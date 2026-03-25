-- AI usage logging table for rate limiting and response caching
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  function_name TEXT NOT NULL,
  input_hash TEXT,
  cached_response JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage_log (user_id, created_at);
CREATE INDEX idx_ai_usage_hash ON ai_usage_log (input_hash) WHERE input_hash IS NOT NULL;

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_select_own" ON ai_usage_log FOR SELECT USING (auth.uid() = user_id);
-- No client INSERT/UPDATE/DELETE -- only service_role (Edge Functions) writes
