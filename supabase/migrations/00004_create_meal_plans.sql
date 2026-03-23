-- Meal Plans table for weekly dinner planning
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  plan_date DATE NOT NULL,
  assigned_cook UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, plan_date)
);

-- Indexes
CREATE INDEX idx_meal_plans_household ON meal_plans(household_id);
CREATE INDEX idx_meal_plans_date ON meal_plans(plan_date);
CREATE INDEX idx_meal_plans_household_date ON meal_plans(household_id, plan_date);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing is_household_member() function
CREATE POLICY "Household members can view meal plans"
  ON meal_plans FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Household members can create meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Household members can update meal plans"
  ON meal_plans FOR UPDATE
  USING (is_household_member(household_id));

CREATE POLICY "Household members can delete meal plans"
  ON meal_plans FOR DELETE
  USING (is_household_member(household_id));
