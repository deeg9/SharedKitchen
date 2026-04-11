---
phase: 50-cooking-mode-redesign
plan: 01
subsystem: ui
tags: [react-native, cooking-mode, unit-conversion, step-categories]

# Dependency graph
requires:
  - phase: none
    provides: existing StepCard.tsx with 3-category classification
provides:
  - 7-category step classification with color-coded badges
  - Per-step ingredient display with metric/imperial conversion
  - Empty ingredient state for layout consistency
affects: [50-02, cooking-mode]

# Tech tracking
tech-stack:
  added: []
  patterns: [hardcoded blue for SIMMERING badge since theme lacks blue token]

key-files:
  created: []
  modified: [src/components/cooking/StepCard.tsx]

key-decisions:
  - "SIMMERING badge uses hardcoded #d0e4ff/#00497e (blue) because theme tertiaryContainer is dark green"
  - "Ingredient card always renders (not conditionally) — empty state shows placeholder for layout consistency"

patterns-established:
  - "Regex-based step classification: ordered keyword matching with MARINATING priority"
  - "Hardcoded colors documented inline when theme tokens are unsuitable"

requirements-completed: [COOK-R02, COOK-R03, COOK-R06]

# Metrics
duration: 2min
completed: 2026-04-11
---

# Phase 50 Plan 01: StepCard Categories and Ingredients Summary

**7-category step classification (PREP/GRILLING/SIMMERING/BAKING/MIXING/MARINATING/COOK) with per-step ingredient unit conversion and empty state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T23:06:26Z
- **Completed:** 2026-04-11T23:08:20Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Expanded step classification from 3 types to 7 with distinct color-coded badges
- Per-step ingredients now apply metric/imperial conversion via convertIngredient
- Empty ingredient state ("No ingredients for this step") renders for layout consistency
- Badge typography updated to 12px per UI-SPEC contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand deriveStepType to 7 categories with correct badge colors** - `2c42311` (feat)
2. **Task 2: Fix ingredient display with unit conversion and add empty state** - `19315d1` (feat)

## Files Created/Modified
- `src/components/cooking/StepCard.tsx` - Expanded 7-category deriveStepType, BADGE_STYLES with theme-appropriate colors, convertIngredient integration, always-visible ingredient card with empty state

## Decisions Made
- SIMMERING uses hardcoded hex #d0e4ff/#00497e because theme tertiaryContainer (#535b4c) is dark green, not blue
- Ingredient card always renders (removed conditional wrapper) per CONTEXT.md decision for layout consistency
- Badge font size changed from 10 to 12 per UI-SPEC typography contract

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors exist in other files (CookingMode.tsx passing wrong type to recipeCategory prop, CookingProgress.tsx color type mismatch, missing @expo/vector-icons types) — all unrelated to StepCard changes and out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- StepCard is ready with full 7-category classification and ingredient conversion
- Plan 50-02 (CookingMode layout restructure) can proceed — StepCard provides the enhanced card it will integrate

---
*Phase: 50-cooking-mode-redesign*
*Completed: 2026-04-11*
