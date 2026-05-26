-- Make WhatsApp sale registration transactional: sale, items and stock move together.

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT;

CREATE OR REPLACE FUNCTION public.register_whatsapp_sale(
  p_user_id UUID,
  p_customer_id UUID,
  p_action_data JSONB,
  p_conversation_text TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_sale public.sales%ROWTYPE;
  v_item JSONB;
  v_items JSONB;
  v_product public.products%ROWTYPE;
  v_inventory public.inventory%ROWTYPE;
  v_product_id UUID;
  v_product_name TEXT;
  v_quantity NUMERIC;
  v_unit_price NUMERIC;
  v_subtotal NUMERIC;
  v_total NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_payment_method public.payment_method;
  v_status public.sale_status;
  v_inventory_required BOOLEAN := p_business_type IN ('comercio', 'alimentacao');
  v_result_items JSONB := '[]'::JSONB;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_business_type IS NULL THEN
    SELECT business_type::TEXT IN ('comercio', 'alimentacao')
    INTO v_inventory_required
    FROM public.profiles
    WHERE user_id = p_user_id;
  END IF;

  v_items := CASE
    WHEN jsonb_typeof(p_action_data -> 'items') = 'array' THEN p_action_data -> 'items'
    ELSE jsonb_build_array(p_action_data)
  END;

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'items are required for create_sale';
  END IF;

  v_discount := COALESCE(NULLIF(p_action_data ->> 'discount', '')::NUMERIC, 0);

  SELECT enumlabel::public.payment_method
  INTO v_payment_method
  FROM pg_enum
  WHERE enumtypid = 'public.payment_method'::REGTYPE
    AND enumlabel = COALESCE(NULLIF(p_action_data ->> 'payment_method', ''), NULLIF(p_action_data ->> 'paymentMethod', ''));

  SELECT enumlabel::public.sale_status
  INTO v_status
  FROM pg_enum
  WHERE enumtypid = 'public.sale_status'::REGTYPE
    AND enumlabel = COALESCE(NULLIF(p_action_data ->> 'status', ''), 'pago');

  IF v_status IS NULL THEN
    v_status := 'pago';
  END IF;

  INSERT INTO public.sales (
    user_id,
    customer_id,
    total,
    discount,
    payment_method,
    status,
    sold_at,
    notes
  )
  VALUES (
    p_user_id,
    p_customer_id,
    0,
    v_discount,
    v_payment_method,
    v_status,
    COALESCE(NULLIF(p_action_data ->> 'sold_at', '')::TIMESTAMPTZ, now()),
    COALESCE(NULLIF(p_action_data ->> 'notes', ''), p_conversation_text)
  )
  RETURNING * INTO v_sale;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'product_id', '')::UUID;
    v_product_name := NULLIF(BTRIM(COALESCE(
      v_item ->> 'product_name',
      v_item ->> 'product',
      v_item ->> 'produto',
      v_item ->> 'name'
    )), '');

    v_quantity := COALESCE(
      NULLIF(v_item ->> 'quantity', '')::NUMERIC,
      NULLIF(v_item ->> 'qtd', '')::NUMERIC,
      NULLIF(v_item ->> 'qty', '')::NUMERIC,
      1
    );

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'quantity must be greater than zero';
    END IF;

    v_product := NULL;

    IF v_product_id IS NOT NULL THEN
      SELECT *
      INTO v_product
      FROM public.products
      WHERE id = v_product_id
        AND user_id = p_user_id
        AND active = true;
    ELSIF v_product_name IS NOT NULL THEN
      SELECT *
      INTO v_product
      FROM public.products
      WHERE user_id = p_user_id
        AND active = true
        AND lower(name) = lower(v_product_name)
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    IF v_inventory_required AND v_product.id IS NULL THEN
      RAISE EXCEPTION 'Produto nao encontrado no catalogo: %', COALESCE(v_product_name, v_product_id::TEXT, 'sem nome');
    END IF;

    v_unit_price := COALESCE(
      NULLIF(v_item ->> 'unit_price', '')::NUMERIC,
      NULLIF(v_item ->> 'price', '')::NUMERIC,
      NULLIF(v_item ->> 'valor_unitario', '')::NUMERIC,
      NULLIF(v_item ->> 'valorUnitario', '')::NUMERIC,
      NULLIF(v_item ->> 'amount', '')::NUMERIC / NULLIF(v_quantity, 0),
      NULLIF(v_item ->> 'total', '')::NUMERIC / NULLIF(v_quantity, 0),
      v_product.price,
      0
    );

    v_subtotal := COALESCE(
      NULLIF(v_item ->> 'subtotal', '')::NUMERIC,
      v_quantity * v_unit_price
    );

    IF v_product.id IS NOT NULL THEN
      v_product_id := v_product.id;
      v_product_name := v_product.name;

      IF v_inventory_required AND NOT v_product.is_service THEN
        SELECT *
        INTO v_inventory
        FROM public.inventory
        WHERE product_id = v_product.id
        FOR UPDATE;

        IF v_inventory.id IS NULL THEN
          RAISE EXCEPTION 'Produto sem estoque configurado: %', v_product.name;
        END IF;

        IF v_inventory.quantity < v_quantity THEN
          RAISE EXCEPTION 'Estoque insuficiente para %. Disponivel: %, solicitado: %',
            v_product.name,
            v_inventory.quantity,
            v_quantity;
        END IF;

        UPDATE public.inventory
        SET quantity = quantity - v_quantity,
            updated_at = now()
        WHERE id = v_inventory.id;
      END IF;
    END IF;

    IF v_product_name IS NULL THEN
      v_product_name := 'Item via WhatsApp';
    END IF;

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      subtotal
    )
    VALUES (
      v_sale.id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_unit_price,
      v_subtotal
    );

    v_total := v_total + v_subtotal;
    v_result_items := v_result_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id,
      'product_name', v_product_name,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'subtotal', v_subtotal
    ));
  END LOOP;

  v_total := COALESCE(NULLIF(p_action_data ->> 'total', '')::NUMERIC, NULLIF(p_action_data ->> 'amount', '')::NUMERIC, v_total);

  UPDATE public.sales
  SET total = GREATEST(v_total - v_discount, 0),
      updated_at = now()
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  IF p_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET total_spent = total_spent + v_sale.total,
        last_purchase_at = v_sale.sold_at,
        updated_at = now()
    WHERE id = p_customer_id
      AND user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'items', v_result_items
  );
END;
$$;
