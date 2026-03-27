# Phase 19: Recipe Browsing & Detail QA - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Validate that recipe list browsing, search, filtering, and all recipe detail interactions (rating, favorites, notes, scaling, ingredient checklist) work correctly. Run existing tests, write new tests for gaps, verify on simulator with Maestro E2E flows.

</domain>

<decisions>
## Implementation Decisions

### Testing Methodology
- Run existing Jest unit tests (recipeStore.test.ts, CookingMode.test.tsx) and verify they pass
- Write new Maestro E2E flows for recipe list search/filter, recipe detail interactions
- Fix any bugs found inline

### Claude's Discretion
All implementation choices are at Claude's discretion — autonomous mode. Use ROADMAP phase goal, success criteria, and codebase conventions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/stores/recipeStore.test.ts` — existing recipe store tests
- `tests/components/CookingMode.test.tsx` — cooking mode tests
- `.maestro/recipe-create-manual.yaml` — manual recipe creation E2E
- `.maestro/recipe-import-url.yaml` — URL import E2E
- `.maestro/recipe-detail-view.yaml` — recipe detail view E2E
- Maestro installed at `$HOME/.maestro/bin/maestro` (requires JAVA_HOME=/tmp/jdk-21.0.5+11/Contents/Home)

### Established Patterns
- Jest with @testing-library/react-native
- Maestro YAML flows with `appId: com.sharedkitchen.app`
- Use `text: ".*pattern.*"` for text with icon characters
- Use `id:` for testID-based element selection
- App is running on iPhone 17 Pro simulator

### Integration Points
- `src/stores/recipeStore.ts` — recipe state management with filteredRecipes()
- `app/(app)/(tabs)/recipes.tsx` — recipe list screen with FilterBar
- `app/(app)/recipe/[id].tsx` — recipe detail with rating, favorites, notes, scaling
- `src/components/ui/FilterBar.tsx` — category/cost/time filter dropdowns

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard QA testing approach.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
