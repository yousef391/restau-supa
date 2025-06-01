-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Restaurant owners can create their restaurant" ON restaurants;

-- Create policy for restaurant creation
CREATE POLICY "Restaurant owners can create their restaurant"
ON restaurants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Ensure RLS is enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY; 