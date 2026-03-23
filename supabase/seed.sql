-- Seed data for local development
-- Re-runnable: all inserts use ON CONFLICT DO NOTHING
-- Fixed UUIDs for referential integrity

-- ============================================================
-- 1. Test users in auth.users
-- ============================================================

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'alice@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name":"Alice Test"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'bob@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name":"Bob Test"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Profiles (trigger auto-creates, but seed explicitly for safety)
-- ============================================================

INSERT INTO profiles (id, display_name, avatar_url, created_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Alice Test',
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, avatar_url, created_at)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Bob Test',
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Household
-- ============================================================

INSERT INTO households (id, name, invite_code, created_by, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Kitchen',
  'testkitc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Household members (Alice as admin/owner, Bob as member)
-- ============================================================

INSERT INTO household_members (id, household_id, user_id, role, joined_at)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin',
  now()
)
ON CONFLICT (household_id, user_id) DO NOTHING;

INSERT INTO household_members (id, household_id, user_id, role, joined_at)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'member',
  now()
)
ON CONFLICT (household_id, user_id) DO NOTHING;

-- ============================================================
-- 5. Recipes (three recipes in the household)
-- ============================================================

INSERT INTO recipes (id, household_id, name, category, servings, prep_time_minutes, cook_time_minutes, estimated_cost, ingredients, instructions, tags, created_by, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Spaghetti Bolognese',
  'Italian',
  4,
  15,
  30,
  12.50,
  '[{"name":"spaghetti","amount":"400g"},{"name":"ground beef","amount":"500g"},{"name":"canned tomatoes","amount":"800g"},{"name":"onion","amount":"1 large"}]'::jsonb,
  '["Cook spaghetti according to package directions.","Brown ground beef with diced onion in a large skillet.","Add canned tomatoes, simmer for 20 minutes, and serve over pasta."]'::jsonb,
  ARRAY['dinner', 'pasta', 'easy'],
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, household_id, name, category, servings, prep_time_minutes, cook_time_minutes, estimated_cost, ingredients, instructions, tags, created_by, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Chicken Stir Fry',
  'Asian',
  2,
  10,
  15,
  9.00,
  '[{"name":"chicken breast","amount":"300g"},{"name":"mixed vegetables","amount":"400g"},{"name":"soy sauce","amount":"3 tbsp"}]'::jsonb,
  '["Slice chicken into strips and stir-fry until golden.","Add vegetables and soy sauce, cook for 5 minutes until tender-crisp."]'::jsonb,
  ARRAY['dinner', 'quick', 'healthy'],
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, household_id, name, category, servings, prep_time_minutes, cook_time_minutes, estimated_cost, ingredients, instructions, tags, created_by, created_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Chocolate Cake',
  'Dessert',
  8,
  20,
  35,
  8.00,
  '[{"name":"flour","amount":"2 cups"},{"name":"cocoa powder","amount":"3/4 cup"},{"name":"eggs","amount":"3"}]'::jsonb,
  '["Preheat oven to 350F and grease two 9-inch cake pans.","Mix dry ingredients, add wet ingredients, and beat until smooth.","Bake for 30-35 minutes until a toothpick comes out clean."]'::jsonb,
  ARRAY['dessert', 'baking'],
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Meal plan (current week, 2 entries)
-- ============================================================

INSERT INTO meal_plans (id, household_id, recipe_id, plan_date, assigned_cook, notes, created_by)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  CURRENT_DATE,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Classic family dinner',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (household_id, plan_date) DO NOTHING;

INSERT INTO meal_plans (id, household_id, recipe_id, plan_date, assigned_cook, notes, created_by)
VALUES (
  '55555555-5555-5555-5555-555555555556',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  CURRENT_DATE + INTERVAL '1 day',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Quick weeknight meal',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT (household_id, plan_date) DO NOTHING;

-- ============================================================
-- 7. Grocery list with 4 items
-- ============================================================

INSERT INTO grocery_lists (id, household_id, week_start, created_by)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  date_trunc('week', CURRENT_DATE)::date,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (household_id, week_start) DO NOTHING;

INSERT INTO grocery_items (id, grocery_list_id, name, quantity, estimated_price, section, is_checked, is_manual, source_recipe_id)
VALUES
  ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666666', 'Ground beef', '500g', 6.99, 'Proteins', false, false, '22222222-2222-2222-2222-222222222222'),
  ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666666', 'Spaghetti', '400g', 2.49, 'Pantry', true, false, '22222222-2222-2222-2222-222222222222'),
  ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666666', 'Mixed vegetables', '400g', 3.99, 'Produce', false, false, '33333333-3333-3333-3333-333333333333'),
  ('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666666', 'Milk', '1 gallon', 4.29, 'Dairy & Eggs', false, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Expenses and budget settings
-- ============================================================

INSERT INTO expenses (id, household_id, amount, category, description, expense_date, created_by)
VALUES (
  '88888888-8888-8888-8888-888888888881',
  '11111111-1111-1111-1111-111111111111',
  47.23,
  'Groceries',
  'Weekly grocery run at Trader Joes',
  CURRENT_DATE - INTERVAL '2 days',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expenses (id, household_id, amount, category, description, expense_date, created_by)
VALUES (
  '88888888-8888-8888-8888-888888888882',
  '11111111-1111-1111-1111-111111111111',
  32.50,
  'Dining Out',
  'Pizza night at Luigis',
  CURRENT_DATE - INTERVAL '1 day',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO budget_settings (id, household_id, monthly_target)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  600.00
)
ON CONFLICT (household_id) DO NOTHING;

-- ============================================================
-- 9. Leftovers
-- ============================================================

INSERT INTO leftovers (id, household_id, name, date_made, use_by_date, portions, status, notes, created_by)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'Spaghetti Bolognese',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  2,
  'fresh',
  'Stored in glass container in fridge',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT (id) DO NOTHING;
