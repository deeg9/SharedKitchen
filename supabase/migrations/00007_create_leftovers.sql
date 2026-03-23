-- Leftovers tracker table
-- Tracks leftover food items with freshness dates and portion counts

create table leftovers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  date_made date not null default current_date,
  use_by_date date not null,
  portions integer not null default 1,
  status text not null default 'fresh' check (status in ('fresh', 'frozen')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Index for fast household lookups
create index idx_leftovers_household on leftovers(household_id);

-- RLS policies
alter table leftovers enable row level security;

create policy "Household members can view leftovers"
  on leftovers for select
  using (is_household_member(household_id, auth.uid()));

create policy "Household members can insert leftovers"
  on leftovers for insert
  with check (is_household_member(household_id, auth.uid()));

create policy "Household members can update leftovers"
  on leftovers for update
  using (is_household_member(household_id, auth.uid()));

create policy "Household members can delete leftovers"
  on leftovers for delete
  using (is_household_member(household_id, auth.uid()));
