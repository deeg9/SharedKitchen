-- Migration: Create public_profiles VIEW for cross-user profile access
-- Phase 49: Tech Debt & Type Safety (DEBT-01)
--
-- Restricts cross-user profile visibility to safe columns only.
-- Own-profile access continues via direct profiles table with existing RLS.

-- 1. Create restricted VIEW (only safe columns for cross-user access)
CREATE VIEW public_profiles AS
  SELECT id, handle, display_name, avatar_url
  FROM profiles;

-- 2. Grant access to authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- 3. Drop the overly broad read policy (DEBT-01)
-- Own-profile read (auth.uid() = id from 00001) remains intact.
DROP POLICY IF EXISTS "Authenticated users can read any profile" ON profiles;
