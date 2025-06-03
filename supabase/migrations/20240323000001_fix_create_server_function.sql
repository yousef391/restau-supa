-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS create_server_with_password(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_server_with_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_server_with_password(UUID, TEXT, TEXT);

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION create_server_with_password(
    p_restaurant_id UUID,
    p_name TEXT,
    server_email TEXT,
    server_password TEXT
)
RETURNS servers AS $$
DECLARE
    v_server servers;
    v_password_hash TEXT;
BEGIN
    -- Check if the user is the owner of the restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants
        WHERE id = p_restaurant_id
        AND owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the restaurant owner can add servers';
    END IF;

    -- Hash the password
    v_password_hash := crypt(server_password, gen_salt('bf'));

    -- Insert the new server
    INSERT INTO servers (
        restaurant_id,
        name,
        email,
        password_hash
    )
    VALUES (
        p_restaurant_id,
        p_name,
        server_email,
        v_password_hash
    )
    RETURNING * INTO v_server;

    RETURN v_server;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION create_server_with_password(UUID, TEXT, TEXT, TEXT) TO authenticated; 