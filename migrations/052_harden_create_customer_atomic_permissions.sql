-- =========================================================================
--   AL ZOAL LUXURY BOUTIQUE - HARDEN create_customer_atomic PERMISSIONS
-- =========================================================================
-- Version: 052
-- Description: Hardens create_customer_atomic with explicit safe search_path,
--              revokes execute permissions from PUBLIC, anon, and authenticated
--              roles, and grants execute only to trusted server-side roles.

-- 1. RECREATE FUNCTION WITH SAFE search_path (public, pg_temp) AND gen_random_uuid()
CREATE OR REPLACE FUNCTION public.create_customer_atomic(
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
SET search_path = public, pg_temp
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
    gen_random_uuid(),
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

-- 2. REVOKE EXECUTE FROM PUBLIC
REVOKE EXECUTE ON FUNCTION public.create_customer_atomic(
  text,text,text,text,text,text,timestamptz,text,text,text,date,text,text,text,text,text[]
) FROM PUBLIC;

-- 3. REVOKE EXECUTE FROM anon and authenticated ROLES (IF PRESENT)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE EXECUTE ON FUNCTION public.create_customer_atomic(
      text,text,text,text,text,text,timestamptz,text,text,text,date,text,text,text,text,text[]
    ) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE EXECUTE ON FUNCTION public.create_customer_atomic(
      text,text,text,text,text,text,timestamptz,text,text,text,date,text,text,text,text,text[]
    ) FROM authenticated;
  END IF;

  -- 4. GRANT EXECUTE ONLY TO TRUSTED SERVER-SIDE ROLES
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.create_customer_atomic(
      text,text,text,text,text,text,timestamptz,text,text,text,date,text,text,text,text,text[]
    ) TO service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT EXECUTE ON FUNCTION public.create_customer_atomic(
      text,text,text,text,text,text,timestamptz,text,text,text,date,text,text,text,text,text[]
    ) TO postgres;
  END IF;
END $$;
