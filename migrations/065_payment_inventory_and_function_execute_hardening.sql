-- Payment + inventory atomic transition hardening
-- Payment verification/webhooks must never update payment state and stock in separate requests.
-- These functions are callable only by the server-side service_role.

CREATE OR REPLACE FUNCTION public.finalize_order_payment(
  p_order_id TEXT,
  p_gateway_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_tx RECORD;
  v_item RECORD;
  v_inventory RECORD;
BEGIN
  SELECT id, payment_status
    INTO v_order
    FROM public.zoal_orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid', 'order_id', p_order_id);
  END IF;

  SELECT id, gateway_payment_id, payment_status
    INTO v_tx
    FROM public.zoal_payment_transactions
   WHERE order_id = p_order_id
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_TRANSACTION_NOT_FOUND';
  END IF;

  IF v_tx.gateway_payment_id IS NOT NULL
     AND v_tx.gateway_payment_id <> p_gateway_payment_id THEN
    RAISE EXCEPTION 'GATEWAY_PAYMENT_MISMATCH';
  END IF;

  IF v_tx.payment_status NOT IN ('initiated', 'pending', 'unpaid') THEN
    IF v_tx.payment_status = 'paid' THEN
      RETURN jsonb_build_object('status', 'already_paid', 'order_id', p_order_id);
    END IF;
    RAISE EXCEPTION 'PAYMENT_NOT_SETTLEABLE';
  END IF;

  FOR v_item IN
    SELECT product_id, quantity
      FROM public.zoal_order_items
     WHERE order_id = p_order_id
     ORDER BY product_id
  LOOP
    SELECT id, warehouse_id, quantity, reserved_quantity
      INTO v_inventory
      FROM public.zoal_inventory
     WHERE product_id = v_item.product_id
       AND reserved_quantity >= v_item.quantity
     ORDER BY warehouse_id NULLS LAST
     LIMIT 1
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVENTORY_RESERVATION_NOT_FOUND_FOR_PRODUCT:%', v_item.product_id;
    END IF;

    UPDATE public.zoal_inventory
       SET quantity = quantity - v_item.quantity,
           reserved_quantity = reserved_quantity - v_item.quantity,
           updated_at = NOW()
     WHERE id = v_inventory.id;
  END LOOP;

  UPDATE public.zoal_payment_transactions
     SET payment_status = 'paid',
         gateway_payment_id = p_gateway_payment_id,
         updated_at = NOW()
   WHERE id = v_tx.id;

  UPDATE public.zoal_orders
     SET payment_status = 'paid',
         status = 'processing',
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('status', 'paid', 'order_id', p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_order_payment(
  p_order_id TEXT,
  p_gateway_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_tx RECORD;
  v_item RECORD;
  v_inventory RECORD;
BEGIN
  SELECT id, payment_status
    INTO v_order
    FROM public.zoal_orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  SELECT id, gateway_payment_id, payment_status
    INTO v_tx
    FROM public.zoal_payment_transactions
   WHERE order_id = p_order_id
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_TRANSACTION_NOT_FOUND';
  END IF;

  IF p_gateway_payment_id IS NOT NULL
     AND v_tx.gateway_payment_id IS NOT NULL
     AND v_tx.gateway_payment_id <> p_gateway_payment_id THEN
    RAISE EXCEPTION 'GATEWAY_PAYMENT_MISMATCH';
  END IF;

  IF v_tx.payment_status = 'failed'
     AND v_order.payment_status = 'failed' THEN
    RETURN jsonb_build_object('status', 'already_failed', 'order_id', p_order_id);
  END IF;

  IF v_tx.payment_status IN ('paid', 'refunded', 'partially_refunded') THEN
    RAISE EXCEPTION 'PAYMENT_ALREADY_SETTLED';
  END IF;

  FOR v_item IN
    SELECT product_id, quantity
      FROM public.zoal_order_items
     WHERE order_id = p_order_id
     ORDER BY product_id
  LOOP
    SELECT id, reserved_quantity
      INTO v_inventory
      FROM public.zoal_inventory
     WHERE product_id = v_item.product_id
       AND reserved_quantity >= v_item.quantity
     ORDER BY warehouse_id NULLS LAST
     LIMIT 1
     FOR UPDATE;

    IF FOUND THEN
      UPDATE public.zoal_inventory
         SET reserved_quantity = reserved_quantity - v_item.quantity,
             updated_at = NOW()
       WHERE id = v_inventory.id;
    END IF;
  END LOOP;

  UPDATE public.zoal_payment_transactions
     SET payment_status = 'failed',
         gateway_payment_id = COALESCE(p_gateway_payment_id, gateway_payment_id),
         updated_at = NOW()
   WHERE id = v_tx.id;

  UPDATE public.zoal_orders
     SET payment_status = 'failed',
         status = 'failed',
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('status', 'failed', 'order_id', p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_order_payment(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_order_payment(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_order_payment(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_order_payment(TEXT, TEXT) TO service_role;

-- Security-definer functions identified by the production advisor as externally callable
-- are internal/server-only operations.
REVOKE ALL ON FUNCTION public.merge_category_safe(UUID, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_category_safe(UUID, UUID, BOOLEAN) TO service_role;

REVOKE ALL ON FUNCTION public.zoal_executive_financial_core_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.zoal_executive_financial_core_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

REVOKE ALL ON FUNCTION public.zoal_is_staff_or_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.zoal_is_staff_or_admin(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.is_blog_staff_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blog_staff_role() TO authenticated, service_role;
