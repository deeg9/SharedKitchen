---
phase: 42-grocery-list-redesign
plan: 02
subsystem: ui
tags: [react-native, grocery, presence, sync, segment-control]

requires:
  - phase: 42-grocery-list-redesign
    provides: Redesigned GrocerySummary with presenceMembers prop (plan 01)
provides:
  - Grocery screen with Sync with Plan header button calling handleGenerate
  - Swapped segment order (Shopping List left, On Hand right)
  - Presence avatars wired into GrocerySummary via presenceMembers prop
affects: []

tech-stack:
  added: []
  patterns: [header actions row pattern with sync button and category edit]

key-files:
  created: []
  modified:
    - app/(app)/(tabs)/grocery.tsx

key-decisions:
  - "Replaced PresenceAvatarStack from titleRow with titleSpacer; presence avatars now render inside GrocerySummary card"
  - "Used calendar-outline icon for category edit button (replacing tag-edit-outline) to match Stitch design"

patterns-established:
  - "Header sync button pattern: disabled during loading, calls existing generate callback"

requirements-completed: [GROC-03, GROC-05]

duration: 2min
completed: 2026-04-09
---

# Phase 42 Plan 02: Grocery Screen Wiring Summary

**Sync with Plan header button, swapped Shopping List/On Hand segment order, and presence avatars wired to GrocerySummary -- all 4 real-time hooks preserved**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T22:32:13Z
- **Completed:** 2026-04-09T22:34:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added "Sync with Plan" button in header that calls handleGenerate with loading-disabled state and testID for E2E
- Swapped segment control order: Shopping List (left/default) then On Hand (right)
- Passed presenceMembers prop to GrocerySummary so avatars render in the summary card
- All 4 real-time hooks verified intact: useGrocerySync, usePantrySync, usePresence, useActivityToast
- All camera flows, barcode scanner, bottom sheets, and ActivityToast rendering unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Sync with Plan header button, swap segments, and wire presence to GrocerySummary** - `c794907` (feat)

## Files Created/Modified
- `app/(app)/(tabs)/grocery.tsx` - Redesigned header with sync button and actions row, swapped segment order, wired presenceMembers to GrocerySummary

## Decisions Made
- Moved PresenceAvatarStack out of titleRow into GrocerySummary component (via presenceMembers prop) -- cleaner separation and matches Stitch design where avatars appear in the summary card
- Changed category edit icon from tag-edit-outline to calendar-outline per Stitch reference

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 42 grocery list redesign complete -- all components and screen wiring shipped
- Ready for next phase (43-budget-dashboard-redesign or similar)

---
*Phase: 42-grocery-list-redesign*
*Completed: 2026-04-09*
