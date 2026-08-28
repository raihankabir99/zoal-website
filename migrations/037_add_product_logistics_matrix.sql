-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - SHIPPING & LOGISTICS MATRIX
-- =========================================================================
-- Version: 037
-- Description: Additive logistics, shipping, and boutique pickup fields.

ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_location TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_ready_time TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_open TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_close TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_friday_schedule TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_instruction TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_phone TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_whatsapp TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_email TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS pickup_map_url TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS shipping_scope TEXT[] NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS delivery_zones TEXT[] NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS free_shipping_minimum NUMERIC NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS cash_on_delivery BOOLEAN NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS packaging_type TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS temperature_control BOOLEAN NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS handling_flags TEXT[] NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS shipping_note TEXT NULL;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS customer_delivery_message TEXT NULL;
