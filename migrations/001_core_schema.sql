-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - CORE SCHEMA
-- =========================================================================
-- Version: 001
-- Description: Initial core tables, indexes, and RLS policies.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ACCOUNTS & SESSIONS
CREATE TABLE IF NOT EXISTS zoal_users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  reset_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  addresses JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS zoal_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  remember_me BOOLEAN DEFAULT FALSE
);

-- 2. CATALOG MANAGEMENT
CREATE TABLE IF NOT EXISTS zoal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_sale_price CHECK (sale_price IS NULL OR sale_price <= price)
);

CREATE TABLE IF NOT EXISTS zoal_product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  option_name TEXT NOT NULL,
  price NUMERIC(12,2) CHECK (price >= 0),
  sale_price NUMERIC(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_attribute UNIQUE (product_id, attribute_key)
);

CREATE TABLE IF NOT EXISTS zoal_product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_tag UNIQUE (product_id, tag)
);

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

CREATE TABLE IF NOT EXISTS zoal_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  warehouse_location TEXT,
  low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOGISTICS & ORDERS
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

CREATE TABLE IF NOT EXISTS zoal_orders (
  id TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS zoal_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES zoal_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0)
);

-- 4. SOCIAL & ANALYTICS
CREATE TABLE IF NOT EXISTS zoal_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS zoal_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS zoal_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_staff_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  department TEXT,
  permissions TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT
);

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

CREATE TABLE IF NOT EXISTS zoal_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INDEXES
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

-- 6. RLS
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

-- Public read policies
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
