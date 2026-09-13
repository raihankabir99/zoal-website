-- Coupon redemption integrity and concurrency-safe usage enforcement
CREATE TABLE IF NOT EXISTS public.zoal_coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  coupon_id uuid NOT NULL REFERENCES public.zoal_coupons(id) ON DELETE RESTRICT,
  order_id text NOT NULL REFERENCES public.zoal_orders(id) ON DELETE CASCADE,
  customer_id text REFERENCES public.zoal_users(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_zoal_coupon_redemptions_coupon_id ON public.zoal_coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_zoal_coupon_redemptions_customer_id ON public.zoal_coupon_redemptions(customer_id);

ALTER TABLE public.zoal_coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.redeem_coupon_for_order(
  p_coupon_id uuid,
  p_order_id text,
  p_customer_id text,
  p_discount_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coupon_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_id, 0));

  IF EXISTS (SELECT 1 FROM public.zoal_coupon_redemptions WHERE order_id = p_order_id) THEN
    RETURN;
  END IF;

  UPDATE public.zoal_coupons
     SET usage_count = COALESCE(usage_count, 0) + 1
   WHERE id = p_coupon_id
     AND is_active = true
     AND (start_date IS NULL OR start_date <= now())
     AND (expiration_date IS NULL OR expiration_date >= now())
     AND (usage_limit IS NULL OR COALESCE(usage_count, 0) < usage_limit)
  RETURNING id INTO v_coupon_id;

  IF v_coupon_id IS NULL THEN
    RAISE EXCEPTION 'COUPON_REDEMPTION_NOT_AVAILABLE';
  END IF;

  INSERT INTO public.zoal_coupon_redemptions (coupon_id, order_id, customer_id, discount_amount)
  VALUES (p_coupon_id, p_order_id, p_customer_id, p_discount_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon_for_order(uuid, text, text, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_for_order(uuid, text, text, numeric)
  TO service_role;


-- Keep usage_count consistent when a redemption is removed through cascading
-- order deletion during rollback/error handling.
CREATE OR REPLACE FUNCTION public.rollback_coupon_usage_on_redemption_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.zoal_coupons
     SET usage_count = GREATEST(COALESCE(usage_count, 0) - 1, 0)
   WHERE id = OLD.coupon_id;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_coupon_usage_on_redemption_delete()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_rollback_coupon_usage_on_redemption_delete
  ON public.zoal_coupon_redemptions;

CREATE TRIGGER trg_rollback_coupon_usage_on_redemption_delete
AFTER DELETE ON public.zoal_coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.rollback_coupon_usage_on_redemption_delete();
