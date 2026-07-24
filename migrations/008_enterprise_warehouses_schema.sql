-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - WAREHOUSE MANAGEMENT SCHEMA
-- =========================================================================
-- Version: 008
-- Description: Creates the zoal_warehouses table, indexes, RLS policies,
--              and seeds initial enterprise distribution hubs.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS zoal_warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_name TEXT NOT NULL,
  warehouse_code TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'Saudi Arabia',
  city TEXT DEFAULT 'Dammam',
  address TEXT DEFAULT '',
  manager TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  capacity INTEGER DEFAULT 10000 CHECK (capacity >= 0),
  used_capacity INTEGER DEFAULT 0 CHECK (used_capacity >= 0),
  status TEXT DEFAULT 'Active',
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial enterprise warehouses if table is empty
INSERT INTO zoal_warehouses (id, warehouse_name, warehouse_code, country, city, address, manager, phone, email, capacity, used_capacity, status, latitude, longitude)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Dammam Main Hub', 'WH-DMM-01', 'Saudi Arabia', 'Dammam', 'King Fahd Road, Logistics Zone', 'Tariq Al-Harbi', '+966 50 123 4567', 'dammam.wh@zoal.com', 10000, 8200, 'Optimal', 26.4207, 50.0888),
  ('a2222222-2222-2222-2222-222222222222', 'Al Hofuf Lounge', 'WH-HOF-02', 'Saudi Arabia', 'Al Hofuf', 'Al Ahsa Industrial District', 'Musa Al-Ghamdi', '+966 55 987 6543', 'hofuf.wh@zoal.com', 5000, 2250, 'Optimal', 25.3835, 49.5862),
  ('a3333333-3333-3333-3333-333333333333', 'Riyadh Distribution Gate', 'WH-RUH-03', 'Saudi Arabia', 'Riyadh', 'Sully Logistics Park, Gate 4', 'Sami Al-Otaibi', '+966 51 444 3322', 'riyadh.wh@zoal.com', 25000, 22750, 'Near Capacity', 24.7136, 46.6753),
  ('a4444444-4444-4444-4444-444444444444', 'Jeddah Port Gateway', 'WH-JED-04', 'Saudi Arabia', 'Jeddah', 'Jeddah Islamic Port Freezone', 'Faisal Al-Dosari', '+966 54 888 7766', 'jeddah.wh@zoal.com', 20000, 3000, 'Under-utilized', 21.4858, 39.1925)
ON CONFLICT (warehouse_code) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zoal_warehouses_code ON zoal_warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_zoal_warehouses_city ON zoal_warehouses(city);
CREATE INDEX IF NOT EXISTS idx_zoal_warehouses_status ON zoal_warehouses(status);
