---
phase: 12-code-quality-polish
plan: 01
subsystem: code-quality
tags: [typescript, error-handling, type-safety, zustand, eslint]

# Dependency graph
requires: []
provides:
  - "getErrorMessage(error: unknown) utility for safe error extraction"
  - "Zero console.error calls in store files"
  - "Zero as-any casts in production src/ and app/ code"
  - "Zero catch(error: any) blocks in production code"
affects: [all-stores, app-screens, error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getErrorMessage(error: unknown) pattern for all catch blocks"
    - "SupabaseFunctionError interface for typed error context access"
    - "DimensionValue from react-native for style width typing"
    - "Href from expo-router for typed route navigation"

key-files:
  created:
    - src/lib/errors.ts
  modified:
    - src/stores/householdStore.ts
    - src/stores/onboardingStore.ts
    - src/stores/subscriptionStore.ts
    - src/stores/planStore.ts
    - src/stores/recipeStore.ts
    - src/stores/groceryStore.ts
    - src/stores/leftoverStore.ts
    - src/stores/budgetStore.ts
    - src/lib/ai.ts
    - src/hooks/useGrocerySync.ts
    - src/hooks/usePresence.ts
    - src/components/ui/Skeleton.tsx
    - src/components/plan/PlanEditSheet.tsx
    - src/types/database.ts
    - app/(app)/recipe/add.tsx
    - app/(app)/recipe/edit/[id].tsx
    - app/(app)/edit-profile.tsx
    - app/(auth)/sign-in.tsx
    - app/(app)/(tabs)/plan.tsx
    - app/(app)/(tabs)/profile.tsx

key-decisions:
  - "Used string literal union type for MEAL_TYPE_CONFIG icon instead of ComponentProps to avoid adding @expo/vector-icons import to database.ts"
  - "Used Href from expo-router for router.push casts instead of route-specific types"
  - "Used unknown-to-unknown double cast for Supabase Presence state to PresenceMember array"

patterns-established:
  - "getErrorMessage(error: unknown): all catch blocks use this utility"
  - "SupabaseFunctionError interface: typed access to supabase function error context"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

# Metrics
duration: 9min
completed: 2026-03-26
---

# Phase 12 Plan 01: Code Quality Polish Summary

**getErrorMessage utility replacing 31 catch(error: any) blocks, eliminating 5 console.error calls, and removing 10 as-any casts across all stores and app screens**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-26T15:01:49Z
- **Completed:** 2026-03-26T15:11:01Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Created `getErrorMessage(error: unknown)` utility for safe error message extraction from unknown thrown values
- Eliminated all 5 `console.error` calls in store files (householdStore x2, onboardingStore x2, subscriptionStore x1) -- errors now set in store state or silently handled
- Changed 26 `catch(error: any)` to `catch(error: unknown)` in 8 store files plus 5 in app/ screens
- Removed all 10 `as any` casts from production source: ai.ts (2), useGrocerySync.ts (1), usePresence.ts (1), Skeleton.tsx (1), PlanEditSheet.tsx (1), plan.tsx (1), profile.tsx (3)
- Zero net new TypeScript errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Create error utility and fix console.error + catch blocks in all stores** - `1b35987` (fix)
2. **Task 2: Replace all as-any casts in non-store files and fix catch blocks in app/ screens** - `b2c5c58` (fix)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified
- `src/lib/errors.ts` - getErrorMessage(error: unknown) utility
- `src/stores/householdStore.ts` - Removed console.error, typed catch blocks, added getErrorMessage
- `src/stores/onboardingStore.ts` - Removed console.error, cleaned catch blocks
- `src/stores/subscriptionStore.ts` - Removed console.error
- `src/stores/planStore.ts` - Replaced 3 `as any` vars with proper types, typed catch blocks
- `src/stores/recipeStore.ts` - Typed 9 catch blocks with getErrorMessage
- `src/stores/groceryStore.ts` - Typed 3 catch blocks with getErrorMessage
- `src/stores/leftoverStore.ts` - Typed 2 catch blocks with getErrorMessage
- `src/stores/budgetStore.ts` - Typed 4 catch blocks with getErrorMessage
- `src/lib/ai.ts` - SupabaseFunctionError interface replacing 2 as-any casts
- `src/hooks/useGrocerySync.ts` - Typed payload.old cast
- `src/hooks/usePresence.ts` - Typed presences array cast
- `src/components/ui/Skeleton.tsx` - DimensionValue cast replacing as-any
- `src/components/plan/PlanEditSheet.tsx` - Removed as-any on config.icon
- `src/types/database.ts` - String literal union type for MEAL_TYPE_CONFIG icon
- `app/(app)/recipe/add.tsx` - 2 catch blocks fixed with getErrorMessage
- `app/(app)/recipe/edit/[id].tsx` - 1 catch block fixed with getErrorMessage
- `app/(app)/edit-profile.tsx` - 1 catch block fixed with getErrorMessage
- `app/(auth)/sign-in.tsx` - 1 catch block fixed with typed error check
- `app/(app)/(tabs)/plan.tsx` - marginLeft as const replacing as-any
- `app/(app)/(tabs)/profile.tsx` - Href cast replacing 4 as-any router.push calls

## Decisions Made
- Used string literal union type (`'food-croissant' | 'food-apple' | 'food-variant'`) for MEAL_TYPE_CONFIG icon instead of importing ComponentProps from @expo/vector-icons into database.ts, avoiding a new TS module resolution error
- Used `Href` from expo-router for router.push path casts, the idiomatic expo-router approach
- For sign-in.tsx Google OAuth error, checked error code via `instanceof Error` + property check instead of accessing `.code` directly on unknown

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed 3 additional as-any casts in planStore.ts**
- **Found during:** Task 1 (store catch block fixes)
- **Issue:** planStore.ts had `let data: any = null`, `let error: any = null`, `const payload: any = {}` which are `as any` equivalent
- **Fix:** Changed to `MealPlanWithRecipe | null`, `{ code?: string; message?: string } | null`, and `Record<string, unknown>`
- **Files modified:** src/stores/planStore.ts
- **Committed in:** 1b35987 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Fixed as-any casts in plan.tsx and profile.tsx**
- **Found during:** Task 2 (non-store as-any elimination)
- **Issue:** plan.tsx had `marginLeft: 'auto' as any`, profile.tsx had 4 `router.push(... as any)` casts
- **Fix:** Used `as const` for CSS value, `as Href` for router navigation
- **Files modified:** app/(app)/(tabs)/plan.tsx, app/(app)/(tabs)/profile.tsx
- **Committed in:** b2c5c58 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both expanded scope of as-any elimination to achieve true zero-as-any across all production code. No scope creep.

## Issues Encountered
None

## Known Stubs
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All QUAL-01, QUAL-02, QUAL-03 requirements met
- Error utility available for any future catch blocks
- TypeScript compiles with no new errors (176 pre-existing, 0 regressions)

---
*Phase: 12-code-quality-polish*
*Completed: 2026-03-26*
