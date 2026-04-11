-- Create meal_rsvps table for tracking which household members are eating/skipping each meal
CREATE TABLE meal_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('eating', 'skipped')) DEFAULT 'eating',
  created_at timestamptz DEFAULT now(),
  UNIQUE (meal_plan_id, user_id)
);

-- Index for fast lookups by meal_plan_id
CREATE INDEX idx_meal_rsvps_meal_plan_id ON meal_rsvps(meal_plan_id);

-- Enable RLS
ALTER TABLE meal_rsvps ENABLE ROW LEVEL SECURITY;

-- SELECT: household members can view RSVPs for meal plans in their household
CREATE POLICY "Household members can view RSVPs"
  ON meal_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      JOIN household_members hm ON hm.household_id = mp.household_id
      WHERE mp.id = meal_rsvps.meal_plan_id
        AND hm.user_id = auth.uid()
    )
  );

-- INSERT: users can only insert their own RSVP rows for meals in their household
CREATE POLICY "Users can insert own RSVPs"
  ON meal_rsvps FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM meal_plans mp
      JOIN household_members hm ON hm.household_id = mp.household_id
      WHERE mp.id = meal_rsvps.meal_plan_id
        AND hm.user_id = auth.uid()
    )
  );

-- UPDATE: users can only update their own RSVP status
CREATE POLICY "Users can update own RSVPs"
  ON meal_rsvps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
