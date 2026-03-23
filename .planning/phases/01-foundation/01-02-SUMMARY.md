---
phase: 01-foundation
plan: 02
subsystem: household
tags: [supabase, rls, zustand, expo-router, expo-clipboard, expo-sharing, asyncstorage, deep-linking]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: Supabase client, auth store, profiles table, expo-router navigation
provides:
  - Households and household_members tables with RLS and SECURITY DEFINER helpers
  - Zustand household store with CRUD, multi-household switching, AsyncStorage persistence
  - useHousehold convenience hook
  - Create, invite, and join household screens
  - Deep link handler for mise://join/CODE URLs
  - MemberList and InviteCard UI components
  - 11 household-specific tests (40 total passing)
affects: [01-03, 02-01, 02-02, 02-03]

# Tech tracking
tech-stack:
  added: [expo-clipboard, expo-sharing]
  patterns: [SECURITY DEFINER functions to avoid recursive RLS, household-scoped data access via household_members join, Zustand store with AsyncStorage persistence for active selection]

key-files:
  created: [supabase/migrations/00002_create_households.sql, src/stores/householdStore.ts, src/hooks/useHousehold.ts, app/(app)/household/create.tsx, app/(app)/household/invite.tsx, app/(app)/household/join.tsx, app/join/[code].tsx, src/components/household/MemberList.tsx, src/components/household/InviteCard.tsx, tests/household.test.ts, tests/stores/householdStore.test.ts]
  modified: [tests/setup.ts, package.json]

key-decisions:
  - "Used SECURITY DEFINER functions (is_household_member, is_household_admin) to avoid recursive RLS on household_members table"
  - "Used react-native Share API instead of expo-sharing for invite sharing (expo-sharing is file-based, not suitable for text sharing)"
  - "Stored pending join code in AsyncStorage for post-auth completion in deep link handler"

patterns-established:
  - "SECURITY DEFINER helpers for RLS membership checks to prevent recursive policy evaluation"
  - "Household store pattern: fetch member rows first, then fetch household details by IDs"
  - "Deep link handler pattern: check auth state, redirect to sign-in with preserved intent if unauthenticated"
  - "Component pattern: InviteCard and MemberList as reusable household UI components"

requirements-completed: [HOUS-01, HOUS-02, HOUS-03, HOUS-04, HOUS-05]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 1 Plan 02: Household CRUD, Invite/Join, and Member List Summary

**Multi-household data model with RLS, Zustand store with persistent switching, invite/join screens with deep link support, and member list with role badges**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T16:34:09Z
- **Completed:** 2026-03-23T16:38:59Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Households and household_members tables with full RLS policies using SECURITY DEFINER to avoid recursive evaluation
- Zustand household store with create, join, fetch, member queries, and AsyncStorage-persisted active household
- Create household screen with name validation (2-50 chars), invite screen with code display/copy/share, join screen with error handling
- Deep link handler (app/join/[code]) that auto-joins authenticated users or preserves intent through sign-in
- MemberList component with avatar initials, display names, and admin/member role badges
- InviteCard component with copy-to-clipboard feedback and share button

## Task Commits

Each task was committed atomically:

1. **Task 1: Household schema, store, and CRUD logic** - `e3949cd` (feat)
2. **Task 2: Household screens, member list, and invite components** - `0de88de` (feat)

## Files Created/Modified
- `supabase/migrations/00002_create_households.sql` - Households and household_members tables with RLS and helper functions
- `src/stores/householdStore.ts` - Zustand store for household state, CRUD operations, member management
- `src/hooks/useHousehold.ts` - Convenience hook wrapping household store selectors and actions
- `app/(app)/household/create.tsx` - Create household screen with name input and validation
- `app/(app)/household/invite.tsx` - Invite members screen with code display, copy link, and share
- `app/(app)/household/join.tsx` - Join household screen with invite code input
- `app/join/[code].tsx` - Deep link handler for mise://join/CODE URLs
- `src/components/household/MemberList.tsx` - Member list with avatar initials and role badges
- `src/components/household/InviteCard.tsx` - Invite code card with copy feedback and share button
- `tests/household.test.ts` - 8 tests for household CRUD operations
- `tests/stores/householdStore.test.ts` - 3 tests for store state management and persistence
- `tests/setup.ts` - Added mocks for expo-clipboard, expo-sharing, useLocalSearchParams, and auth.getUser
- `package.json` - Added expo-clipboard and expo-sharing dependencies

## Decisions Made
- Used SECURITY DEFINER functions for RLS membership checks: avoids the recursive RLS pitfall where household_members policies reference household_members itself
- Used react-native's built-in Share API instead of expo-sharing for text sharing: expo-sharing is designed for file sharing, not plain text/links
- Deep link handler stores pending join code in AsyncStorage when user is unauthenticated, allowing completion after sign-in

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used react-native Share instead of expo-sharing for invite**
- **Found during:** Task 2
- **Issue:** expo-sharing is file-based (shareAsync requires a file URI), not suitable for sharing text/links
- **Fix:** Used react-native's built-in Share.share() API for sharing invite messages
- **Files modified:** app/(app)/household/invite.tsx
- **Verification:** Share button triggers native share sheet with invite message
- **Committed in:** 0de88de (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added auth.getUser mock to test setup**
- **Found during:** Task 1
- **Issue:** Household store calls supabase.auth.getUser() which was not mocked in test setup
- **Fix:** Added getUser mock returning mock-user-id
- **Files modified:** tests/setup.ts
- **Verification:** All 40 tests pass
- **Committed in:** 0de88de (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered
None - plan executed smoothly.

## User Setup Required
Run the households migration (`supabase/migrations/00002_create_households.sql`) in the Supabase SQL editor after the profiles migration.

## Next Phase Readiness
- Household data model and store complete, ready for design system integration (Plan 01-03)
- All screens use basic styling that will be updated with Culinary Curator design tokens in Plan 03
- Member list component ready for use in profile and household management screens
- Active household ID persists across restarts, enabling household-scoped data queries in Phase 2

## Self-Check: PASSED

All 11 key files verified present. Both task commits (e3949cd, 0de88de) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-23*
