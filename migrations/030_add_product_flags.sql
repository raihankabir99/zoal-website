-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - PRODUCT FLAG SCHEMA COMPLETION
-- =========================================================================
-- Version: 030
-- Description: Adds missing product flags (Featured, Popular, Best Seller, etc.)
--              to zoal_products to ensure 100% persistence and correct Home page 
--              collection rendering.
-- =========================================================================

ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_staff_pick BOOLEAN DEFAULT FALSE;
ALTER TABLE zoal_products ADD COLUMN IF NOT EXISTS is_luxury_choice BOOLEAN DEFAULT FALSE;

-- Add indexes for performance on these flags
CREATE INDEX IF NOT EXISTS idx_zoal_products_is_featured ON zoal_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_zoal_products_is_popular ON zoal_products(is_popular);
CREATE INDEX IF NOT EXISTS idx_zoal_products_is_best_seller ON zoal_products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_zoal_products_is_new_arrival ON zoal_products(is_new_arrival);
