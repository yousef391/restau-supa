-- Add social media columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN restaurants.facebook_url IS 'Facebook page URL for the restaurant';
COMMENT ON COLUMN restaurants.instagram_url IS 'Instagram profile URL for the restaurant'; 