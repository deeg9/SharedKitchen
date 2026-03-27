# Phase 21: Planning, Grocery, Budget & Leftovers QA - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Validate meal planning (add recipe to plan, day picker, plan tab display), grocery list (populate from plans, check off, sync), budget tracking (tab loads, cost display), and leftovers (screen loads, freshness badges).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — autonomous mode. Use ROADMAP success criteria and codebase conventions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/stores/planStore.test.ts` — existing plan store tests
- `tests/stores/groceryStore.test.ts` — existing grocery store tests
- `tests/stores/budgetStore.test.ts` — existing budget store tests
- `tests/stores/leftoverStore.test.ts` — existing leftover store tests
- `.maestro/meal-plan-add-edit.yaml`, `meal-plan-clear.yaml`, `meal-plan-surprise-me.yaml` — meal plan E2E
- `.maestro/grocery-generate.yaml`, `grocery-check-off.yaml`, `grocery-manual-add.yaml` — grocery E2E
- All Maestro flows need appId update from com.mise.app to com.sharedkitchen.app

### Integration Points
- `app/(app)/(tabs)/plan.tsx` — Plan tab
- `app/(app)/(tabs)/grocery.tsx` — Grocery tab
- `app/(app)/(tabs)/budget.tsx` — Budget tab
- `app/(app)/leftovers.tsx` — Leftovers screen

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard QA testing approach.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
