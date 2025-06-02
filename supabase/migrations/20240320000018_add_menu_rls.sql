-- Enable RLS on menu_items if not already enabled
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow servers to view menu items for their restaurant
CREATE POLICY "Servers can view menu items"
ON menu_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM servers
        WHERE servers.restaurant_id = menu_items.restaurant_id
        AND servers.email = auth.email()
        AND servers.is_active = true
    )
);

-- Allow restaurant owners to manage menu items
CREATE POLICY "Restaurant owners can manage menu items"
ON menu_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = menu_items.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
); 