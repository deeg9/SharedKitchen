-- Migration 00018: Create social tables for v5.0 Social Feed
-- Tables: kitchen_profiles, follows, feed_posts, post_likes, post_comments, saved_recipes, blocked_kitchens
-- Also creates: is_kitchen_member() helper, follow/like/comment count triggers

-- =============================================================================
-- Helper function: is_kitchen_member
-- Checks if a user is a member of the household that owns a kitchen profile
-- =============================================================================
CREATE OR REPLACE FUNCTION is_kitchen_member(p_kitchen_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kitchen_profiles kp
    JOIN household_members hm ON hm.household_id = kp.household_id
    WHERE kp.id = p_kitchen_id AND hm.user_id = p_user_id
  );
$$;

-- =============================================================================
-- Table 1: kitchen_profiles
-- The public-facing social identity for a household
-- =============================================================================
CREATE TABLE kitchen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT CHECK (char_length(bio) <= 300),
  avatar_url TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  is_public BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT true,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kitchen_profiles_household ON kitchen_profiles(household_id);
CREATE INDEX idx_kitchen_profiles_display_name ON kitchen_profiles(display_name);
CREATE INDEX idx_kitchen_profiles_invite_code ON kitchen_profiles(invite_code);

-- =============================================================================
-- Table 2: follows
-- Kitchen-to-kitchen follow relationships
-- =============================================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  following_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_kitchen_id, following_kitchen_id),
  CHECK (follower_kitchen_id != following_kitchen_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_kitchen_id);
CREATE INDEX idx_follows_following ON follows(following_kitchen_id);

-- =============================================================================
-- Table 3: feed_posts
-- Denormalized feed items (snapshots, not live JOINs)
-- =============================================================================
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  recipe_name TEXT NOT NULL,
  recipe_image_url TEXT,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 500),
  photo_url TEXT,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_posts_kitchen ON feed_posts(kitchen_id);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);

-- =============================================================================
-- Table 4: post_likes
-- Like/heart on feed posts
-- =============================================================================
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, kitchen_id)
);

-- =============================================================================
-- Table 5: post_comments
-- Flat comments on feed posts
-- =============================================================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- =============================================================================
-- Table 6: saved_recipes
-- Recipes saved from feed to own library
-- =============================================================================
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  source_kitchen_id UUID REFERENCES kitchen_profiles(id) ON DELETE SET NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  feed_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kitchen_id, recipe_id)
);

-- =============================================================================
-- Table 7: blocked_kitchens
-- Block a kitchen to hide their content
-- =============================================================================
CREATE TABLE blocked_kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  blocked_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_kitchen_id, blocked_kitchen_id)
);

-- =============================================================================
-- Triggers: Follow count maintenance
-- =============================================================================
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kitchen_profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_kitchen_id;
    UPDATE kitchen_profiles SET following_count = following_count + 1 WHERE id = NEW.follower_kitchen_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE kitchen_profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_kitchen_id;
    UPDATE kitchen_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_kitchen_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- =============================================================================
-- Triggers: Like count maintenance
-- =============================================================================
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- =============================================================================
-- Triggers: Comment count maintenance
-- =============================================================================
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- =============================================================================
-- RLS: Enable on all tables
-- =============================================================================
ALTER TABLE kitchen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_kitchens ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies: kitchen_profiles
-- =============================================================================
CREATE POLICY "Anyone can view public kitchens"
  ON kitchen_profiles FOR SELECT
  USING (
    is_public = true
    OR is_kitchen_member(id, (select auth.uid()))
  );

CREATE POLICY "Household members can create kitchen profile"
  ON kitchen_profiles FOR INSERT
  WITH CHECK (is_household_member(household_id, (select auth.uid())));

CREATE POLICY "Kitchen members can update kitchen profile"
  ON kitchen_profiles FOR UPDATE
  USING (is_kitchen_member(id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: follows
-- =============================================================================
CREATE POLICY "Anyone can view follow relationships"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Kitchen members can follow as their kitchen"
  ON follows FOR INSERT
  WITH CHECK (is_kitchen_member(follower_kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can unfollow as their kitchen"
  ON follows FOR DELETE
  USING (is_kitchen_member(follower_kitchen_id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: feed_posts
-- =============================================================================
CREATE POLICY "Anyone can view feed posts"
  ON feed_posts FOR SELECT
  USING (true);

CREATE POLICY "Kitchen members can create feed posts"
  ON feed_posts FOR INSERT
  WITH CHECK (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can update own feed posts"
  ON feed_posts FOR UPDATE
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can delete own feed posts"
  ON feed_posts FOR DELETE
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: post_likes
-- =============================================================================
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Kitchen members can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can unlike posts"
  ON post_likes FOR DELETE
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: post_comments
-- =============================================================================
CREATE POLICY "Anyone can view post comments"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Kitchen members can comment on posts"
  ON post_comments FOR INSERT
  WITH CHECK (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can delete own comments"
  ON post_comments FOR DELETE
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: saved_recipes
-- =============================================================================
CREATE POLICY "Kitchen members can view own saved recipes"
  ON saved_recipes FOR SELECT
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can save recipes"
  ON saved_recipes FOR INSERT
  WITH CHECK (is_kitchen_member(kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can unsave recipes"
  ON saved_recipes FOR DELETE
  USING (is_kitchen_member(kitchen_id, (select auth.uid())));

-- =============================================================================
-- RLS Policies: blocked_kitchens
-- =============================================================================
CREATE POLICY "Kitchen members can view own blocks"
  ON blocked_kitchens FOR SELECT
  USING (is_kitchen_member(blocker_kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can block kitchens"
  ON blocked_kitchens FOR INSERT
  WITH CHECK (is_kitchen_member(blocker_kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can unblock kitchens"
  ON blocked_kitchens FOR DELETE
  USING (is_kitchen_member(blocker_kitchen_id, (select auth.uid())));
