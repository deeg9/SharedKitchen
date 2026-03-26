# Phase 10: Recipe Discovery - Research

**Researched:** 2026-03-25
**Domain:** React Native / Expo Router UI components, Zustand store filtering, Supabase recipe schema
**Confidence:** HIGH

## Summary

This phase is primarily about committing and wiring existing code, not building from scratch. The FilterBar component (uncommitted, 302 lines) is already fully built and already imported/rendered inside `RecipeGrid.tsx`. The `RecipeForm` component already includes a category chip picker with `CATEGORY_OPTIONS`. Both the add and edit screens use `RecipeForm`, so category picking in create and edit flows is already functional. The `recipeStore` already implements `filteredRecipes()` with category, cost range, and prep time filtering logic. The AI import edge function already extracts and returns the `category` field.

The main work is: (1) commit the uncommitted FilterBar, (2) fix a category list mismatch between FilterBar and RecipeForm, (3) verify end-to-end filtering behavior, and (4) verify AI import populates category.

**Primary recommendation:** Unify the CATEGORIES list into a single shared constant, commit FilterBar.tsx, and verify filtering works against real data. Most functionality already exists.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | FilterBar component committed and rendering in recipes tab with category/cost/time dropdowns | FilterBar.tsx exists uncommitted (302 lines). Already imported in RecipeGrid.tsx line 7, rendered line 62. RecipeGrid rendered in recipes.tsx tab line 48. Just needs `git add` and commit. |
| DISC-02 | Manual recipe form includes category picker from standard category list | RecipeForm.tsx already has CATEGORY_OPTIONS (line 21-32) with chip-based category picker (lines 201-221). Used in add.tsx line 185. |
| DISC-03 | Recipe edit form includes category picker to update existing recipes | edit/[id].tsx uses same RecipeForm (line 127) with initialData that includes category (line 33). Already functional. |
| DISC-04 | AI-imported recipes populate category field from extracted data | ai.ts parseRecipeUrl returns category (line 139). Edge function extracts from JSON-LD schema.recipeCategory and also via OpenAI structured output. add.tsx passes importedData to RecipeForm (line 188). |
| DISC-05 | Filtering by category, cost range, and prep time returns correct results client-side | recipeStore.ts filteredRecipes() (lines 68-97) filters by activeCategory, costRange [min,max], and maxPrepTime. RecipeGrid calls filteredRecipes() line 27. |
</phase_requirements>

## Architecture Patterns

### Existing Component Hierarchy (already built)
```
app/(app)/(tabs)/recipes.tsx        -- RecipesScreen
  -> src/components/recipes/RecipeGrid.tsx   -- Search + FilterBar + FlashList
       -> src/components/recipes/FilterBar.tsx   -- UNCOMMITTED
       -> src/components/recipes/RecipeCard.tsx
  -> FABs for add recipe + meal generator

app/(app)/recipe/add.tsx            -- AddRecipeScreen
  -> src/components/recipes/RecipeForm.tsx    -- Has category picker

app/(app)/recipe/edit/[id].tsx      -- EditRecipeScreen
  -> src/components/recipes/RecipeForm.tsx    -- Same component, with initialData
```

### State Management Pattern
- **Store:** `recipeStore.ts` (Zustand) holds filter state: `activeCategory`, `costRange`, `maxPrepTime`, `searchQuery`
- **Computed:** `filteredRecipes()` is a function on the store that applies all active filters
- **Reset:** `resetFilters()` clears all filter state
- **Check:** `hasActiveFilters()` returns boolean for UI (reset button, empty state messaging)

### Filter Flow (already wired)
```
FilterBar -> setActiveCategory/setCostRange/setMaxPrepTime (store actions)
  -> RecipeGrid reads filteredRecipes() (re-renders via Zustand subscription)
    -> FlashList renders filtered data
```

## Critical Finding: Category List Mismatch

There are THREE separate category lists that do not match:

| Source | Categories |
|--------|-----------|
| **FilterBar.tsx** (line 10-20) | Mexican, Seafood, Chicken, Vegetarian, Pasta, Asian, Salads, Soups, Desserts (9 items) |
| **RecipeForm.tsx** (line 21-32) | Mexican, Seafood, Chicken, Vegetarian, Pasta, Asian, Salads, Soups, Desserts, Other (10 items -- adds "Other") |
| **starter-recipes.ts** (actual data) | Vegetarian, Italian, Vegan, High Protein, Breakfast (5 unique values -- "Italian", "Vegan", "High Protein", "Breakfast" not in either UI list) |

**Impact:** Starter recipes categorized as "Italian", "Vegan", "High Protein", or "Breakfast" will NEVER appear when filtering by category in FilterBar. Users cannot select those categories.

**Resolution:** Create a single shared `CATEGORIES` constant in a shared location (e.g., `src/lib/categories.ts`) and import it in both FilterBar and RecipeForm. The list should include all values that appear in starter recipes plus the current UI options.

### Recommended Unified Category List
```typescript
// src/lib/categories.ts
export const CATEGORIES = [
  'Mexican',
  'Italian',
  'Asian',
  'Seafood',
  'Chicken',
  'Pasta',
  'Vegetarian',
  'Vegan',
  'Salads',
  'Soups',
  'Breakfast',
  'Desserts',
  'Other',
] as const;

export type RecipeCategory = (typeof CATEGORIES)[number];
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown menus | Custom dropdown from scratch | Existing FilterBar pattern (Pressable + absolute positioned View) | Already built and working in FilterBar |
| List virtualization | Manual FlatList pagination | FlashList (already used in RecipeGrid) | Already integrated with correct estimatedItemSize |
| Filter state | Local component state for filters | Zustand store (recipeStore) | Already implemented, shared across components |

## Common Pitfalls

### Pitfall 1: Forgetting to Export CATEGORIES from Shared Location
**What goes wrong:** FilterBar and RecipeForm each maintain their own copy of categories, leading to drift.
**How to avoid:** Extract to `src/lib/categories.ts` and import everywhere. Single source of truth.

### Pitfall 2: AI-Imported Category Not in Standard List
**What goes wrong:** The AI/edge function returns free-text category values (e.g., "Comfort Food", "Mediterranean") that may not match any standard category, making filtering miss those recipes.
**Why it happens:** The edge function's OpenAI prompt does not constrain category to a fixed enum.
**How to avoid:** This is acceptable for now -- recipes with non-standard categories show up in "All" (no filter) but not when a specific category is selected. The "Other" fallback in RecipeForm handles this for manual entry. No action needed for DISC-04 beyond verifying the field is populated.

### Pitfall 3: Cost Filter Edge Case with null estimated_cost
**What goes wrong:** Recipes with `estimated_cost: null` are excluded from ALL cost filter ranges because `0 >= min` evaluates true but the intent may differ.
**Why it happens:** `filteredRecipes()` uses `r.estimated_cost ?? 0` which means null-cost recipes appear as $0, matching "Under $10" and "$10-$25" ranges but excluded from higher ranges.
**How to avoid:** Current behavior is acceptable but should be verified. Null-cost recipes will show in "Under $10" which is reasonable.

### Pitfall 4: Prep Time Filter with value 0
**What goes wrong:** The filter `time > 0 && time <= maxPrepTime` excludes recipes with `prep_time_minutes: 0` (no-cook recipes like salads).
**Why it happens:** The `time > 0` guard was intended to skip null/zero but also catches legitimate 0-minute prep items.
**How to avoid:** Verify this is the desired behavior. Spring Harvest Salad has `cook_time_minutes: 0` but `prep_time_minutes: 15` so it would still appear. The filter only applies to prep_time_minutes, so this is likely fine.

## Database Schema

The `recipes` table `category` column is `string | null` (free text, not an enum). This is already sufficient -- no schema migration needed.

Key fields used by filtering:
- `category: string | null` -- matched exactly against `activeCategory`
- `estimated_cost: number | null` -- compared against `costRange [min, max]`
- `prep_time_minutes: number | null` -- compared against `maxPrepTime`

## Code Examples

### Shared Categories Constant (to create)
```typescript
// src/lib/categories.ts
export const CATEGORIES = [
  'Mexican',
  'Italian',
  'Asian',
  'Seafood',
  'Chicken',
  'Pasta',
  'Vegetarian',
  'Vegan',
  'Salads',
  'Soups',
  'Breakfast',
  'Desserts',
  'Other',
] as const;
```

### FilterBar Import Update
```typescript
// src/components/recipes/FilterBar.tsx
import { CATEGORIES } from '../../lib/categories';
// Remove local CATEGORIES const
```

### RecipeForm Import Update
```typescript
// src/components/recipes/RecipeForm.tsx
import { CATEGORIES } from '../../lib/categories';
const CATEGORY_OPTIONS = [...CATEGORIES]; // or use CATEGORIES directly
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via Expo/React Native preset) |
| Config file | package.json jest config or jest.config.js |
| Quick run command | `npx jest --testPathPattern=recipe` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | FilterBar renders in recipes tab | manual | Visual verification in simulator | N/A |
| DISC-02 | Category picker in create form | manual | Visual verification in simulator | N/A |
| DISC-03 | Category picker in edit form | manual | Visual verification in simulator | N/A |
| DISC-04 | AI import populates category | manual | Import a recipe URL, check category field | N/A |
| DISC-05 | Filtering returns correct results | unit | `npx jest --testPathPattern=recipeStore` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** Visual verification that FilterBar renders, category picker works
- **Per wave merge:** Full filter test with multiple categories/costs/times
- **Phase gate:** All 5 DISC requirements verified manually or by test

### Wave 0 Gaps
- [ ] `__tests__/stores/recipeStore.test.ts` -- unit test for filteredRecipes() covering all filter combinations
- [ ] Verify jest/testing infrastructure exists and runs

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all files listed above
- `src/components/recipes/FilterBar.tsx` -- uncommitted, 302 lines, fully functional
- `src/components/recipes/RecipeForm.tsx` -- category picker at lines 21-32, 201-221
- `src/components/recipes/RecipeGrid.tsx` -- imports and renders FilterBar at line 62
- `src/stores/recipeStore.ts` -- filteredRecipes() at lines 68-97
- `src/lib/ai.ts` -- parseRecipeUrl returns category at line 139
- `supabase/functions/parse-recipe-url/index.ts` -- extracts category from schema and OpenAI
- `src/types/database.ts` -- Recipe type has `category: string | null`
- `app/(app)/(tabs)/recipes.tsx` -- RecipesScreen renders RecipeGrid
- `app/(app)/recipe/add.tsx` -- uses RecipeForm with importedData
- `app/(app)/recipe/edit/[id].tsx` -- uses RecipeForm with initialData including category

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all code already exists and was directly inspected
- Architecture: HIGH - component hierarchy and data flow fully traced
- Pitfalls: HIGH - category mismatch identified by comparing actual arrays in source code

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- no external dependencies changing)
