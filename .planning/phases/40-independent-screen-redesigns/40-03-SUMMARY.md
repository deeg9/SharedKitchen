---
phase: 40-independent-screen-redesigns
plan: 03
subsystem: ui
tags: [react-native, cooking-mode, expo-image, stitch-ui]

requires:
  - phase: 39-shared-components
    provides: Design system tokens (colors, typography, spacing, borderRadius)
provides:
  - Redesigned cooking mode with step photos, type badges, chef tip callouts, ingredient chips
  - Vertical scroll layout with Previous/Next Step button navigation
  - Light-themed CookingTimer horizontal card with START/PAUSE/RESET
  - CookingProgress header with recipe name
  - Per-step ingredient matching heuristic
affects: [cooking-mode, e2e-tests]

tech-stack:
  added: []
  patterns:
    - "Step type derivation from instruction text keywords (MARINATING/PREP/COOKING)"
    - "Chef's Tip parsing via regex on instruction text"
    - "Per-step ingredient matching by scanning instruction text for ingredient names"

key-files:
  created: []
  modified:
    - src/components/cooking/StepCard.tsx
    - src/components/cooking/CookingTimer.tsx
    - src/components/cooking/CookingProgress.tsx
    - src/components/cooking/CookingMode.tsx
    - src/components/cooking/UnitToggle.tsx
    - app/(app)/recipe/cook/[id].tsx

key-decisions:
  - "Used recipe-level image for all steps since InstructionStep has no per-step image_url"
  - "Step type badge derived from keyword matching in instruction text"
  - "Ingredient matching is best-effort heuristic (name substring in instruction text)"

patterns-established:
  - "Cooking mode uses light surface theme (previously dark inverseSurface)"
  - "Navigation uses labeled buttons (Previous/Next Step) instead of swipe gestures"

requirements-completed: [COOK-01, COOK-02, COOK-03, COOK-04, COOK-05, COOK-06]

duration: 3min
completed: 2026-04-09
---

# Phase 40 Plan 03: Cooking Mode Redesign Summary

**Editorial cooking mode with recipe photo hero, step type badges, Chef's Tip callouts, ingredient chips, horizontal timer cards, and Previous/Next Step button navigation on light surface theme**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T21:40:31Z
- **Completed:** 2026-04-09T21:43:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Complete visual redesign of cooking mode from dark horizontal-swipe layout to light vertical-scroll editorial experience
- StepCard renders recipe photo, step type badge (MARINATING/PREP/COOKING), Chef's Tip callout, and ingredient chips per step
- CookingTimer redesigned as horizontal card with icon circle, label, countdown, and START/PAUSE/RESET pill button
- CookingMode uses labeled Previous/Next Step navigation buttons with ingredient matching per step

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign StepCard, CookingTimer, CookingProgress** - `0d0b601` (feat)
2. **Task 2: Redesign CookingMode layout** - `2baa33d` (feat)

## Files Created/Modified
- `src/components/cooking/StepCard.tsx` - Recipe photo, step type badge, Chef's Tip callout, ingredient chips
- `src/components/cooking/CookingTimer.tsx` - Horizontal card with icon, label, countdown, action button
- `src/components/cooking/CookingProgress.tsx` - Step X of Y header with recipe name, light-themed progress bar
- `src/components/cooking/CookingMode.tsx` - Vertical ScrollView, Previous/Next buttons, ingredient matching, light theme
- `src/components/cooking/UnitToggle.tsx` - Updated to light theme colors
- `app/(app)/recipe/cook/[id].tsx` - Loading screen updated to light theme

## Decisions Made
- Used recipe-level image for all steps since InstructionStep has no per-step image_url field
- Step type badge derived from keyword matching: "marinat" -> MARINATING, prep/chop/dice/slice/mince/peel/wash/rinse/measure -> PREP, default -> COOKING
- Chef's Tip parsed via regex looking for "tip:" or "note:" patterns in instruction text
- Ingredient matching is best-effort substring search of ingredient names within step text

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated UnitToggle and cook route to light theme**
- **Found during:** Task 2 (CookingMode layout redesign)
- **Issue:** UnitToggle used dark theme colors (rgba white bg, inversePrimary active, outlineVariant label) and cook route loading screen used inverseSurface background -- inconsistent with the light theme redesign
- **Fix:** Updated UnitToggle to surfaceContainerLow bg, primaryFixed active, onSurfaceVariant/primary text. Updated cook route to surface bg with primary spinner.
- **Files modified:** src/components/cooking/UnitToggle.tsx, app/(app)/recipe/cook/[id].tsx
- **Committed in:** 2baa33d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix for theme consistency)
**Impact on plan:** Auto-fix necessary for visual consistency. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cooking mode redesign complete, all 6 COOK requirements satisfied
- All existing testIDs preserved (cooking-prev-step, cooking-next-step, cooking-done-button, cooking-timer-start, cooking-timer-pause, cooking-progress)
- Ready for Phase 40 Plan 04 (Premium Upgrade screen)

## Self-Check: PASSED

All 6 files verified present. Both task commits (0d0b601, 2baa33d) verified in git log.

---
*Phase: 40-independent-screen-redesigns*
*Completed: 2026-04-09*
