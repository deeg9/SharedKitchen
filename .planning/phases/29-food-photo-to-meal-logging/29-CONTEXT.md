# Phase 29: Food Photo to Meal Logging - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Adds "Log as Meal" path after dish identification. Users photograph food, AI identifies the dish (reusing Phase 28's identify flow), then choose between "Find Recipes" or "Log as Meal". Logging adds the dish name to a specific day/meal slot on the weekly plan. Builds on Phase 26 vision infrastructure and Phase 28 DishIdentifiedSheet.

</domain>

<decisions>
## Implementation Decisions

### Meal Logging Flow
- "Log as Meal" button on DishIdentifiedSheet alongside "Find Recipes" — two action buttons side by side below the dish name
- Day/slot picker as bottom sheet with day picker (today + next 6 days) and meal slot buttons (Breakfast/Lunch/Dinner) — matches existing meal plan edit pattern
- Save dish name as meal title with no recipe_id (recipe-less meal) on selected day/slot — uses existing `planStore.assignRecipe()` or equivalent with null recipe_id
- Success feedback: toast "Added [dish] to [Day] [Slot]" + dismiss all sheets

### Claude's Discretion
- Exact visual layout of the dual-action buttons on DishIdentifiedSheet
- Day picker visual design (list vs horizontal scroll)
- Whether to show the food photo thumbnail on the meal slot picker
- How to handle if a meal already exists on the selected day/slot (overwrite vs confirm)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/recipe-discovery/DishIdentifiedSheet.tsx` — Phase 28, needs "Log as Meal" button added
- `src/stores/planStore.ts` — `assignRecipe()` for adding meals to plan
- `src/types/database.ts` — MealPlan type
- Existing day/meal slot pickers in meal plan edit flows

### Established Patterns
- Bottom sheet for pickers (day, meal slot)
- planStore with optimistic updates
- Toast notifications for success feedback

### Integration Points
- `DishIdentifiedSheet.tsx` — add "Log as Meal" button callback
- `app/(app)/(tabs)/grocery.tsx` — handle "Log as Meal" action from dish identification
- `src/stores/planStore.ts` — may need method for adding recipe-less meal by name

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond grey area decisions.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
