-- Add meal_type column to support breakfast, lunch, and dinner per day
ALTER TABLE meal_plans ADD COLUMN meal_type TEXT NOT NULL DEFAULT 'dinner'
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'));

-- Drop old unique constraint (one meal per day)
ALTER TABLE meal_plans DROP CONSTRAINT meal_plans_household_id_plan_date_key;

-- Add new unique constraint (one meal per type per day)
ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_household_meal_unique
  UNIQUE (household_id, plan_date, meal_type);
