-- Add image_url column to categories table
ALTER TABLE categories ADD COLUMN image_url TEXT;

-- Update existing categories to have null image_url
UPDATE categories SET image_url = NULL; 