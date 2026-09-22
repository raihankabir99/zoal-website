-- Atomic order creation: order, items, inventory reservation and coupon redemption
-- are committed together. Payment gateway integration remains separate.

CREATE TABLE IF NOT EXISTS public.zoal_order_inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.zoal_orders(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES public.zoal_inventory(id),
  product_id text NOT NULL,
  warehouse_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  released_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_order_inventory_reservations_order
  ON public.zoal_order_inventory_reservations(order_id);

ALTER TABLE public.zoal_order_inventory_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_inventory_reservations_service_only" ON public.zoal_order_inventory_reservations;
CREATE POLICY "order_inventory_reservations_service_only"
  ON public.zoal_order_inventory_reservations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_id text,
  p_customer_id text,
  p_items jsonb,
  p_subtotal numeric,
  p_discount_amount numeric,
  p_shipping_cost numeric,
  p_tax_amount numeric,
  p_total_amount numeric,
  p_coupon_id uuid DEFAULT NULL,
  p_coupon_code text DEFAULT NULL,
  p_coupon_discount numeric DEFAULT 0,
  p_payment_method text DEFAULT 'card',
  p_notes text DEFAULT '',
  p_order_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item record;
  v_inventory record;
  v_remaining integer;
  v_available integer;
  v_take integer;
  v_reserved jsonb := '[]'::jsonb;
  v_order jsonb;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN
    RAISE EXCEPTION 'ORDER_ID_REQUIRED';
  END IF;

  IF p_customer_id IS NULL OR p_customer_id = '' THEN
    RAISE EXCEPTION 'CUSTOMER_ID_REQUIRED';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'ORDER_ITEMS_REQUIRED';
  END IF;

  IF p_subtotal < 0 OR p_discount_amount < 0 OR p_shipping_cost < 0
     OR p_tax_amount < 0 OR p_total_amount < 0 THEN
    RAISE EXCEPTION 'INVALID_ORDER_TOTALS';
  END IF;

  IF EXISTS (SELECT 1 FROM public.zoal_orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'ORDER_ID_ALREADY_EXISTS';
  END IF;

  INSERT INTO public.zoal_orders (
    id, customer_id, status, coupon_id, subtotal, discount_amount,
    shipping_cost, tax_amount, total_amount, payment_status,
    payment_method, notes, order_data
  )
  VALUES (
    p_order_id, p_customer_id, 'pending', p_coupon_id, p_subtotal,
    p_discount_amount, p_shipping_cost, p_tax_amount, p_total_amount,
    'unpaid', p_payment_method, p_notes, p_order_data
  )
  RETURNING to_jsonb(zoal_orders.*) INTO v_order;

  FOR v_item IN
    SELECT product_id, SUM(quantity)::integer AS quantity,
           MAX(unit_price)::numeric AS unit_price,
           MAX(unit_cost)::numeric AS unit_cost,
           SUM(total_price)::numeric AS total_price
    FROM jsonb_to_recordset(p_items) AS x(
      product_id text,
      quantity integer,
      unit_price numeric,
      unit_cost numeric,
      total_price numeric
    )
    GROUP BY product_id
    ORDER BY product_id
  LOOP
    IF v_item.product_id IS NULL OR v_item.product_id = '' OR v_item.quantity < 1 THEN
      RAISE EXCEPTION 'INVALID_ORDER_ITEM';
    END IF;

    IF v_item.unit_price IS NULL OR v_item.unit_price < 0
       OR v_item.total_price IS NULL OR v_item.total_price < 0 THEN
      RAISE EXCEPTION 'INVALID_ORDER_ITEM_PRICE';
    END IF;

    INSERT INTO public.zoal_order_items (
      order_id, product_id, quantity, unit_price, unit_cost, total_price
    )
    VALUES (
      p_order_id, v_item.product_id, v_item.quantity,
      v_item.unit_price, v_item.unit_cost, v_item.total_price
    );

    v_remaining := v_item.quantity;

    FOR v_inventory IN
      SELECT id, warehouse_id, quantity, reserved_quantity
      FROM public.zoal_inventory
      WHERE product_id = v_item.product_id
        AND quantity > reserved_quantity
      ORDER BY warehouse_id NULLS LAST, id
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_available := GREATEST(v_inventory.quantity - v_inventory.reserved_quantity, 0);
      v_take := LEAST(v_remaining, v_available);

      IF v_take > 0 THEN
        UPDATE public.zoal_inventory
        SET reserved_quantity = reserved_quantity + v_take,
            updated_at = NOW()
        WHERE id = v_inventory.id;

        INSERT INTO public.zoal_order_inventory_reservations (
          order_id, inventory_id, product_id, warehouse_id, quantity
        ) VALUES (
          p_order_id, v_inventory.id, v_item.product_id, v_inventory.warehouse_id, v_take
        );

        v_reserved := v_reserved || jsonb_build_object(
          'product_id', v_item.product_id,
          'warehouse_id', v_inventory.warehouse_id,
          'quantity', v_take
        );

        v_remaining := v_remaining - v_take;
      END IF;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_INVENTORY:%:%', v_item.product_id, v_item.quantity;
    END IF;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    PERFORM public.redeem_coupon_for_order(
      p_coupon_id,
      p_order_id,
      p_customer_id,
      COALESCE(p_coupon_discount, p_discount_amount)
    );
  END IF;

  RETURN jsonb_build_object(
    'order', v_order,
    'reserved', v_reserved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_atomic(
  text, text, jsonb, numeric, numeric, numeric, numeric, numeric,
  uuid, text, numeric, text, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_atomic(
  text, text, jsonb, numeric, numeric, numeric, numeric, numeric,
  uuid, text, numeric, text, text, jsonb
) TO service_role;


CREATE OR REPLACE FUNCTION public.release_order_inventory(
  p_order_id text,
  p_reason text DEFAULT 'cancelled'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r record;
  v_released integer := 0;
  v_order_status text;
BEGIN
  SELECT status INTO v_order_status
  FROM public.zoal_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  IF v_order_status NOT IN ('cancelled','failed','pending','pending_payment','draft') THEN
    RAISE EXCEPTION 'ORDER_NOT_ELIGIBLE_FOR_RESERVATION_RELEASE:%', v_order_status;
  END IF;

  FOR r IN
    SELECT id, inventory_id, quantity
    FROM public.zoal_order_inventory_reservations
    WHERE order_id = p_order_id
      AND released_at IS NULL
    ORDER BY inventory_id
    FOR UPDATE
  LOOP
    UPDATE public.zoal_inventory
       SET reserved_quantity = GREATEST(reserved_quantity - r.quantity, 0),
           updated_at = NOW()
     WHERE id = r.inventory_id;

    UPDATE public.zoal_order_inventory_reservations
       SET released_at = NOW()
     WHERE id = r.id;

    v_released := v_released + r.quantity;
  END LOOP;

  RETURN jsonb_build_object('order_id', p_order_id, 'released_quantity', v_released, 'reason', p_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.release_order_inventory(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_inventory(text,text) TO service_role;


-- Atomically cancel an order and release all ledger-backed reservations.
CREATE OR REPLACE FUNCTION public.cancel_order_and_release_inventory(
  p_order_id text,
  p_reason text DEFAULT 'cancelled'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r record;
  v_status text;
  v_released integer := 0;
BEGIN
  SELECT status INTO v_status
  FROM public.zoal_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_status NOT IN ('draft','pending_payment','pending','processing') THEN
    RAISE EXCEPTION 'ORDER_NOT_ELIGIBLE_FOR_CANCELLATION:%', v_status;
  END IF;

  FOR r IN
    SELECT id, inventory_id, quantity
    FROM public.zoal_order_inventory_reservations
    WHERE order_id = p_order_id
      AND released_at IS NULL
    ORDER BY inventory_id
    FOR UPDATE
  LOOP
    UPDATE public.zoal_inventory
       SET reserved_quantity = GREATEST(reserved_quantity - r.quantity, 0),
           updated_at = NOW()
     WHERE id = r.inventory_id;

    UPDATE public.zoal_order_inventory_reservations
       SET released_at = NOW()
     WHERE id = r.id;

    v_released := v_released + r.quantity;
  END LOOP;

  UPDATE public.zoal_orders
     SET status = 'cancelled',
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'released_quantity', v_released,
    'reason', p_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_and_release_inventory(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_release_inventory(text,text) TO service_role;


-- Reserve inventory for legacy checkout paths while keeping the reservation ledger authoritative.
CREATE OR REPLACE FUNCTION public.reserve_order_inventory(
  p_order_id text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item jsonb;
  v_product_id text;
  v_qty integer;
  v_inv public.zoal_inventory%ROWTYPE;
  v_reserved integer := 0;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN RAISE EXCEPTION 'ORDER_ID_REQUIRED'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'ITEMS_REQUIRED'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := item->>'product_id';
    v_qty := (item->>'quantity')::integer;
    IF v_product_id IS NULL OR v_qty IS NULL OR v_qty < 1 THEN
      RAISE EXCEPTION 'INVALID_RESERVATION_ITEM';
    END IF;

    SELECT * INTO v_inv
    FROM public.zoal_inventory
    WHERE product_id = v_product_id
    ORDER BY warehouse_id NULLS LAST, id
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'INVENTORY_NOT_FOUND:%', v_product_id; END IF;
    IF (v_inv.quantity - v_inv.reserved_quantity) < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_INVENTORY:%', v_product_id;
    END IF;

    UPDATE public.zoal_inventory
       SET reserved_quantity = reserved_quantity + v_qty,
           updated_at = NOW()
     WHERE id = v_inv.id;

    INSERT INTO public.zoal_order_inventory_reservations
      (order_id, inventory_id, product_id, warehouse_id, quantity)
    VALUES
      (p_order_id, v_inv.id, v_product_id, v_inv.warehouse_id, v_qty);

    v_reserved := v_reserved + v_qty;
  END LOOP;

  RETURN jsonb_build_object('order_id', p_order_id, 'reserved_quantity', v_reserved);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_order_inventory(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_inventory(text,jsonb) TO service_role;
