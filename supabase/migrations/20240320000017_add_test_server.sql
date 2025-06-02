-- Add a test server (password: test123)
DO $$
DECLARE
    v_restaurant_id UUID;
    v_server_exists BOOLEAN;
BEGIN
    -- Get the restaurant ID
    SELECT id INTO v_restaurant_id
    FROM restaurants
    ORDER BY created_at DESC
    LIMIT 1;

    -- Log the restaurant ID for debugging
    RAISE NOTICE 'Creating server for restaurant: %', v_restaurant_id;

    -- Check if server already exists
    SELECT EXISTS (
        SELECT 1 FROM servers WHERE email = 'server@test.com'
    ) INTO v_server_exists;

    IF v_server_exists THEN
        -- Update existing server
        UPDATE servers
        SET 
            restaurant_id = v_restaurant_id,
            name = 'Test Server',
            password_hash = crypt('test123', gen_salt('bf')),
            is_active = true
        WHERE email = 'server@test.com';
        
        RAISE NOTICE 'Updated existing server';
    ELSE
        -- Insert new server
        INSERT INTO servers (restaurant_id, name, email, password_hash)
        VALUES (
            v_restaurant_id,
            'Test Server',
            'server@test.com',
            crypt('test123', gen_salt('bf'))
        );
        
        RAISE NOTICE 'Created new server';
    END IF;

    -- Log success
    RAISE NOTICE 'Server setup completed successfully';
END $$; 