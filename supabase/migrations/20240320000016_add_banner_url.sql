-- Add banner_url column to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN restaurants.banner_url IS 'URL of the restaurant banner image'; 