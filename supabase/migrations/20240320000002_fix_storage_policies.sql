-- Drop existing policies
DROP POLICY IF EXISTS "Restaurant owners can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their logos" ON storage.objects;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the restaurant-logos bucket
CREATE POLICY "Enable read access for all users"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Enable insert for authenticated users only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

CREATE POLICY "Enable update for authenticated users only"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Enable delete for authenticated users only"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-logos'); 