# Phase 49: Tech Debt & Type Safety - Research

**Researched:** 2026-04-11
**Domain:** Supabase RLS policies, Zustand store validation, TypeScript type generation
**Confidence:** HIGH

## Summary

This phase addresses four distinct tech debt items: (1) tightening profiles RLS to restrict column visibility, (2-3) adding reserved word and cooldown validation to `authStore.updateHandle`, and (4) fixing the `Database` type in `database.ts` which is missing ~6 tables and several columns, causing 231 `never`-type errors and 341 total `tsc` errors.

The `never` inference errors stem from the hand-maintained `Database` type not matching the actual Supabase schema. The profiles table type is missing `handle` and `handle_changed_at` columns. Six tables used in code (`cook_logs`, `recipe_comments`, `meal_rsvps`, `push_tokens`, `subscriptions`, `ai_usage_log`) are entirely absent from the type definition. The supabase CLI is installed (v2.39.2) and the project is linked (ref: `jzwxutnqdpnjssvouohe`), so `supabase gen types typescript` can regenerate types from the live schema.

**Primary recommendation:** Regenerate `database.ts` using `supabase gen types typescript --project-id jzwxutnqdpnjssvouohe > src/types/database.ts`, then manually restore the helper types/interfaces that live below the `Database` interface. For RLS, create a Postgres VIEW exposing only safe columns, or alter the SELECT policy. For handle validation, add guard logic at the top of `updateHandle` in `authStore.ts`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEBT-01 | Profiles RLS SELECT policy scoped to only expose handle, display_name, avatar_url | Current RLS policy at migration 00025 allows any authenticated user to read ALL profile columns. Need new migration to either (a) restrict RLS policy with column-level security via a VIEW, or (b) drop broad SELECT policy and create column-restricted one. See Architecture Patterns for approach. |
| DEBT-02 | Reserved word validation enforced in authStore.updateHandle | `RESERVED_WORDS` array already exists in `src/lib/handle-utils.ts`. `authStore.updateHandle` (line 72-91) currently does NO validation -- sends directly to Supabase. Need to import `validateHandle` and call it before the DB update. |
| DEBT-03 | 30-day handle change cooldown enforced in authStore.updateHandle | `handleChangedAt` is already tracked in authStore state (fetched in `checkHandle`). `updateHandle` needs to check `get().handleChangedAt` and reject if within 30 days. |
| DEBT-04 | TypeScript type safety -- eliminate `never` inference errors on database type definitions | 231 `never`-related errors + 110 other TS errors. Root cause: `database.ts` is missing 6 tables and several columns. Supabase CLI can regenerate from live schema. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (already installed) | DB client with typed queries | Already in use, types flow from Database interface |
| supabase CLI | 2.39.2 | Type generation from live schema | `supabase gen types typescript` is the canonical approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | (already installed) | State management with stores | Handle validation lives in authStore |

No new libraries needed for this phase. [VERIFIED: codebase inspection]

## Architecture Patterns

### DEBT-01: Profiles RLS Column Restriction

**Current state:** Migration `00025_add_handle_column.sql` created a broad policy: `"Authenticated users can read any profile"` with `USING (auth.uid() IS NOT NULL)`. This exposes ALL columns (id, display_name, avatar_url, handle, handle_changed_at, created_at) to any authenticated user. [VERIFIED: migration file]

**Approach: Restrict via Supabase view + RLS on view**

Postgres RLS operates at the row level, not column level. To restrict columns visible to other users, there are two approaches:

**Option A (recommended): Revoke direct table SELECT, create a public-safe VIEW**
```sql
-- New migration
-- 1. Drop the broad read policy
DROP POLICY "Authenticated users can read any profile" ON profiles;

-- 2. Keep own-profile read (already exists from migration 00001)
-- "Users can read own profile" remains with USING (auth.uid() = id)

-- 3. Create a limited policy for reading OTHER users' profiles
-- This still returns all columns but only for own profile
-- For other users, use a view:
CREATE VIEW public_profiles AS
  SELECT id, handle, display_name, avatar_url
  FROM profiles;

-- 4. Grant select on view to authenticated
GRANT SELECT ON public_profiles TO authenticated;
```

However, Supabase views accessed via the PostgREST API inherit the permissions of the view definer, not the caller, unless `security_invoker = true` is set. [ASSUMED]

**Option B (simpler, recommended): Use two RLS policies**
```sql
-- Drop broad policy
DROP POLICY "Authenticated users can read any profile" ON profiles;

-- Own profile: full access (already exists from 00001)
-- Other profiles: use a security-definer function approach
-- Actually, RLS can't restrict columns. The simplest approach:

-- Keep broad policy BUT update all cross-user queries to use
-- explicit .select('id, handle, display_name, avatar_url')
```

**Recommended approach:** The success criterion says "querying profiles from another user's session does not expose email, phone, or other private columns." The profiles table does NOT contain email or phone columns -- those live in `auth.users`. The profiles table columns are: `id, display_name, avatar_url, created_at, handle, handle_changed_at`. Of these, only `created_at` and `handle_changed_at` could be considered non-public. Since `PROFILE_SELECT` constant already exists in `handle-utils.ts` as `'id, display_name, avatar_url, handle'`, the cleanest approach is:

1. Create a Postgres VIEW `public_profiles` that selects only `id, handle, display_name, avatar_url`
2. Update cross-user profile queries to use the view
3. Keep the existing RLS policies on the base `profiles` table for own-profile operations

[VERIFIED: migration 00001 + 00025 show all columns on profiles table]

### DEBT-02/03: Store-Level Handle Validation

**Current `updateHandle`** (authStore.ts lines 72-91):
```typescript
updateHandle: async (handle: string) => {
  const userId = get().user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };
  // NO validation -- goes straight to DB
  const { error } = await supabase
    .from('profiles')
    .update({ handle, handle_changed_at: new Date().toISOString() })
    .eq('id', userId);
  // ...
}
```

**Required changes:**
```typescript
import { validateHandle } from '../lib/handle-utils';

updateHandle: async (handle: string) => {
  const userId = get().user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  // DEBT-02: Reserved word + format validation
  const validation = validateHandle(handle);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // DEBT-03: 30-day cooldown check
  const { handleChangedAt } = get();
  if (handleChangedAt) {
    const lastChanged = new Date(handleChangedAt);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      const daysLeft = Math.ceil(30 - daysSince);
      return {
        success: false,
        error: `You can change your handle again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      };
    }
  }

  // Proceed with DB update...
}
```

`validateHandle` already checks reserved words via `RESERVED_WORDS.includes(handle)`. [VERIFIED: src/lib/handle-utils.ts]

The `handleChangedAt` value is already fetched in `checkHandle()` and stored in state. [VERIFIED: authStore.ts lines 55-69]

### DEBT-04: Database Type Regeneration

**Root cause analysis:**

The `Database` interface in `src/types/database.ts` is hand-maintained (comment on line 3: "These can be refined later with `supabase gen types typescript`"). It has not been updated since tables were added in migrations 00024-00029. [VERIFIED: database.ts]

**Missing tables (used in code but not in Database type):**
| Table | Added in Migration | Used By |
|-------|-------------------|---------|
| `cook_logs` | 00027 | cookLogStore.ts |
| `recipe_comments` | 00028 | recipeCommentStore.ts |
| `meal_rsvps` | 00024 | rsvpStore.ts |
| `push_tokens` | 00013 | notifications.ts |
| `subscriptions` | 00012 | subscriptionStore.ts |
| `ai_usage_log` | 00011 | ai.ts |

**Missing columns on `profiles`:**
- `handle TEXT` (added in 00025)
- `handle_changed_at TIMESTAMPTZ` (added in 00025)

**Error breakdown (341 total tsc errors):**
- ~231 involve `never` type inference (from missing tables/columns in Database type)
- ~96 are `@expo/vector-icons` module resolution (unrelated, likely missing type package)
- ~14 are other type mismatches (FlashList, notification hooks, color types)

**Regeneration command:**
```bash
supabase gen types typescript --project-id jzwxutnqdpnjssvouohe > src/types/database.ts
```

**Post-regeneration work:**
The current `database.ts` contains manually-added types below the `Database` interface that `supabase gen types` will NOT generate:
- `MealType`, `MEAL_TYPES`, `MEAL_TYPE_CONFIG` (lines 15-23)
- `MealSource`, `MEAL_SOURCES`, `MEAL_SOURCE_CONFIG` (lines 26-34)
- `Ingredient`, `InstructionStep`, `NutritionInfo` interfaces (lines 37-60)
- All convenience type aliases: `Recipe`, `MealPlan`, `GroceryItem`, etc. (lines 822-870)
- Extended interfaces: `MealPlanWithRecipe`, `KitchenProfileWithRecipeCount`, `FrequentItem`, `GrocerySummary`, `CookLog`, `CookLogInsert`, `CookLogWithProfile`, `RecipeComment`, etc. (lines 833-943)

**Strategy:** Save the manually-added types to a separate block, regenerate the `Database` interface, then append the manual types back. The convenience aliases (`type Recipe = Database['public']['Tables']['recipes']['Row']`) will continue to work since they reference the regenerated `Database` type.

**However:** The generated types may type JSONB columns as `Json` instead of the specific interfaces (`Ingredient[]`, `InstructionStep[]`, etc.). The current hand-maintained types explicitly use these interfaces. After regeneration, the convenience aliases may need manual overrides or the generated Row types may need patching for JSONB columns.

### Anti-Patterns to Avoid
- **Do NOT just add `as any` casts to suppress `never` errors** -- fix the root cause (Database type)
- **Do NOT create a column-restricted RLS policy** -- Postgres RLS is row-level only, column restriction requires views or function-based access
- **Do NOT put validation only in UI components** -- that's the current state and exactly what this phase fixes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database types | Manual type definitions | `supabase gen types typescript` | CLI generates from actual schema, stays in sync |
| Handle format validation | New regex/logic in store | `validateHandle` from `handle-utils.ts` | Already exists, already tested in UI path |

## Common Pitfalls

### Pitfall 1: Regenerated Types Overwrite Custom Types
**What goes wrong:** Running `supabase gen types typescript > database.ts` overwrites the entire file including manually-added types
**Why it happens:** The CLI generates only the Database interface, not convenience aliases
**How to avoid:** Either (a) split into `database.generated.ts` + `database.ts` that re-exports, or (b) regenerate and manually append the custom types
**Warning signs:** Import errors across the codebase after regeneration

### Pitfall 2: JSONB Columns Typed as `Json` After Regeneration
**What goes wrong:** `supabase gen types` types JSONB columns as `Json` (generic), but code expects `Ingredient[]`, `InstructionStep[]`, etc.
**Why it happens:** PostgreSQL JSONB has no schema; Supabase CLI can't know the application-level types
**How to avoid:** After regeneration, override JSONB column types in convenience aliases or patch the generated type
**Warning signs:** Type errors on `.ingredients`, `.instructions`, `.nutrition_info` accesses

### Pitfall 3: View Not Accessible via PostgREST
**What goes wrong:** Creating a Postgres VIEW doesn't automatically make it accessible via the Supabase client
**Why it happens:** PostgREST needs the view in the exposed schemas and proper grants
**How to avoid:** Ensure VIEW is in `public` schema and `GRANT SELECT ON public_profiles TO authenticated, anon` is set
**Warning signs:** `supabase.from('public_profiles')` returns permission errors

### Pitfall 4: Cooldown Check Using Stale State
**What goes wrong:** `handleChangedAt` in Zustand state could be stale if not recently fetched
**Why it happens:** `checkHandle` is called at auth init but state could be from a cached session
**How to avoid:** Have `updateHandle` re-fetch `handle_changed_at` from DB before checking cooldown, or call `checkHandle` before showing the change UI
**Warning signs:** User bypasses cooldown after session restore

## Code Examples

### Handle Validation in Store (DEBT-02 + DEBT-03)
```typescript
// Source: Verified from src/stores/authStore.ts + src/lib/handle-utils.ts
import { validateHandle } from '../lib/handle-utils';

updateHandle: async (handle: string) => {
  const userId = get().user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  // DEBT-02: Format + reserved word validation
  const validation = validateHandle(handle);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // DEBT-03: 30-day cooldown
  const { handleChangedAt } = get();
  if (handleChangedAt) {
    const lastChanged = new Date(handleChangedAt);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      const daysLeft = Math.ceil(30 - daysSince);
      return {
        success: false,
        error: `You can change your handle again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      };
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ handle, handle_changed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This handle was just taken' };
    }
    return { success: false, error: error.message };
  }

  const now = new Date().toISOString();
  set({ handle, handleChangedAt: now });
  return { success: true };
},
```

### Type Regeneration Command
```bash
# Source: supabase CLI docs
supabase gen types typescript --project-id jzwxutnqdpnjssvouohe > src/types/database.generated.ts
```

### Public Profiles View Migration
```sql
-- Source: PostgreSQL + Supabase patterns [ASSUMED: exact PostgREST behavior]
CREATE VIEW public_profiles AS
  SELECT id, handle, display_name, avatar_url
  FROM profiles;

GRANT SELECT ON public_profiles TO authenticated;

-- Update broad policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can read any profile" ON profiles;

-- Own profile: full access (policy from 00001 remains)
-- Other profiles: go through the view
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 via jest-expo 55.0.15 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern='<pattern>' --no-coverage` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEBT-01 | public_profiles VIEW only exposes safe columns | manual-only | N/A (requires Supabase instance) | N/A |
| DEBT-02 | updateHandle rejects reserved words before DB call | unit | `npx jest --testPathPattern='authStore' --no-coverage` | Needs creation |
| DEBT-03 | updateHandle rejects within 30-day cooldown | unit | `npx jest --testPathPattern='authStore' --no-coverage` | Needs creation |
| DEBT-04 | `npx tsc --noEmit` produces zero `never` errors on database types | smoke | `npx tsc --noEmit 2>&1 \| grep -c 'never'` | N/A (tsc itself) |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` for DEBT-04; `npx jest --testPathPattern='authStore'` for DEBT-02/03
- **Per wave merge:** `npx jest && npx tsc --noEmit`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/stores/authStore.test.ts` -- covers DEBT-02 (reserved words) and DEBT-03 (cooldown)
- [ ] Mock for supabase client in authStore tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A |
| V3 Session Management | no | N/A |
| V4 Access Control | yes | Profiles RLS policy restricts data exposure (DEBT-01) |
| V5 Input Validation | yes | Reserved word validation in store layer (DEBT-02) |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Profile data leakage via broad RLS | Information Disclosure | Column-restricted VIEW for cross-user access (DEBT-01) |
| Handle squatting of reserved words | Spoofing | Server-side reserved word list (DEBT-02) |
| Handle change rate abuse | Denial of Service | 30-day cooldown enforced at store level (DEBT-03) |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgREST auto-exposes views in public schema with proper GRANT | Architecture Patterns (DEBT-01) | View won't be queryable via `supabase.from('public_profiles')` -- would need alternative approach |
| A2 | `supabase gen types typescript --project-id` works against the remote project with current auth | Architecture Patterns (DEBT-04) | Would need to run `supabase db start` locally and generate from local instead |
| A3 | Generated types will use `Json` for JSONB columns requiring manual override | Pitfalls | JSONB column types may actually be more specific if DB comments are set -- would reduce post-gen work |

## Open Questions

1. **Should the View approach vs. application-level `.select()` be used for DEBT-01?**
   - What we know: Both work. View is enforced at DB level (defense in depth). `.select()` is simpler but relies on developers using the right select string.
   - What's unclear: Whether the success criteria strictly requires DB-level enforcement or if application-level restriction suffices
   - Recommendation: Use the VIEW approach -- it's defense in depth and matches the security intent

2. **Should `database.ts` be split into generated + manual files?**
   - What we know: Regeneration will overwrite custom types. A split file approach prevents this.
   - What's unclear: Whether the team prefers a single file or split
   - Recommendation: Split into `database.generated.ts` (from CLI) and `database.ts` (imports generated + adds custom types)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| supabase CLI | Type generation (DEBT-04) | Yes | 2.39.2 | N/A |
| Supabase project link | Type generation (DEBT-04) | Yes | ref: jzwxutnqdpnjssvouohe | Local `supabase db start` |
| TypeScript compiler | Verification (DEBT-04) | Yes | (via npx tsc) | N/A |
| Jest | Unit tests (DEBT-02/03) | Yes | 29.7 | N/A |

**Missing dependencies:** None

## Sources

### Primary (HIGH confidence)
- `src/stores/authStore.ts` -- current updateHandle implementation (no validation)
- `src/lib/handle-utils.ts` -- existing validateHandle + RESERVED_WORDS
- `src/types/database.ts` -- hand-maintained Database type, 943 lines
- `supabase/migrations/00025_add_handle_column.sql` -- profiles RLS + handle columns
- `supabase/migrations/00001_create_profiles.sql` -- original profiles schema
- `npx tsc --noEmit` output -- 341 errors, 231 never-related

### Secondary (MEDIUM confidence)
- Supabase CLI `gen types` capability -- verified CLI is installed and project linked

### Tertiary (LOW confidence)
- PostgREST VIEW auto-exposure behavior [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing tooling
- Architecture: HIGH for DEBT-02/03/04 (straightforward), MEDIUM for DEBT-01 (VIEW approach needs validation)
- Pitfalls: HIGH -- directly observed from codebase analysis

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable infrastructure, no fast-moving dependencies)
