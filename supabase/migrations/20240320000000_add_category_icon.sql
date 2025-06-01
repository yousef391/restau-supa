-- Add icon_id column to categories table
ALTER TABLE categories ADD COLUMN icon_id TEXT;

-- Update existing categories to have a default icon
UPDATE categories SET icon_id = 'main-course' WHERE icon_id IS NULL; 