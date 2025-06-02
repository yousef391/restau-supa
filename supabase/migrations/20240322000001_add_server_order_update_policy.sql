-- Allow servers to update their own orders
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