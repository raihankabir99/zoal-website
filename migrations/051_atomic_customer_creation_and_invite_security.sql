-- =========================================================================
--   AL ZOAL LUXURY BOUTIQUE - ATOMIC CUSTOMER CREATION & SECURE INVITATIONS
-- =========================================================================
-- Version: 051
-- Description: Adds secure invitation fields to zoal_users and provides an
--              atomic PostgreSQL function for all-or-nothing customer creation.

-- 1. ADD SECURE INVITATION FIELDS TO zoal_users
ALTER TABLE zoal_users ADD COLUMN IF NOT EXISTS invite_token_hash TEXT;
ALTER TABLE zoal_users ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
ALTER TABLE zoal_users ADD COLUMN IF NOT EXISTS invite_used_at TIMESTAMPTZ;

-- 2. CREATE PERFORMANCE & INTEGRITY INDEXES
CREATE INDEX IF NOT EXISTS idx_zoal_users_invite_token_hash 
  ON zoal_users(invite_token_hash) 
  WHERE invite_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zoal_orders_customer_id 
  ON zoal_orders(customer_id) 
  WHERE customer_id IS NOT NULL;

-- 3. ENSURE FOREIGN KEY & UNIQUE CONSTRAINTS ON zoal_customer_crm
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_zoal_customer_crm_user_id'
  ) THEN
    BEGIN
      ALTER TABLE zoal_customer_crm
        ADD CONSTRAINT fk_zoal_customer_crm_user_id
        FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 4. ATOMIC PostgreSQL FUNCTION FOR CUSTOMER & CRM CREATION
CREATE OR REPLACE FUNCTION create_customer_atomic(
  p_user_id TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_invite_token_hash TEXT,
  p_invite_expires_at TIMESTAMPTZ,
  p_status TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_birthday DATE DEFAULT NULL,
  p_preferred_language TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'::text[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_crm_record RECORD;
  v_clean_email TEXT;
BEGIN
  -- Strict email normalization and format check
  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email IS NULL OR v_clean_email = '' OR POSITION('@' IN v_clean_email) = 0 THEN
    RAISE EXCEPTION 'INVALID_EMAIL: A valid email address is required';
  END IF;

  -- 1. Atomically insert user into zoal_users (role is strictly enforced as customer)
  INSERT INTO zoal_users (
    id,
    first_name,
    last_name,
    email,
    phone,
    password_hash,
    role,
    is_verified,
    invite_token_hash,
    invite_expires_at,
    invite_used_at,
    created_at,
    addresses
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    v_clean_email,
    p_phone,
    NULL,
    'customer',
    FALSE,
    p_invite_token_hash,
    p_invite_expires_at,
    NULL,
    NOW(),
    '[]'::jsonb
  )
  RETURNING id, first_name, last_name, email, phone, role, is_verified, created_at, addresses INTO v_user_record;

  -- 2. Atomically insert CRM metadata into zoal_customer_crm
  INSERT INTO zoal_customer_crm (
    id,
    user_id,
    status,
    segment,
    manual_segment,
    gender,
    birthday,
    preferred_language,
    country,
    city,
    photo_url,
    loyalty_points,
    membership_level,
    referral_credits,
    birthday_reward,
    tags,
    marketing_preferences,
    coupons,
    rewards,
    archived,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    p_user_id,
    p_status,
    p_segment,
    FALSE,
    p_gender,
    p_birthday,
    p_preferred_language,
    p_country,
    p_city,
    p_photo_url,
    NULL,
    NULL,
    NULL,
    NULL,
    COALESCE(p_tags, '{}'::text[]),
    NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_crm_record;

  RETURN jsonb_build_object(
    'user', row_to_json(v_user_record),
    'crm', row_to_json(v_crm_record),
    'user_id', v_user_record.id
  );
END;
$$;
