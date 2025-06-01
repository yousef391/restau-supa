-- First delete all objects in the bucket
DELETE FROM storage.objects WHERE bucket_id = 'restaurant-logos';

-- Then drop the bucket if it exists
DELETE FROM storage.buckets WHERE id = 'restaurant-logos';

-- Create a new bucket with public access and no size limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-logos',
  'restaurant-logos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

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
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;

-- Create policies for the bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-logos');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create function to validate logo uploads
CREATE OR REPLACE FUNCTION validate_logo_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if file is an image
  IF NEW.metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
    RAISE EXCEPTION 'Only JPEG, PNG, and WebP images are allowed';
  END IF;
  
  -- Check file size (5MB limit)
  IF (NEW.metadata->>'size')::bigint > 5242880 THEN
    RAISE EXCEPTION 'File size must be less than 5MB';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for logo upload validation
DROP TRIGGER IF EXISTS validate_logo_upload_trigger ON storage.objects;
CREATE TRIGGER validate_logo_upload_trigger
BEFORE INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'restaurant-logos')
EXECUTE FUNCTION validate_logo_upload(); 