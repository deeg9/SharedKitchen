---
phase: 36-food-search
plan: 01
subsystem: food-search-edge-function
tags: [edge-function, usda, fatsecret, food-search, caching, rate-limiting]
dependency_graph:
  requires: [food_items table, food_search_cache table, ai_usage_log table, subscriptions table]
  provides: [food-search Edge Function, FoodSearchResult API]
  affects: [food_items, food_search_cache, ai_usage_log]
tech_stack:
  added: [USDA FoodData Central API, FatSecret Platform API v3]
  patterns: [cache-first search, parallel API with Promise.allSettled, OAuth2 in-memory token cache, SHA-256 query hashing]
key_files:
  created:
    - supabase/functions/food-search/index.ts
  modified: []
decisions:
  - Daily rate limit (20/day) instead of monthly for food search
  - USDA nutrient mapping by nutrientNumber not nutrientName to avoid kcal/kJ confusion
  - Deduplication by normalized name substring matching with USDA priority
  - Individual upserts per food item to handle mixed conflict columns (fdc_id vs fatsecret_id)
  - Re-fetch food_items after upsert to get Postgres-generated UUIDs for search results
metrics:
  duration: 98s
  completed: 2026-04-07
---

# Phase 36 Plan 01: Food Search Edge Function Summary

Cache-first food search Edge Function querying USDA FoodData Central and FatSecret APIs in parallel with OAuth2 token caching, per-100g nutrition normalization, quality-based deduplication, and daily rate limiting.

## What Was Built

Single Edge Function at `supabase/functions/food-search/index.ts` that:

1. Authenticates user via Supabase auth
2. Checks premium status via subscriptions table
3. Enforces daily rate limit (20/day free, unlimited premium) via ai_usage_log
4. Normalizes and hashes the query string with SHA-256 for cache lookup
5. Checks food_search_cache for cached results (24h TTL)
6. On cache miss, queries USDA and FatSecret in parallel via Promise.allSettled
7. Normalizes USDA results using nutrient number mapping (208->calories, etc.)
8. Normalizes FatSecret results with string-to-number conversion and per-100g scaling
9. Handles FatSecret array/object quirk for both foods and servings
10. Deduplicates by normalized name similarity (USDA takes priority)
11. Sorts by data_quality (Foundation=90 > SR Legacy=80 > Generic=70 > Brand=60 > Branded=40)
12. Upserts all results into food_items table
13. Caches FoodSearchResult[] in food_search_cache
14. Logs usage non-blocking to ai_usage_log

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create food-search Edge Function with cache-first USDA + FatSecret search | dd00dc9 | supabase/functions/food-search/index.ts |

## Decisions Made

1. **Daily rate limit scope** -- Used setHours(0,0,0,0) for day-start boundary instead of monthly setDate(1) pattern from other Edge Functions.
2. **Individual upserts** -- Used per-item upsert calls instead of batch because USDA and FatSecret items have different conflict columns (fdc_id vs fatsecret_id).
3. **UUID retrieval** -- Re-fetch food_items rows after upsert to get Postgres-generated UUIDs rather than pre-generating them client-side.

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED
