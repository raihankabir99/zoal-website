-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - PRODUCTION-READY SUPABASE DATABASE
-- =========================================================================
-- Paste this script into your Supabase SQL Editor (https://database.new) to create/migrate the schema.
-- This script is fully compatible with Next.js 15, TypeScript, and standard PostgreSQL.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. DATABASE CLEANUP & REVERSIBILITY (Safe fresh startup option)
-- =========================================================================
-- To perform a complete fresh reset, uncomment the DROP statements below.
-- WARNING: This will delete existing database tables and data.
/*
DROP VIEW IF EXISTS view_zoal_executive_summary CASCADE;
DROP VIEW IF EXISTS view_zoal_inventory_alerts CASCADE;
DROP TABLE IF EXISTS zoal_product_images CASCADE;
DROP TABLE IF EXISTS zoal_product_videos CASCADE;
DROP TABLE IF EXISTS zoal_product_variants CASCADE;
DROP TABLE IF EXISTS zoal_product_attributes CASCADE;
DROP TABLE IF EXISTS zoal_product_tags CASCADE;
DROP TABLE IF EXISTS zoal_product_seo CASCADE;
DROP TABLE IF EXISTS zoal_email_logs CASCADE;
DROP TABLE IF EXISTS zoal_inquiries CASCADE;
DROP TABLE IF EXISTS zoal_activity_logs CASCADE;
DROP TABLE IF EXISTS zoal_staff_details CASCADE;
DROP TABLE IF EXISTS zoal_analytics CASCADE;
DROP TABLE IF EXISTS zoal_notifications CASCADE;
DROP TABLE IF EXISTS zoal_reviews CASCADE;
DROP TABLE IF EXISTS zoal_cart CASCADE;
DROP TABLE IF EXISTS zoal_wishlist CASCADE;
DROP TABLE IF EXISTS zoal_order_items CASCADE;
DROP TABLE IF EXISTS zoal_orders CASCADE;
DROP TABLE IF EXISTS zoal_shipping CASCADE;
DROP TABLE IF EXISTS zoal_coupons CASCADE;
DROP TABLE IF EXISTS zoal_addresses CASCADE;
DROP TABLE IF EXISTS zoal_inventory CASCADE;
DROP TABLE IF EXISTS zoal_products CASCADE;
DROP TABLE IF EXISTS zoal_brands CASCADE;
DROP TABLE IF EXISTS zoal_categories CASCADE;
DROP TABLE IF EXISTS zoal_sessions CASCADE;
DROP TABLE IF EXISTS zoal_users CASCADE;
*/

-- =========================================================================
-- 2. CORE SCHEMAS & RELATIONSHIPS
-- =========================================================================

-- 2a. Users Table (Accommodates both external standard auth and custom profiles)
CREATE TABLE IF NOT EXISTS zoal_users (
  id TEXT PRIMARY KEY, -- Supports text UUIDs or external provider user IDs
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin', 'owner', 'manager')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  reset_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  addresses JSONB DEFAULT '[]'::jsonb
);

-- 2b. Sessions Table
CREATE TABLE IF NOT EXISTS zoal_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  remember_me BOOLEAN DEFAULT FALSE
);

-- 2c. Categories Table (Coffee, Bakery, Organic Market, Fashion, Thobes)
CREATE TABLE IF NOT EXISTS zoal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2d. Brands Table (High-luxury custom houses)
CREATE TABLE IF NOT EXISTS zoal_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2e. Products Table
CREATE TABLE IF NOT EXISTS zoal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES zoal_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES zoal_brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  image_urls TEXT[] DEFAULT '{}'::text[],
  sku TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_sale_price CHECK (sale_price IS NULL OR sale_price <= price)
);

-- 2f. Product Images Table (Media Gallery)
CREATE TABLE IF NOT EXISTS zoal_product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2g. Product Videos Table (Exclusive Video Showcases)
CREATE TABLE IF NOT EXISTS zoal_product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2h. Product Variants Table (Attributes sizing, luxury fabric weaves, pricing offsets)
CREATE TABLE IF NOT EXISTS zoal_product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  option_name TEXT NOT NULL, -- e.g., 'Large / Gold Embroidery'
  price NUMERIC(12,2) CHECK (price >= 0),
  sale_price NUMERIC(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2i. Product Attributes Table (Technical specifications & materials)
CREATE TABLE IF NOT EXISTS zoal_product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_attribute UNIQUE (product_id, attribute_key)
);

-- 2j. Product Tags Table (Synonyms and search tagging)
CREATE TABLE IF NOT EXISTS zoal_product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_tag UNIQUE (product_id, tag)
);

-- 2k. Product SEO Metadata Table
CREATE TABLE IF NOT EXISTS zoal_product_seo (
  product_id UUID PRIMARY KEY REFERENCES zoal_products(id) ON DELETE CASCADE,
  seo_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  slug TEXT UNIQUE,
  canonical_url TEXT,
  og_image TEXT,
  schema_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2l. Inventory Table (Core stock level ledger)
CREATE TABLE IF NOT EXISTS zoal_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  warehouse_location TEXT,
  low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2m. Addresses Table (Sovereign patrons locations)
CREATE TABLE IF NOT EXISTS zoal_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Saudi Arabia',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2n. Coupons Table (Promotion triggers)
CREATE TABLE IF NOT EXISTS zoal_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(12,2) DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(12,2),
  start_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (start_date IS NULL OR expiration_date IS NULL OR start_date <= expiration_date)
);

-- 2o. Shipping Methods Table (White-glove priority couriers)
CREATE TABLE IF NOT EXISTS zoal_shipping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_name TEXT NOT NULL,
  carrier TEXT,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  estimated_days_min INTEGER NOT NULL CHECK (estimated_days_min >= 0),
  estimated_days_max INTEGER NOT NULL CHECK (estimated_days_max >= estimated_days_min),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2p. Orders Table (Checkout ledger)
CREATE TABLE IF NOT EXISTS zoal_orders (
  id TEXT PRIMARY KEY, -- Custom alphanumeric luxury order ID (e.g. ZL-1029)
  customer_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  coupon_id UUID REFERENCES zoal_coupons(id) ON DELETE SET NULL,
  shipping_id UUID REFERENCES zoal_shipping(id) ON DELETE SET NULL,
  shipping_address_id UUID REFERENCES zoal_addresses(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_cost NUMERIC(12,2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount NUMERIC(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2q. Order Items Table
CREATE TABLE IF NOT EXISTS zoal_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES zoal_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0)
);

-- 2r. Wishlist Table
CREATE TABLE IF NOT EXISTS zoal_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- 2s. Cart Table
CREATE TABLE IF NOT EXISTS zoal_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

-- 2t. Reviews Table
CREATE TABLE IF NOT EXISTS zoal_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2u. Notifications Table
CREATE TABLE IF NOT EXISTS zoal_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2v. System Analytics Table
CREATE TABLE IF NOT EXISTS zoal_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2w. Staff Details Table (Role configurations)
CREATE TABLE IF NOT EXISTS zoal_staff_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  department TEXT,
  permissions TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2x. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS zoal_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT
);

-- 2y. Email Delivery Log Table
CREATE TABLE IF NOT EXISTS zoal_email_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_date TEXT,
  total_amount NUMERIC DEFAULT 0,
  delivery_status TEXT NOT NULL,
  attempts_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  logs JSONB DEFAULT '[]'::jsonb,
  order_data JSONB DEFAULT '{}'::jsonb
);

-- 2z. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS zoal_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================================================
-- 3. VIEWS (EXECUTIVE INSIGHTS)
-- =========================================================================

-- View 3a. Executive Summary Sales Dashboard Analytics
CREATE OR REPLACE VIEW view_zoal_executive_summary AS
SELECT 
  COUNT(o.id) AS total_orders_count,
  COALESCE(SUM(o.total_amount), 0) AS gross_sales_volume,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS realized_sales_volume,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') AS active_pending_orders_count,
  COALESCE(AVG(o.total_amount), 0) AS average_order_ticket_value,
  COUNT(DISTINCT o.customer_id) AS active_patron_count
FROM zoal_orders o;

-- View 3b. Inventory Low Stock Alerts
CREATE OR REPLACE VIEW view_zoal_inventory_alerts AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  inv.quantity AS stock_count,
  inv.low_stock_threshold AS threshold_alert_limit,
  inv.warehouse_location,
  CASE 
    WHEN inv.quantity = 0 THEN 'OUT_OF_STOCK'
    ELSE 'LOW_STOCK'
  END AS inventory_status
FROM zoal_inventory inv
JOIN zoal_products p ON p.id = inv.product_id
WHERE inv.quantity <= inv.low_stock_threshold;


-- =========================================================================
-- 4. DATABASE TRIGGERS & FUNCTIONS
-- =========================================================================

-- Function 4a. Automatic updated_at timestamp updating
CREATE OR REPLACE FUNCTION fn_zoal_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger configurations for automated updated_at
CREATE TRIGGER trg_zoal_products_update_timestamp
  BEFORE UPDATE ON zoal_products
  FOR EACH ROW EXECUTE FUNCTION fn_zoal_update_timestamp();

CREATE TRIGGER trg_zoal_inventory_update_timestamp
  BEFORE UPDATE ON zoal_inventory
  FOR EACH ROW EXECUTE FUNCTION fn_zoal_update_timestamp();

CREATE TRIGGER trg_zoal_orders_update_timestamp
  BEFORE UPDATE ON zoal_orders
  FOR EACH ROW EXECUTE FUNCTION fn_zoal_update_timestamp();


-- Function 4b. Automated stock decrement upon new order item creation
CREATE OR REPLACE FUNCTION fn_zoal_auto_decrement_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement main inventory level
  UPDATE zoal_inventory
  SET quantity = GREATEST(0, quantity - NEW.quantity)
  WHERE product_id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger configurations for inventory subtraction
CREATE TRIGGER trg_zoal_orders_decrement_stock
  AFTER INSERT ON zoal_order_items
  FOR EACH ROW EXECUTE FUNCTION fn_zoal_auto_decrement_stock();


-- =========================================================================
-- 5. PERFORMANCE INDEXES (FOR EXTREME LATENCY CONTROL)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON zoal_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON zoal_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON zoal_products(price);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON zoal_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON zoal_orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON zoal_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON zoal_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON zoal_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON zoal_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON zoal_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_analytics_event ON zoal_analytics(event_name);


-- =========================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE zoal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_product_seo ENABLE ROW LEVEL SECURITY;

-- 6a. Public Access Policies (Read-Only)
CREATE POLICY "Allow public read of categories" ON zoal_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read of brands" ON zoal_brands FOR SELECT USING (true);
CREATE POLICY "Allow public read of active products" ON zoal_products FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read of approved reviews" ON zoal_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Allow public read of shipping" ON zoal_shipping FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read of product images" ON zoal_product_images FOR SELECT USING (true);
CREATE POLICY "Allow public read of product videos" ON zoal_product_videos FOR SELECT USING (true);
CREATE POLICY "Allow public read of product variants" ON zoal_product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read of product attributes" ON zoal_product_attributes FOR SELECT USING (true);
CREATE POLICY "Allow public read of product tags" ON zoal_product_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read of product seo" ON zoal_product_seo FOR SELECT USING (true);

-- 6b. Secure Authenticated User Policies (Access to own data only)
CREATE POLICY "Users can manage their own addresses" ON zoal_addresses FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own cart" ON zoal_cart FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own wishlist" ON zoal_wishlist FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their own orders" ON zoal_orders FOR SELECT USING (customer_id = auth.uid()::text);
CREATE POLICY "Users can view their own order items" ON zoal_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM zoal_orders WHERE id = zoal_order_items.order_id AND customer_id = auth.uid()::text)
);
CREATE POLICY "Users can manage their own reviews" ON zoal_reviews FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their own notifications" ON zoal_notifications FOR ALL USING (user_id = auth.uid()::text);


-- =========================================================================
-- 7. LUXURY BRAND PRODUCTION SEED DATA
-- =========================================================================

-- Seed Categories
INSERT INTO zoal_categories (id, name, slug, description, image_url)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'Specialty Coffee', 'coffee', 'Premium single-origin micro-lot roasts and specialty blends.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600'),
  ('c0000000-0000-0000-0000-000000000002', 'Bespoke Tailoring & Thobes', 'thobes', 'Handcrafted royal garments utilizing premium imported fibers.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600'),
  ('c0000000-0000-0000-0000-000000000003', 'Artisanal Bakery', 'bakery', 'Fresh cardamom cookies and traditional stone-oven breads.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600'),
  ('c0000000-0000-0000-0000-000000000004', 'Organic Market', 'market', 'Elite Grade natural ingredients and Kordofan gum Arabic pearls.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- Seed Brands
INSERT INTO zoal_brands (id, name, slug, description, logo_url)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'AL ZOAL Specialty Roasters', 'zoal-roasters', 'Luxury Arabian and African single-origin masters.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=150'),
  ('b0000000-0000-0000-0000-000000000002', 'Sovereign Weavers Group', 'sovereign-weavers', 'Crafting gold-embroidered royal garments for generational patrons.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=150'),
  ('b0000000-0000-0000-0000-000000000003', 'Sudan Heritage Organics', 'sudan-organics', 'Sourcing translucent Acacia Senegal gum crystals directly from local cooperatives.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=150')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url;

-- Seed Products
INSERT INTO zoal_products (id, category_id, brand_id, name, slug, description, price, sku, image_urls)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Sovereign Saffron Specialty Blend', 'sovereign-saffron-blend', 'Organic roasted coffee beans layered with certified Grade-1 Sargol saffron threads.', 180.00, 'ZL-SVR-SFN', ARRAY['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600']),
  ('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Royal Gold Embroidered Sudanese Toob', 'royal-gold-toob', 'Velvet-textured hand-woven Sudanese Toob lined with pure 24k gold threads.', 4800.00, 'ZL-ROY-TOOB', ARRAY['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600']),
  ('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Kordofan Arabic Gum Translucent Pearls', 'kordofan-gum-pearls', 'First-grade natural acacia crystals harvested organically from West Sudan.', 95.00, 'ZL-GUM-KOR', ARRAY['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600'])
ON CONFLICT (slug) DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description;

-- Seed Inventory levels
INSERT INTO zoal_inventory (id, product_id, quantity, warehouse_location, low_stock_threshold)
VALUES
  ('i0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 45, 'Al Hofuf Central (Climate-Controlled Section B)', 5),
  ('i0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 8, 'Riyadh Secure Vault (Tailoring Room)', 2),
  ('i0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 120, 'Al Hofuf Central (Dry Pantry Row 4)', 15)
ON CONFLICT (product_id) DO UPDATE SET 
  quantity = EXCLUDED.quantity,
  warehouse_location = EXCLUDED.warehouse_location;
