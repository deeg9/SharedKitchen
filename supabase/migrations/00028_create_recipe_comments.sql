-- Migration: Create recipe_comments table, indexes, RLS, and comment_count trigger
-- Phase 47: Recipe Comments

-- 1. Create the recipe_comments table
CREATE TABLE IF NOT EXISTS recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES recipe_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX idx_recipe_comments_recipe ON recipe_comments (recipe_id, created_at ASC);
CREATE INDEX idx_recipe_comments_parent ON recipe_comments (parent_id);
CREATE INDEX idx_recipe_comments_user ON recipe_comments (user_id);

-- 3. Enable RLS
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS SELECT policy (household members + followers of recipe's kitchen)
CREATE POLICY "Users can view recipe comments"
  ON recipe_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND (
        is_household_member(r.household_id, auth.uid())
        OR EXISTS (
          SELECT 1 FROM kitchen_profiles kp
          JOIN follows f ON f.following_kitchen_id = kp.id
          JOIN kitchen_profiles my_kp ON my_kp.id = f.follower_kitchen_id
          JOIN household_members hm ON hm.household_id = my_kp.household_id
          WHERE kp.household_id = r.household_id
          AND hm.user_id = auth.uid()
        )
      )
    )
  );

-- 5. RLS INSERT policy (household members only)
CREATE POLICY "Household members can add comments"
  ON recipe_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND is_household_member(r.household_id, auth.uid())
    )
  );

-- 6. RLS DELETE policy (comment author OR recipe creator)
CREATE POLICY "Comment author or recipe creator can delete"
  ON recipe_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND r.created_by = auth.uid()
    )
  );

-- 7. Add comment_count column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;

-- 8. Trigger for comment_count maintenance (mirrors feed_posts pattern from 00018)
CREATE OR REPLACE FUNCTION update_recipe_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET comment_count = comment_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_recipe_comment_count
  AFTER INSERT OR DELETE ON recipe_comments
  FOR EACH ROW EXECUTE FUNCTION update_recipe_comment_count();
