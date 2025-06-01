-- Add Google Maps URL column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN google_maps_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN restaurants.google_maps_url IS 'Google Maps URL for the restaurant location'; 