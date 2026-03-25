---
phase: 07-real-time-presence
plan: 02
subsystem: ui
tags: [supabase-realtime, presence, react-native, appstate, activity-toast]

# Dependency graph
requires:
  - phase: 07-real-time-presence
    plan: 01
    provides: "usePresence hook, PresenceAvatarStack, useActivityToast, ActivityToast"
provides:
  - "Grocery screen with live presence avatars and activity toasts"
  - "Recipe detail screen with live presence avatars"
  - "AppState-based presence untrack/re-track on background/foreground"
affects: [08-e2e-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: ["AppState listener for presence lifecycle management", "useAuthStore replacing manual supabase.auth.getUser()", "memberLookup callback for toast member resolution"]

key-files:
  created: []
  modified:
    - app/(app)/(tabs)/grocery.tsx
    - app/(app)/recipe/[id].tsx

key-decisions:
  - "Replaced manual supabase.auth.getUser() pattern with useAuthStore in both screens for consistency and reactivity"
  - "AppState-based channelKey nulling to untrack presence on background rather than explicit untrack calls"

patterns-established:
  - "Presence integration pattern: derive currentPresenceUser from authStore + householdStore members, pass appActive-gated channelKey to usePresence"
  - "Activity toast integration: useCallback memberLookup from household members, pass appActive-gated IDs to useActivityToast"

requirements-completed: [RT-01, RT-02, RT-03, RT-04]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 07 Plan 02: Screen Integration Summary

**Presence avatars and activity toasts wired into grocery and recipe screens with AppState-based background untracking**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T22:28:49Z
- **Completed:** 2026-03-25T22:31:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Grocery screen shows PresenceAvatarStack in titleRow left slot, replacing empty spacer (RT-01)
- Recipe detail screen shows PresenceAvatarStack in hero overlay to left of edit button (RT-02)
- Grocery screen displays ActivityToast notifications for other users' grocery check-offs and meal plan changes (RT-03)
- Both screens use AppState listener to null out channelKey on background, causing usePresence cleanup (RT-04)
- Replaced manual supabase.auth.getUser() async pattern with reactive useAuthStore in both screens

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire presence avatars and activity toasts into grocery screen** - `13875b5` (feat)
2. **Task 2: Wire presence avatars into recipe detail screen** - `590082e` (feat)

## Files Created/Modified
- `app/(app)/(tabs)/grocery.tsx` - Added usePresence, useActivityToast, PresenceAvatarStack, ActivityToast, AppState listener, replaced auth pattern
- `app/(app)/recipe/[id].tsx` - Added usePresence, PresenceAvatarStack, AppState listener, replaced auth pattern

## Decisions Made
- Replaced manual `supabase.auth.getUser()` async pattern with `useAuthStore((s) => s.user)` in both screens -- more reactive and consistent with other stores
- Used channelKey nulling via AppState (setting appActive to false nulls the key, triggering usePresence cleanup) rather than explicit untrack/re-track calls -- cleaner integration with existing hook lifecycle

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All RT-01 through RT-04 requirements are complete
- Presence and activity features are live on grocery and recipe screens
- Ready for E2E testing in Phase 08

---
*Phase: 07-real-time-presence*
*Completed: 2026-03-25*
