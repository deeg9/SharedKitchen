---
phase: 35-data-foundation
plan: 02
subsystem: food-data
tags: [nutrition, utilities, types, density-tables]
dependency_graph:
  requires: [35-01]
  provides: [nutrition-utils, food-item-db-types]
  affects: [food-search, recipe-nutrition, meal-logging]
tech_stack:
  added: []
  patterns: [density-table-lookup, per-100g-scaling, element-wise-nutrition-sum]
key_files:
  created:
    - src/lib/nutrition-utils.ts
    - src/lib/__tests__/nutrition-utils.test.ts
  modified:
    - src/types/database.ts
decisions:
  - "Separate nutrition-utils from existing unit-conversion.ts: complementary modules (food-science vs display conversion)"
  - "FOOD_DENSITIES uses normalized lowercase keys with partial matching for flexible lookups"
  - "scaleNutrition caps calories at 900/100g to flag bad external API data"
metrics:
  duration: 216s
  completed: 2026-04-07
---

# Phase 35 Plan 02: Nutrition Utilities & Database Types Summary

Nutrition computation library with food-specific density tables (35+ ingredients) for volume-to-weight conversion, per-100g scaling, ingredient summing, and sanity validation; plus food_items/food_search_cache table types wired into Database interface.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create nutrition-utils with density tables and computation functions (TDD) | d1507d2 (RED), dd7ba77 (GREEN) | src/lib/nutrition-utils.ts, src/lib/__tests__/nutrition-utils.test.ts |
| 2 | Add food_items table types to database.ts | f4c6a47 | src/types/database.ts |

## Implementation Details

### nutrition-utils.ts
- **FOOD_DENSITIES**: 35+ common cooking ingredients with grams-per-cup values (flour, sugar, butter, oils, dairy, grains, condiments)
- **VOLUME_TO_CUP_FACTOR**: cup, tbsp, tsp, ml, l, fl oz with plural/alternate names
- **WEIGHT_TO_GRAMS**: g, kg, oz, lb with plural/alternate names
- **scaleNutrition()**: Scales per-100g NutritionData to any serving weight, rounds to 1 decimal, caps calories at 900/100g
- **sumNutrition()**: Element-wise sum across NutritionData array for recipe totals, handles optional fields
- **volumeToGrams()**: Food-specific volume-to-grams via density lookup with partial name matching
- **convertToGrams()**: Unified weight/volume-to-grams with optional food name for density
- **extractNutritionSummary()**: Extracts big-6 fields (calories, protein, fat, carbs, fiber, sodium)
- **isNutritionDataValid()**: Sanity checks for bad API data (calories 0-900, macros <= 100g, finite numbers)

### database.ts Updates
- Added `food_items` table type with Row/Insert/Update (matches 00022 migration exactly)
- Added `food_search_cache` table type with Row/Insert/Update
- Added convenience aliases: FoodItemRow, FoodItemInsert, FoodItemUpdate, FoodSearchCacheRow
- All existing types (NutritionInfo, Ingredient, etc.) unchanged

## Test Coverage

29 test cases covering:
- scaleNutrition: scaling at 1.5x, 0.5x, zero, calorie cap, optional field handling
- sumNutrition: two-item sum, empty array, optional field summing
- volumeToGrams: flour, sugar, butter(tbsp), unknown food, case insensitivity
- convertToGrams: oz, lb, g, kg weight; cup+milk density; volume without food name
- extractNutritionSummary: big-6 extraction, fiber default
- isNutritionDataValid: valid data, high calories, negative, NaN, macro overflow
- FOOD_DENSITIES: entry count >= 30, specific values

## Deviations from Plan

None - plan executed exactly as written.

## Threat Mitigations

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-35-04 | isNutritionDataValid() checks calories 0-900, macros <= 100g, finite numbers; scaleNutrition caps at 900 | Implemented |
| T-35-05 | Client-side only, bounded by recipe ingredient count | Accepted |

## Known Stubs

None.

## Self-Check: PASSED
