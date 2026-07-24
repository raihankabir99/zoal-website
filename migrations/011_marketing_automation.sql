-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - MARKETING AUTOMATION SCHEMA
-- =========================================================================
-- Version: 011
-- Description: Creates Marketing Automation tables: zoal_campaigns,
--              zoal_email_campaigns, zoal_sms_campaigns,
--              zoal_push_notifications, zoal_subscribers, zoal_marketing_logs.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Running', 'Completed', 'Paused')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES zoal_campaigns(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'Queued'
);

CREATE TABLE IF NOT EXISTS zoal_sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES zoal_campaigns(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'Queued'
);

CREATE TABLE IF NOT EXISTS zoal_push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES zoal_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'Queued'
);

CREATE TABLE IF NOT EXISTS zoal_marketing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES zoal_campaigns(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'Email', 'SMS', 'Push'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_marketing_logs ENABLE ROW LEVEL SECURITY;
