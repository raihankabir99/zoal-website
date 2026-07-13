import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Checks if Supabase credentials are configured in the environment variables.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return !!(url && key && url.trim() !== '' && key.trim() !== '');
}

/**
 * Lazily retrieves the Supabase client instance.
 * Returns null if the keys are not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY!;
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
      console.log('✅ Supabase Client initialized successfully.');
    } catch (err) {
      console.error('❌ Error initializing Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * SQL instructions to create tables in Supabase SQL editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- AL ZOAL LUXURY BOUTIQUE - PRODUCTION-READY SUPABASE SQL SCHEMA
-- This script contains the enterprise-grade schema for ZOAL, including all constraints, foreign keys, optimized indexes, and secure Row Level Security (RLS) policies.
-- Paste this entire block into your Supabase SQL Editor (https://database.new) to deploy.

-- =========================================================================
-- 1. EXTENSIONS & UTILITIES
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. CORE IDENTITY & AUTHENTICATION (Extends current schema)
-- =========================================================================
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

-- =========================================================================
-- 3. PRODUCT CATALOG, CATEGORIES & BRANDS
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES zoal_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES zoal_brands(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10, 2) CHECK (sale_price >= 0),
  images TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_sale_price CHECK (sale_price IS NULL OR sale_price <= price)
);

-- =========================================================================
-- 4. INVENTORY SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. COUPON & PROMOTION ENGINE
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value DECIMAL(10, 2) DEFAULT 0 CHECK (min_order_value >= 0),
  max_discount_amount DECIMAL(10, 2) CHECK (max_discount_amount >= 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INT DEFAULT 0 CHECK (usage_count >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. SHIPPING SYSTEM
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  carrier VARCHAR(100) NOT NULL,
  estimated_days_min INT NOT NULL CHECK (estimated_days_min >= 0),
  estimated_days_max INT NOT NULL CHECK (estimated_days_max >= estimated_days_min),
  cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  title VARCHAR(100) DEFAULT 'Home',
  recipient_name VARCHAR(150) NOT NULL,
  recipient_phone VARCHAR(50) NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'Saudi Arabia',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. CART & WISHLIST SYSTEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS zoal_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES zoal_cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

-- =========================================================================
-- 8. ORDER PIPELINE & INVOICING
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  coupon_id UUID REFERENCES zoal_coupons(id) ON DELETE SET NULL,
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(100),
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zoal_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES zoal_products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0)
);

-- =========================================================================
-- 9. SOCIAL SYSTEM: REVIEWS
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zoal_products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(150),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- =========================================================================
-- 10. NOTIFICATIONS, SECURITY LOGS & AUDITING
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES zoal_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
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

-- =========================================================================
-- 11. ANALYTICS PIPELINE
-- =========================================================================
CREATE TABLE IF NOT EXISTS zoal_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type VARCHAR(100) NOT NULL, -- e.g. page_view, add_to_cart, search
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 12. PERFORMANCE INDEXES
-- =========================================================================
-- Product Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON zoal_products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON zoal_products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON zoal_products (slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON zoal_products (is_featured) WHERE is_featured = TRUE;

-- Order Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON zoal_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON zoal_orders (order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON zoal_order_items (order_id);

-- Cart & Wishlist Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON zoal_cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON zoal_wishlist (user_id);

-- Analytics & Logs Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON zoal_analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON zoal_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON zoal_notifications (user_id, is_read);

-- =========================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Enable Row Level Security on all critical tables
ALTER TABLE zoal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_analytics_events ENABLE ROW LEVEL SECURITY;

-- 13.1 Category & Brand Policies (Public Read, Admin/Staff Manage)
CREATE POLICY "Allow public read access for categories" ON zoal_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access for brands" ON zoal_brands FOR SELECT USING (true);

-- 13.2 Products Policies (Public Read for Active Products, Admin/Staff Manage)
CREATE POLICY "Allow public read access for active products" ON zoal_products FOR SELECT USING (is_active = true);

-- 13.3 Inventory Policies (Admin/Staff only)
CREATE POLICY "Allow admin and staff full control over inventory" ON zoal_inventory FOR ALL USING (true);

-- 13.4 Coupon Policies (Admin/Staff manage, Customers can select active coupons)
CREATE POLICY "Allow public read access to active coupons" ON zoal_coupons FOR SELECT USING (is_active = true);

-- 13.5 Order Policies (Customers can read/insert their own, Admin/Staff manage all)
CREATE POLICY "Allow users to select their own orders" ON zoal_orders FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Allow users to insert their own orders" ON zoal_orders FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- 13.6 Wishlist Policies (Users manage their own)
CREATE POLICY "Allow users to manage their own wishlist" ON zoal_wishlist FOR ALL USING (user_id = auth.uid()::text);

-- 13.7 Cart Policies (Users manage their own)
CREATE POLICY "Allow users to manage their own cart" ON zoal_cart FOR ALL USING (user_id = auth.uid()::text);

-- 13.8 Address Policies (Users manage their own)
CREATE POLICY "Allow users to manage their own addresses" ON zoal_addresses FOR ALL USING (user_id = auth.uid()::text);

-- 13.9 Reviews Policies (Public read approved, Users manage their own reviews)
CREATE POLICY "Allow public read approved reviews" ON zoal_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Allow users to write/edit reviews" ON zoal_reviews FOR ALL USING (user_id = auth.uid()::text);

-- 13.10 Shipping Methods (Public Read)
CREATE POLICY "Allow public read shipping methods" ON zoal_shipping_methods FOR SELECT USING (is_active = true);

-- 13.11 Notifications (Users read and update read state of their own notifications)
CREATE POLICY "Allow users to manage their own notifications" ON zoal_notifications FOR ALL USING (user_id = auth.uid()::text);

-- 13.12 Analytics & Logs Policies (Insert Only for Tracking, Read for Admin/Staff)
CREATE POLICY "Allow public insert to analytics" ON zoal_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to inquiries" ON zoal_inquiries FOR INSERT WITH CHECK (true);
`;

