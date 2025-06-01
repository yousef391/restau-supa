-- Drop the bucket if it exists
DELETE FROM storage.buckets WHERE id = 'restaurant-logos';

-- Create a new bucket with minimal settings
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true);

-- Drop all existing policies
DROP POLICY IF EXISTS "Restaurant owners can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their logos" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;

-- Create a single policy that allows everything
CREATE POLICY "Allow all operations"
ON storage.objects
FOR ALL
TO public
USING (true)
WITH CHECK (true); 