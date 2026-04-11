-- Migration: Feed cook-log integration
-- Adds post_type discriminator, cook_log_id FK, nullable meal fields,
-- saved_from columns on recipes, and clone_recipe_to_household RPC.

-- 1. Add post_type column with CHECK constraint
ALTER TABLE feed_posts
  ADD COLUMN post_type TEXT NOT NULL DEFAULT 'meal_plan'
  CONSTRAINT feed_posts_post_type_check CHECK (post_type IN ('meal_plan', 'cook_log'));

-- 2. Add cook_log_id FK with partial unique index
ALTER TABLE feed_posts
  ADD COLUMN cook_log_id UUID REFERENCES cook_logs(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX feed_posts_cook_log_id_unique
  ON feed_posts (cook_log_id)
  WHERE cook_log_id IS NOT NULL;

-- 3. Make meal_date and meal_type nullable (cook-log posts have no meal plan context)
ALTER TABLE feed_posts
  ALTER COLUMN meal_date DROP NOT NULL,
  ALTER COLUMN meal_type DROP NOT NULL;

-- 4. Add saved_from columns to recipes
ALTER TABLE recipes
  ADD COLUMN saved_from_kitchen_id UUID REFERENCES kitchen_profiles(id) ON DELETE SET NULL,
  ADD COLUMN saved_from_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- 5. Create clone_recipe_to_household SECURITY DEFINER function
CREATE OR REPLACE FUNCTION clone_recipe_to_household(
  p_source_recipe_id UUID,
  p_target_household_id UUID,
  p_source_kitchen_id UUID,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- Verify caller is member of target household
  IF NOT is_household_member(p_target_household_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of the target household';
  END IF;

  INSERT INTO recipes (
    household_id,
    name,
    category,
    image_url,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    estimated_cost,
    ingredients,
    instructions,
    tags,
    source_url,
    nutrition_info,
    source_image_url,
    created_by,
    saved_from_kitchen_id,
    saved_from_recipe_id
  )
  SELECT
    p_target_household_id,
    name,
    category,
    image_url,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    estimated_cost,
    ingredients,
    instructions,
    tags,
    source_url,
    nutrition_info,
    source_image_url,
    p_created_by,
    p_source_kitchen_id,
    p_source_recipe_id
  FROM recipes
  WHERE id = p_source_recipe_id
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
