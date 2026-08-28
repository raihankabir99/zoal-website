-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - CUSTOMER CRM SCHEMA
-- =========================================================================
-- Version: 049
-- Description: Additive customer CRM metadata, notes, communications, and RLS policies.

-- 1. CUSTOMER CRM METADATA
CREATE TABLE IF NOT EXISTS zoal_customer_crm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blocked', 'Suspended', 'VIP', 'Verified')),
  segment TEXT NOT NULL DEFAULT 'New Customer' CHECK (segment IN ('New Customer', 'Returning Customer', 'Regular Customer', 'VIP Customer', 'Inactive Customer', 'High Value Customer', 'Frequent Buyer')),
  manual_segment BOOLEAN DEFAULT FALSE,
  gender TEXT DEFAULT 'Other' CHECK (gender IN ('Male', 'Female', 'Other')),
  birthday DATE,
  preferred_language TEXT DEFAULT 'Arabic',
  country TEXT DEFAULT 'Saudi Arabia',
  city TEXT DEFAULT 'Riyadh',
  photo_url TEXT,
  loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
  membership_level TEXT DEFAULT 'Bronze' CHECK (membership_level IN ('Bronze', 'Silver', 'Gold')),
  referral_credits NUMERIC(12,2) DEFAULT 0 CHECK (referral_credits >= 0),
  birthday_reward TEXT DEFAULT 'None' CHECK (birthday_reward IN ('Available', 'Claimed', 'Expired', 'None')),
  tags TEXT[] DEFAULT '{}'::text[],
  marketing_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "whatsapp": true, "newsletter": true, "promotionalOffers": true}'::jsonb,
  coupons JSONB DEFAULT '[]'::jsonb,
  rewards JSONB DEFAULT '[]'::jsonb,
  archived BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_crm_user_id ON zoal_customer_crm(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_crm_status ON zoal_customer_crm(status);
CREATE INDEX IF NOT EXISTS idx_customer_crm_segment ON zoal_customer_crm(segment);
CREATE INDEX IF NOT EXISTS idx_customer_crm_archived ON zoal_customer_crm(archived);

-- 2. CUSTOMER INTERNAL ADMIN NOTES
CREATE TABLE IF NOT EXISTS zoal_customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  admin_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Internal' CHECK (type IN ('Internal', 'Follow-up', 'Support')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_user_id ON zoal_customer_notes(user_id);

-- 3. CUSTOMER COMMUNICATIONS LOG
CREATE TABLE IF NOT EXISTS zoal_customer_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES zoal_users(id) ON DELETE CASCADE,
  admin_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('Email', 'SMS', 'WhatsApp', 'Notification', 'Campaign', 'Support Response')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Failed', 'Delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_comms_user_id ON zoal_customer_communications(user_id);

-- Enable RLS
ALTER TABLE zoal_customer_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_customer_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Privileged staff/admin/owner full access
CREATE POLICY "zoal_customer_crm_privileged_all" ON zoal_customer_crm FOR ALL USING (
  EXISTS (
    SELECT 1 FROM zoal_users
    WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
  )
);

CREATE POLICY "zoal_customer_notes_privileged_all" ON zoal_customer_notes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM zoal_users
    WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
  )
);

CREATE POLICY "zoal_customer_comms_privileged_all" ON zoal_customer_communications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM zoal_users
    WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
  )
);

-- Individual customers can view their own CRM metadata
CREATE POLICY "zoal_customer_crm_self_read" ON zoal_customer_crm FOR SELECT USING (
  user_id = auth.uid()::text
);
