-- Drop existing bucket if it exists
DROP POLICY IF EXISTS "Restaurant owners can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant logos" ON storage.objects;

-- Drop and recreate the bucket
DROP BUCKET IF EXISTS "restaurant-logos";
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true);

-- Create policies for the restaurant-logos bucket
CREATE POLICY "Restaurant owners can upload their logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-logos' AND
  auth.uid() IN (
    SELECT owner_id FROM restaurants
    WHERE id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Restaurant owners can update their logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-logos' AND
  auth.uid() IN (
    SELECT owner_id FROM restaurants
    WHERE id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Restaurant owners can delete their logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-logos' AND
  auth.uid() IN (
    SELECT owner_id FROM restaurants
    WHERE id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Public can view restaurant logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-logos'); 