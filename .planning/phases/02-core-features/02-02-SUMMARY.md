---
phase: 02-core-features
plan: 02
subsystem: database, ui, ai
tags: [supabase, zustand, react-native, date-fns, openai, edge-functions, meal-planning, calendar]

requires:
  - phase: 01-foundation
    provides: "Supabase client, auth, household store, UI components (Card, BottomSheet, Button, Skeleton), theme tokens"
  - phase: 02-core-features
    provides: "Recipe store, Recipe types (Recipe, RecipeInsert, Ingredient, InstructionStep), RecipeForm component"
provides:
  - "meal_plans table with RLS"
  - "MealPlan, MealPlanWithRecipe TypeScript types"
  - "planStore with fetchMealPlan, assignRecipe, clearDay, getRandomSuggestion, week navigation"
  - "dates.ts helpers (getWeekDays, toDateString, formatDayLabel, getWeekLabel)"
  - "ai.ts parseRecipeUrl helper wrapping Edge Function"
  - "parse-recipe-url Edge Function (OpenAI gpt-4o-mini)"
  - "Weekly calendar screen with DayCard, WeekHeader, PlanEditSheet, SurpriseMe"
  - "AI recipe URL import on recipe creation form"
affects: [grocery-lists, real-time-sync, cook-mode]

tech-stack:
  added: []
  patterns: [Edge Function for AI recipe parsing, Map-based meal plan state keyed by date string, week offset navigation pattern]

key-files:
  created:
    - supabase/migrations/00004_create_meal_plans.sql
    - src/lib/dates.ts
    - src/lib/ai.ts
    - src/stores/planStore.ts
    - supabase/functions/parse-recipe-url/index.ts
    - src/components/plan/WeekHeader.tsx
    - src/components/plan/DayCard.tsx
    - src/components/plan/PlanEditSheet.tsx
    - src/components/plan/SurpriseMe.tsx
    - tests/lib/dates.test.ts
    - tests/lib/ai.test.ts
    - tests/stores/planStore.test.ts
  modified:
    - src/types/database.ts
    - app/(app)/(tabs)/plan.tsx
    - app/(app)/recipe/add.tsx
    - src/components/recipes/RecipeForm.tsx
    - tests/setup.tsx

key-decisions:
  - "Map<string, MealPlanWithRecipe> keyed by date string for O(1) lookup in day cards"
  - "OpenAI gpt-4o-mini with JSON mode for structured recipe extraction from HTML"
  - "RecipeForm initialData prop with useEffect sync for AI-populated form fields"
  - "Surprise Me uses local recipe array shuffle rather than database random query"

patterns-established:
  - "Week offset navigation: weekOffset state in store, getWeekDays(offset) for date computation"
  - "Edge Function pattern: Deno.serve with CORS, OpenAI JSON mode, error handling tiers"
  - "AI import UX: progress message rotation during async operation"

requirements-completed: [AI-01, RECP-07, PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, RECP-09]

duration: 6min
completed: 2026-03-23
---

# Phase 2 Plan 2: Meal Planning & AI Import Summary

**Weekly dinner calendar with 7-day navigation, day editing via bottom sheet, random dinner suggestions with alternatives, and AI recipe URL import via OpenAI Edge Function**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T19:31:04Z
- **Completed:** 2026-03-23T19:37:00Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Meal plan data layer: Supabase migration (meal_plans table with RLS), planStore with full CRUD and week navigation
- Date utility library with Monday-start week computation, date formatting, and week range labels
- AI recipe import: Edge Function using OpenAI gpt-4o-mini to extract structured recipe data from any URL
- Weekly calendar screen with filled/empty day cards, edit bottom sheet, Surprise Me FAB with random suggestions
- Recipe add form enhanced with URL import section and progress messaging

## Task Commits

Each task was committed atomically:

1. **Task 1: Meal plan schema, date helpers, AI import, plan store with tests** (TDD)
   - `234587a` (test: add failing tests) - RED
   - `f9ebb15` (feat: meal plan schema, date helpers, AI import, plan store) - GREEN
2. **Task 2: Calendar screen, day editing, surprise me, AI import UI** - `5c85d46` (feat: meal planning calendar, day editing, surprise me, AI import UI)

## Files Created/Modified
- `supabase/migrations/00004_create_meal_plans.sql` - meal_plans table with RLS using is_household_member()
- `src/types/database.ts` - Added MealPlan, MealPlanInsert, MealPlanUpdate, MealPlanWithRecipe types
- `src/lib/dates.ts` - getWeekDays, toDateString, formatDayLabel, getWeekLabel helpers
- `src/lib/ai.ts` - parseRecipeUrl wrapping Edge Function invoke with validation
- `src/stores/planStore.ts` - Zustand store with Map-based meal plan, week navigation, CRUD
- `supabase/functions/parse-recipe-url/index.ts` - Deno Edge Function with OpenAI gpt-4o-mini
- `src/components/plan/WeekHeader.tsx` - Week label with prev/next arrows and Today pill
- `src/components/plan/DayCard.tsx` - Filled (recipe info) and empty (dashed + Add Dinner) states
- `src/components/plan/PlanEditSheet.tsx` - Bottom sheet with recipe picker, cook assignment, notes
- `src/components/plan/SurpriseMe.tsx` - Modal with random recipe card, shuffle, 3 alternatives
- `app/(app)/(tabs)/plan.tsx` - Full calendar screen replacing placeholder
- `app/(app)/recipe/add.tsx` - Added AI URL import section with progress messages
- `src/components/recipes/RecipeForm.tsx` - Added initialData prop for AI-populated fields
- `tests/lib/dates.test.ts` - 10 tests for date helpers
- `tests/lib/ai.test.ts` - 4 tests for AI import
- `tests/stores/planStore.test.ts` - 8 tests for plan store
- `tests/setup.tsx` - Added gte, lte, match, functions.invoke mocks

## Decisions Made
- Map<string, MealPlanWithRecipe> keyed by date string: O(1) day card lookup vs array filter
- OpenAI gpt-4o-mini with JSON mode: cost-effective structured extraction, temperature 0.1 for consistency
- RecipeForm initialData with useEffect sync: allows AI import to populate form reactively
- Surprise Me uses local recipe shuffle: avoids additional database query, works with existing recipe data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added initialData prop to RecipeForm**
- **Found during:** Task 2 (AI import UI)
- **Issue:** RecipeForm had no way to accept pre-populated data from AI import
- **Fix:** Added initialData prop with useEffect to sync form state when import data arrives
- **Files modified:** src/components/recipes/RecipeForm.tsx
- **Verification:** All 106 tests pass
- **Committed in:** 5c85d46 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for AI import to work end-to-end. No scope creep.

## Issues Encountered
None

## User Setup Required
- OpenAI API key required for Edge Function (`supabase secrets set OPENAI_API_KEY=sk-...`)
- See plan frontmatter user_setup section for details

## Next Phase Readiness
- Meal plan data layer complete, ready for grocery list generation (Plan 3)
- planStore.weekDays() and mealPlan Map available for grocery aggregation
- AI recipe import ready for production once OpenAI key is configured

## Self-Check: PASSED

All 12 created files verified present. All 3 task commits verified in git log (234587a, f9ebb15, 5c85d46).

---
*Phase: 02-core-features*
*Completed: 2026-03-23*
