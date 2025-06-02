-- Enable RLS on orders if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow servers to view their own orders
CREATE POLICY "Servers can view their own orders"
ON orders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM servers
        WHERE servers.id = orders.server_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
);

-- Allow servers to create orders
CREATE POLICY "Servers can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM servers
        WHERE servers.id = orders.server_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
);

-- Enable RLS on order_items if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow servers to view order items for their orders
CREATE POLICY "Servers can view their order items"
ON order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        JOIN servers ON servers.id = orders.server_id
        WHERE orders.id = order_items.order_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
);

-- Allow servers to create order items
CREATE POLICY "Servers can create order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        JOIN servers ON servers.id = orders.server_id
        WHERE orders.id = order_items.order_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
); 