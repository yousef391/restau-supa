-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    notes TEXT
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
    notes TEXT
);

-- Add RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow restaurant owners to manage their orders
CREATE POLICY "Restaurant owners can manage their orders"
ON orders FOR ALL
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

-- Allow restaurant owners to manage their order items
CREATE POLICY "Restaurant owners can manage their order items"
ON order_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        JOIN restaurants ON restaurants.id = orders.restaurant_id
        WHERE orders.id = order_items.order_id
        AND restaurants.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        JOIN restaurants ON restaurants.id = orders.restaurant_id
        WHERE orders.id = order_items.order_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Create function to get daily sales
CREATE OR REPLACE FUNCTION get_daily_sales(restaurant_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    date DATE,
    total_amount DECIMAL(10,2),
    order_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(orders.created_at) as date,
        SUM(orders.total_amount) as total_amount,
        COUNT(*) as order_count
    FROM orders
    WHERE 
        orders.restaurant_id = restaurant_id
        AND DATE(orders.created_at) BETWEEN start_date AND end_date
        AND orders.status != 'cancelled'
        AND orders.payment_status = 'paid'
    GROUP BY DATE(orders.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 