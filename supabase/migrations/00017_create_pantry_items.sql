-- Pantry items table
-- Tracks items currently on hand in a household's kitchen pantry

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  quantity text,
  unit text,
  category text default 'Other',
  added_at timestamptz default now(),
  expires_at date,
  created_by uuid references auth.users(id),
  source_grocery_item_id uuid references grocery_items(id) on delete set null
);

-- Index for fast household lookups
create index idx_pantry_items_household on pantry_items(household_id);

-- RLS policies
alter table pantry_items enable row level security;

create policy "Household members can view pantry items"
  on pantry_items for select
  using (is_household_member(household_id, auth.uid()));

create policy "Household members can insert pantry items"
  on pantry_items for insert
  with check (is_household_member(household_id, auth.uid()));

create policy "Household members can update pantry items"
  on pantry_items for update
  using (is_household_member(household_id, auth.uid()));

create policy "Household members can delete pantry items"
  on pantry_items for delete
  using (is_household_member(household_id, auth.uid()));

-- Enable Realtime for pantry_items
alter publication supabase_realtime add table pantry_items;
