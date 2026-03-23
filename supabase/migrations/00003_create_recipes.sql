-- ============================================================
-- Migration: 00003_create_recipes
-- Creates recipes, recipe_ratings, recipe_notes tables with RLS
-- ============================================================

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  prep_time_minutes INT,
  cook_time_minutes INT,
  servings INT DEFAULT 4,
  estimated_cost NUMERIC(6,2),
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recipe ratings table (one rating per user per recipe)
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe notes table
CREATE TABLE IF NOT EXISTS recipe_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_recipes_household_id ON recipes(household_id);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_notes_recipe_id ON recipe_notes(recipe_id);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for recipes (using existing is_household_member function)
CREATE POLICY "Users can view recipes in their household"
  ON recipes FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can insert recipes in their household"
  ON recipes FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update recipes in their household"
  ON recipes FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Users can delete recipes in their household"
  ON recipes FOR DELETE
  USING (is_household_member(household_id));

-- RLS policies for recipe_ratings (join through recipes to check household)
CREATE POLICY "Users can view ratings for household recipes"
  ON recipe_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ratings.recipe_id
    AND is_household_member(r.household_id)
  ));

CREATE POLICY "Users can insert ratings for household recipes"
  ON recipe_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_ratings.recipe_id
      AND is_household_member(r.household_id)
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON recipe_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON recipe_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for recipe_notes (join through recipes to check household)
CREATE POLICY "Users can view notes for household recipes"
  ON recipe_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_notes.recipe_id
    AND is_household_member(r.household_id)
  ));

CREATE POLICY "Users can insert notes for household recipes"
  ON recipe_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_notes.recipe_id
      AND is_household_member(r.household_id)
    )
  );

CREATE POLICY "Users can update their own notes"
  ON recipe_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON recipe_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for recipes
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_updated_at();
