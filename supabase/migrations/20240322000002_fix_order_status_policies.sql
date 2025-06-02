-- Standardize order statuses
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check,
  ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('received', 'completed'));

-- Add RLS policies for order status updates
CREATE POLICY "Restaurant owners can update their orders"
ON orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = orders.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = orders.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Allow servers to update their own orders
DROP POLICY IF EXISTS "Servers can update their own orders" ON orders;
CREATE POLICY "Servers can update their own orders"
ON orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM servers
        WHERE servers.id = orders.server_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM servers
        WHERE servers.id = orders.server_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
); 