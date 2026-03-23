---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/config.toml
  - supabase/migrations/00008_create_storage_buckets.sql
  - supabase/seed.sql
autonomous: true
requirements: [SUPA-CONFIG, SUPA-STORAGE, SUPA-SEED]

must_haves:
  truths:
    - "supabase start can be run with a valid config.toml"
    - "recipe-images and avatars storage buckets are created with proper RLS"
    - "seed.sql populates all tables with sample data for local dev"
  artifacts:
    - path: "supabase/config.toml"
      provides: "Supabase CLI local dev configuration"
      contains: "project_id"
    - path: "supabase/migrations/00008_create_storage_buckets.sql"
      provides: "Storage bucket creation with RLS policies"
      contains: "recipe-images"
    - path: "supabase/seed.sql"
      provides: "Sample data for all tables"
      contains: "INSERT INTO"
  key_links:
    - from: "supabase/config.toml"
      to: "supabase/functions/parse-recipe-url"
      via: "edge function reference in config"
      pattern: "parse-recipe-url"
    - from: "supabase/migrations/00008_create_storage_buckets.sql"
      to: "app/(app)/recipe/add.tsx"
      via: "recipe-images bucket used by storage.from('recipe-images')"
      pattern: "recipe-images"
    - from: "supabase/migrations/00008_create_storage_buckets.sql"
      to: "app/(app)/edit-profile.tsx"
      via: "avatars bucket used by storage.from('avatars')"
      pattern: "avatars"
---

<objective>
Complete all missing Supabase infrastructure files: CLI config, storage bucket migration, and seed data.

Purpose: The app code references storage buckets (recipe-images, avatars) that have no migration creating them, there is no config.toml for local dev with `supabase start`, and no seed.sql for bootstrapping test data.
Output: Three files that make the Supabase backend fully self-contained for local development.
</objective>

<execution_context>
@/Users/deeg/.claude/get-shit-done/workflows/execute-plan.md
@/Users/deeg/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@supabase/migrations/00001_create_profiles.sql
@supabase/migrations/00002_create_households.sql
@supabase/migrations/00003_create_recipes.sql
@supabase/migrations/00004_create_meal_plans.sql
@supabase/migrations/00005_create_grocery_items.sql
@supabase/migrations/00006_create_expenses.sql
@supabase/migrations/00007_create_leftovers.sql
@supabase/functions/parse-recipe-url/index.ts
@app/(app)/recipe/add.tsx
@app/(app)/edit-profile.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create config.toml and storage bucket migration</name>
  <files>supabase/config.toml, supabase/migrations/00008_create_storage_buckets.sql</files>
  <action>
Create `supabase/config.toml` with standard Supabase CLI local dev configuration:
- project_id = "shared-kitchen"
- API on port 54321, DB on port 54322, Studio on port 54323
- Auth enabled with email provider, no confirm email for local dev
- Storage enabled
- Edge functions enabled, reference the existing `parse-recipe-url` function
- Realtime enabled
- Use standard Supabase config.toml format (v1.x CLI style with `[api]`, `[db]`, `[studio]`, `[auth]`, `[storage]`, `[edge_runtime]` sections)

Create `supabase/migrations/00008_create_storage_buckets.sql`:
- Use `INSERT INTO storage.buckets` to create two buckets:
  1. `recipe-images` (id: 'recipe-images', name: 'recipe-images', public: true)
  2. `avatars` (id: 'avatars', name: 'avatars', public: true)
- Create RLS policies on `storage.objects`:
  - Public read (SELECT) for both buckets: anyone can view
  - Authenticated INSERT for recipe-images: `auth.role() = 'authenticated'` AND `bucket_id = 'recipe-images'`
  - Authenticated INSERT for avatars: `auth.role() = 'authenticated'` AND `bucket_id = 'avatars'`
  - Owner UPDATE/DELETE for both: `auth.uid()::text = (storage.foldername(name))[1]` (files stored as `{user_id}/filename`)
- Follow the migration header comment style from existing migrations (e.g., 00003)
  </action>
  <verify>
    <automated>grep -q "project_id" supabase/config.toml && grep -q "recipe-images" supabase/migrations/00008_create_storage_buckets.sql && echo "PASS"</automated>
  </verify>
  <done>config.toml exists with all required sections; migration 00008 creates both storage buckets with public read and authenticated write RLS policies</done>
</task>

<task type="auto">
  <name>Task 2: Create seed.sql with sample data for all tables</name>
  <files>supabase/seed.sql</files>
  <action>
Create `supabase/seed.sql` that inserts sample data for local development. Use fixed UUIDs for referential integrity. Include:

1. Two test users in `auth.users` (using Supabase's auth schema format):
   - User A: id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email='alice@test.com'
   - User B: id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email='bob@test.com'

2. Two profiles (auto-created by trigger, but seed explicitly):
   - Alice (display_name: 'Alice Test')
   - Bob (display_name: 'Bob Test')

3. One household:
   - id='11111111-1111-1111-1111-111111111111', name='Test Kitchen'
   - Both users as members (Alice as owner, Bob as member)

4. Three recipes in the household:
   - Spaghetti Bolognese (category: 'Italian', servings: 4, with 4 ingredients and 3 instructions as JSONB)
   - Chicken Stir Fry (category: 'Asian', servings: 2, with 3 ingredients and 2 instructions)
   - Chocolate Cake (category: 'Dessert', servings: 8, with 3 ingredients and 3 instructions)

5. One meal plan for current week with 2 entries

6. One grocery list with 4 items (mix of checked/unchecked, different sections)

7. Two expenses (one Groceries, one Dining Out) with a budget_targets row

8. One leftover entry

Use `ON CONFLICT DO NOTHING` on all inserts so seed is re-runnable. Add clear section comments. Start with `-- Seed data for local development` header.

For auth.users inserts, use the standard format:
```sql
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES (..., '00000000-0000-0000-0000-000000000000', ..., crypt('password123', gen_salt('bf')), now(), '{"full_name":"Alice Test"}'::jsonb, now(), now(), 'authenticated', 'authenticated')
ON CONFLICT DO NOTHING;
```
  </action>
  <verify>
    <automated>grep -c "INSERT INTO" supabase/seed.sql | xargs -I{} test {} -ge 8 && echo "PASS"</automated>
  </verify>
  <done>seed.sql contains INSERT statements for all 8 table groups (auth.users, profiles, households, household_members, recipes, meal_plans, grocery_lists/items, expenses, leftovers) with fixed UUIDs and ON CONFLICT safety</done>
</task>

</tasks>

<verification>
- `supabase/config.toml` is valid TOML with all required sections
- `supabase/migrations/00008_create_storage_buckets.sql` creates both buckets with RLS
- `supabase/seed.sql` has inserts for all tables, uses fixed UUIDs, is re-runnable
- All three files follow existing project conventions (comment style, formatting)
</verification>

<success_criteria>
- config.toml enables `supabase start` for local development
- Storage buckets match what app code expects: `recipe-images` and `avatars`
- Seed data covers all 7 existing migrations' tables with realistic sample data
- All files are idempotent (safe to re-run)
</success_criteria>

<output>
After completion, create `.planning/quick/1-finish-any-and-all-of-the-supabase-stuff/1-SUMMARY.md`
</output>
