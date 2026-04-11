---
phase: 49-tech-debt-type-safety
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/stores/authStore.ts
  - src/hooks/useHandleForm.ts
  - src/stores/socialStore.ts
  - src/types/database.ts
  - supabase/migrations/00030_public_profiles_view.sql
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 49: Code Review Report

**Reviewed:** 2026-04-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase introduces a `public_profiles` view to restrict cross-user profile access, adds handle management to `authStore`, a `useHandleForm` hook for availability checking, and an expanded `socialStore` covering feed, likes, comments, blocking, and following. The `database.ts` type file covers the full schema.

The overall structure is solid. The main concern is a **duplicate type declaration** in `database.ts` that creates a maintenance hazard: `CookLog`, `CookLogInsert`, and `RecipeComment`/`RecipeCommentInsert` are redefined as manual interfaces that duplicate what is already generated as `CookLogRow` and `RecipeCommentRow`. Beyond that there are several warning-level issues: unsafe error swallowing in `saveRecipeFromPost`, an unguarded error from `supabase.auth.getUser()`, an unenforced client-side rate-limit in `updateHandle`, a `public_profiles` view with no RLS policy, and two minor type-safety gaps in the store.

---

## Critical Issues

### CR-01: Duplicate type declarations diverge from generated schema

**File:** `src/types/database.ts:1177-1225`
**Issue:** `CookLog`, `CookLogInsert`, `CookLogWithProfile`, `RecipeComment`, `RecipeCommentInsert`, and `RecipeCommentWithProfile` are hand-written interfaces that duplicate the generated `CookLogRow` and `RecipeCommentRow` type aliases (lines 1153-1154). The hand-written versions differ from the DB-generated counterparts — notably `CookLog.created_at` is typed as `string` (non-nullable) while `CookLogRow.created_at` is `string | null`, and `RecipeComment.created_at` is `string` while `RecipeCommentRow.created_at` is `string | null`. Any code that uses the manual interfaces will silently fail null checks at runtime when the database returns `null` for those columns, and future schema migrations will only update the generated types, leaving the manual ones stale.

**Fix:** Remove the duplicate manual interfaces and derive the `WithProfile` variants from the generated aliases:

```typescript
// Remove lines 1177-1225 entirely.
// Replace with:

export type CookLog = CookLogRow;
export type CookLogInsert = Database['public']['Tables']['cook_logs']['Insert'];

export interface CookLogWithProfile extends CookLog {
  profiles: { handle: string | null; avatar_url: string | null } | null;
}

export type RecipeComment = RecipeCommentRow;
export type RecipeCommentInsert = Database['public']['Tables']['recipe_comments']['Insert'];

export interface RecipeCommentWithProfile extends RecipeComment {
  profiles: { handle: string | null; avatar_url: string | null } | null;
}

export interface ThreadedComment {
  comment: RecipeCommentWithProfile;
  replies: RecipeCommentWithProfile[];
}
```

---

## Warnings

### WR-01: `supabase.auth.getUser()` error is silently discarded in `saveRecipeFromPost`

**File:** `src/stores/socialStore.ts:658`
**Issue:** The call `(await supabase.auth.getUser()).data.user?.id` destructures `.data` without checking `.error`. If the Supabase session is expired or a network error occurs, `error` will be non-null but execution continues, `userId` will be `undefined`, the `null` guard on line 659 returns silently, and the user sees no feedback. This is different from a genuine "not logged in" state and should surface as an error.

**Fix:**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  console.warn('[socialStore] saveRecipeFromPost: auth error', authError?.message);
  return null;
}
const userId = user.id;
```

### WR-02: `saved_recipes` insert error is silently swallowed

**File:** `src/stores/socialStore.ts:685-692`
**Issue:** The `saved_recipes` insert is awaited but its returned `{ error }` is never checked. If the insert fails (e.g., duplicate, RLS rejection), the function returns the cloned recipe as if the save succeeded, leaving the junction table out of sync with no indication of failure to the caller.

**Fix:**
```typescript
const { error: saveError } = await supabase
  .from('saved_recipes')
  .insert({ ... });

if (saveError) {
  console.warn('[socialStore] saveRecipeFromPost: failed to record saved_recipe', saveError.message);
  // Decide: return null or return the recipe with a warning — caller should know
}
```

### WR-03: Handle rate-limit is enforced only on the client side

**File:** `src/stores/authStore.ts:82-93`
**Issue:** The 30-day cooldown check on `handleChangedAt` is performed entirely in client code. The actual `UPDATE` on line 95-98 does not use a conditional expression or a database-level constraint/trigger to enforce it. A determined user (or a buggy re-render that clears `handleChangedAt`) can bypass the cooldown by calling `updateHandle` directly with a fresh store instance or by patching local state. The duplicate-key error on line 101 (`23505`) is correctly handled, but the rate-limit is not.

**Fix:** Enforce the 30-day rule at the database layer (e.g., a `CHECK` constraint on `handle_changed_at`, a trigger, or a `SECURITY DEFINER` RPC). The client-side check can remain as a UX guard, but it should not be the sole enforcement point.

### WR-04: `searchKitchens` casts partial query result to full `KitchenProfile`

**File:** `src/stores/socialStore.ts:232-246`
**Issue:** The query on line 232 selects only `id, display_name, bio, avatar_url, follower_count` — five of the twelve `KitchenProfile` fields. The result is then cast to `KitchenProfile[]` via `as KitchenProfile[]` on line 241. Missing fields (`household_id`, `invite_code`, `is_public`, `is_searchable`, `following_count`, `created_at`, `updated_at`) will be `undefined` at runtime, but TypeScript believes they are present. Any consumer of `searchResults` that accesses those fields will silently get `undefined` instead of the typed non-nullable values.

**Fix:** Either select all columns (`*`) or define a narrower type for search results:
```typescript
// Option A: select all
.select('*')

// Option B: narrow type
type KitchenSearchResult = Pick<KitchenProfile, 'id' | 'display_name' | 'bio' | 'avatar_url' | 'follower_count'>;
// Update SocialState.searchResults: KitchenSearchResult[]
```

### WR-05: `public_profiles` view has no RLS policy

**File:** `supabase/migrations/00030_public_profiles_view.sql:8-13`
**Issue:** The migration creates the view and grants `SELECT` to `authenticated`, but Supabase views do **not** inherit the RLS policies of their underlying tables unless `security_invoker = true` is set (Postgres 15+) or an explicit policy is attached to the view itself. With the default `security_definer` behavior, the `GRANT SELECT ON public_profiles TO authenticated` means any authenticated user can read all rows, which is the intended behavior. However, the comment on line 5 says "Restricts cross-user profile visibility to safe columns only" — the restriction is column-level only, not row-level. If row-level visibility needs to be restricted in the future (e.g., deleted/suspended accounts), there is no RLS in place and the grant is permanent until explicitly revoked.

This is a low-severity gap today (the intent is to expose all profiles), but the migration should explicitly document that row-level access is intentionally unrestricted, or add a placeholder RLS policy comment to make the design decision clear and prevent future silent over-exposure.

**Fix:**
```sql
-- After the GRANT, add an explicit comment documenting the decision:
COMMENT ON VIEW public_profiles IS
  'Safe cross-user profile view. Column-restricted (no email, phone, etc).
   Row access is intentionally unrestricted for all authenticated users —
   all profiles are public by design. Add a policy here if that changes.';
```

---

## Info

### IN-01: `useHandleForm` suggestions use `Math.random()` — unstable across renders

**File:** `src/hooks/useHandleForm.ts:16-21`
**Issue:** `suggestAlternatives` in `handle-utils.ts` calls `Math.random()`, so suggestions regenerate on every render if `displayName` changes. The `useEffect` dependency `[displayName]` means suggestions are stable for a given display name, but any parent re-render that passes a new `displayName` reference (even with the same string value) will regenerate them with different random numbers. This is unlikely to cause a bug in practice but can produce confusing UX (suggestions flickering). The effect already guards with `if (displayName)` so it will not run if undefined.

**Fix:** Consider seeding the suggestion generation from the display name itself so the same name always produces the same suggestions, or memoize with `useMemo`.

### IN-02: `meal_rsvps.status` is typed as plain `string` rather than a union

**File:** `src/types/database.ts:627`
**Issue:** The `status` field on `meal_rsvps` is typed as `string` in all three variants (Row, Insert, Update). If the DB column has a known set of valid values (e.g., `'yes' | 'no' | 'maybe'`), the loose type allows any string to be inserted without compile-time validation.

**Fix:** Replace with a union type if the domain values are known:
```typescript
status: 'yes' | 'no' | 'maybe';
```
If values are not yet finalized, add a `// TODO: narrow this to a union` comment so it is not forgotten.

### IN-03: `subscriptions.status` is typed as plain `string`

**File:** `src/types/database.ts:1010`
**Issue:** Same pattern as IN-02. Stripe subscription status has a well-known set of values: `'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'`. The loose `string` type loses type safety for any code that switches or compares on this field.

**Fix:**
```typescript
status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
```

---

_Reviewed: 2026-04-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
