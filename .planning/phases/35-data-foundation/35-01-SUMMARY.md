---
phase: 35-data-foundation
plan: 01
subsystem: food-data-schema
tags: [database, types, migration, food-data]
dependency_graph:
  requires: []
  provides: [food_items-table, food_search_cache-table, food-types]
  affects: [pantry-integration, food-search-edge-function, nutrition-display]
tech_stack:
  added: [pg_trgm]
  patterns: [jsonb-nutrition, trigram-gin-index, ttl-cache-tables]
key_files:
  created:
    - supabase/migrations/00022_create_food_tables.sql
    - src/types/food.ts
  modified: []
decisions:
  - "pg_trgm GIN index for fuzzy food name search (trigram matching)"
  - "Numeric NutritionData coexists with existing string-based NutritionInfo"
  - "30-day TTL on food_items, 24h TTL on food_search_cache"
metrics:
  duration_seconds: 63
  completed: "2026-04-09T15:07:44Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 35 Plan 01: Food Data Schema & Types Summary

food_items and food_search_cache Postgres tables with trigram search, TTL caching, RLS read-only access, plus canonical numeric TypeScript types (NutritionData, FoodItem, ServingSize) mirroring the schema

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e77ccbe | Create food_items and food_search_cache migration |
| 2 | 8ba19a2 | Create canonical food TypeScript types |

## Task Details

### Task 1: Create food_items and food_search_cache migration

Created `supabase/migrations/00022_create_food_tables.sql` with:
- `food_items` table: UUID PK, nullable source IDs (fdc_id, off_barcode, fatsecret_id), JSONB nutrition per 100g, trigram GIN index on name_normalized, 30-day TTL, at_least_one_source constraint
- `food_search_cache` table: query_hash TEXT PK, results JSONB, 24h TTL
- RLS enabled on both tables: SELECT for all, no INSERT/UPDATE/DELETE for anon/authenticated
- pg_trgm extension enabled for trigram matching

### Task 2: Create canonical food TypeScript types

Created `src/types/food.ts` with 7 exported types:
- `FoodSource`: literal union for data sources
- `NutritionData`: numeric per-100g nutrition (not strings)
- `ServingSize`: serving description with gram weight and scaled nutrition
- `FoodItem`: mirrors food_items table schema exactly
- `FoodSearchResult`: lightweight subset for search result display
- `NutritionSummaryData`: big-6 values for compact nutrition cards
- `ScaledNutrition`: serving-scaled nutrition result

Existing `NutritionInfo` in database.ts is untouched.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- Migration file: both CREATE TABLE statements present
- Trigram index: gin_trgm_ops confirmed
- TTLs: 30-day and 24-hour intervals confirmed
- RLS: ENABLE ROW LEVEL SECURITY on both tables
- TypeScript: all 7 types exported, `npx tsc --noEmit` passes clean
- No modifications to database.ts

## Self-Check: PASSED
