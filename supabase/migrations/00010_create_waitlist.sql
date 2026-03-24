-- Waitlist signups from landing page
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anonymous inserts (landing page visitors aren't authenticated)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can view the list (optional future use)
CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist FOR SELECT
  USING (auth.role() = 'authenticated');
