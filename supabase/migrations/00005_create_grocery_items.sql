-- Grocery Lists table
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, week_start)
);

-- Grocery Items table
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  estimated_price DECIMAL(6,2),
  section TEXT CHECK (section IN ('Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other')),
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES profiles(id),
  checked_at TIMESTAMPTZ,
  is_manual BOOLEAN DEFAULT false,
  source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for grocery_lists
CREATE POLICY "grocery_lists_select" ON grocery_lists
  FOR SELECT USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "grocery_lists_insert" ON grocery_lists
  FOR INSERT WITH CHECK (is_household_member(household_id, auth.uid()));

CREATE POLICY "grocery_lists_update" ON grocery_lists
  FOR UPDATE USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "grocery_lists_delete" ON grocery_lists
  FOR DELETE USING (is_household_member(household_id, auth.uid()));

-- RLS policies for grocery_items
CREATE POLICY "grocery_items_select" ON grocery_items
  FOR SELECT USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE is_household_member(household_id, auth.uid())
    )
  );

CREATE POLICY "grocery_items_insert" ON grocery_items
  FOR INSERT WITH CHECK (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE is_household_member(household_id, auth.uid())
    )
  );

CREATE POLICY "grocery_items_update" ON grocery_items
  FOR UPDATE USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE is_household_member(household_id, auth.uid())
    )
  );

CREATE POLICY "grocery_items_delete" ON grocery_items
  FOR DELETE USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE is_household_member(household_id, auth.uid())
    )
  );

-- Enable Realtime for grocery_items
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
