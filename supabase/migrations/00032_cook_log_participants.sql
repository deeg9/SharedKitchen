-- Migration: Create cook_log_participants junction table
-- Phase 52: Co-Cook Tagging

-- 1. Junction table for co-cook participants on cook logs
CREATE TABLE IF NOT EXISTS cook_log_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_log_id UUID NOT NULL REFERENCES cook_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cook_log_id, user_id)
);

-- 2. Indexes
CREATE INDEX idx_cook_log_participants_cook_log ON cook_log_participants (cook_log_id);
CREATE INDEX idx_cook_log_participants_user ON cook_log_participants (user_id);

-- 3. RLS
ALTER TABLE cook_log_participants ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user (feed posts are public)
CREATE POLICY "Authenticated users can view cook log participants"
  ON cook_log_participants FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the cook log creator can insert participants
CREATE POLICY "Cook log creator can add participants"
  ON cook_log_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cook_logs
      WHERE cook_logs.id = cook_log_id
      AND cook_logs.user_id = auth.uid()
    )
  );

-- Only the cook log creator can delete participants
CREATE POLICY "Cook log creator can delete participants"
  ON cook_log_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cook_logs
      WHERE cook_logs.id = cook_log_id
      AND cook_logs.user_id = auth.uid()
    )
  );
