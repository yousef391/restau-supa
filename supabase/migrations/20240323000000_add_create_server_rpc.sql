-- Add a function to create a new server with a hashed password
CREATE OR REPLACE FUNCTION create_server_with_password(
    p_restaurant_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_password TEXT
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
    v_password_hash := crypt(p_password, gen_salt('bf'));

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
        p_email,
        v_password_hash
    )
    RETURNING * INTO v_server;

    RETURN v_server;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION create_server_with_password TO authenticated; 