---
phase: 35-data-foundation
verified: 2026-04-07T00:00:00Z
status: gaps_found
score: 11/12
overrides_applied: 0
gaps:
  - truth: "food_items has tsvector full-text search via GIN index on name_normalized"
    status: failed
    reason: "Migration uses gin_trgm_ops (pg_trgm trigram GIN index) on name_normalized instead of a tsvector column with GIN index. Roadmap SC-3 explicitly required tsvector + GIN. No tsvector column or to_tsvector call exists in 00022_create_food_tables.sql."
    artifacts:
      - path: "supabase/migrations/00022_create_food_tables.sql"
        issue: "GIN index uses gin_trgm_ops (trigram) not tsvector. The approach achieves fuzzy name search but deviates from the roadmap's stated tsvector requirement."
    missing:
      - "Either add a tsvector-generated column (name_search tsvector GENERATED ALWAYS AS to_tsvector('english', name_normalized) STORED) with a GIN index, OR accept the trigram deviation with an explicit override."
---

# Phase 35: Data Foundation Verification Report

**Phase Goal:** App has a canonical food data layer with numeric nutrition storage, unit conversion, and caching infrastructure ready for external API integration
**Verified:** 2026-04-07
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | food_items table exists with numeric JSONB nutrition column storing per-100g canonical values | VERIFIED | `CREATE TABLE food_items` present in 00022_create_food_tables.sql; `nutrition JSONB NOT NULL` column confirmed |
| 2 | food_search_cache table exists with query_hash PK, 24h TTL, and results JSONB | VERIFIED | `CREATE TABLE food_search_cache` with `query_hash TEXT PRIMARY KEY`, `expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')`, `results JSONB NOT NULL` confirmed |
| 3 | food_items has tsvector full-text search via GIN index on name_normalized | FAILED | Migration creates `gin_trgm_ops` trigram GIN index on name_normalized, not a tsvector column. No `tsvector` or `to_tsvector` anywhere in the file. Comment says "tsvector trigram search" but the index is purely trigram. |
| 4 | food_items has 30-day TTL via expires_at column with default | VERIFIED | `expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')` confirmed in migration |
| 5 | TypeScript FoodItem, NutritionData, ServingSize types are exported from src/types/food.ts | VERIFIED | All 7 types exported: FoodSource, NutritionData, ServingSize, FoodItem, FoodSearchResult, NutritionSummaryData, ScaledNutrition — all confirmed in src/types/food.ts |
| 6 | RLS allows anyone to read food_items but only service_role can write | VERIFIED | `ALTER TABLE food_items ENABLE ROW LEVEL SECURITY` and `CREATE POLICY "Anyone can read food items" ON food_items FOR SELECT USING (true)` confirmed; no INSERT/UPDATE/DELETE policy for anon/authenticated |
| 7 | App can convert between cups, tbsp, oz, ml, g using food-specific density tables | VERIFIED | FOOD_DENSITIES, VOLUME_TO_CUP_FACTOR, WEIGHT_TO_GRAMS all confirmed in src/lib/nutrition-utils.ts; convertToGrams() handles both weight and volume+density |
| 8 | Density table covers at least 30 common cooking ingredients | VERIFIED | 42 key-value entries counted in FOOD_DENSITIES (exceeds 30 minimum requirement) |
| 9 | Nutrition can be scaled from per-100g to any serving weight in grams | VERIFIED | scaleNutrition(perHundredG, servingWeightG) function confirmed with correct factor multiplication and 1-decimal rounding |
| 10 | Nutrition values can be summed across multiple ingredients for recipe totals | VERIFIED | sumNutrition(items[]) function confirmed; handles required fields and optional field accumulation; empty array returns zeros |
| 11 | database.ts has food_items table types in the Database interface | VERIFIED | food_items Row/Insert/Update defined in Database['public']['Tables'] at lines 707-762 of database.ts |
| 12 | FoodItem convenience type alias is exported from database.ts | VERIFIED | FoodItemRow, FoodItemInsert, FoodItemUpdate, FoodSearchCacheRow all exported at lines 847-850 of database.ts |

**Score:** 11/12 truths verified

### Roadmap Success Criteria

| # | Roadmap SC | Status | Evidence |
|---|-----------|--------|----------|
| SC-1 | Nutrition data is stored as canonical numeric values per serving and per 100g in Postgres | VERIFIED | nutrition JSONB NOT NULL column in food_items; NutritionData interface uses `number` not `string` for all fields |
| SC-2 | App can convert between common cooking units using food-specific density tables | VERIFIED | convertToGrams(), volumeToGrams() with FOOD_DENSITIES covering cups, tbsp, tsp, ml, l, fl oz, g, kg, oz, lb |
| SC-3 | Food data cache table exists with full-text search (tsvector + GIN index) and 30-day TTL cleanup | FAILED | 30-day TTL confirmed; GIN index exists on name_normalized but uses gin_trgm_ops (trigram) not tsvector. Roadmap explicitly states "tsvector + GIN" |
| SC-4 | TypeScript types (FoodItem, NutritionData) are defined and shared between client and Edge Functions | VERIFIED | src/types/food.ts exports all canonical types; database.ts exposes Row types for Supabase client queries |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00022_create_food_tables.sql` | food_items and food_search_cache tables with indexes and RLS | VERIFIED | Both tables, all 4 indexes, RLS on both tables present. 72 lines total — substantive. |
| `src/types/food.ts` | FoodItem, NutritionData, ServingSize, FoodSource types | VERIFIED | 113 lines; 7 exported types including all required plus FoodSearchResult, NutritionSummaryData, ScaledNutrition |
| `src/lib/nutrition-utils.ts` | scaleNutrition, sumNutrition, volumeToGrams, convertToGrams, FOOD_DENSITIES | VERIFIED | 313 lines; all 6 functions exported plus FOOD_DENSITIES constant |
| `src/types/database.ts` | food_items table type definitions in Database interface | VERIFIED | food_items and food_search_cache table definitions added at lines 707-788; FoodItemRow/Insert/Update/FoodSearchCacheRow aliases at lines 847-850 |
| `src/lib/__tests__/nutrition-utils.test.ts` | Test coverage for all computation functions | VERIFIED | 29 test cases across 6 describe blocks covering all behaviors specified in plan |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/lib/nutrition-utils.ts | src/types/food.ts | `import type { NutritionData, NutritionSummaryData } from '../types/food'` | WIRED | Import confirmed at line 11 of nutrition-utils.ts |
| src/types/database.ts | src/types/food.ts | Database food_items Row type mirrors FoodItem schema | WIRED | food_items table definition in Database interface matches FoodItem fields; FoodItemRow alias exported |
| supabase/migrations/00022_create_food_tables.sql | src/types/food.ts | TypeScript types mirror Postgres schema columns | WIRED | All FoodItem fields map 1:1 to food_items table columns (id, fdc_id, off_barcode, fatsecret_id, name, name_normalized, brand, barcode, category, nutrition, serving_sizes, source, image_url, data_quality, fetched_at, expires_at) |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces infrastructure (migration, types, utilities), not components that render dynamic data.

### Behavioral Spot-Checks

| Behavior | Check | Status |
|----------|-------|--------|
| FOOD_DENSITIES has ≥ 30 entries | Counted 42 density key-value pairs in nutrition-utils.ts | PASS |
| NutritionData uses number types (not strings) | All fields in NutritionData interface confirmed as `number` or `number \| undefined` | PASS |
| database.ts NutritionInfo unchanged (still uses string types) | `calories?: string` confirmed at line 54 of database.ts | PASS |
| food_items has at_least_one_source constraint | `CONSTRAINT at_least_one_source CHECK (fdc_id IS NOT NULL OR off_barcode IS NOT NULL OR fatsecret_id IS NOT NULL)` confirmed | PASS |
| food_items barcode uniqueness enforced | `barcode TEXT UNIQUE` in table definition + partial index confirmed | PASS |
| 29 test cases in nutrition-utils.test.ts | grep -c "test(" confirmed 29 tests | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DATA-01 | 35-01, 35-02 | App stores nutrition data in canonical numeric format per serving and per 100g | SATISFIED | NutritionData interface (all numeric fields); food_items.nutrition JSONB NOT NULL; scaleNutrition() enables per-serving calculation from per-100g base |
| DATA-02 | 35-02 | App converts between food-specific units using density tables | SATISFIED | convertToGrams(), volumeToGrams(), FOOD_DENSITIES (42 ingredients), WEIGHT_TO_GRAMS, VOLUME_TO_CUP_FACTOR all confirmed |
| DATA-03 | 35-01 | App caches food data with full-text search and 30-day TTL | PARTIAL | food_items table with 30-day TTL confirmed; GIN index on name_normalized exists but uses trigram not tsvector; still achieves search goal but deviates from requirement's implied tsvector approach |

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| src/lib/nutrition-utils.ts | `return null` at lines 220, 237, 269 | Info | Intentional sentinel value — functions return null when conversion is impossible (no density for unknown food, no density for volumetric unit without food name). Not a stub. |
| supabase/migrations/00022_create_food_tables.sql | Comment says "tsvector trigram search" (line 3) but only trigram index exists | Warning | Misleading comment that claims tsvector when none is implemented. Minor documentation inaccuracy, but technically the index works. |

### Human Verification Required

None. All must-haves are either verified or failed with clear programmatic evidence.

---

## Gaps Summary

**1 gap blocking full goal achievement:**

### tsvector vs. Trigram GIN: Roadmap SC-3 Deviation

Plan 35-01 truth #3 and Roadmap SC-3 both require "tsvector full-text search via GIN index on name_normalized." The actual implementation uses `gin_trgm_ops` (pg_trgm trigram extension) for the GIN index instead of a `tsvector` generated column.

**What exists:** `CREATE INDEX idx_food_items_name_trgm ON food_items USING gin (name_normalized gin_trgm_ops)`

**What was required:** A tsvector-based index, e.g., a generated column `name_search tsvector GENERATED ALWAYS AS to_tsvector('english', name_normalized) STORED` with `CREATE INDEX ... USING gin (name_search)`

**Assessment:** The trigram approach is arguably superior for food name search — it supports prefix matching and substring search without English tokenization, which is important for brand names, food product codes, and non-English terms. This deviation appears intentional and achieves the search goal better in practice. However, it literally fails the roadmap criterion.

**Two resolution paths:**

Option A — Accept the deviation with an override:

```yaml
overrides:
  - must_have: "food_items has tsvector full-text search via GIN index on name_normalized"
    reason: "Implemented with pg_trgm trigram GIN index instead — superior for food name search (handles partial matches, brand names, non-English terms without English tokenizer assumptions)"
    accepted_by: "{your name}"
    accepted_at: "2026-04-07T00:00:00Z"
```

Option B — Add a tsvector generated column alongside the trigram index (backward-compatible migration):

```sql
ALTER TABLE food_items
  ADD COLUMN name_search tsvector GENERATED ALWAYS AS (to_tsvector('english', name_normalized)) STORED;
CREATE INDEX idx_food_items_name_fts ON food_items USING gin (name_search);
```

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
