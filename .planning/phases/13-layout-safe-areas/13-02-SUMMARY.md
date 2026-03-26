---
phase: 13-layout-safe-areas
plan: 02
subsystem: ui
tags: [react-native, layout, z-index, buttons, hero-image]

requires:
  - phase: 02-core-features
    provides: Recipe detail screen and RecipeGrid component
provides:
  - Fixed recipe detail bottom bar with equal-width action buttons
  - Hero image visible without white card overlay
  - FilterBar z-index contained within stacking context
affects: []

tech-stack:
  added: []
  patterns:
    - "z-index containment via wrapper View with position relative"

key-files:
  created: []
  modified:
    - app/(app)/recipe/[id].tsx
    - src/components/recipes/RecipeGrid.tsx

key-decisions:
  - "Reduced hero gradient from 160px/0.85 to 80px/0.3 for minimal text readability aid without obscuring food photo"
  - "Used wrapper View stacking context instead of modifying FilterBar internal z-index"

patterns-established:
  - "z-index containment: wrap components with high internal z-index in a View with zIndex: 1 and position: relative"

requirements-completed: [LAYOUT-03, LAYOUT-04, RECIPE-01]

duration: 1min
completed: 2026-03-26
---

# Phase 13 Plan 02: Recipe Detail Layout & FilterBar Z-Index Summary

**Fixed recipe detail button overlap and hero overlay, contained FilterBar z-index to prevent bleed-through on bottom sheets**

## What Was Done

### Task 1: Fix recipe detail buttons and remove hero overlay (LAYOUT-03, LAYOUT-04)
- **startCookingBtn**: Added `flex: 1`, reduced height from 56 to 52, reduced paddingHorizontal from spacing.md to spacing.sm
- **addToPlanBtn**: Reduced height from 56 to 52, added paddingHorizontal: spacing.sm
- **favButton**: Shrunk from 56x56 to 48x48 to give action buttons more room
- **heroGradient**: Reduced from 160px height at 0.85 opacity to 80px at 0.3 opacity
- Commit: `8e4e265`

### Task 2: Fix FilterBar z-index bleed-through on MealGeneratorSheet (RECIPE-01)
- Wrapped `<FilterBar />` in RecipeGrid.tsx with `<View style={{ zIndex: 1, position: 'relative' }}>`
- Creates a new stacking context so FilterBar's internal zIndex: 10 stays contained
- FilterBar.tsx was NOT modified -- its internal dropdown logic remains correct
- Commit: `21c176b`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 8e4e265 | fix(13-02): fix recipe detail button overlap and remove hero white overlay |
| 2 | 21c176b | fix(13-02): contain FilterBar z-index to prevent bleed-through on sheets |

## Self-Check: PASSED
