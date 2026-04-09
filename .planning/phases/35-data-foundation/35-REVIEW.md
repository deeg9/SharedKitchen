---
phase: 35-data-foundation
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/__tests__/nutrition-utils.test.ts
  - src/lib/nutrition-utils.ts
  - src/types/database.ts
  - src/types/food.ts
  - supabase/migrations/00022_create_food_tables.sql
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 35: Code Review Report

**Reviewed:** 2026-04-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed for the v6.0 Food Data Integration data foundation: the nutrition utility library, its test suite, the two type definition files, and the Postgres migration. The code is well-structured overall with clear separation of concerns. No security vulnerabilities or data-loss risks were found.

Four warnings were identified: one logic bug in the macro validation check that would incorrectly reject nutritionally valid foods (e.g., pure oils), one correctness hazard in the partial-match fallback in `volumeToGrams`, an ambiguous type contract in `ServingSize.nutrition` that risks double-scaling, and a missing type-level linkage between the `food_items` JSONB columns and the typed interfaces. Four info-level items cover the missing DB boundary type narrowing, the SQL constraint gap for barcode-only items, a duplication risk between `FoodSource` and the DB type union, and a minor test coverage gap.

---

## Warnings

### WR-01: Macro sum validation incorrectly rejects valid high-fat foods

**File:** `src/lib/nutrition-utils.ts:309`
**Issue:** `isNutritionDataValid` rejects any food where `protein_g + total_fat_g + total_carbs_g > 100`. Pure-fat foods (olive oil, coconut oil, butter) have `total_fat_g` close to 100g per 100g, causing them to fail validation even though the data is correct. The constraint conflates "macros cannot exceed food weight" with "macros must fit in 100g" — the former is true only if all three macros are present and water/ash are zero, which does not hold for real foods.

**Fix:**
```typescript
// Remove the macro-sum constraint entirely, or replace with a loose guard
// that only fires if the sum is wildly implausible (e.g., > 110g to allow
// for rounding tolerance):
if (data.protein_g + data.total_fat_g + data.total_carbs_g > 110) return false;
```

---

### WR-02: Partial-match fallback in volumeToGrams produces silently wrong results

**File:** `src/lib/nutrition-utils.ts:229-233`
**Issue:** The fallback loop uses both `normalizedFood.includes(key)` and `key.includes(normalizedFood)`. The second clause — `key.includes(normalizedFood)` — means that any short food name that happens to be a substring of a density-table key will silently match the wrong entry. For example, `"oil"` would match `"vegetable oil"` (first hit in iteration order), `"sugar"` would match `"granulated sugar"`, and `"rice"` could match `"rice (uncooked)"` or `"rice"` depending on insertion order. The iteration order of `Object.entries` is not guaranteed to be stable across JS engines for string keys. A caller passing an unrecognized food name expects `null`, not a silently incorrect density value.

**Fix:**
```typescript
// Remove the key.includes(normalizedFood) arm. Only match when the
// food name contains a known key, not the reverse.
if (density === undefined) {
  for (const [key, val] of Object.entries(FOOD_DENSITIES)) {
    if (normalizedFood.includes(key)) {
      density = val;
      break;
    }
  }
}
```
If broader fuzzy matching is needed, use a priority-ordered lookup rather than first-match iteration.

---

### WR-03: ServingSize.nutrition type contract is ambiguous — risk of double-scaling

**File:** `src/types/food.ts:48`
**Issue:** `ServingSize.nutrition` is typed as `NutritionData`. The `NutritionData` type is documented as "normalized per 100g" throughout the codebase (food.ts line 19, nutrition-utils.ts line 152). However, the `ServingSize` comment says "nutrition for this specific serving size," implying the values are pre-scaled to `amount_g`. If consumer code calls `scaleNutrition(servingSize.nutrition, servingSize.amount_g)` it will apply the per-100g factor to already-scaled values, producing results off by a factor of `amount_g/100`. The type alone does not prevent this mistake.

**Fix:** Clarify the contract explicitly in the type and, if `nutrition` here is pre-scaled, use a distinct type or rename the field:
```typescript
export interface ServingSize {
  description: string;
  amount_g: number;
  /**
   * Nutrition values already scaled to amount_g (NOT per 100g).
   * Do NOT pass this to scaleNutrition() — the scaling is pre-applied.
   */
  nutrition: NutritionData;
}
```
Alternatively, if it is intentionally per-100g, update the comment to say so clearly and add a note that callers must scale it before displaying.

---

### WR-04: food_items JSONB columns typed as Json — no type safety at DB boundary

**File:** `src/types/database.ts:718-719`
**Issue:** The `food_items` Row type uses `nutrition: Json` and `serving_sizes: Json` rather than `NutritionData` and `ServingSize[]`. Any code that reads from the `food_items` table and accesses `row.nutrition` receives `Json` (which is `string | number | boolean | null | object | array`). This means the TypeScript compiler cannot catch misuse of the nutrition fields at the DB read site. Silent runtime errors are likely when consumers treat the result as `NutritionData` without an explicit cast and runtime validation.

**Fix:** Narrow the types in the Row definition, or add a typed accessor helper:
```typescript
// Option A: Narrow directly in the Row type
food_items: {
  Row: {
    ...
    nutrition: NutritionData;
    serving_sizes: ServingSize[];
    ...
  };
  ...
};

// Option B: Helper function with runtime validation
function parseFoodItemRow(row: FoodItemRow): FoodItem {
  return {
    ...row,
    nutrition: row.nutrition as NutritionData,   // add zod/runtime check here
    serving_sizes: (row.serving_sizes as unknown as ServingSize[]) ?? [],
  };
}
```
Option A is sufficient for TypeScript safety. Option B adds runtime defense against malformed JSONB data.

---

## Info

### IN-01: at_least_one_source constraint excludes barcode-only food items

**File:** `supabase/migrations/00022_create_food_tables.sql:33-35`
**Issue:** The `CONSTRAINT at_least_one_source` checks `fdc_id IS NOT NULL OR off_barcode IS NOT NULL OR fatsecret_id IS NOT NULL`. The table also has a `barcode TEXT UNIQUE` column (line 24) representing a UPC/EAN barcode used for product lookups, distinct from `off_barcode` (the Open Food Facts primary key). A food item found only via barcode scan (no fdc_id, no off_barcode, no fatsecret_id) would fail this constraint, even though the item has a valid identifier. If barcode-only foods are not a supported use case this is fine, but it should be documented.

**Fix:** If barcode-only items should be supported, add `barcode` to the constraint:
```sql
CONSTRAINT at_least_one_source CHECK (
  fdc_id IS NOT NULL OR off_barcode IS NOT NULL OR fatsecret_id IS NOT NULL OR barcode IS NOT NULL
)
```

---

### IN-02: FoodSource union duplicated between food.ts and database.ts

**File:** `src/types/food.ts:15`, `src/types/database.ts:720`
**Issue:** `FoodSource` is declared as `'usda' | 'off' | 'fatsecret'` in `food.ts` line 15, and the same union literal is independently re-declared in the `food_items.Row.source` field type in `database.ts` line 720. If a new source is added to `FoodSource` but not to `database.ts` (or vice versa), TypeScript will silently accept values that are invalid at the other boundary.

**Fix:** Reference `FoodSource` from `food.ts` in the database type definition:
```typescript
import type { FoodSource } from './food';
// ...
source: FoodSource;
```

---

### IN-03: scaleNutrition only caps calories — other fields not guarded

**File:** `src/lib/nutrition-utils.ts:159-165`
**Issue:** `scaleNutrition` caps `calories` at 900 per 100g but applies no bounds check to `protein_g`, `total_fat_g`, `sodium_mg`, or `total_carbs_g`. Data from external APIs that passes bad macro values (e.g., `protein_g: 5000`) is silently scaled and returned. This inconsistency is a code smell — either all fields should be capped/validated, or none should be (leaving validation to `isNutritionDataValid`). The split responsibility makes the trust boundary unclear.

**Fix:** Either remove the calorie cap from `scaleNutrition` and always call `isNutritionDataValid` before scaling, or document explicitly that `scaleNutrition` only sanitizes calories and callers are responsible for full validation.

---

### IN-04: sumNutrition does not guard against NaN accumulation at runtime

**File:** `src/lib/nutrition-utils.ts:195-196`
**Issue:** `(result as Record<string, number>)[key] += item[key] as number` uses a TypeScript cast to `number`, but if a `NutritionData` object is constructed at runtime (e.g., from a JSON parse) with a missing required field, `item[key]` will be `undefined`, and `0 + undefined === NaN`. This silently corrupts the accumulator for all subsequent additions. The TypeScript type system prevents this for statically-typed callers, but runtime inputs (from JSONB columns, API responses) bypass type checking.

**Fix:** Add a defensive guard in the accumulation loop:
```typescript
for (const key of REQUIRED_KEYS) {
  const val = item[key];
  if (typeof val === 'number' && Number.isFinite(val)) {
    (result as Record<string, number>)[key] += val;
  }
}
```

---

_Reviewed: 2026-04-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
