-- Subscriptions table: server-authoritative premium state (PAY-05)
-- Only service_role (Stripe webhook Edge Function) can write.
-- Users can only read their own subscription row via RLS.
-- This is the PAY-05 enforcement mechanism: premium features are gated
-- server-side because only service_role can set status to 'active'.

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by stripe IDs (webhook processing)
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions (stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions (stripe_subscription_id);

-- PAY-05: Enable RLS -- users can only SELECT their own subscription row
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- PAY-05: SELECT-only policy for authenticated users
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- PAY-05: NO INSERT/UPDATE/DELETE policies for authenticated role.
-- Only service_role (Edge Functions with SUPABASE_SERVICE_ROLE_KEY) can write.
-- This means clients CANNOT set their own subscription status to 'active' --
-- only the Stripe webhook Edge Function can do that.

-- Webhook idempotency: track processed Stripe event IDs (PAY-03)
CREATE TABLE processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-cleanup: remove events older than 7 days (Stripe retries for max 72 hours)
CREATE INDEX idx_processed_events_date ON processed_webhook_events (processed_at);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- No RLS policies needed -- only service_role accesses this table
