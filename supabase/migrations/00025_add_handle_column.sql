-- Migration: Add handle column to profiles table
-- Phase 44: Handle System & Identity Foundation

-- 1. Add handle column (NULLABLE per locked decision - never NOT NULL at DB level)
ALTER TABLE profiles ADD COLUMN handle TEXT;
ALTER TABLE profiles ADD COLUMN handle_changed_at TIMESTAMPTZ;

-- 2. Case-insensitive unique index (NULLs don't conflict in Postgres)
CREATE UNIQUE INDEX idx_profiles_handle_lower ON profiles (LOWER(handle));

-- 3. Format constraint at DB level (defense in depth)
ALTER TABLE profiles ADD CONSTRAINT chk_handle_format
  CHECK (handle IS NULL OR (handle ~ '^[a-z0-9_]{3,20}$'));

-- 4. Broaden profiles RLS: any authenticated user can read profile fields
-- Needed because @handles must be visible on feed posts, recipe attribution, etc.
-- across households and followed kitchens.
-- Existing narrower SELECT policies are subsumed but can remain without harm.
CREATE POLICY "Authenticated users can read any profile"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
