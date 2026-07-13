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
export const SUPABASE_SQL_SCHEMA = `-- AL ZOAL LUXURY BOUTIQUE - SUPABASE SQL SCHEMA
-- Paste this script into your Supabase SQL Editor (https://database.new) to create the required tables.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS zoal_users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer',
  status TEXT DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  addresses JSONB DEFAULT '[]'::jsonb,
  verification_code TEXT,
  reset_code TEXT
);

-- 2. Create Sessions Table
CREATE TABLE IF NOT EXISTS zoal_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  remember_me BOOLEAN DEFAULT FALSE
);

-- 3. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS zoal_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT,
  entity TEXT DEFAULT 'system'
);

-- 4. Create Email Logs (Order Receipts) Table
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

-- 5. Create Roles Table
CREATE TABLE IF NOT EXISTS zoal_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Permissions Table
CREATE TABLE IF NOT EXISTS zoal_permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- 7. Create Role Permissions Table
CREATE TABLE IF NOT EXISTS zoal_role_permissions (
  role_id TEXT NOT NULL REFERENCES zoal_roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES zoal_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 8. Create User Permissions Table
CREATE TABLE IF NOT EXISTS zoal_user_permissions (
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES zoal_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id)
);

-- 9. Create Login History Table
CREATE TABLE IF NOT EXISTS zoal_login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  ip_address TEXT,
  device TEXT,
  browser TEXT,
  country TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  status TEXT NOT NULL
);

-- Disable RLS (Row Level Security) or allow all operations for ease of sandbox integration:
ALTER TABLE zoal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_login_history DISABLE ROW LEVEL SECURITY;
`;
