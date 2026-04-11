-- Migration: Create cook_logs table, indexes, RLS, and storage bucket
-- Phase 46: Cook Log with Photos

-- 1. Create the cook_logs table
CREATE TABLE IF NOT EXISTS cook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  photo_url TEXT,
  notes TEXT CHECK (char_length(notes) <= 500),
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX idx_cook_logs_recipe ON cook_logs (recipe_id);
CREATE INDEX idx_cook_logs_user ON cook_logs (user_id);
CREATE INDEX idx_cook_logs_household ON cook_logs (household_id);
CREATE INDEX idx_cook_logs_cooked_at ON cook_logs (cooked_at DESC);
CREATE INDEX idx_cook_logs_recipe_cooked ON cook_logs (recipe_id, cooked_at DESC);

-- 3. Enable RLS
ALTER TABLE cook_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Household members can view cook logs"
  ON cook_logs FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can create cook logs"
  ON cook_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_household_member(household_id, auth.uid()));

CREATE POLICY "Users can delete own cook logs"
  ON cook_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Storage bucket for cook log photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cook-log-photos', 'cook-log-photos', true)
ON CONFLICT DO NOTHING;

-- 6. Storage policies
-- Public read
CREATE POLICY "Public read for cook-log-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cook-log-photos');

-- Authenticated upload
CREATE POLICY "Authenticated upload for cook-log-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cook-log-photos'
    AND auth.role() = 'authenticated'
  );

-- Users delete own photos (path: {recipeId}/{userId}/{timestamp}.jpg — userId is 2nd folder segment)
CREATE POLICY "Users delete own cook-log-photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cook-log-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
