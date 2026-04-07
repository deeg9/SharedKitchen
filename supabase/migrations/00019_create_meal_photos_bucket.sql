-- ============================================================
-- Migration: 00019_create_meal_photos_bucket
-- Creates meal-photos storage bucket with RLS for feed post photos
-- ============================================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS policies for storage.objects
-- ============================================================

-- Public read access for meal-photos
CREATE POLICY "Public read access for meal-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos');

-- Authenticated users can upload meal photos
CREATE POLICY "Authenticated users can upload meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-photos'
    AND auth.role() = 'authenticated'
  );

-- Users can update their own meal photos (files stored as {user_id}/filename)
CREATE POLICY "Users can update own meal photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'meal-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own meal photos
CREATE POLICY "Users can delete own meal photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
