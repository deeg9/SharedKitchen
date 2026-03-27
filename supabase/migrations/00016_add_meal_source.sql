-- Add meal source type and cost to meal_plans
ALTER TABLE meal_plans
  ADD COLUMN meal_source TEXT NOT NULL DEFAULT 'home-cooked'
    CHECK (meal_source IN ('home-cooked', 'takeout', 'eating-out')),
  ADD COLUMN meal_cost NUMERIC(10,2) DEFAULT NULL;

-- Require cost when source is not home-cooked
ALTER TABLE meal_plans
  ADD CONSTRAINT meal_cost_required_for_non_home_cooked
    CHECK (meal_source = 'home-cooked' OR meal_cost IS NOT NULL);

