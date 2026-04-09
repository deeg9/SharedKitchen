-- Add computed nutrition columns to recipes table
-- Cached NutritionData per serving, computed from ingredient food_id matches
ALTER TABLE recipes ADD COLUMN computed_nutrition JSONB DEFAULT NULL;

-- Cached ingredient-to-food_id match results from AI matching
ALTER TABLE recipes ADD COLUMN ingredient_matches JSONB DEFAULT NULL;
