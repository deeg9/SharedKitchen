-- Add nutrition info and source image URL columns to recipes table
-- Part of Phase 08: Enhanced AI & Cooking Mode

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS nutrition_info jsonb DEFAULT NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_image_url text DEFAULT NULL;

COMMENT ON COLUMN recipes.nutrition_info IS 'Structured nutrition data extracted from recipe source (calories, protein, fat, carbs, etc.)';
COMMENT ON COLUMN recipes.source_image_url IS 'Original image URL from the recipe source website';
