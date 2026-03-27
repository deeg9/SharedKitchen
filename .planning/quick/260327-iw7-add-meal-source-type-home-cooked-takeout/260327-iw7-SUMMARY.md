---
phase: quick
plan: 260327-iw7
subsystem: plan-edit, grocery, budget
tags: [meal-source, cost-tracking, auto-expense, grocery-checkout]
dependency_graph:
  requires: [budgetStore.addExpense, planStore.assignRecipe, groceryStore.toggleItem]
  provides: [meal-source-selector, meal-cost-tracking, grocery-cost-prompt]
  affects: [PlanEditSheet, GroceryItem, planStore, database-types]
tech_stack:
  added: []
  patterns: [Alert.prompt-for-inline-cost-entry, auto-expense-on-save]
key_files:
  created:
    - supabase/migrations/00016_add_meal_source.sql
  modified:
    - src/types/database.ts
    - src/stores/planStore.ts
    - src/components/plan/PlanEditSheet.tsx
    - src/components/grocery/GroceryItem.tsx
decisions:
  - "Takeout/eating-out meals allow optional recipe selection (recipe_id nullable)"
  - "Alert.prompt used for grocery cost entry (iOS-only, matches project constraints)"
  - "Skip option on grocery check-off allows cost-free toggle for convenience"
metrics:
  duration: 198s
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
  completed_date: "2026-03-27"
---

# Quick Task 260327-iw7: Add Meal Source Type + Grocery Cost Tracking Summary

Meal source selector (Home-cooked/Takeout/Eating Out) with auto-expense creation for non-home-cooked meals, plus cost prompt on grocery item check-off with Groceries budget integration.

## What Was Done

### Task 1: DB migration, types, planStore, PlanEditSheet UI
**Commit:** 5a32cd6

- Created `00016_add_meal_source.sql` migration adding `meal_source` (text with CHECK constraint) and `meal_cost` (numeric) columns to `meal_plans`, with constraint requiring cost for non-home-cooked sources
- Added `MealSource` type, `MEAL_SOURCES` array, and `MEAL_SOURCE_CONFIG` (with labels and MaterialCommunityIcons names) to `database.ts`
- Added `meal_source` and `meal_cost` to meal_plans Row/Insert/Update types
- Updated `planStore.assignRecipe` to accept optional `mealSource` and `mealCost` params, include them in upsert payload, and auto-create expense via `useBudgetStore.getState().addExpense()` for takeout/eating-out
- Updated `PlanEditSheet` with meal source pill selector (same style as meal type pills), conditional cost input field with dollar prefix, "Recipe (optional)" label for non-home-cooked, and updated save validation logic

### Task 2: Grocery item cost prompt on check-off
**Commit:** 8a49ca4

- Modified `GroceryItem.handleToggle` to show `Alert.prompt` when checking ON
- Prompt pre-fills `estimated_price` if available, offers Skip (toggle only) and Save (toggle + persist cost + create Groceries expense)
- Save flow: calls `toggleItem`, `updateItem` (persist actual cost), and `addExpense` to budget store

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows are fully wired.

## Self-Check: PASSED
