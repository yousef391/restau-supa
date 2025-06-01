-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_items_updated_at();

-- Add RLS policies
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
ON menu_items FOR SELECT
TO authenticated
USING (true);

-- Allow insert/update/delete only to restaurant owners
CREATE POLICY "Allow restaurant owners to manage menu items"
ON menu_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = menu_items.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = menu_items.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
); 