---
phase: 44-handle-system-identity-foundation
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - app/_layout.tsx
  - app/(app)/(tabs)/profile.tsx
  - app/(app)/edit-profile.tsx
  - app/(app)/onboarding.tsx
  - app/(app)/recipe/[id].tsx
  - src/components/handle/HandleInput.tsx
  - src/components/handle/HandleSetupInterstitial.tsx
  - src/components/handle/HandleSuggestions.tsx
  - src/components/onboarding/HandleSetupStep.tsx
  - src/components/social/CommentSheet.tsx
  - src/components/social/FeedCard.tsx
  - src/components/social/FeedList.tsx
  - src/hooks/useHandleForm.ts
  - src/lib/handle-utils.ts
  - src/stores/authStore.ts
  - src/stores/onboardingStore.ts
  - supabase/migrations/00025_add_handle_column.sql
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 44: Code Review Report

**Reviewed:** 2026-04-10
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This phase implements the handle (username) system foundation: DB migration, store actions, validation utilities, UI components for setup/editing, and attribution surfaces in the feed and recipe detail. The implementation is well-structured with good separation of concerns. Most findings are correctness and security issues in the DB migration and edge-case gaps in the handle flow rather than architectural problems.

Two critical issues are present: the new profiles RLS policy allows any authenticated user to read **all** columns of every profile (including private fields), and `authStore.updateHandle` does not re-validate format server-side before writing. Five warnings cover handle cooldown bypass race conditions, a missing debounce cleanup on component unmount in `edit-profile.tsx`, `handle` being displayed without a null guard on the edit-profile screen, an unguarded `CommentSheet` render when `postId` is empty string, and the `suggestAlternatives` function generating non-unique alternatives that could all collide. Four info items cover a `TODO` left in production FeedList code, code duplication between `HandleSetupInterstitial` and `HandleSetupStep`, a stale key in `onboardingStore`, and the `profilesFetched` ref in `FeedList` that is set but never read.

---

## Critical Issues

### CR-01: Profiles RLS policy exposes all profile columns to all authenticated users

**File:** `supabase/migrations/00025_add_handle_column.sql:19-22`

**Issue:** The new policy `"Authenticated users can read any profile"` grants `FOR SELECT` to any authenticated user with no column restriction. The `profiles` table likely contains columns beyond `handle` that are not intended to be publicly visible to all users (e.g., `email`, internal IDs used in other queries, etc.). The comment acknowledges this broadens existing policies, but does so without scoping to the minimum required columns. Any authenticated user can now `SELECT *` from `profiles` for any other user.

**Fix:** Restrict the broad policy to only the columns that need cross-household visibility. In Postgres, column-level security can be implemented with a view or by splitting into a separate policy using a security-barrier view. At minimum, create a separate policy scoped to handle-read use cases, or verify that all columns in `profiles` are safe for all authenticated users to read, and document that decision explicitly:

```sql
-- Option A: Use a dedicated view for public profile fields
CREATE VIEW public_profiles AS
  SELECT id, display_name, avatar_url, handle
  FROM profiles;

GRANT SELECT ON public_profiles TO authenticated;

-- Option B: If full row exposure is intentional, add explicit comment
-- and audit all columns first. Do NOT add unbounded SELECT policy
-- without that audit.
```

---

### CR-02: `updateHandle` skips format validation before DB write, allowing reserved words and malformed handles to bypass the cooldown check and be written if RLS is misconfigured

**File:** `src/stores/authStore.ts:72-91`

**Issue:** `updateHandle` writes the handle directly to the database without calling `validateHandle`. The client-side validation in `useHandleForm` and `edit-profile.tsx` is the only guard. If `updateHandle` is called from any other code path (e.g., tests, a future migration script, or directly via the store in a shell), it will write whatever string it receives. The DB `CHECK` constraint provides a safety net, but only for format — it does not enforce reserved words (the `RESERVED_WORDS` list is client-only). A user who bypasses the UI can claim `admin`, `support`, etc.

**Fix:** Add server-side enforcement for reserved words via the DB constraint, or move the validation into `updateHandle` itself:

```typescript
updateHandle: async (handle: string) => {
  const userId = get().user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  // Validate before writing — defense in depth against non-UI callers
  const validation = validateHandle(handle);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ handle, handle_changed_at: new Date().toISOString() })
    .eq('id', userId);
  // ... rest unchanged
},
```

For reserved words at DB level, add them to the `CHECK` constraint in the migration using an array:

```sql
ALTER TABLE profiles ADD CONSTRAINT chk_handle_reserved
  CHECK (
    handle IS NULL OR
    LOWER(handle) NOT IN (
      'admin','support','sharedkitchen','help','system',
      'mod','moderator','official','team','staff',
      'null','undefined','api','www','app'
    )
  );
```

---

## Warnings

### WR-01: Handle cooldown is computed client-side and can be bypassed by calling `updateHandle` directly

**File:** `app/(app)/edit-profile.tsx:50-55` and `src/stores/authStore.ts:72-91`

**Issue:** The 30-day change cooldown is computed in the UI (`canChangeHandle` memo) and enforced only by hiding the "Change Handle" button. `updateHandle` in the store does not check `handleChangedAt` before writing. Any caller that invokes `updateHandle` directly (including `HandleSetupInterstitial` and `HandleSetupStep` on existing users who theoretically already have a handle) bypasses the cooldown entirely.

**Fix:** Enforce the cooldown inside `updateHandle` in the store, which is the only authoritative write path:

```typescript
updateHandle: async (handle: string) => {
  const { userId, handleChangedAt } = /* get state */;
  if (handleChangedAt) {
    const cooldownEnd = new Date(new Date(handleChangedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() < cooldownEnd) {
      return { success: false, error: 'Handle can only be changed once per 30 days' };
    }
  }
  // ... proceed with DB write
},
```

Alternatively, enforce this in a Postgres function/trigger on `profiles` so it cannot be bypassed via any client.

---

### WR-02: Debounce timer in `edit-profile.tsx` is never cleared on unmount, causing setState after unmount

**File:** `app/(app)/edit-profile.tsx:47` and `app/(app)/edit-profile.tsx:80-91`

**Issue:** `debounceRef` holds a `setTimeout` reference that fires an async Supabase query followed by `setHandleStatus`. If the user navigates away while the debounce is pending, the timer fires on the unmounted component, calling state setters on an unmounted component. This differs from `useHandleForm` which correctly cleans up the debounce in a `useEffect` return.

**Fix:** Add a cleanup `useEffect` to `edit-profile.tsx`:

```typescript
// Add alongside the other refs/effects in edit-profile.tsx
useEffect(() => {
  return () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };
}, []);
```

---

### WR-03: `edit-profile.tsx` renders `@{handle}` without a null guard, crashing when `handle` is null

**File:** `app/(app)/edit-profile.tsx:223`

**Issue:** `handle` from `useAuthStore` is typed as `string | null`. The JSX at line 223 renders `@{handle}` unconditionally. If `handle` is `null` (a user who completed onboarding before this migration), the display shows `@` with `null` converted to the string `"null"` by React Native's `Text` component.

**Fix:**

```tsx
<Text style={styles.currentHandle}>
  {handle ? `@${handle}` : 'No handle set'}
</Text>
```

---

### WR-04: `CommentSheet` is rendered with `postId=""` when no comment post is selected, potentially triggering a Supabase query for an empty string ID

**File:** `src/components/social/FeedList.tsx:343`

**Issue:** `CommentSheet` is always mounted. When `activeCommentPostId` is `null`, it is passed as `postId=""` (via the `?? ''` fallback). Inside `CommentSheet`, `useEffect` on line 71 triggers `fetchComments(postId)` whenever `isOpen && postId`. While `isOpen` is `false` at that moment, if there is any timing issue where `isOpen` transitions to `true` before `activeCommentPostId` is set, `fetchComments('')` will execute a Supabase query with an empty-string ID.

**Fix:** Gate the render or add an explicit guard in `CommentSheet`:

```tsx
// Option A: Don't render CommentSheet unless there is an active post
{activeCommentPostId && (
  <CommentSheet
    isOpen={commentSheetOpen}
    onClose={() => { setCommentSheetOpen(false); setActiveCommentPostId(null); }}
    postId={activeCommentPostId}
    myKitchenId={myKitchenId}
    kitchenProfiles={kitchenProfiles}
  />
)}
```

---

### WR-05: `suggestAlternatives` can generate duplicate suffixes, resulting in repeated suggestion chips

**File:** `src/lib/handle-utils.ts:27-31`

**Issue:** Three random suffixes `suffix1`, `suffix2`, `suffix3` are generated independently using `Math.random()`. There is no deduplication. With a range of 10–99 (90 values) and 3 draws, the probability of at least one collision is ~3%. More importantly, the caller in `useHandleForm` (line 18-20) concatenates `[base, ...alts]` where `base` and `alts[0]` share the same root with a suffix — if `base` itself ends in digits (e.g., display name "chef99"), the suggestions may be visually indistinguishable.

**Fix:**

```typescript
export function suggestAlternatives(base: string): string[] {
  const suffixes = new Set<string>();
  while (suffixes.size < 3) {
    const n = Math.floor(Math.random() * 90 + 10);
    suffixes.add(`${n}`);
  }
  const [s1, s2, s3] = [...suffixes];
  return [`${base}${s1}`, `${base}${s2}`, `${base}_${s3}`];
}
```

---

## Info

### IN-01: `TODO` comment in production `FeedList` code signals unimplemented navigation

**File:** `src/components/social/FeedList.tsx:236`

**Issue:** `onRecipePress` callback contains a `// TODO: Recipe detail navigation deferred` comment with an empty function body. Pressing "VIEW FULL RECIPE" on a feed card does nothing silently — no error, no feedback to the user.

**Fix:** Either implement the navigation or show a user-facing message:

```typescript
onRecipePress={() => {
  if (item.recipe_id) {
    router.push(`/(app)/recipe/${item.recipe_id}`);
  }
}}
```

---

### IN-02: `HandleSetupInterstitial` and `HandleSetupStep` are nearly identical — submit logic is duplicated

**File:** `src/components/handle/HandleSetupInterstitial.tsx:37-52` and `src/components/onboarding/HandleSetupStep.tsx:31-47`

**Issue:** Both components implement identical `handleSubmit` logic (call `updateHandle`, handle success/error, set submitting state). The only difference is the success callback (`onComplete()` vs `nextStep()`). This violates DRY and means bug fixes must be applied in two places.

**Fix:** Extract the shared submit logic into `useHandleForm` as an `onSubmit` callback that accepts a success handler:

```typescript
// In useHandleForm
const onSubmit = useCallback(async (onSuccess: () => void) => {
  if (!canSubmit) return;
  setSubmitting(true);
  const result = await updateHandle(value);
  if (result.success) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess();
  } else {
    setStatus({ state: 'taken', message: result.error || 'This handle was just taken' });
    setSubmitting(false);
  }
}, [canSubmit, value, updateHandle]);
```

---

### IN-03: `onboardingStore.ts` uses an `AsyncStorage` key named `mise_onboarding_completed` instead of `sharedkitchen_*`

**File:** `src/stores/onboardingStore.ts:4`

**Issue:** The constant `ONBOARDING_KEY = 'mise_onboarding_completed'` uses the old product name "Mise" (the project was renamed to SharedKitchen). This is a stale artifact. While functionally harmless once deployed, it will cause confusion during debugging and is inconsistent with the product identity.

**Fix:**

```typescript
const ONBOARDING_KEY = 'sharedkitchen_onboarding_completed';
```

Note: Changing this key for existing users will reset their onboarding state. If there are live users, a migration in `checkOnboardingStatus` is needed to read the old key and write the new one.

---

### IN-04: `profilesFetched` ref in `FeedList` is declared but never read

**File:** `src/components/social/FeedList.tsx:56`

**Issue:** `const profilesFetched = useRef(false);` is declared at line 56 but never read or written anywhere in the file. This is dead code, likely a leftover from an earlier implementation that used it to prevent duplicate fetches (the current implementation uses `missingIds.length === 0` check instead).

**Fix:** Remove the unused ref:

```typescript
// Delete this line:
const profilesFetched = useRef(false);
```

---

_Reviewed: 2026-04-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
