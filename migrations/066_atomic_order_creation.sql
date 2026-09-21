-- Atomic order creation: order, items, inventory reservation and coupon redemption
-- are committed together. Payment gateway integration remains separate.

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
