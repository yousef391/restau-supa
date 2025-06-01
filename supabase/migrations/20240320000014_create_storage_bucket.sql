-- Create a new storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow restaurant owners to update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow restaurant owners to delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'restaurant-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
); 