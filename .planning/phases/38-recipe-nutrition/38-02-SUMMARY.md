---
phase: 38-recipe-nutrition
plan: 02
subsystem: recipe-nutrition-ui
tags: [nutrition, ui, recipe-detail, plan-tab]
dependency_graph:
  requires: [38-01]
  provides: [NutritionCard, computeDayNutrition, recipe-nutrition-display, plan-nutrition-totals]
  affects: [recipe-detail, plan-tab, DayCard]
tech_stack:
  added: []
  patterns: [horizontal-bar-chart, computed-aggregation, conditional-rendering]
key_files:
  created:
    - src/components/food/NutritionCard.tsx
  modified:
    - app/(app)/recipe/[id].tsx
    - src/stores/planStore.ts
    - src/components/plan/DayCard.tsx
decisions:
  - Macro bar widths proportional to percentage of total macros (protein+carbs+fat)
  - NutritionCard placed between ingredients and method sections on recipe detail
  - Daily nutrition row placed outside the row View below meal slots for full-width span
  - computeDayNutrition is a pure exported function (not inside zustand store) for testability
metrics:
  duration: 429s
  completed: 2026-04-09T17:13:33Z
  tasks_completed: 2
  tasks_total: 3
  status: checkpoint-pending
requirements:
  - NUTR-03
  - NUTR-04
---

# Phase 38 Plan 02: NutritionCard UI & Plan Tab Nutrition Summary

Horizontal bar chart NutritionCard component with calculate/loading/error/display states, integrated into recipe detail between ingredients and method; daily nutrition totals on Plan tab day cards with partial meal indicator.

## Task Results

### Task 1: NutritionCard component + Recipe detail integration
**Commit:** 32044a4

Created `NutritionCard` component with four states:
- **Calculate button**: full-width primary button with calculator icon when no nutrition data exists
- **Loading**: ActivityIndicator with "Analyzing ingredients..." text
- **Error**: error message with retry button
- **Nutrition display**: large calorie number, horizontal macro bars (protein green, carbs orange, fat red) with proportional widths, "Per serving (1 of N)" subtitle

Integrated into recipe detail screen between ingredients section and method section. Destructures `nutritionLoading`, `nutritionError`, `computeNutrition` from recipeStore and wires the calculate button to trigger `computeNutrition(id)`.

### Task 2: Plan tab daily nutrition totals
**Commit:** 9100470

Added `computeDayNutrition` pure function to planStore that aggregates `computed_nutrition` from all meal plan recipes for a given day. Returns total nutrition, matched meal count, and total meal count.

Updated `DaySection` in DayCard.tsx to display a compact nutrition summary row below meal slots: "X cal . Yg protein . Zg carbs . Wg fat" with a partial indicator "(N of M meals)" when some meals lack nutrition data.

### Task 3: Verify recipe nutrition end-to-end
**Status:** CHECKPOINT PENDING (human-verify)

Awaiting human verification of the complete nutrition pipeline:
1. Recipe detail "Calculate Nutrition" button appears and triggers AI matching
2. NutritionCard displays calories and macro bars after computation
3. Plan tab day cards show daily nutrition totals
4. Partial meal indicator displays correctly

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data paths are wired to live computed_nutrition from recipeStore/planStore.

## Self-Check: PASSED
