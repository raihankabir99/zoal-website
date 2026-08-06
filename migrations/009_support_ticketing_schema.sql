-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - SUPPORT TICKETING SCHEMA
-- =========================================================================
-- Version: 009
-- Description: Creates support ticketing tables: zoal_support_tickets,
--              zoal_ticket_messages, zoal_ticket_attachments.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  subject TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  category TEXT,
  channel TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Pending', 'Resolved', 'Closed')),
  assigned_staff_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES zoal_support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES zoal_ticket_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Insert Policies here if needed, based on auth setup.
-- Assuming basic authentication is set up in auth_repair.sql
