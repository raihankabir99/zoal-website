-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - RELATIONAL INVENTORY SOT
-- =========================================================================
-- Version: 039
-- Description: Establishes Model A canonical inventory architecture:
--              Physical stock, reserved quantity, multi-warehouse mapping (product_id, warehouse_id),
--              max_stock, min_stock, and automatic inventory row synchronization.
-- =========================================================================

-- 1. Expand zoal_inventory schema
ALTER TABLE zoal_inventory 
  ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
  ADD COLUMN IF NOT EXISTS max_stock INTEGER CHECK (max_stock IS NULL OR max_stock >= 0),
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES zoal_warehouses(id) ON DELETE SET NULL;

-- 2. Handle Multi-Warehouse Uniqueness (product_id, warehouse_id)
-- Drop existing unique constraint on product_id if present
DO $$ 
BEGIN
  ALTER TABLE zoal_inventory DROP CONSTRAINT IF EXISTS zoal_inventory_product_id_key;
EXCEPTION WHEN undefined_object THEN
  -- ignore
END $$;

-- Assign default warehouse ('a1111111-1111-1111-1111-111111111111' - Dammam Main Hub) to existing rows with null warehouse_id
UPDATE zoal_inventory 
SET warehouse_id = 'a1111111-1111-1111-1111-111111111111' 
WHERE warehouse_id IS NULL;

-- Add composite unique constraint if not already present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_warehouse'
  ) THEN
    ALTER TABLE zoal_inventory ADD CONSTRAINT unique_product_warehouse UNIQUE (product_id, warehouse_id);
  END IF;
END $$;

-- 3. Promote 4 Custom Products from zoal_supabase_products into zoal_products & zoal_inventory
-- Ensure all records in zoal_supabase_products have corresponding zoal_products and zoal_inventory entries
INSERT INTO zoal_products (id, name, slug, price, is_active, created_at, updated_at)
SELECT 
  id,
  name,
  COALESCE(data->>'slug', LOWER(REGEXP_REPLACE(name, '\s+', '-', 'g'))),
  COALESCE((data->>'price')::NUMERIC, 0),
  COALESCE(is_active, TRUE),
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM zoal_supabase_products
ON CONFLICT (id) DO NOTHING;

-- Initialize zoal_inventory for any product missing an inventory row
INSERT INTO zoal_inventory (product_id, warehouse_id, quantity, reserved_quantity, min_stock, max_stock, low_stock_threshold, updated_at)
SELECT 
  p.id,
  'a1111111-1111-1111-1111-111111111111'::UUID,
  COALESCE((s.data->>'inventory')::INTEGER, 20),
  0,
  COALESCE((s.data->>'minStock')::INTEGER, 5),
  COALESCE((s.data->>'maxStock')::INTEGER, NULL),
  COALESCE((s.data->>'lowStockThreshold')::INTEGER, 5),
  CURRENT_TIMESTAMP
FROM zoal_products p
LEFT JOIN zoal_supabase_products s ON s.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM zoal_inventory i WHERE i.product_id = p.id
);

-- 4. Harden Product Creation Trigger to Auto-Initialize Inventory
CREATE OR REPLACE FUNCTION sync_zoal_supabase_product_to_core()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
  v_brand_id UUID;
  v_price NUMERIC;
  v_sale_price NUMERIC;
  v_is_active BOOLEAN;
  v_image_urls TEXT[];
  v_initial_qty INTEGER;
  v_min_stock INTEGER;
  v_max_stock INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM zoal_products WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Extract basic fields safely (same as migration 038)
  BEGIN
    IF NEW.data ? 'categoryId' AND NEW.data->>'categoryId' IS NOT NULL AND NEW.data->>'categoryId' <> '' THEN
      v_category_id := (NEW.data->>'categoryId')::UUID;
    ELSIF NEW.data ? 'category_id' AND NEW.data->>'category_id' IS NOT NULL AND NEW.data->>'category_id' <> '' THEN
      v_category_id := (NEW.data->>'category_id')::UUID;
    ELSE
      v_category_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_category_id := NULL;
  END;

  BEGIN
    v_price := NEW.price;
    IF v_price IS NULL AND NEW.data ? 'price' THEN
      v_price := (NEW.data->>'price')::NUMERIC;
    END IF;
    IF v_price IS NULL THEN v_price := 0; END IF;
  EXCEPTION WHEN OTHERS THEN
    v_price := 0;
  END;

  v_is_active := COALESCE(NEW.is_active, (NEW.data->>'isActive')::BOOLEAN, (NEW.data->>'is_active')::BOOLEAN, TRUE);

  -- Extract inventory values
  v_initial_qty := COALESCE((NEW.data->>'inventory')::INTEGER, 20);
  v_min_stock := COALESCE((NEW.data->>'minStock')::INTEGER, 5);
  v_max_stock := COALESCE((NEW.data->>'maxStock')::INTEGER, NULL);

  -- Upsert into zoal_products
  INSERT INTO zoal_products (
    id, category_id, name, slug, price, is_active, created_at, updated_at
  ) VALUES (
    NEW.id,
    v_category_id,
    NEW.name,
    COALESCE(NEW.data->>'slug', LOWER(REGEXP_REPLACE(NEW.name, '\s+', '-', 'g'))),
    v_price,
    v_is_active,
    COALESCE(NEW.created_at, CURRENT_TIMESTAMP),
    COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

  -- Ensure zoal_inventory row exists
  INSERT INTO zoal_inventory (
    product_id, warehouse_id, quantity, reserved_quantity, min_stock, max_stock, low_stock_threshold, updated_at
  ) VALUES (
    NEW.id,
    'a1111111-1111-1111-1111-111111111111'::UUID,
    v_initial_qty,
    0,
    v_min_stock,
    v_max_stock,
    v_min_stock,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (product_id, warehouse_id) DO UPDATE SET
    min_stock = COALESCE(EXCLUDED.min_stock, zoal_inventory.min_stock),
    max_stock = COALESCE(EXCLUDED.max_stock, zoal_inventory.max_stock),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS trg_sync_zoal_supabase_product ON zoal_supabase_products;
CREATE TRIGGER trg_sync_zoal_supabase_product
AFTER INSERT OR UPDATE OR DELETE ON zoal_supabase_products
For EACH ROW
EXECUTE FUNCTION sync_zoal_supabase_product_to_core();

-- 5. Add performance indexes for relational inventory
CREATE INDEX IF NOT EXISTS idx_zoal_inventory_product_warehouse ON zoal_inventory(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_zoal_inventory_available ON zoal_inventory((quantity - reserved_quantity));
