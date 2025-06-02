-- Update orders table to remove items JSONB column if it exists
ALTER TABLE orders
DROP COLUMN IF EXISTS items;

-- Keep total, status, and server_id columns (add if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received' CHECK (status IN ('received', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id);

-- Update create_server_order function to insert into order_items
CREATE OR REPLACE FUNCTION create_server_order(
    p_restaurant_id UUID,
    p_server_id UUID,
    p_table_number INTEGER,
    p_items JSONB -- Array of { menu_item_id: UUID, quantity: INTEGER, price: DECIMAL } objects
)
RETURNS orders AS $$
DECLARE
    v_order orders;
    v_item jsonb;
    v_total DECIMAL(10,2) := 0;
BEGIN
    -- Verify server belongs to restaurant
    IF NOT EXISTS (
        SELECT 1 FROM servers
        WHERE id = p_server_id
        AND restaurant_id = p_restaurant_id
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Server does not belong to this restaurant';
    END IF;

    -- Calculate total from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::integer;
    END LOOP;

    -- Create the main order entry
    INSERT INTO orders (
        restaurant_id,
        server_id,
        table_number,
        status,
        total
    )
    VALUES (
        p_restaurant_id,
        p_server_id,
        p_table_number,
        'received',
        v_total
    )
    RETURNING * INTO v_order;

    -- Insert items into order_items table
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO order_items (
            order_id,
            menu_item_id,
            quantity,
            price -- Store price at time of order in the 'price' column
        )
        VALUES (
            v_order.id,
            (v_item->>'menu_item_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::numeric
        );
    END LOOP;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 