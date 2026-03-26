---
phase: 09-e2e-testing
plan: 01
subsystem: testing
tags: [maestro, e2e, testID, react-native, yaml]

# Dependency graph
requires:
  - phase: 04-onboarding
    provides: onboarding wizard flow components
  - phase: 01-foundation
    provides: auth screens, tab navigation
provides:
  - testID props on all interactive elements (74 total across 42 files)
  - .maestro/ directory with config and 4 E2E flow definitions
  - reusable Button and Input components accept testID pass-through
affects: [09-e2e-testing]

# Tech tracking
tech-stack:
  added: [maestro]
  patterns: [testID naming convention: screen-element-qualifier]

key-files:
  created:
    - .maestro/config.yaml
    - .maestro/auth-signup.yaml
    - .maestro/auth-login.yaml
    - .maestro/auth-logout.yaml
    - .maestro/onboarding-flow.yaml
  modified:
    - app/(auth)/sign-in.tsx
    - app/(auth)/sign-up.tsx
    - src/components/onboarding/WelcomeStep.tsx
    - src/components/onboarding/CreateHouseholdStep.tsx
    - src/components/onboarding/InviteMembersStep.tsx
    - src/components/onboarding/AddRecipesStep.tsx
    - src/components/onboarding/PlanWeekStep.tsx
    - src/components/onboarding/AllSetStep.tsx
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/TabBar.tsx
    - app/(app)/(tabs)/profile.tsx
    - app/(app)/(tabs)/recipes.tsx
    - app/(app)/(tabs)/plan.tsx
    - app/(app)/(tabs)/grocery.tsx
    - app/(app)/(tabs)/budget.tsx
    - app/(app)/recipe/[id].tsx
    - app/(app)/recipe/add.tsx
    - app/(app)/subscription.tsx
    - app/(app)/leftovers.tsx
    - src/components/plan/DayCard.tsx
    - src/components/plan/PlanEditSheet.tsx
    - src/components/plan/SurpriseMe.tsx
    - src/components/plan/WeekHeader.tsx
    - src/components/recipes/RecipeCard.tsx
    - src/components/recipes/RecipeForm.tsx
    - src/components/recipes/RecipeGrid.tsx
    - src/components/recipes/MealGeneratorSheet.tsx
    - src/components/premium/SubscriptionSheet.tsx
    - src/components/premium/UpgradePrompt.tsx
    - src/components/cooking/CookingMode.tsx
    - src/components/cooking/CookingTimer.tsx
    - src/components/budget/AddExpenseSheet.tsx
    - src/components/leftovers/AddLeftoverSheet.tsx

key-decisions:
  - "testID naming convention: {screen}-{element}-{qualifier} for consistent Maestro selectors"
  - "Custom TabBar passes testID via route.name fallback instead of tabBarTestID option (expo-router Tabs type limitation)"
  - "Signup flow includes confirm-password field matching actual sign-up screen implementation"

patterns-established:
  - "testID naming: {screen}-{element}-{qualifier} e.g. sign-in-email-input"
  - "Maestro flows use id: selectors for interactive elements, text assertions for screen identification"
  - "UI components (Button, Input) accept optional testID prop and pass through to underlying native element"

requirements-completed: [TEST-01]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 09 Plan 01: E2E Testing Foundation Summary

**74 testID props across 42 app components with Maestro config and 4 auth/onboarding E2E flow YAML definitions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T00:40:39Z
- **Completed:** 2026-03-26T00:49:00Z
- **Tasks:** 2
- **Files modified:** 38

## Accomplishments
- Added testID props to every interactive element across all screens and components (74 total)
- Created .maestro/ directory with project config pointing to com.mise.app bundle ID
- Built 4 E2E flow definitions: signup, login, logout, and full onboarding wizard
- Made Button and Input UI components accept and pass through optional testID props
- Custom TabBar automatically assigns testIDs to tab items (plan-tab, recipes-tab, etc.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add testID props to all interactive elements** - `0016909` (feat)
2. **Task 2: Create Maestro config and auth/onboarding E2E flows** - `a6088f9` (feat)

## Files Created/Modified
- `.maestro/config.yaml` - Maestro project config with appId
- `.maestro/auth-signup.yaml` - Signup E2E flow with clearState, unique email, confirm password
- `.maestro/auth-login.yaml` - Login E2E flow with clearState
- `.maestro/auth-logout.yaml` - Logout flow via profile tab scroll
- `.maestro/onboarding-flow.yaml` - Full 6-step onboarding wizard from signup through all-set
- `app/(auth)/sign-in.tsx` - testID on email, password, submit, Google, signup link
- `app/(auth)/sign-up.tsx` - testID on email, password, confirm, submit, signin link
- `src/components/onboarding/*.tsx` - testID on continue, skip, input, done buttons
- `src/components/ui/Button.tsx` - Accept and pass through optional testID prop
- `src/components/ui/Input.tsx` - Accept and pass through optional testID prop
- `src/components/ui/TabBar.tsx` - Auto-assign testID from route name to tab items
- 25+ additional screen and component files with testID additions

## Decisions Made
- Used `{screen}-{element}-{qualifier}` naming convention for testIDs for readable Maestro selectors
- Custom TabBar uses `${route.name}-tab` fallback instead of `tabBarTestID` option since expo-router Tabs type does not support that property
- Signup flow includes confirm-password step since the actual sign-up screen has a confirm password field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed tabBarTestID from Tabs.Screen options**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** expo-router Tabs component types do not include tabBarTestID property, causing 5 TS errors
- **Fix:** Reverted _layout.tsx to original, relied on custom TabBar.tsx to auto-assign testID from route.name
- **Files modified:** app/(app)/(tabs)/_layout.tsx, src/components/ui/TabBar.tsx
- **Verification:** TypeScript compilation passes with no new errors
- **Committed in:** 0016909 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Tab testIDs still work correctly via TabBar component. No scope creep.

## Issues Encountered
None beyond the tabBarTestID type issue noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All interactive elements have testID props ready for Maestro selectors
- Auth and onboarding flows are ready to run on an EAS dev build simulator
- Plans 09-02 and 09-03 can reference these testIDs for additional feature E2E flows

## Known Stubs
None - all testID props are wired to real interactive elements.

---
*Phase: 09-e2e-testing*
*Completed: 2026-03-26*
