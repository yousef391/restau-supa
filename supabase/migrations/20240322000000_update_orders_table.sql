-- Update orders table to remove items JSONB column if it exists
ALTER TABLE orders
DROP COLUMN IF EXISTS items;

-- Keep total, status, and server_id columns (add if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received' CHECK (status IN ('received', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id);

-- Drop the existing function with the old return type
DROP FUNCTION IF EXISTS create_server_order(uuid,uuid,integer,jsonb);

-- Update create_server_order function to insert into order_items and return ticket data
CREATE OR REPLACE FUNCTION create_server_order(
    p_restaurant_id UUID,
    p_server_id UUID,
    p_table_number INTEGER,
    p_items JSONB -- Array of { menu_item_id: UUID, quantity: INTEGER, price: DECIMAL } objects
)
RETURNS JSON AS $$
DECLARE
    v_order orders;
    v_item jsonb;
    v_order_items_data JSONB := '[]'; -- Use a new variable for item data
    v_total DECIMAL(10,2) := 0;
    v_restaurant_info JSON;
    v_order_details JSON;
    v_menu_item_name TEXT;
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

    -- Insert items into order_items table and collect data for ticket
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        -- Get menu item name
        SELECT name INTO v_menu_item_name
        FROM menu_items
        WHERE id = (v_item->>'menu_item_id')::UUID;

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

        -- Add item details to a JSONB array
        v_order_items_data := v_order_items_data || jsonb_build_object(
            'name', v_menu_item_name,
            'quantity', (v_item->>'quantity')::INTEGER,
            'price', (v_item->>'price')::numeric,
            'subtotal', (v_item->>'price')::numeric * (v_item->>'quantity')::integer
        );
    END LOOP;

    -- Get restaurant info
    SELECT row_to_json(r) INTO v_restaurant_info
    FROM restaurants r
    WHERE r.id = p_restaurant_id;

    -- Build order details for the ticket
    v_order_details := json_build_object(
        'id', v_order.id,
        'table_number', v_order.table_number,
        'created_at', v_order.created_at,
        'total', v_order.total,
        'items', v_order_items_data -- Use the collected item data
    );

    -- Return the complete ticket data as JSON
    RETURN json_build_object(
        'restaurant', v_restaurant_info,
        'order', v_order_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 