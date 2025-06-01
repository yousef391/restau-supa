-- First delete all objects in the bucket
DELETE FROM storage.objects WHERE bucket_id = 'restaurant-logos';

-- Then drop the bucket if it exists
DELETE FROM storage.buckets WHERE id = 'restaurant-logos';

-- Create a new bucket with public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true);

-- Create policies for the bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-logos' AND auth.uid()::text = (storage.foldername(name))[1]); 