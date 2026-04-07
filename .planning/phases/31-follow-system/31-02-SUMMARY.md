---
phase: 31-follow-system
plan: "02"
subsystem: social
tags: [social, follow, followers-list, segmented-control, kitchen-profile]
dependency_graph:
  requires:
    - phase: 31-01
      provides: followKitchen, unfollowKitchen, checkIsFollowing, KitchenProfileCard with follow props
  provides:
    - fetchFollowers, fetchFollowing, clearFollowLists actions in socialStore
    - Followers/following list screen at /kitchen/followers
    - Navigation from kitchen profile stat taps to followers screen
  affects: []
tech_stack:
  added: []
  patterns: [two-step-supabase-query, segmented-control, optimistic-follow-from-list]
key_files:
  created:
    - app/(app)/kitchen/followers.tsx
  modified:
    - src/stores/socialStore.ts
    - app/(app)/kitchen/[id].tsx
key_decisions:
  - "Used two-step query (fetch follow IDs then profiles) instead of Supabase FK join hints due to dual FK ambiguity on follows table"
  - "Follow status for list items determined by fetching current user's following list as a Set for O(1) lookup"
  - "Inline follow/unfollow uses local Set state with optimistic updates separate from store's isFollowing field"
patterns_established:
  - "Two-step Supabase query pattern for tables with multiple FKs to same target table"
  - "Segmented control with primary bg + onPrimary text for active, transparent + onSurfaceVariant for inactive"
requirements_completed: [FOLL-02]
metrics:
  duration: 3m02s
  completed: "2026-04-07T19:07:56Z"
---

# Phase 31 Plan 02: Followers/Following List Screen Summary

**Followers/following list screen with segmented control, inline follow buttons, two-step Supabase queries, and navigation wiring from kitchen profile stat taps**

## Performance

- **Duration:** 3m 02s
- **Started:** 2026-04-07T19:04:54Z
- **Completed:** 2026-04-07T19:07:56Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- socialStore extended with `followers`, `following` arrays, `followListLoading` state, and `fetchFollowers`, `fetchFollowing`, `clearFollowLists` actions
- Two-step query pattern: first fetch follow relationship IDs from `follows` table, then batch-fetch kitchen_profiles by ID -- avoids Supabase PostgREST FK ambiguity with dual foreign keys
- New `followers.tsx` screen with segmented control toggling between Followers and Following tabs
- Each list item renders avatar (with initials fallback), display name, follower count, and an inline Follow/Following button
- Follow/Following button hidden for the user's own kitchen in the list
- Optimistic follow/unfollow directly from the list using a local Set of following IDs
- Action loading state per-item prevents double-tap issues
- Empty states show account-group-outline icon with contextual message
- Kitchen profile screen `[id].tsx` now navigates to followers screen when tapping follower/following counts (replacing Plan 01 no-ops)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fetchFollowers and fetchFollowing to socialStore** - `5f06e47` (feat)
2. **Task 2: Create followers/following list screen and wire navigation** - `e37f87f` (feat)

## Files Modified
- `src/stores/socialStore.ts` - Added followers, following arrays; followListLoading state; fetchFollowers, fetchFollowing (two-step queries), clearFollowLists actions; clearViewedProfile now resets follow lists
- `app/(app)/kitchen/followers.tsx` - New screen with segmented control, FlatList of follower/following profiles, inline follow/unfollow buttons, loading and empty states
- `app/(app)/kitchen/[id].tsx` - Replaced no-op callbacks with router.push navigation to followers screen with kitchenId and tab params

## Decisions Made
- Used two-step query approach (fetch IDs from follows, then fetch profiles) rather than Supabase FK join hints, because the follows table has two FKs to kitchen_profiles and PostgREST may not auto-resolve the ambiguity
- Current user's following list fetched separately as a Set for O(1) lookup when rendering inline follow buttons, keeping it independent from the store's `isFollowing` field (which tracks the viewed profile specifically)
- Inline follow/unfollow manages its own optimistic state via local useState Set, avoiding interference with the profile-level follow state in the store

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript type resolution issues (supabase-js v2.100 `PostgrestVersion` causing `never` types, `@expo/vector-icons` missing types, `--jsx` flag not set for .tsx in app directory) -- all pre-existing from Phase 30/31-01, not introduced by this plan

## Self-Check: PASSED

- All 3 files (1 created, 2 modified) exist on disk
- Both task commits (5f06e47, e37f87f) found in git log
- fetchFollowers and fetchFollowing exported from socialStore
- followers.tsx screen created with segmented control and list
- [id].tsx navigation callbacks wired to followers screen

---
*Phase: 31-follow-system*
*Completed: 2026-04-07*
