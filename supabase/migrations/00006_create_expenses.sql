-- Budget tracking: expenses and budget settings tables
-- Supports monthly budget tracking with category breakdown

-- ============================================================
-- Expenses table
-- ============================================================
CREATE TABLE expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  amount      numeric(10,2) NOT NULL,
  category    text NOT NULL CHECK (category IN ('Groceries', 'Dining Out', 'Takeout')),
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view expenses"
  ON expenses FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can update expenses"
  ON expenses FOR UPDATE
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can delete expenses"
  ON expenses FOR DELETE
  USING (is_household_member(household_id, auth.uid()));

-- ============================================================
-- Budget settings table (one row per household)
-- ============================================================
CREATE TABLE budget_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  monthly_target numeric(10,2) NOT NULL DEFAULT 600,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view budget settings"
  ON budget_settings FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can insert budget settings"
  ON budget_settings FOR INSERT
  WITH CHECK (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can update budget settings"
  ON budget_settings FOR UPDATE
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can delete budget settings"
  ON budget_settings FOR DELETE
  USING (is_household_member(household_id, auth.uid()));

-- ============================================================
-- Realtime publication for expenses
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX idx_expenses_household_date ON expenses(household_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(household_id, category);
