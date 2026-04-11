# Phase 45: Recipe Attribution & Creator Permissions - Research

**Researched:** 2026-04-10
**Domain:** Supabase RLS, React Native UI, Expo Router
**Confidence:** HIGH

## Summary

Phase 45 establishes recipe ownership by displaying creator attribution on recipe detail pages, restricting edit/delete to creators, migrating legacy recipes to household admins, and adding user search by @handle. The codebase is well-prepared: the `created_by` column already exists on the `recipes` table, all recipe creation paths already set `created_by = user.id`, the recipe detail page already fetches and displays `creatorHandle`, and the Avatar component is reusable. The primary work is: (1) replacing the permissive RLS UPDATE/DELETE policies with creator-scoped ones plus a legacy exception, (2) conditionally showing the Edit button in the UI, (3) writing a migration to backfill legacy recipes, (4) adding a "People" tab to KitchenSearchBar, and (5) creating a minimal public profile page.

The biggest risk area is the RLS policy replacement -- the existing UPDATE/DELETE policies on `recipes` allow any household member to edit/delete. These must be replaced with creator-only policies that include a legacy recipe exception. This requires careful migration ordering (backfill `created_by` BEFORE tightening RLS) and testing.

**Primary recommendation:** Structure as three plans: (1) migration + RLS policies, (2) UI attribution + edit gating, (3) people search + public profile.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Recipe detail displays avatar + "Created by @handle" row below recipe name -- matches feed card identity pattern
- Hide Edit button entirely for non-creators -- cleaner UX, no confusion
- No "Suggest Edit" option for v8.0
- Assign legacy recipes (created_by IS NULL) to household admin via SQL migration
- Legacy recipes remain editable by all household members (special RLS rule)
- Backfill query: UPDATE recipes SET created_by = first household_member by created_at WHERE created_by IS NULL
- Extend existing KitchenSearchBar with a "People" tab -- reuses search overlay pattern
- Search results show: avatar + @handle + display_name, tap navigates to public profile
- Public profile page: avatar, @handle, display_name, their public recipes (grid) -- minimal for v8.0
- Following remains kitchen-only (existing system)
- New RLS UPDATE policy: allow if auth.uid() = created_by OR legacy (created_by = household admin AND user is household member)
- DELETE follows same rules as edit
- Recipe creation automatically sets created_by: user.id on insert (verify recipeStore.addRecipe)

### Claude's Discretion
- Visual layout of the public profile page
- Search debounce timing and result limit
- Animation/transition for the People tab in search

### Deferred Ideas (OUT OF SCOPE)
- "Suggest Edit" feature for non-creators
- User-level follows (currently kitchen-only)
- Full public profile with cook stats, kitchens, followers
- Recipe version history
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ATTR-01 | Recipe detail page shows "Created by @handle" with creator's avatar below the recipe name | Recipe detail (`app/(app)/recipe/[id].tsx`) already fetches `creatorHandle` and displays "by @handle" text. Needs upgrade to include Avatar component and "Created by" prefix. Avatar component exists at `src/components/ui/Avatar.tsx`. |
| ATTR-02 | Only the recipe creator can edit the recipe | Current RLS UPDATE policy allows any household member. Must replace with creator-only policy (+ legacy exception). UI must conditionally render Edit button by comparing `recipe.created_by === user.id`. |
| ATTR-03 | Non-creator household members can rate, comment, favorite, and save but not edit | Existing RLS for recipe_ratings and recipe_notes already allows any household member. Only UPDATE/DELETE on `recipes` table needs restriction. No changes needed for ratings/notes/favorites. |
| ATTR-04 | Recipes with no creator (legacy data) are assigned to household admin during migration | Requires SQL migration backfilling `created_by` for NULL rows. `household_members` table has `role` column with 'admin' value. Migration must find admin per household. |
| IDEN-03 | User can search for other users by @handle from a search interface | KitchenSearchBar exists at `src/components/social/KitchenSearchBar.tsx`. Must add "People" tab that searches `profiles` table by handle. New route needed for public profile page. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (existing) | RLS policies, queries, migrations | Already in use throughout app [VERIFIED: codebase] |
| expo-router | (existing) | New public profile route | File-based routing, already used [VERIFIED: codebase] |
| zustand | (existing) | State management | Already used for all stores [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Avatar (internal) | N/A | Creator avatar display | `src/components/ui/Avatar.tsx` -- reuse for attribution row [VERIFIED: codebase] |
| KitchenSearchBar (internal) | N/A | Search overlay | Extend with People tab [VERIFIED: codebase] |

No new npm packages needed for this phase.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
  00026_backfill_legacy_recipes.sql     # Backfill created_by + tighten RLS
app/(app)/
  user/[id].tsx                         # New public profile page
src/components/social/
  PersonSearchResult.tsx                # Search result row for people
  PublicRecipeGrid.tsx                  # Grid of public recipes for profile
```

### Pattern 1: RLS Policy Replacement (Migration)
**What:** Drop existing permissive UPDATE/DELETE policies on `recipes`, replace with creator-scoped policies
**When to use:** This migration
**Example:**
```sql
-- Source: existing migration pattern in 00003_create_recipes.sql
-- Step 1: Backfill created_by for legacy recipes
UPDATE recipes r
SET created_by = (
  SELECT hm.user_id FROM household_members hm
  WHERE hm.household_id = r.household_id
  AND hm.role = 'admin'
  LIMIT 1
)
WHERE r.created_by IS NULL;

-- Step 2: Drop old permissive policies
DROP POLICY "Users can update recipes in their household" ON recipes;
DROP POLICY "Users can delete recipes in their household" ON recipes;

-- Step 3: Create creator-only UPDATE policy with legacy exception
CREATE POLICY "Creator can update own recipes"
  ON recipes FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (
      -- Legacy exception: household admin was assigned as created_by
      -- but all household members can still edit
      is_household_member(household_id, auth.uid())
      AND created_by = (
        SELECT hm.user_id FROM household_members hm
        WHERE hm.household_id = recipes.household_id
        AND hm.role = 'admin'
        LIMIT 1
      )
    )
  );

-- Step 4: Same for DELETE
CREATE POLICY "Creator can delete own recipes"
  ON recipes FOR DELETE
  USING (
    auth.uid() = created_by
    OR (
      is_household_member(household_id, auth.uid())
      AND created_by = (
        SELECT hm.user_id FROM household_members hm
        WHERE hm.household_id = recipes.household_id
        AND hm.role = 'admin'
        LIMIT 1
      )
    )
  );
```
[ASSUMED: The legacy detection heuristic -- "created_by equals the household admin" -- aligns with the CONTEXT.md decision. An alternative would be adding an `is_legacy` boolean column, but the admin-assignment approach is simpler and was decided by the user.]

### Pattern 2: Conditional Edit Button (Client-side)
**What:** Compare `recipe.created_by` to `user.id` to show/hide Edit button
**When to use:** Recipe detail page
**Example:**
```typescript
// Source: existing pattern in app/(app)/recipe/[id].tsx line 198-202
const isCreator = recipe.created_by === userId;

// In JSX -- conditionally render the edit button
{isCreator && (
  <Pressable
    onPress={() => router.push(`/recipe/edit/${id}`)}
    style={[s.headerBtn, { right: spacing.md, top: insets.top + spacing.xs }]}
  >
    <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
  </Pressable>
)}
```
[VERIFIED: codebase -- recipe.created_by and userId both available in RecipeDetailScreen]

### Pattern 3: Creator Attribution Row
**What:** Avatar + "Created by @handle" below recipe title
**When to use:** Recipe detail page, replacing the existing text-only attribution
**Example:**
```typescript
// Source: Avatar component at src/components/ui/Avatar.tsx, creatorHandle state in recipe/[id].tsx
{creatorHandle && (
  <Pressable
    style={s.creatorRow}
    onPress={() => router.push(`/user/${recipe.created_by}`)}
  >
    <Avatar uri={creatorAvatarUrl} name={creatorHandle} size="sm" />
    <Text style={s.creatorText}>Created by @{creatorHandle}</Text>
  </Pressable>
)}
```
[VERIFIED: codebase -- Avatar accepts uri, name, size props]

### Pattern 4: People Search Tab
**What:** Extend KitchenSearchBar with a tab to search profiles by @handle
**When to use:** People search feature
**Example:**
```typescript
// Source: existing searchKitchens pattern in socialStore.ts
// New action in socialStore or a new store
searchPeople: async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url')
    .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
    .not('handle', 'is', null)
    .limit(20);
  // ...
}
```
[VERIFIED: profiles table has handle, display_name, avatar_url columns per migration 00025 and 00001]

### Anti-Patterns to Avoid
- **Checking permissions client-side only:** Always enforce via RLS. The UI hides the button, but RLS prevents the actual update even if someone bypasses the UI.
- **Complex subquery in every RLS check:** The legacy exception requires a subquery to find the household admin. Keep it as simple as possible. Consider whether a single materialized column (`is_legacy BOOLEAN`) would be better for performance at scale -- but for v8.0 the subquery is acceptable. [ASSUMED: subquery performance is fine for current scale]
- **Forgetting to fetch creator avatar_url:** The current `creatorHandle` fetch only selects `handle`. Must also select `avatar_url` and `display_name` for the attribution row.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Permission checking | Custom middleware/hooks checking ownership | Supabase RLS policies | Server-side enforcement, can't be bypassed |
| Avatar rendering | Custom image+initials component | Existing `Avatar` component | Already handles fallback to initials |
| Search debounce | Manual setTimeout management | Existing debounce pattern in KitchenSearchBar | Already implemented with cleanup |
| Profile routing | Custom navigation stack | expo-router file-based route | `app/(app)/user/[id].tsx` |

## Common Pitfalls

### Pitfall 1: Migration Ordering -- Backfill Before RLS
**What goes wrong:** If you tighten RLS policies before backfilling `created_by`, recipes with NULL `created_by` become uneditable/undeletable by anyone.
**Why it happens:** The new RLS policy requires `auth.uid() = created_by`, which fails when `created_by IS NULL`.
**How to avoid:** Single migration file: backfill first, then drop old policies, then create new ones. All in one transaction.
**Warning signs:** Any recipe with `created_by IS NULL` after migration indicates backfill failure.

### Pitfall 2: Household Without Admin
**What goes wrong:** The backfill query assumes every household has a member with role='admin'. If a household has no admin (e.g., data corruption), the subquery returns NULL and `created_by` stays NULL.
**Why it happens:** Edge case in household data.
**How to avoid:** Add a fallback: if no admin, use the oldest member (by `joined_at`). Or add a COALESCE fallback in the backfill query.
**Warning signs:** Run `SELECT COUNT(*) FROM recipes WHERE created_by IS NULL` after migration -- should be 0.

### Pitfall 3: RLS Subquery Performance
**What goes wrong:** The legacy exception in the RLS policy does a subquery on `household_members` for every UPDATE/DELETE check.
**Why it happens:** Checking "is the assigned creator the household admin" requires a join.
**How to avoid:** For v8.0 scale this is fine. If it becomes a bottleneck, add an `is_legacy` boolean column to recipes and check that instead.
**Warning signs:** Slow recipe updates in households with many members.

### Pitfall 4: Creator Avatar Not Fetched
**What goes wrong:** The existing `creatorHandle` fetch (line 77-86 of recipe/[id].tsx) only selects `handle`. The new attribution row needs `avatar_url` too.
**Why it happens:** Original implementation was text-only.
**How to avoid:** Update the profiles query to `.select('handle, display_name, avatar_url')`.
**Warning signs:** Avatar component always shows initials, never a photo.

### Pitfall 5: INSERT Policy Still Permissive
**What goes wrong:** Someone might think the INSERT policy also needs creator restrictions, but it doesn't -- any household member should be able to create recipes.
**Why it happens:** Confusion between "who can create" and "who can edit after creation".
**How to avoid:** Leave the INSERT policy as-is. Only change UPDATE and DELETE.
**Warning signs:** N/A -- this is about NOT making a change.

## Code Examples

### Legacy Backfill Migration (verified pattern)
```sql
-- Source: pattern from 00002_create_households.sql (role column), 00003_create_recipes.sql (RLS)
-- Backfill: assign legacy recipes to the household admin (or oldest member as fallback)
UPDATE recipes r
SET created_by = COALESCE(
  (SELECT hm.user_id FROM household_members hm
   WHERE hm.household_id = r.household_id AND hm.role = 'admin'
   ORDER BY hm.joined_at ASC LIMIT 1),
  (SELECT hm.user_id FROM household_members hm
   WHERE hm.household_id = r.household_id
   ORDER BY hm.joined_at ASC LIMIT 1)
)
WHERE r.created_by IS NULL;
```
[VERIFIED: household_members has role TEXT CHECK (role IN ('admin', 'member')) and joined_at column]

### Profile Search Query
```typescript
// Source: profiles table schema from migration 00001 + 00025
const { data } = await supabase
  .from('profiles')
  .select('id, handle, display_name, avatar_url')
  .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
  .not('handle', 'is', null)
  .limit(20);
```
[VERIFIED: profiles table has these columns, and RLS allows authenticated users to read any profile (migration 00025)]

### Conditional Edit Button
```typescript
// Source: recipe/[id].tsx existing pattern
const isCreator = recipe.created_by === userId;
// The client only checks isCreator for button visibility.
// RLS handles legacy recipe permissions transparently -- household members
// can still edit legacy recipes via RLS even without seeing the Edit button.
```
[VERIFIED: recipe.created_by and userId both available in component scope]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Any household member edits any recipe | Creator-only editing with legacy exception | Phase 45 (this phase) | Recipes now have clear ownership |
| Text-only "by @handle" attribution | Avatar + "Created by @handle" row | Phase 45 (this phase) | Visual identity on recipes |
| Kitchen-only search | Kitchen + People search tabs | Phase 45 (this phase) | Users discoverable by @handle |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Subquery in RLS policy performs acceptably at current scale | Architecture Patterns, Pitfall 3 | Slow recipe updates -- mitigate with is_legacy column |
| A2 | Every household has at least one admin member | Pitfall 2 | Backfill fails silently -- mitigate with COALESCE fallback to oldest member |
| A3 | Legacy recipe = created_by was NULL before migration (no other indicator needed) | Architecture Patterns | If recipes were created with created_by set but should still be legacy, they'd be missed -- low risk given codebase audit shows all create paths set created_by |

## Open Questions (RESOLVED)

1. **Legacy recipe identification after migration** (RESOLVED)
   - What we know: After backfill, legacy recipes look identical to creator-owned recipes (both have created_by set).
   - What was unclear: Should we add an `is_legacy` or `created_before_v8` flag for future reference?
   - Resolution: Not needed for v8.0. The RLS "legacy exception" checks if `created_by = household admin`, which works because only legacy recipes get assigned to admin via migration. New recipes created by the admin are legitimately theirs. If needed later, add a column.

2. **Public profile page routing** (RESOLVED)
   - What we know: Need a new route for viewing another user's profile with their public recipes.
   - What was unclear: Should it be `/user/[id]` or `/profile/[handle]`?
   - Resolution: Use `/user/[id]` (UUID-based) for simplicity and consistency with how `created_by` stores UUIDs. Handles could change; UUIDs don't.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with jest-expo preset |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern="<pattern>" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ATTR-01 | Creator attribution row renders with avatar + handle | unit | `npx jest --testPathPattern="RecipeDetail" --no-coverage` | No -- Wave 0 |
| ATTR-02 | Edit button hidden for non-creators, shown for creators | unit | `npx jest --testPathPattern="RecipeDetail" --no-coverage` | No -- Wave 0 |
| ATTR-03 | Non-creator can still rate/favorite (no UI change needed) | unit | `npx jest --testPathPattern="recipeStore" --no-coverage` | Partial -- `tests/stores/recipeStore.test.ts` exists |
| ATTR-04 | Legacy backfill SQL correctness | manual-only | N/A (SQL migration verified by running against test DB) | N/A |
| IDEN-03 | People search returns matching profiles | unit | `npx jest --testPathPattern="PeopleSearch\|KitchenSearchBar" --no-coverage` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="<changed-module>" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/screens/recipe-detail-attribution.test.tsx` -- covers ATTR-01, ATTR-02
- [ ] `tests/components/PeopleSearch.test.tsx` -- covers IDEN-03
- [ ] No new framework install needed -- Jest already configured

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A |
| V3 Session Management | no | N/A |
| V4 Access Control | yes | Supabase RLS policies -- creator-only UPDATE/DELETE with legacy exception |
| V5 Input Validation | yes | Handle search input sanitized via Supabase parameterized queries |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized recipe edit | Tampering | RLS policy: `auth.uid() = created_by` on UPDATE |
| Unauthorized recipe delete | Tampering | RLS policy: `auth.uid() = created_by` on DELETE |
| Search injection | Tampering | Supabase `.ilike()` uses parameterized queries, no raw SQL |
| Profile enumeration | Information Disclosure | Profiles already readable by any authenticated user (migration 00025 policy) -- acceptable for social app |

## Sources

### Primary (HIGH confidence)
- Codebase audit: `supabase/migrations/00003_create_recipes.sql` -- current RLS policies, table schema
- Codebase audit: `supabase/migrations/00025_add_handle_column.sql` -- handle column, profiles RLS
- Codebase audit: `supabase/migrations/00002_create_households.sql` -- household_members roles, is_household_member function
- Codebase audit: `app/(app)/recipe/[id].tsx` -- current recipe detail page, creatorHandle fetch
- Codebase audit: `src/stores/recipeStore.ts` -- createRecipe, updateRecipe actions
- Codebase audit: `src/components/social/KitchenSearchBar.tsx` -- search overlay pattern
- Codebase audit: `src/components/ui/Avatar.tsx` -- reusable avatar component
- Codebase audit: `app/(app)/recipe/add.tsx` -- created_by set on insert (line 174)

### Secondary (MEDIUM confidence)
- None needed -- all research based on direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all existing libraries, no new dependencies
- Architecture: HIGH -- extending existing patterns with well-understood Supabase RLS
- Pitfalls: HIGH -- identified from direct code inspection of migration ordering and data integrity

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- internal codebase patterns)
