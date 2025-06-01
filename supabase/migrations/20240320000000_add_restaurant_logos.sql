-- Create storage bucket for restaurant logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true)
ON CONFLICT (id) DO NOTHING;

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

-- Add logo_url column to restaurants table if it doesn't exist
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS logo_url TEXT;

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
  
  -- Check file size (2MB limit)
  IF (NEW.metadata->>'size')::bigint > 2097152 THEN
    RAISE EXCEPTION 'File size must be less than 2MB';
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