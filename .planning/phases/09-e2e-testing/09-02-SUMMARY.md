---
phase: 09-e2e-testing
plan: 02
subsystem: testing
tags: [maestro, e2e, yaml, recipe, meal-plan, react-native]

# Dependency graph
requires:
  - phase: 09-e2e-testing
    provides: testID props on all interactive elements, .maestro/ config
provides:
  - 6 Maestro E2E flow YAML files covering recipe and meal planning workflows
  - recipe-create-manual.yaml for manual recipe form fill
  - recipe-import-url.yaml for AI-powered URL import
  - recipe-detail-view.yaml for detail page interactions
  - meal-plan-add-edit.yaml for adding and editing meals
  - meal-plan-clear.yaml for clearing a day's meal
  - meal-plan-surprise-me.yaml for random suggestion acceptance
affects: [09-e2e-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [Maestro text-based selectors for elements without testID, extendedWaitUntil for async operations]

key-files:
  created:
    - .maestro/recipe-create-manual.yaml
    - .maestro/recipe-import-url.yaml
    - .maestro/recipe-detail-view.yaml
    - .maestro/meal-plan-add-edit.yaml
    - .maestro/meal-plan-clear.yaml
    - .maestro/meal-plan-surprise-me.yaml
  modified: []

key-decisions:
  - "Text-based selectors used for elements without testID (Add Dinner, Clear Meal, Add to Plan in SurpriseMe)"
  - "30s timeout for AI URL import to accommodate Edge Function + OpenAI network round-trip"
  - "Meal plan flows use text selectors for meal slot interaction since DayCard testIDs are weekday-based not index-based"

patterns-established:
  - "Maestro flows assume logged-in state (no clearState) for feature E2E tests"
  - "extendedWaitUntil with generous timeouts for async network operations"
  - "scrollUntilVisible for off-screen form elements and action buttons"

requirements-completed: [TEST-02, TEST-03]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 09 Plan 02: Recipe & Meal Plan E2E Flows Summary

**6 Maestro E2E flows covering manual recipe creation, AI URL import, recipe detail interactions, meal plan add/edit/clear, and Surprise Me acceptance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T00:51:31Z
- **Completed:** 2026-03-26T00:55:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created 3 recipe management E2E flows: manual creation with full form fill, AI URL import with 30s timeout, and detail view with favorite/cook/add-to-plan interactions
- Created 3 meal planning E2E flows: add/edit meal with recipe selection, clear meal from day, and Surprise Me with shuffle and accept
- All flows use testID selectors from Plan 01 where available, with text-based fallbacks for elements lacking testIDs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Maestro flows for recipe management** - `e686c30` (feat)
2. **Task 2: Create Maestro flows for meal planning** - `facd5ff` (feat)

## Files Created/Modified
- `.maestro/recipe-create-manual.yaml` - Manual recipe creation: name, category, 2 ingredients, 2 instructions, save
- `.maestro/recipe-import-url.yaml` - AI URL import with allrecipes.com test URL and 30s timeout
- `.maestro/recipe-detail-view.yaml` - Detail view: favorite toggle, cook mode entry, add-to-plan day picker
- `.maestro/meal-plan-add-edit.yaml` - Add dinner to day, then edit by searching and selecting different recipe
- `.maestro/meal-plan-clear.yaml` - Open filled meal slot, tap Clear Meal, verify empty state returns
- `.maestro/meal-plan-surprise-me.yaml` - Tap Surprise Me FAB, shuffle, accept suggestion via Add to Plan

## Decisions Made
- Used text-based selectors ("Add Dinner", "Clear Meal", "Add to Plan") for SurpriseMe and PlanEditSheet buttons that lack testID props
- Set 30-second timeout for AI URL import to handle Edge Function + OpenAI network latency
- Meal plan flows interact via meal slot text ("Dinner", "Add Dinner") since DayCard testIDs are weekday-based (plan-day-Mon) rather than index-based

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all flows reference real testID props and text selectors from implemented components.

## Next Phase Readiness
- All 6 recipe and meal plan E2E flows ready to run on EAS dev build simulator
- Plan 09-03 can build on these flows for grocery, budget, and premium feature E2E tests
- Some components (SurpriseMe "Add to Plan" button, PlanEditSheet "Clear Meal" button) could benefit from testID additions in a future pass

## Self-Check: PASSED

All 6 flow files verified on disk. Both task commits (e686c30, facd5ff) confirmed in git log.

---
*Phase: 09-e2e-testing*
*Completed: 2026-03-26*
