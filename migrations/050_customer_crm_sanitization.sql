-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - CUSTOMER CRM SANITIZATION
-- =========================================================================
-- Version: 050
-- Description: Remove manufactured CRM database defaults and allow nullable password_hash.

-- 1. Enable nullable password_hash for invitation / setup flows
ALTER TABLE zoal_users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Remove manufactured defaults from zoal_customer_crm
ALTER TABLE zoal_customer_crm ALTER COLUMN status DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN segment DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN gender DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN preferred_language DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN country DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN city DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN loyalty_points DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN membership_level DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN referral_credits DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN birthday_reward DROP DEFAULT;
ALTER TABLE zoal_customer_crm ALTER COLUMN marketing_preferences DROP DEFAULT;
