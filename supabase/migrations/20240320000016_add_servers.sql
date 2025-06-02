-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for servers
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- Servers can view their own profile
CREATE POLICY "Servers can view own profile"
ON servers FOR SELECT
TO authenticated
USING (email = auth.email());

-- Restaurant owners can view their servers
CREATE POLICY "Restaurant owners can view their servers"
ON servers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = servers.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Restaurant owners can manage their servers
CREATE POLICY "Restaurant owners can manage their servers"
ON servers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = servers.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Create function to handle server authentication
CREATE OR REPLACE FUNCTION authenticate_server(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    name TEXT,
    email TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.restaurant_id,
        s.name,
        s.email,
        s.is_active
    FROM servers s
    WHERE s.email = p_email
    AND s.password_hash = crypt(p_password, s.password_hash)
    AND s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add server_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id);

-- Create function to create order as server
CREATE OR REPLACE FUNCTION create_server_order(
    p_restaurant_id UUID,
    p_server_id UUID,
    p_table_number INTEGER,
    p_items JSONB
)
RETURNS orders AS $$
DECLARE
    v_order orders;
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

    -- Create the order
    INSERT INTO orders (
        restaurant_id,
        server_id,
        table_number,
        status,
        items,
        total
    )
    VALUES (
        p_restaurant_id,
        p_server_id,
        p_table_number,
        'received',
        p_items,
        (SELECT COALESCE(SUM((item->>'price')::numeric * (item->>'quantity')::integer), 0)
         FROM jsonb_array_elements(p_items) AS item)
    )
    RETURNING * INTO v_order;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 