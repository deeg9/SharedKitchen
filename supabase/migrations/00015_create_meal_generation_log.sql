-- Meal generation audit log table
-- Tracks AI meal suggestion requests for analytics and rate limiting

CREATE TABLE meal_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  household_id uuid REFERENCES households NOT NULL,
  prompt_context jsonb NOT NULL,
  suggestions jsonb NOT NULL,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE meal_generation_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own generation logs
CREATE POLICY "Users can read own meal generation logs"
  ON meal_generation_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (Edge Function uses service_role key)
CREATE POLICY "Service role can insert meal generation logs"
  ON meal_generation_log
  FOR INSERT
  WITH CHECK (true);

-- Index for rate limiting and user history queries
CREATE INDEX idx_meal_gen_log_user ON meal_generation_log(user_id, created_at DESC);
