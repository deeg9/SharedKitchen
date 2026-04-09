---
phase: 38-recipe-nutrition
plan: 01
subsystem: recipe-nutrition
tags: [ai, edge-function, nutrition, gemini, recipes]
dependency_graph:
  requires: [food_items table (Phase 35), analyze-food-photo pattern (Phase 26)]
  provides: [match-ingredients Edge Function, computed_nutrition column, computeNutrition action, matchIngredients API]
  affects: [recipe detail screen (Plan 02), plan tab nutrition (Plan 02)]
tech_stack:
  added: [match-ingredients Edge Function]
  patterns: [Gemini 2.5 Flash text-only matching, per-serving nutrition computation, JSONB column caching]
key_files:
  created:
    - supabase/migrations/00023_add_computed_nutrition.sql
    - supabase/functions/match-ingredients/index.ts
  modified:
    - src/types/database.ts
    - src/lib/food-api.ts
    - src/stores/recipeStore.ts
    - __tests__/stores/recipeStore.test.ts
decisions:
  - Reused analyze-food-photo Edge Function pattern for auth, rate limiting, Gemini calls
  - Rate limit set to 20/month free tier for ingredient matching (vs 5/month for vision)
  - Gemini text-only prompt with few-shot examples for ingredient-to-food matching
  - Food lookup via ILIKE on name_normalized with data_quality ranking for best match
  - Nutrition cached as per-serving JSONB on recipe to avoid recomputation
metrics:
  duration: 212s
  completed: 2026-04-07
---

# Phase 38 Plan 01: AI Ingredient Matching & Nutrition Pipeline Summary

Gemini 2.5 Flash ingredient-to-food matching Edge Function with food_items lookup, per-serving nutrition computation, JSONB caching on recipes, and Zustand store integration.

## What Was Built

### Task 1: Migration + match-ingredients Edge Function
- **Migration** (`00023_add_computed_nutrition.sql`): Adds `computed_nutrition` and `ingredient_matches` JSONB columns to recipes table
- **Edge Function** (`match-ingredients/index.ts`): Full pipeline following established analyze-food-photo pattern:
  - Auth via supabase.auth.getUser()
  - Recipe access validation (user must have access via RLS)
  - Premium check and rate limiting (20/month free, unlimited premium)
  - Gemini 2.5 Flash text prompt with few-shot examples for ingredient matching
  - food_items table lookup via ILIKE on name_normalized
  - Best match selection by data_quality score
  - Per-ingredient nutrition scaling from per-100g canonical data
  - Recipe total and per-serving nutrition computation
  - Results cached on recipe via admin client UPDATE
  - Usage logged to ai_usage_log

### Task 2: Types + API Wrapper + Store Action
- **database.ts**: Ingredient extended with `food_id?` and `matched_confidence?`; Recipe Row/Insert/Update extended with `computed_nutrition` and `ingredient_matches`
- **food-api.ts**: `IngredientMatch`, `MatchIngredientsResponse`, `MatchLimitError` types; `matchIngredients()` function calling Edge Function via supabase.functions.invoke
- **recipeStore.ts**: `computeNutrition(recipeId)` action -- checks cache, extracts ingredients, calls matchIngredients, updates local state; `nutritionLoading`/`nutritionError` state fields
- **Test fixtures**: Updated all mock recipes with new required fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated test fixtures for new required fields**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Adding computed_nutrition and ingredient_matches to Recipe Row type made them required, breaking existing test mock objects
- **Fix:** Added `computed_nutrition: null, ingredient_matches: null` to all mock recipe fixtures
- **Files modified:** `__tests__/stores/recipeStore.test.ts`
- **Commit:** 4946c38

## Verification

- Migration file has computed_nutrition and ingredient_matches columns
- Edge Function has auth, CORS, rate limiting, Gemini 2.5 Flash, food_items lookup, nutrition computation
- food-api.ts exports matchIngredients wrapper with MatchLimitError handling
- recipeStore has computeNutrition action with cache check and state updates
- TypeScript compiles with no new errors (pre-existing errors unrelated to this plan)

## Self-Check: PASSED

- [x] supabase/migrations/00023_add_computed_nutrition.sql exists
- [x] supabase/functions/match-ingredients/index.ts exists
- [x] Commit 2474240 exists (Task 1)
- [x] Commit 4946c38 exists (Task 2)
