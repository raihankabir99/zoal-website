-- Keep coupon usage_count consistent when a redeemed order is rolled back/deleted
CREATE OR REPLACE FUNCTION public.rollback_coupon_redemption_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.zoal_coupons
     SET usage_count = GREATEST(0, COALESCE(usage_count, 0) - 1)
   WHERE id = OLD.coupon_id;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_coupon_redemption_usage() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_rollback_coupon_redemption_usage ON public.zoal_coupon_redemptions;

CREATE TRIGGER trg_rollback_coupon_redemption_usage
AFTER DELETE ON public.zoal_coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.rollback_coupon_redemption_usage();
