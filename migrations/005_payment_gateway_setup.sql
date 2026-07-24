-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - PAYMENT GATEWAY INTEGRATION
-- =========================================================================

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS zoal_payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES zoal_orders(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES zoal_users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  payment_method TEXT, -- 'credit_card', 'mada', 'apple_pay', etc.
  payment_status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  gateway_payment_id TEXT UNIQUE, -- Moyasar's payment ID (e.g. pay_xxxxx)
  gateway_invoice_id TEXT, -- Moyasar's invoice ID (e.g. inv_xxxxx)
  gateway_response JSONB,
  refund_amount NUMERIC(12,2) DEFAULT 0.00,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON zoal_payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON zoal_payment_transactions(gateway_payment_id);

-- Create payment webhook logs table
CREATE TABLE IF NOT EXISTS zoal_payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_event_id TEXT UNIQUE, -- event ID from Moyasar to prevent replay
  event_type TEXT, -- e.g. 'payment.captured', 'payment.failed'
  payload JSONB NOT NULL,
  processed_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_event_id ON zoal_payment_webhook_logs(gateway_event_id);

-- Update check constraints on zoal_orders if they exist to support Phase 5 states
ALTER TABLE zoal_orders DROP CONSTRAINT IF EXISTS zoal_orders_status_check;
ALTER TABLE zoal_orders ADD CONSTRAINT zoal_orders_status_check CHECK (status IN ('draft', 'pending_payment', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed', 'partially_refunded'));

ALTER TABLE zoal_orders DROP CONSTRAINT IF EXISTS zoal_orders_payment_status_check;
ALTER TABLE zoal_orders ADD CONSTRAINT zoal_orders_payment_status_check CHECK (payment_status IN ('unpaid', 'pending_payment', 'paid', 'failed', 'refunded', 'partially_refunded'));
