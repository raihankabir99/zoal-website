-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - DATA CONSISTENCY HARDENING
-- =========================================================================
-- Version: 038
-- Description: Create AFTER INSERT/UPDATE/DELETE trigger on zoal_supabase_products
--              to atomically and type-safely sync to relational zoal_products table.

CREATE OR REPLACE FUNCTION sync_zoal_supabase_product_to_core()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
  v_brand_id UUID;
  v_price NUMERIC;
  v_sale_price NUMERIC;
  v_is_active BOOLEAN;
  v_image_urls TEXT[];
  
  -- Logistics fields
  v_pickup_location TEXT;
  v_pickup_ready_time TEXT;
  v_pickup_open TEXT;
  v_pickup_close TEXT;
  v_pickup_friday_schedule TEXT;
  v_pickup_instruction TEXT;
  v_pickup_phone TEXT;
  v_pickup_whatsapp TEXT;
  v_pickup_email TEXT;
  v_pickup_map_url TEXT;
  
  v_shipping_scope TEXT[];
  v_delivery_zones TEXT[];
  v_free_shipping BOOLEAN;
  v_free_shipping_minimum NUMERIC;
  v_cash_on_delivery BOOLEAN;
  v_packaging_type TEXT;
  v_temperature_control BOOLEAN;
  v_handling_flags TEXT[];
  v_shipping_note TEXT;
  v_customer_delivery_message TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM zoal_products WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- 1. Extract category_id safely
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

  -- 2. Extract brand_id safely
  BEGIN
    IF NEW.data ? 'brandId' AND NEW.data->>'brandId' IS NOT NULL AND NEW.data->>'brandId' <> '' THEN
      v_brand_id := (NEW.data->>'brandId')::UUID;
    ELSIF NEW.data ? 'brand_id' AND NEW.data->>'brand_id' IS NOT NULL AND NEW.data->>'brand_id' <> '' THEN
      v_brand_id := (NEW.data->>'brand_id')::UUID;
    ELSE
      v_brand_id := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_brand_id := NULL;
  END;

  -- 3. Extract price safely
  BEGIN
    v_price := NEW.price;
    IF v_price IS NULL AND NEW.data ? 'price' THEN
      v_price := (NEW.data->>'price')::NUMERIC;
    END IF;
    IF v_price IS NULL THEN
      v_price := 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_price := 0;
  END;

  -- 4. Extract sale_price safely
  BEGIN
    IF NEW.data ? 'salePrice' AND NEW.data->>'salePrice' IS NOT NULL AND NEW.data->>'salePrice' <> '' THEN
      v_sale_price := (NEW.data->>'salePrice')::NUMERIC;
    ELSIF NEW.data ? 'sale_price' AND NEW.data->>'sale_price' IS NOT NULL AND NEW.data->>'sale_price' <> '' THEN
      v_sale_price := (NEW.data->>'sale_price')::NUMERIC;
    ELSE
      v_sale_price := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_sale_price := NULL;
  END;

  -- 5. Extract is_active safely
  BEGIN
    v_is_active := NEW.is_active;
    IF v_is_active IS NULL AND NEW.data ? 'isActive' THEN
      v_is_active := (NEW.data->>'isActive')::BOOLEAN;
    ELSIF v_is_active IS NULL AND NEW.data ? 'is_active' THEN
      v_is_active := (NEW.data->>'is_active')::BOOLEAN;
    END IF;
    IF v_is_active IS NULL THEN
      v_is_active := TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_is_active := TRUE;
  END;

  -- 6. Extract image_urls safely
  BEGIN
    IF NEW.data ? 'image_urls' AND jsonb_typeof(NEW.data->'image_urls') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'image_urls')) INTO v_image_urls;
    ELSIF NEW.data ? 'images' AND jsonb_typeof(NEW.data->'images') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'images')) INTO v_image_urls;
    ELSE
      v_image_urls := '{}'::TEXT[];
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_image_urls := '{}'::TEXT[];
  END;

  -- 7. Extract string fields
  v_pickup_location := NEW.data->>'pickup_location';
  v_pickup_ready_time := NEW.data->>'pickup_ready_time';
  v_pickup_open := NEW.data->>'pickup_open';
  v_pickup_close := NEW.data->>'pickup_close';
  v_pickup_friday_schedule := NEW.data->>'pickup_friday_schedule';
  v_pickup_instruction := NEW.data->>'pickup_instruction';
  v_pickup_phone := NEW.data->>'pickup_phone';
  v_pickup_whatsapp := NEW.data->>'pickup_whatsapp';
  v_pickup_email := NEW.data->>'pickup_email';
  v_pickup_map_url := NEW.data->>'pickup_map_url';
  v_packaging_type := NEW.data->>'packaging_type';
  v_shipping_note := NEW.data->>'shipping_note';
  v_customer_delivery_message := NEW.data->>'customer_delivery_message';

  -- 8. Extract arrays safely
  BEGIN
    IF NEW.data ? 'shipping_scope' AND jsonb_typeof(NEW.data->'shipping_scope') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'shipping_scope')) INTO v_shipping_scope;
    ELSE
      v_shipping_scope := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_shipping_scope := NULL;
  END;

  BEGIN
    IF NEW.data ? 'delivery_zones' AND jsonb_typeof(NEW.data->'delivery_zones') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'delivery_zones')) INTO v_delivery_zones;
    ELSE
      v_delivery_zones := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_delivery_zones := NULL;
  END;

  BEGIN
    IF NEW.data ? 'handling_flags' AND jsonb_typeof(NEW.data->'handling_flags') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.data->'handling_flags')) INTO v_handling_flags;
    ELSE
      v_handling_flags := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_handling_flags := NULL;
  END;

  -- 9. Extract booleans safely
  BEGIN
    IF NEW.data ? 'free_shipping' AND jsonb_typeof(NEW.data->'free_shipping') = 'boolean' THEN
      v_free_shipping := (NEW.data->'free_shipping')::BOOLEAN;
    ELSIF NEW.data ? 'free_shipping' AND NEW.data->>'free_shipping' IS NOT NULL THEN
      v_free_shipping := (NEW.data->>'free_shipping')::BOOLEAN;
    ELSE
      v_free_shipping := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_free_shipping := NULL;
  END;

  BEGIN
    IF NEW.data ? 'cash_on_delivery' AND jsonb_typeof(NEW.data->'cash_on_delivery') = 'boolean' THEN
      v_cash_on_delivery := (NEW.data->'cash_on_delivery')::BOOLEAN;
    ELSIF NEW.data ? 'cash_on_delivery' AND NEW.data->>'cash_on_delivery' IS NOT NULL THEN
      v_cash_on_delivery := (NEW.data->>'cash_on_delivery')::BOOLEAN;
    ELSE
      v_cash_on_delivery := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_cash_on_delivery := NULL;
  END;

  BEGIN
    IF NEW.data ? 'temperature_control' AND jsonb_typeof(NEW.data->'temperature_control') = 'boolean' THEN
      v_temperature_control := (NEW.data->'temperature_control')::BOOLEAN;
    ELSIF NEW.data ? 'temperature_control' AND NEW.data->>'temperature_control' IS NOT NULL THEN
      v_temperature_control := (NEW.data->>'temperature_control')::BOOLEAN;
    ELSE
      v_temperature_control := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_temperature_control := NULL;
  END;

  -- 10. Extract free_shipping_minimum safely
  BEGIN
    IF NEW.data ? 'free_shipping_minimum' AND NEW.data->>'free_shipping_minimum' IS NOT NULL AND NEW.data->>'free_shipping_minimum' <> '' THEN
      v_free_shipping_minimum := (NEW.data->>'free_shipping_minimum')::NUMERIC;
    ELSE
      v_free_shipping_minimum := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_free_shipping_minimum := NULL;
  END;

  -- 11. Upsert into zoal_products
  INSERT INTO zoal_products (
    id, category_id, brand_id, name, slug, description, price, sale_price, image_urls, sku, is_active,
    pickup_location, pickup_ready_time, pickup_open, pickup_close, pickup_friday_schedule,
    pickup_instruction, pickup_phone, pickup_whatsapp, pickup_email, pickup_map_url,
    shipping_scope, delivery_zones, free_shipping, free_shipping_minimum, cash_on_delivery,
    packaging_type, temperature_control, handling_flags, shipping_note, customer_delivery_message,
    created_at, updated_at
  ) VALUES (
    NEW.id,
    v_category_id,
    v_brand_id,
    NEW.name,
    COALESCE(NEW.data->>'slug', LOWER(REGEXP_REPLACE(NEW.name, '\s+', '-', 'g'))),
    COALESCE(NEW.data->>'description', ''),
    v_price,
    v_sale_price,
    v_image_urls,
    COALESCE(NEW.data->>'sku', 'SKU-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)),
    v_is_active,
    v_pickup_location,
    v_pickup_ready_time,
    v_pickup_open,
    v_pickup_close,
    v_pickup_friday_schedule,
    v_pickup_instruction,
    v_pickup_phone,
    v_pickup_whatsapp,
    v_pickup_email,
    v_pickup_map_url,
    v_shipping_scope,
    v_delivery_zones,
    v_free_shipping,
    v_free_shipping_minimum,
    v_cash_on_delivery,
    v_packaging_type,
    v_temperature_control,
    v_handling_flags,
    v_shipping_note,
    v_customer_delivery_message,
    COALESCE(NEW.created_at, CURRENT_TIMESTAMP),
    COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
  )
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    brand_id = EXCLUDED.brand_id,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    sale_price = EXCLUDED.sale_price,
    image_urls = EXCLUDED.image_urls,
    sku = EXCLUDED.sku,
    is_active = EXCLUDED.is_active,
    pickup_location = EXCLUDED.pickup_location,
    pickup_ready_time = EXCLUDED.pickup_ready_time,
    pickup_open = EXCLUDED.pickup_open,
    pickup_close = EXCLUDED.pickup_close,
    pickup_friday_schedule = EXCLUDED.pickup_friday_schedule,
    pickup_instruction = EXCLUDED.pickup_instruction,
    pickup_phone = EXCLUDED.pickup_phone,
    pickup_whatsapp = EXCLUDED.pickup_whatsapp,
    pickup_email = EXCLUDED.pickup_email,
    pickup_map_url = EXCLUDED.pickup_map_url,
    shipping_scope = EXCLUDED.shipping_scope,
    delivery_zones = EXCLUDED.delivery_zones,
    free_shipping = EXCLUDED.free_shipping,
    free_shipping_minimum = EXCLUDED.free_shipping_minimum,
    cash_on_delivery = EXCLUDED.cash_on_delivery,
    packaging_type = EXCLUDED.packaging_type,
    temperature_control = EXCLUDED.temperature_control,
    handling_flags = EXCLUDED.handling_flags,
    shipping_note = EXCLUDED.shipping_note,
    customer_delivery_message = EXCLUDED.customer_delivery_message,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on zoal_supabase_products
DROP TRIGGER IF EXISTS trg_sync_zoal_supabase_product ON zoal_supabase_products;
CREATE TRIGGER trg_sync_zoal_supabase_product
AFTER INSERT OR UPDATE OR DELETE ON zoal_supabase_products
FOR EACH ROW
EXECUTE FUNCTION sync_zoal_supabase_product_to_core();
