-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - ENTERPRISE AUTHENTICATION REPAIR
-- =========================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UPDATE ROLE CHECK CONSTRAINT ON zoal_users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'zoal_users' AND column_name = 'role'
    LOOP
        EXECUTE 'ALTER TABLE zoal_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE;';
    END LOOP;
END $$;

ALTER TABLE zoal_users ADD CONSTRAINT zoal_users_role_check CHECK (role IN ('customer', 'staff', 'manager', 'admin', 'owner'));

-- 2. AUTOMATIC USER SYNCHRONIZATION FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_phone TEXT;
  v_role TEXT;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  v_first_name := COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'firstName', split_part(v_full_name, ' ', 1), 'User');
  v_last_name := COALESCE(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'lastName', substring(v_full_name from position(' ' in v_full_name) + 1), '');
  v_phone := COALESCE(new.raw_user_meta_data->>'phone', new.phone, '');
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
  
  IF v_role NOT IN ('customer', 'staff', 'manager', 'admin', 'owner') THEN
    v_role := 'customer';
  END IF;

  INSERT INTO public.zoal_users (
    id,
    first_name,
    last_name,
    email,
    phone,
    password_hash,
    role,
    is_verified,
    addresses,
    created_at
  ) VALUES (
    new.id::text,
    v_first_name,
    v_last_name,
    COALESCE(new.email, ''),
    v_phone,
    '',
    v_role,
    CASE WHEN new.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    '[]'::jsonb,
    COALESCE(new.created_at, NOW())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation on auth.users (if permitted by database role permissions)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    BEGIN
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop trigger on auth.users: %', SQLERRM;
    END;

    BEGIN
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      RAISE NOTICE '✅ Trigger on_auth_user_created registered successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Permission denied to create trigger on auth.users. Node.js server-side Profile Recovery will be used instead: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ auth.users table does not exist in this environment.';
  END IF;
END $$;

-- 3. REPAIR FOREIGN KEYS (ON UPDATE CASCADE ON DELETE CASCADE)
DO $$
BEGIN
    -- Drop existing foreign keys to recreate them with update cascading
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_sessions_user_id_fkey') THEN
        ALTER TABLE zoal_sessions DROP CONSTRAINT zoal_sessions_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_addresses_user_id_fkey') THEN
        ALTER TABLE zoal_addresses DROP CONSTRAINT zoal_addresses_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_orders_customer_id_fkey') THEN
        ALTER TABLE zoal_orders DROP CONSTRAINT zoal_orders_customer_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_wishlist_user_id_fkey') THEN
        ALTER TABLE zoal_wishlist DROP CONSTRAINT zoal_wishlist_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_cart_user_id_fkey') THEN
        ALTER TABLE zoal_cart DROP CONSTRAINT zoal_cart_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_reviews_user_id_fkey') THEN
        ALTER TABLE zoal_reviews DROP CONSTRAINT zoal_reviews_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_notifications_user_id_fkey') THEN
        ALTER TABLE zoal_notifications DROP CONSTRAINT zoal_notifications_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_analytics_user_id_fkey') THEN
        ALTER TABLE zoal_analytics DROP CONSTRAINT zoal_analytics_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_staff_details_user_id_fkey') THEN
        ALTER TABLE zoal_staff_details DROP CONSTRAINT zoal_staff_details_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zoal_payment_transactions_user_id_fkey') THEN
        ALTER TABLE zoal_payment_transactions DROP CONSTRAINT zoal_payment_transactions_user_id_fkey;
    END IF;
END $$;

ALTER TABLE zoal_sessions ADD CONSTRAINT zoal_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_addresses ADD CONSTRAINT zoal_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_orders ADD CONSTRAINT zoal_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES zoal_users(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE zoal_wishlist ADD CONSTRAINT zoal_wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_cart ADD CONSTRAINT zoal_cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_reviews ADD CONSTRAINT zoal_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE zoal_notifications ADD CONSTRAINT zoal_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_analytics ADD CONSTRAINT zoal_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE zoal_staff_details ADD CONSTRAINT zoal_staff_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE zoal_payment_transactions ADD CONSTRAINT zoal_payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES zoal_users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. RECURSION-FREE RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'guest';
  END IF;
  SELECT role INTO v_role FROM public.zoal_users WHERE id = auth.uid()::text;
  RETURN COALESCE(v_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_privileged_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. APPLY INDIVIDUAL RLS POLICIES FOR REQUISITE TABLES

-- Drop all pre-existing policies on target tables before recreation
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('zoal_users', 'zoal_orders', 'zoal_inventory', 'zoal_payment_transactions', 'zoal_payment_webhook_logs', 'zoal_staff_details', 'zoal_activity_logs', 'zoal_addresses', 'zoal_sessions', 'zoal_notifications')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename) || ';';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE zoal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_notifications ENABLE ROW LEVEL SECURITY;

-- 5a. zoal_users Policies
CREATE POLICY "zoal_users_select" ON zoal_users FOR SELECT USING (id = auth.uid()::text OR public.is_privileged_role());
CREATE POLICY "zoal_users_insert" ON zoal_users FOR INSERT WITH CHECK (true);
CREATE POLICY "zoal_users_update" ON zoal_users FOR UPDATE USING (id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager')) WITH CHECK (id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager'));
CREATE POLICY "zoal_users_delete" ON zoal_users FOR DELETE USING (public.is_admin_or_owner());

-- 5b. zoal_orders Policies
CREATE POLICY "zoal_orders_select" ON zoal_orders FOR SELECT USING (customer_id = auth.uid()::text OR public.is_privileged_role());
CREATE POLICY "zoal_orders_insert" ON zoal_orders FOR INSERT WITH CHECK (customer_id = auth.uid()::text OR public.is_privileged_role());
CREATE POLICY "zoal_orders_update" ON zoal_orders FOR UPDATE USING (customer_id = auth.uid()::text OR public.is_privileged_role());
CREATE POLICY "zoal_orders_delete" ON zoal_orders FOR DELETE USING (public.is_admin_or_owner());

-- 5c. zoal_inventory Policies
CREATE POLICY "zoal_inventory_select" ON zoal_inventory FOR SELECT USING (true);
CREATE POLICY "zoal_inventory_manage" ON zoal_inventory FOR ALL USING (public.is_privileged_role());

-- 5d. zoal_payment_transactions Policies
CREATE POLICY "zoal_payment_transactions_all" ON zoal_payment_transactions FOR ALL USING (user_id = auth.uid()::text OR public.is_privileged_role());

-- 5e. zoal_payment_webhook_logs Policies
CREATE POLICY "zoal_payment_webhook_logs_all" ON zoal_payment_webhook_logs FOR ALL USING (public.is_privileged_role());

-- 5f. zoal_staff_details Policies
CREATE POLICY "zoal_staff_details_select" ON zoal_staff_details FOR SELECT USING (user_id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager'));
CREATE POLICY "zoal_staff_details_all" ON zoal_staff_details FOR ALL USING (public.is_admin_or_owner());

-- 5g. zoal_activity_logs Policies
CREATE POLICY "zoal_activity_logs_select" ON zoal_activity_logs FOR SELECT USING (public.is_privileged_role());
CREATE POLICY "zoal_activity_logs_insert" ON zoal_activity_logs FOR INSERT WITH CHECK (true);

-- 5h. zoal_addresses Policies
CREATE POLICY "zoal_addresses_all" ON zoal_addresses FOR ALL USING (user_id = auth.uid()::text OR public.is_privileged_role());

-- 5i. zoal_sessions Policies
CREATE POLICY "zoal_sessions_all" ON zoal_sessions FOR ALL USING (user_id = auth.uid()::text OR public.is_privileged_role());

-- 5j. zoal_notifications Policies
CREATE POLICY "zoal_notifications_select" ON zoal_notifications FOR SELECT USING (user_id = auth.uid()::text OR public.is_privileged_role());
CREATE POLICY "zoal_notifications_manage" ON zoal_notifications FOR ALL USING (public.is_privileged_role());

-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - COMPLETED SUCCESSFULLY
-- =========================================================================
