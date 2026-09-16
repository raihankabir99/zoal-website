-- ZOAL Guest Order Retry Authorization (P1 Security)
-- Stores only a SHA-256 hash of the opaque guest retry credential.
-- Existing orders remain untouched; legacy tokenless guest orders fail closed for anonymous reuse.

ALTER TABLE zoal_orders
  ADD COLUMN IF NOT EXISTS guest_retry_token_hash TEXT NULL;

COMMENT ON COLUMN zoal_orders.guest_retry_token_hash IS
  'SHA-256 hash of server-generated guest order retry credential; raw token is never persisted.';
