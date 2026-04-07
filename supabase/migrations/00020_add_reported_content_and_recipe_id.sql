-- Migration: Add reported_content table and recipe_id column to feed_posts
-- Phase 33: Social Interactions & Moderation

-- 1. Add recipe_id column to feed_posts
ALTER TABLE feed_posts ADD COLUMN recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

-- 2. Create reported_content table
CREATE TABLE reported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  reason TEXT CHECK (char_length(reason) <= 500),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (content_type = 'post' AND post_id IS NOT NULL) OR
    (content_type = 'comment' AND comment_id IS NOT NULL)
  )
);

-- 3. RLS for reported_content
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kitchen members can view own reports"
  ON reported_content FOR SELECT
  USING (is_kitchen_member(reporter_kitchen_id, (select auth.uid())));

CREATE POLICY "Kitchen members can report content"
  ON reported_content FOR INSERT
  WITH CHECK (is_kitchen_member(reporter_kitchen_id, (select auth.uid())));
