---
phase: 33-social-interactions-moderation
plan: "03"
subsystem: ui
tags: [react-native, moderation, cook-this-too, report, block, action-sheet, meal-plan]

requires:
  - phase: 33-01
    provides: socialStore reportContent, blockKitchen, saveRecipeFromPost methods
  - phase: 33-02
    provides: FeedCard with onLongPress prop, FeedList with interaction handlers
provides:
  - Cook This Too button on feed cards that saves recipe and assigns to meal plan
  - Long-press action sheet with Report Post and Block Kitchen moderation tools
affects: []

tech-stack:
  added: []
  patterns: [action-sheet-ios-with-android-fallback, meal-slot-picker-reuse]

key-files:
  created: []
  modified:
    - src/components/social/FeedCard.tsx
    - src/components/social/FeedList.tsx

key-decisions:
  - "Cook This Too button uses pot-steam-outline icon with primary color, only shown on non-own posts"
  - "Long-press moderation uses ActionSheetIOS on iOS with Alert fallback on Android for cross-platform support"
  - "Block Kitchen shows destructive confirmation dialog before executing block"
  - "Cook This Too saves recipe to library first, then assigns to meal plan via planStore.assignRecipe"

patterns-established:
  - "ActionSheetIOS with Alert.alert Android fallback for destructive actions"

requirements-completed: [INTR-04, MODR-01, MODR-02]

duration: 1m51s
completed: 2026-04-07
---

# Phase 33 Plan 03: Cook This Too & Moderation UI Summary

**Cook This Too button with MealSlotPickerSheet for recipe-to-plan flow, plus long-press action sheet for report/block moderation on non-own feed cards**

## Performance

- **Duration:** 1m 51s
- **Started:** 2026-04-07T20:35:47Z
- **Completed:** 2026-04-07T20:37:38Z
- **Tasks:** 2
- **Files created:** 0
- **Files modified:** 2

## Accomplishments

- Added Cook This Too button (pot-steam-outline icon) to FeedCard action bar, visible only on non-own posts
- Wired Cook This Too flow: tap button -> MealSlotPickerSheet opens -> select day/meal type -> recipe saved to library via saveRecipeFromPost -> assigned to meal plan via planStore.assignRecipe -> success alert
- Added long-press handler with ActionSheetIOS (iOS) / Alert (Android) showing Report Post and Block Kitchen options
- Report Post records to reported_content table with confirmation alert
- Block Kitchen shows destructive confirmation dialog, then calls blockKitchen to hide all content from that kitchen

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Cook This Too button and long-press report/block** - `f3b3857` (feat)
2. **Task 2: Verify all social interactions and moderation** - auto-approved checkpoint

## Files Modified

- `src/components/social/FeedCard.tsx` - Added onCookThisToo prop, Cook This Too button with pot icon in action bar, cookThisTooBtn/cookThisTooText styles
- `src/components/social/FeedList.tsx` - Added imports (ActionSheetIOS, Platform, MealSlotPickerSheet, usePlanStore, MealType), handleLongPress with cross-platform action sheet, handleCookThisToo/handleSlotSelect for recipe-to-plan flow, MealSlotPickerSheet render

## Decisions Made

- Used ActionSheetIOS on iOS with Alert.alert fallback on Android for cross-platform moderation UX
- Cook This Too uses two-step flow: saveRecipeFromPost (clone to library) then assignRecipe (add to plan)
- Block Kitchen requires explicit confirmation with destructive button style before executing
- Cook This Too button only renders when onCookThisToo prop is provided AND isOwnPost is false

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED
