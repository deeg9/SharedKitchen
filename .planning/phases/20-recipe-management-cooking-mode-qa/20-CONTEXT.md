# Phase 20: Recipe Management & Cooking Mode QA - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Validate that recipe creation (manual), URL import (JSON-LD extraction), recipe editing, and fullscreen cooking mode (step navigation, timers, unit toggle, ingredient sidebar, done cooking) all function correctly.

</domain>

<decisions>
## Implementation Decisions

### Testing Methodology
- Run existing Jest tests (CookingMode.test.tsx) and verify passing
- Write new unit tests for cooking timer, unit conversion, and step navigation
- Write Maestro E2E flows for manual recipe creation, cooking mode entry and navigation
- Fix bugs found inline

### Claude's Discretion
All implementation choices are at Claude's discretion — autonomous mode.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/components/CookingMode.test.tsx` — 3 existing cooking mode tests
- `.maestro/recipe-create-manual.yaml` — existing manual recipe creation flow (appId: com.mise.app, needs update)
- `.maestro/recipe-import-url.yaml` — existing URL import flow (appId: com.mise.app, needs update)
- `src/lib/unit-conversion.ts` — metric/imperial conversion
- `src/lib/timer.ts` — useCountdown hook
- `src/components/cooking/` — CookingMode, StepCard, CookingTimer, CookingProgress, UnitToggle, IngredientSidebar

### Integration Points
- `app/(app)/recipe/add.tsx` — add recipe screen
- `app/(app)/recipe/edit/[id].tsx` — edit recipe screen
- `app/(app)/recipe/cook/[id].tsx` — cooking mode screen
- `app/(app)/recipe/[id].tsx` — recipe detail (Start Cooking button)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard QA testing approach.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
