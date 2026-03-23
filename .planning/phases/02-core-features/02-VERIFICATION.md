---
phase: 02-core-features
verified: 2026-03-23T20:00:00Z
status: gaps_found
score: 20/22 must-haves verified
re_verification: false
gaps:
  - truth: "User can add a recipe to their meal plan from the recipe detail page (bottom sheet with day picker)"
    status: failed
    reason: "handleAddToPlan in recipe/[id].tsx inserts with wrong column names: uses 'planned_date' and 'meal_type' which do not exist in the meal_plans table. The actual migration defines 'plan_date' (no 'meal_type' column). The insert will fail silently at runtime (error is caught and swallowed). Also bypasses planStore.assignRecipe() entirely."
    artifacts:
      - path: "app/(app)/recipe/[id].tsx"
        issue: "Line 103-108: inserts {planned_date, meal_type: 'dinner'} but migration schema uses {plan_date}. No meal_type column exists. Error is silently swallowed (line 111: 'Silently handle - meal_plans table may not exist yet'). Should call usePlanStore().assignRecipe() instead."
    missing:
      - "Fix handleAddToPlan to use plan_date (not planned_date) and remove meal_type field"
      - "Replace raw supabase.from('meal_plans').insert() with planStore.assignRecipe() call"
      - "Remove the silent error swallow - display feedback to user on failure"
  - truth: "Meal plans RLS policies are enforced correctly"
    status: failed
    reason: "Migration 00004_create_meal_plans.sql calls is_household_member(household_id) with ONE argument, but the function defined in migration 00002 requires TWO arguments: is_household_member(p_household_id UUID, p_user_id UUID). All four RLS policies on meal_plans will throw a runtime SQL error when evaluated."
    artifacts:
      - path: "supabase/migrations/00004_create_meal_plans.sql"
        issue: "Lines 24, 28, 32, 36: all four RLS policies call is_household_member(household_id) — missing auth.uid() as second argument. Correct call is is_household_member(household_id, auth.uid()) as used in migration 00002 and 00003."
    missing:
      - "Fix all four RLS policies to call is_household_member(household_id, auth.uid())"
human_verification:
  - test: "Recipe library grid with search and category filters"
    expected: "2-column FlashList renders recipe cards, search bar filters by name in real time, category chips filter by category"
    why_human: "Visual rendering and interactive filtering cannot be verified programmatically"
  - test: "Recipe detail portion scaler"
    expected: "Tapping x2 doubles all ingredient amounts, x3 triples them"
    why_human: "UI state interaction requires running the app"
  - test: "Grocery list real-time sync across two household members"
    expected: "Checking an item on one device immediately shows the check on the other device"
    why_human: "Requires two active sessions and live Supabase Realtime connection"
  - test: "AI recipe URL import end-to-end"
    expected: "Pasting a recipe URL and tapping Import fetches the page, calls the Edge Function, and populates the recipe form fields"
    why_human: "Requires OpenAI API key configured and live Edge Function deployment"
---

# Phase 2: Core Features Verification Report

**Phase Goal:** Users can manage recipes, plan weekly dinners, and shop from an auto-generated grocery list that syncs in real-time across the household
**Verified:** 2026-03-23T20:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can browse recipes in a searchable 2-column grid with category filter chips | VERIFIED | RecipeGrid.tsx renders FlashList with search Input and category chips; recipes.tsx mounts and calls fetchRecipes via useRecipeStore |
| 2 | User can view recipe detail with hero image, metadata, rating, ingredients, instructions, and notes | VERIFIED | recipe/[id].tsx is 517 lines with all sections: hero image/placeholder, metadata pills, star rating, IngredientRow list, InstructionStep list, notes section |
| 3 | User can scale recipe portions (x1, x2, x3) and ingredient amounts update | VERIFIED | scaleIngredients pure function in recipeStore.ts; scaledIngredients useMemo in [id].tsx wired to scale state; SCALE_OPTIONS [1,2,3] toggle buttons present |
| 4 | User can rate recipes 1-5 stars | VERIFIED | rateRecipe action in recipeStore.ts calls supabase upsert on recipe_ratings; handleRate in [id].tsx wired to star press |
| 5 | User can add notes to recipes | VERIFIED | addNote action in recipeStore.ts; handleAddNote in [id].tsx wired to noteText state and submit; notes rendered in ScrollView |
| 6 | User can create a recipe manually with all fields | VERIFIED | RecipeForm.tsx with multi-section form; recipe/add.tsx calls createRecipe with household_id; image upload to Supabase Storage wired |
| 7 | User can favorite/heart recipes | VERIFIED | toggleFavorite in recipeStore.ts calls upsert on recipe_ratings with is_favorite; handleFavorite in [id].tsx wired to heart button with Haptics |
| 8 | User can add a recipe to their meal plan from detail page (bottom sheet with day picker) | FAILED | BottomSheet with 7-day picker exists and renders. However handleAddToPlan inserts with wrong column names (planned_date + meal_type) that don't match the migration schema (plan_date only). Insert fails silently at runtime. See gaps. |
| 9 | User can view the weekly dinner calendar with 7 day cards showing recipe, cook, prep time, cost | VERIFIED | plan.tsx renders 7 DayCard components iterating weekDays(); DayCard.tsx has filled/empty states with recipe info |
| 10 | User can navigate between weeks with arrows and jump to current week via Today pill | VERIFIED | WeekHeader.tsx has prev/next arrows and Today pill; plan.tsx wires setWeekOffset callbacks; weekOffset change triggers re-fetch |
| 11 | User can tap a day card to open edit bottom sheet (choose recipe, assign cook, add notes) | VERIFIED | handleDayPress in plan.tsx opens PlanEditSheet; PlanEditSheet.tsx has recipe picker, cook assignment, notes input, Save/Clear/Cancel buttons |
| 12 | User can clear a day's meal plan | VERIFIED | PlanEditSheet calls planStore.clearDay(); clearDay in planStore.ts calls supabase delete on meal_plans and removes from Map |
| 13 | Empty day cards show dashed outline with + and Add Dinner text | VERIFIED | DayCard.tsx renders two states: filled (has mealPlan) and empty (dashed border, + icon, "Add Dinner") |
| 14 | User can tap Surprise Me FAB to get random dinner suggestion with shuffle and 3 alternatives | VERIFIED | SurpriseMe.tsx with modal, random recipe card, shuffle button, 3 alternatives; plan.tsx FAB opens SurpriseMe modal |
| 15 | User can add a randomly suggested recipe to their plan | VERIFIED | SurpriseMe calls planStore.assignRecipe() on "Add to Plan" press |
| 16 | User can import a recipe from a URL via AI parsing | VERIFIED | parseRecipeUrl in ai.ts calls supabase.functions.invoke; Edge Function parse-recipe-url/index.ts uses OpenAI gpt-4o-mini with JSON mode; add.tsx handleImport calls parseRecipeUrl and populates form via setImportedData |
| 17 | User can generate a grocery list from the current week's meal plan | VERIFIED | groceryStore.generateGroceryList() creates/gets list and aggregates ingredients; grocery.tsx handleGenerate extracts recipes from planStore.mealPlan and calls generateGroceryList |
| 18 | Grocery items are grouped by store section (Proteins, Produce, Dairy and Eggs, Pantry) | VERIFIED | groupBySection in grocery-utils.ts; grocery.tsx renders GrocerySection for each section in SECTION_ORDER; inferSection maps keywords to sections |
| 19 | Each grocery item shows name, quantity/unit, and estimated price | VERIFIED | GroceryItem.tsx renders name, quantity, estimated_price; GrocerySummary.tsx shows totals |
| 20 | User can check off items with circular checkbox showing green check, line-through, and avatar | VERIFIED | GroceryItem.tsx has circular checkbox (unchecked/checked states), line-through text when checked, Avatar for checked_by; calls groceryStore.toggleItem |
| 21 | Checked items move to a collapsed Completed section at the bottom | VERIFIED | groupedItems() separates checked items into completed array; grocery.tsx renders GrocerySection with collapsible=true, defaultCollapsed=true for completed |
| 22 | Summary bar shows item count, estimated total, items checked, and progress bar | VERIFIED | GrocerySummary.tsx renders all four fields; computeSummary in grocery-utils.ts calculates totalItems, checkedItems, estimatedTotal, progressPercent |
| 23 | User can manually add items to the grocery list | VERIFIED | AddItemSheet.tsx with name/quantity/section/price fields; calls groceryStore.addManualItem; grocery.tsx FAB opens AddItemSheet |
| 24 | Grocery list syncs in real-time across household members via Supabase Realtime | VERIFIED | useGrocerySync.ts subscribes to postgres_changes on grocery_items with INSERT/UPDATE/DELETE handlers; grocery.tsx calls useGrocerySync(activeHouseholdId, activeListId); migration 00005 enables ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items |
| 25 | Meal plans RLS policies are enforced correctly | FAILED | migration 00004 calls is_household_member(household_id) with one argument; function requires two (household_id, auth.uid()). All four policies will error at runtime. |

**Score:** 20/22 observable truths verified (2 failed, 4 need human verification)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00003_create_recipes.sql` | recipes, recipe_ratings, recipe_notes tables with RLS | VERIFIED | 142 lines; 3 tables with correct schema, RLS enabled, indexes |
| `supabase/migrations/00004_create_meal_plans.sql` | meal_plans table with RLS | PARTIAL | Table schema correct (37 lines). RLS policies call is_household_member() with wrong arg count — will fail at runtime |
| `supabase/migrations/00005_create_grocery_items.sql` | grocery_lists and grocery_items with RLS and Realtime | VERIFIED | 74 lines; both tables, RLS with correct is_household_member(household_id, auth.uid()) calls, Realtime publication enabled |
| `src/types/database.ts` | Recipe, RecipeRating, RecipeNote, MealPlan, GroceryList, GroceryItem types | VERIFIED | All types present and correctly typed |
| `src/stores/recipeStore.ts` | Recipe CRUD, search, filter, favorites, ratings, notes, scaling | VERIFIED | 306 lines; all actions implemented with supabase queries |
| `src/stores/planStore.ts` | Meal plan CRUD, week navigation | VERIFIED | 157 lines; all actions implemented; uses getWeekDays from dates.ts |
| `src/stores/groceryStore.ts` | Grocery CRUD, check-off, Realtime integration | VERIFIED | 283 lines; optimistic toggleItem with revert; Realtime helpers _addItem/_updateItem/_removeItem |
| `src/lib/dates.ts` | getWeekDays, toDateString, formatDayLabel, getWeekLabel | VERIFIED | 60 lines; all four exports present and implemented with date-fns |
| `src/lib/ai.ts` | parseRecipeUrl calling Edge Function | VERIFIED | 40 lines; calls supabase.functions.invoke('parse-recipe-url'); validates response shape |
| `src/lib/grocery-utils.ts` | aggregateIngredients, inferSection, computeSummary, groupBySection | VERIFIED | 137 lines; all four exports with substantive implementations |
| `src/hooks/useGrocerySync.ts` | Supabase Realtime subscription lifecycle | VERIFIED | 79 lines; subscribes to postgres_changes with INSERT/UPDATE/DELETE, cleanup on unmount |
| `supabase/functions/parse-recipe-url/index.ts` | Edge Function for LLM recipe parsing | VERIFIED | 121 lines; Deno.serve, CORS, OpenAI gpt-4o-mini JSON mode, error tiers |
| `app/(app)/(tabs)/recipes.tsx` | Recipe library grid screen | VERIFIED | 65 lines; RecipeGrid rendered, fetchRecipes on mount, FAB to /recipe/add |
| `app/(app)/(tabs)/plan.tsx` | Weekly calendar screen | VERIFIED | 184 lines; WeekHeader, 7 DayCards, PlanEditSheet, SurpriseMe FAB |
| `app/(app)/(tabs)/grocery.tsx` | Grocery list screen | VERIFIED | 250 lines; GrocerySummary, GrocerySection list, AddItemSheet FAB, useGrocerySync |
| `app/(app)/recipe/[id].tsx` | Recipe detail screen | PARTIAL | 517 lines; all sections present. Add to Plan bottom sheet exists but insert uses wrong column names (planned_date vs plan_date) |
| `app/(app)/recipe/add.tsx` | Manual recipe creation + AI import form | VERIFIED | 246 lines; RecipeForm rendered, AI URL import section with progress messages, createRecipe called on submit |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(app)/(tabs)/recipes.tsx` | `src/stores/recipeStore.ts` | `useRecipeStore` | WIRED | Imported and used: fetchRecipes, ratings |
| `src/stores/recipeStore.ts` | `supabase` | `supabase.from('recipes')` | WIRED | Present in fetchRecipes, createRecipe, updateRecipe, deleteRecipe, fetchRecipeDetail |
| `app/(app)/recipe/[id].tsx` | `src/stores/recipeStore.ts` | `useRecipeStore` | WIRED | fetchRecipeDetail, toggleFavorite, rateRecipe, addNote all imported and called |
| `app/(app)/(tabs)/plan.tsx` | `src/stores/planStore.ts` | `usePlanStore` | WIRED | weekOffset, mealPlan, loading, weekDays, weekLabel, setWeekOffset, fetchMealPlan all used |
| `src/stores/planStore.ts` | `src/lib/dates.ts` | `getWeekDays` | WIRED | getWeekDays and getWeekLabel imported at top of planStore.ts; used in weekDays() and weekLabel() computed |
| `src/lib/ai.ts` | `supabase/functions/parse-recipe-url` | `functions.invoke` | WIRED | `supabase.functions.invoke('parse-recipe-url', { body: { url } })` on line 11 |
| `src/stores/planStore.ts` | `supabase` | `supabase.from('meal_plans')` | WIRED | Present in fetchMealPlan, assignRecipe, clearDay |
| `app/(app)/(tabs)/grocery.tsx` | `src/stores/groceryStore.ts` | `useGroceryStore` | WIRED | summary, groupedItems, fetchGroceryList, generateGroceryList all imported and used |
| `app/(app)/(tabs)/grocery.tsx` | `src/hooks/useGrocerySync.ts` | `useGrocerySync` | WIRED | Called on line 43 with (activeHouseholdId, activeListId) |
| `src/hooks/useGrocerySync.ts` | `supabase` | `postgres_changes` | WIRED | Three .on('postgres_changes') calls for INSERT/UPDATE/DELETE on grocery_items |
| `src/stores/groceryStore.ts` | `src/lib/grocery-utils.ts` | `aggregateIngredients` | WIRED | aggregateIngredients, computeSummary, groupBySection all imported and called |
| `src/stores/groceryStore.ts` | `supabase` | `supabase.from('grocery_items')` | WIRED | Present in toggleItem, addManualItem, removeItem, generateGroceryList, fetchGroceryList |
| `app/(app)/recipe/[id].tsx` | `src/stores/planStore.ts` | `planStore.assignRecipe` | NOT WIRED | handleAddToPlan calls `supabase.from('meal_plans').insert()` directly with wrong schema (planned_date, meal_type). planStore is not imported in this file. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RECP-01 | 02-01 | Browse recipes in searchable 2-column grid with category filter chips | SATISFIED | RecipeGrid.tsx with FlashList, search Input, category chip ScrollView |
| RECP-02 | 02-01 | View recipe detail with hero image, metadata, rating, ingredients, instructions, notes | SATISFIED | recipe/[id].tsx all sections present and rendered |
| RECP-03 | 02-01 | Scale recipe portions (x1, x2, x3) with ingredient amounts updating | SATISFIED | scaleIngredients pure function; scale state in [id].tsx; scaledIngredients useMemo |
| RECP-04 | 02-01 | Rate recipes 1-5 stars | SATISFIED | rateRecipe in recipeStore.ts; star rating UI in [id].tsx |
| RECP-05 | 02-01 | Add notes to recipes | SATISFIED | addNote in recipeStore.ts; notes TextInput and list in [id].tsx |
| RECP-06 | 02-01 | Create recipe manually with all fields | SATISFIED | RecipeForm.tsx with all fields; recipe/add.tsx createRecipe call |
| RECP-07 | 02-02 | Import recipe from URL via AI parsing | SATISFIED | parseRecipeUrl in ai.ts; Edge Function; add.tsx handleImport with progress messages |
| RECP-08 | 02-01 | Favorite/heart recipes | SATISFIED | toggleFavorite in recipeStore.ts; heart button in [id].tsx with Haptics |
| RECP-09 | 02-01, 02-02 | Add recipe to meal plan from detail page | BLOCKED | Bottom sheet with day picker exists but insert uses wrong column names (planned_date vs plan_date); will fail silently at runtime |
| AI-01 | 02-02 | AI parses recipe URL and extracts structured data | SATISFIED | parse-recipe-url Edge Function with OpenAI gpt-4o-mini; ai.ts client helper |
| PLAN-01 | 02-02 | View weekly dinner calendar with 7 days | SATISFIED | plan.tsx renders 7 DayCards with recipe data from planStore.mealPlan |
| PLAN-02 | 02-02 | Navigate between weeks and jump to current week | SATISFIED | WeekHeader prev/next arrows; Today pill; setWeekOffset(0) on Today press |
| PLAN-03 | 02-02 | Tap day card to open bottom sheet for editing | SATISFIED | PlanEditSheet with recipe picker, cook assignment, notes |
| PLAN-04 | 02-02 | Clear a day's meal plan | SATISFIED | planStore.clearDay(); Clear button in PlanEditSheet |
| PLAN-05 | 02-02 | Empty day cards show dashed outline with + and Add Dinner | SATISFIED | DayCard.tsx empty state with dashed border, + icon, "Add Dinner" text |
| PLAN-06 | 02-02 | Surprise Me FAB with random dinner and shuffle | SATISFIED | SurpriseMe.tsx with shuffle; plan.tsx FAB |
| PLAN-07 | 02-02 | Add randomly suggested recipe to plan | SATISFIED | SurpriseMe calls planStore.assignRecipe() |
| GROC-01 | 02-03 | Generate grocery list from current week's meal plan | SATISFIED | generateGroceryList in groceryStore.ts; grocery.tsx extracts recipes from mealPlan |
| GROC-02 | 02-03 | Grocery items grouped by store section | SATISFIED | groupBySection in grocery-utils.ts; GrocerySection components in SECTION_ORDER |
| GROC-03 | 02-03 | Each item shows name, quantity/unit, estimated price | SATISFIED | GroceryItem.tsx renders all three fields |
| GROC-04 | 02-03 | Check off items with circular checkbox (green check, line-through, avatar) | SATISFIED | GroceryItem.tsx has all three visual states; groceryStore.toggleItem |
| GROC-05 | 02-03 | Checked items move to collapsed Completed section | SATISFIED | groupedItems() separates completed; GrocerySection collapsible + defaultCollapsed |
| GROC-06 | 02-03 | Summary bar with item count, total, checked count, progress bar | SATISFIED | GrocerySummary.tsx renders all four; computeSummary calculates values |
| GROC-07 | 02-03 | Manually add items to grocery list | SATISFIED | AddItemSheet.tsx; groceryStore.addManualItem with is_manual=true |
| GROC-08 | 02-03 | Real-time sync across household members via Supabase Realtime | SATISFIED | useGrocerySync handles INSERT/UPDATE/DELETE; Realtime publication in migration |

**Requirement orphan check:** All 25 requirement IDs declared across the three plans are accounted for. AI-02 is explicitly assigned to Phase 3 (not Phase 2) in REQUIREMENTS.md — confirmed not orphaned.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(app)/recipe/[id].tsx` | 103-113 | `planned_date` (wrong column name), `meal_type` field (nonexistent column), silent error swallow | Blocker | Add to Plan feature fails silently at runtime; RECP-09 not functional |
| `supabase/migrations/00004_create_meal_plans.sql` | 24, 28, 32, 36 | `is_household_member(household_id)` — missing second argument `auth.uid()` | Blocker | All meal_plans RLS policies throw SQL error; plan CRUD will fail for all users |

---

### Human Verification Required

#### 1. Recipe Library Visual and Interaction

**Test:** Launch the app, navigate to Recipes tab. Confirm the 2-column FlashList renders recipe cards with image/placeholder, time pill, and cost badge. Type in the search bar. Tap a category chip.
**Expected:** Grid rerenders filtered results in real time for both search and category. Tapping a card navigates to detail.
**Why human:** Visual layout, FlashList column rendering, and interactive filter state cannot be verified programmatically.

#### 2. Recipe Portion Scaler

**Test:** Open a recipe detail. Tap x2. Check ingredient amounts.
**Expected:** All ingredient amounts double. Tapping x3 triples from base (not from x2).
**Why human:** Requires rendering and interacting with the UI.

#### 3. Grocery List Real-Time Sync

**Test:** Open the app on two devices with the same household. Check off an item on one device.
**Expected:** The checked state appears on the second device within 1-2 seconds without a refresh.
**Why human:** Requires two live sessions and an active Supabase Realtime connection.

#### 4. AI Recipe URL Import End-to-End

**Test:** Configure `OPENAI_API_KEY` Edge Function secret. Navigate to Add Recipe. Paste a public recipe URL. Tap Import.
**Expected:** Progress messages cycle, then recipe form fields populate with extracted data.
**Why human:** Requires deployed Edge Function with configured API key and live OpenAI service.

---

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — RECP-09 (Add Recipe to Plan from Detail): Schema mismatch in recipe/[id].tsx**

The `handleAddToPlan` function in `app/(app)/recipe/[id].tsx` (lines 99-113) inserts into `meal_plans` using column names that do not exist in the migration:

- It uses `planned_date` but the table defines `plan_date`
- It includes `meal_type: 'dinner'` but no `meal_type` column exists

The error is silently swallowed in the catch block with a comment "Silently handle - meal_plans table may not exist yet", masking the failure. Additionally, the function bypasses `planStore.assignRecipe()` entirely, so the in-memory Map state is never updated — even if the column names were fixed, the plan screen would not reflect the added entry until a reload.

Fix: Replace the raw supabase insert with `planStore.assignRecipe(activeHouseholdId, planDate, recipe.id)` and surface errors to the user.

**Gap 2 — Meal Plans RLS: Wrong function arity**

Migration `00004_create_meal_plans.sql` calls `is_household_member(household_id)` with one argument in all four RLS policies (SELECT, INSERT, UPDATE, DELETE). The function defined in migration `00002` requires two arguments: `is_household_member(p_household_id UUID, p_user_id UUID)`. Migrations `00003` and `00005` both call it correctly with `is_household_member(household_id, auth.uid())`.

This means all meal plan operations (fetching, assigning, clearing) will fail with a PostgreSQL function call error once RLS is evaluated against real data. PlanStore's week navigation and Surprise Me features will appear to work in the UI but return no data or fail silently.

Fix: Update all four RLS policies in `00004_create_meal_plans.sql` to `USING (is_household_member(household_id, auth.uid()))`.

---

_Verified: 2026-03-23T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
