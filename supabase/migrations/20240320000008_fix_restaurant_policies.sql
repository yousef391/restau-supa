-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurant owners can update their restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can delete their restaurant" ON restaurants;

-- Create policies for restaurants table
CREATE POLICY "Restaurant owners can view their restaurant"
ON restaurants FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can update their restaurant"
ON restaurants FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Restaurant owners can delete their restaurant"
ON restaurants FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Enable RLS on restaurants table if not already enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY; 