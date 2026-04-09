# Phase 38: Recipe Nutrition - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see accurate nutrition information on every recipe and across their weekly meal plan, powered by AI-assisted ingredient matching. This phase delivers: a `match-ingredients` Edge Function using Gemini 2.5 Flash for ingredient-to-food matching, a `computed_nutrition` column on recipes, a NutritionCard component with horizontal bar chart, a "Calculate Nutrition" trigger on recipe detail, and daily/weekly nutrition totals on the Plan tab.

</domain>

<decisions>
## Implementation Decisions

### AI Ingredient Matching
- New `match-ingredients` Edge Function using Gemini 2.5 Flash to map ingredient text → food_items IDs
- Auto-accept matches above 80% confidence, show "Confirm match" UI for low-confidence matches
- On-demand trigger: user taps "Calculate Nutrition" button on recipe detail — avoids AI costs for unviewed recipes
- Cache matched food_ids on recipe ingredients in Supabase — don't re-match on every view

### Nutrition Computation & Display
- New `computed_nutrition` JSONB column on recipes table — stores NutritionData after first computation
- NutritionCard component with horizontal bar chart showing calories + protein, carbs, fat per serving
- Card placed below recipe ingredients, above cooking steps on recipe detail screen
- Display "Per serving (1 of N)" with servings from recipe.servings

### Plan Tab Nutrition Totals
- Daily totals shown at bottom of each day card: "Today: 1,850 cal · 95g protein · 180g carbs · 65g fat"
- Partial totals with "(2 of 3 meals)" indicator when some recipes lack nutrition data
- Weekly sum row at bottom of week view: "This week: ~12,500 cal"
- Reactive: recompute totals when plan changes (meal added/removed) via planStore

### Claude's Discretion
- Gemini prompt design for ingredient matching (few-shot examples, output schema)
- Low-confidence match UI component design
- Migration for computed_nutrition column
- How to handle recipe scaling effect on nutrition display
- Error states for AI matching failures

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/food.ts` — FoodItem, NutritionData, ServingSize types (Phase 35)
- `src/lib/nutrition-utils.ts` — scaleNutrition, sumNutrition, formatNutrition (Phase 35)
- `supabase/functions/analyze-food-photo/index.ts` — Gemini 2.5 Flash Edge Function pattern
- `src/stores/recipeStore.ts` — recipe CRUD, scaling
- `src/stores/planStore.ts` — weekly meal plan data
- `src/components/food/NutritionDetail.tsx` — Phase 36 nutrition display (can reference)
- `supabase/migrations/00022_create_food_tables.sql` — food_items table (Phase 35)

### Established Patterns
- Gemini Edge Functions: auth, base64 input, structured JSON output, rate limiting
- Recipe detail screen: ingredients section, steps section, scaling controls
- Plan tab: day cards with meal slots, week view toggle

### Integration Points
- Recipe detail screen: add NutritionCard below ingredients + "Calculate Nutrition" button
- Plan tab day cards: add daily nutrition summary row
- Plan tab week view: add weekly total row
- recipeStore: add computeNutrition() action
- planStore: add getDayNutrition() and getWeekNutrition() computed getters
- New migration: add computed_nutrition column to recipes

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the accepted grey area decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
