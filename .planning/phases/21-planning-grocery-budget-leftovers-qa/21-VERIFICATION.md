---
phase: 21-planning-grocery-budget-leftovers-qa
verified: 2026-03-27T23:30:00Z
status: gaps_found
score: 6/8 must-haves verified
gaps:
  - truth: "planStore assignRecipe auto-creates expense for takeout/eating-out meals via budgetStore"
    status: failed
    reason: "Test was skipped. SUMMARY incorrectly claimed the feature does not exist in planStore.ts. The actual code at lines 163-175 does include mealSource/mealCost parameters and calls useBudgetStore.getState().addExpense() for takeout/eating-out meals. No test exercises this code path."
    artifacts:
      - path: "tests/stores/planStore.test.ts"
        issue: "Missing test case for assignRecipe with mealSource='takeout' and mealCost — zero references to 'takeout', 'mealSource', or 'addExpense'"
    missing:
      - "Test case: assignRecipe('h-1', date, 'dinner', 'r-1', 'u-1', undefined, 'takeout', 15.99) asserts useBudgetStore.getState().addExpense was called with amount 15.99 and category 'Takeout'"
  - truth: "All 6 Maestro flows use appId com.sharedkitchen.app instead of com.mise.app"
    status: failed
    reason: "Commit 22541aa made the appId changes but landed only on branch worktree-agent-ac6667d3. The main branch still has com.mise.app in all 6 files. The changes were never merged to main."
    artifacts:
      - path: ".maestro/meal-plan-add-edit.yaml"
        issue: "appId is com.mise.app on main branch"
      - path: ".maestro/meal-plan-clear.yaml"
        issue: "appId is com.mise.app on main branch"
      - path: ".maestro/meal-plan-surprise-me.yaml"
        issue: "appId is com.mise.app on main branch"
      - path: ".maestro/grocery-generate.yaml"
        issue: "appId is com.mise.app on main branch"
      - path: ".maestro/grocery-check-off.yaml"
        issue: "appId is com.mise.app on main branch"
      - path: ".maestro/grocery-manual-add.yaml"
        issue: "appId is com.mise.app on main branch"
    missing:
      - "Merge worktree-agent-ac6667d3 changes into main (or cherry-pick commit 22541aa onto main)"
human_verification:
  - test: "Manually run Maestro flows against iOS simulator after appId is fixed on main"
    expected: "All 6 flows launch the app and complete their UI interaction scenarios"
    why_human: "Maestro flows require a running iOS simulator with the app installed — cannot verify E2E flows programmatically"
  - test: "Navigate to Plan tab, assign a recipe to a day, verify it appears on the correct day"
    expected: "Assigned meal is visible under the correct day card in the Plan tab"
    why_human: "Visual UI verification of mealPlan Map rendering requires running app"
  - test: "Generate grocery list from planned meals, check off an item on one device, verify it updates on another"
    expected: "Real-time sync propagates checked state to second household member's view"
    why_human: "Real-time sync requires two active sessions against live Supabase"
---

# Phase 21: Planning, Grocery, Budget & Leftovers QA — Verification Report

**Phase Goal:** Meal planning, grocery list generation and sync, budget tracking, and leftover management all work correctly
**Verified:** 2026-03-27T23:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria + Plan must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | planStore assignRecipe populates mealPlan Map so assigned meal appears on correct day | VERIFIED | Test at line 131 seeds upsert mock, calls assignRecipe, asserts mealPlan.size === 1 and entry.plan_date === '2026-03-23'. Passes. |
| 2 | planStore fetchMealPlan sets error state on supabase failure | VERIFIED | Test at line 85 mocks .lte() returning error, asserts state.error is truthy and loading is false. Passes. |
| 3 | planStore assignRecipe auto-creates expense for takeout/eating-out meals via budgetStore | FAILED | Test was explicitly skipped. SUMMARY falsely claimed the feature doesn't exist. src/stores/planStore.ts lines 163-175 confirm the code is present: mealSource/mealCost parameters, budgetStore.addExpense call. Zero test references to 'takeout', 'mealSource', or 'addExpense' in planStore.test.ts. |
| 4 | groceryStore generateGroceryList creates list and populates items from recipe ingredients | VERIFIED | Test at line 153 mocks full create path (PGRST116 fallback, insert, item fetch), asserts items.length === 1 and activeListId === 'list-new'. Passes. |
| 5 | groceryStore removeItem optimistically removes and reverts on error | VERIFIED | Two tests at lines 241 and 260 cover success path (item removed) and failure path (item reverted, error set). Both pass. |
| 6 | groceryStore realtime helpers (_addItem, _updateItem, _removeItem) modify local state for sync | VERIFIED | Four tests at lines 280-315 cover _addItem, _addItem dedup, _updateItem, _removeItem. All pass. |
| 7 | All 6 Maestro flows use appId com.sharedkitchen.app instead of com.mise.app | FAILED | Commit 22541aa contains the fix but landed on branch worktree-agent-ac6667d3 only. All 6 files on main still contain appId: com.mise.app. Confirmed by reading all 6 files directly from main working tree. |
| 8 | meal-plan-add-edit flow validates adding a recipe to a day and editing it | UNCERTAIN | File exists and has correct content (steps, assertions) but appId is wrong (com.mise.app on main). Cannot execute. |

**Score:** 6/8 truths verified

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/stores/planStore.test.ts` | Expanded plan store tests covering error paths and meal Map population | VERIFIED | File exists, 247 lines, contains 'mealPlan' 7 times, 12 test cases total (8 pre-existing + 4 new). Imports usePlanStore.getState() pattern confirmed. |
| `tests/stores/groceryStore.test.ts` | Expanded grocery store tests covering generateGroceryList, removeItem, realtime helpers | VERIFIED | File exists, 336 lines, 'generateGroceryList' appears 4 times, 12 test cases total (4 pre-existing + 8 new). Imports useGroceryStore.getState() pattern confirmed. |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.maestro/meal-plan-add-edit.yaml` | Meal plan add/edit E2E flow with com.sharedkitchen.app | STUB | File exists with correct content but appId: com.mise.app on main |
| `.maestro/meal-plan-clear.yaml` | Meal plan clear E2E flow with com.sharedkitchen.app | STUB | appId: com.mise.app on main |
| `.maestro/meal-plan-surprise-me.yaml` | Meal plan surprise-me E2E flow with com.sharedkitchen.app | STUB | appId: com.mise.app on main |
| `.maestro/grocery-generate.yaml` | Grocery list generation E2E flow with com.sharedkitchen.app | STUB | appId: com.mise.app on main |
| `.maestro/grocery-check-off.yaml` | Grocery check-off E2E flow with com.sharedkitchen.app | STUB | appId: com.mise.app on main |
| `.maestro/grocery-manual-add.yaml` | Grocery manual add E2E flow with com.sharedkitchen.app | STUB | appId: com.mise.app on main |

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tests/stores/planStore.test.ts` | `src/stores/planStore.ts` | `usePlanStore.getState()` | WIRED | Pattern found 8 times in test file. Imports from '../../src/stores/planStore'. |
| `tests/stores/groceryStore.test.ts` | `src/stores/groceryStore.ts` | `useGroceryStore.getState()` | WIRED | Pattern found 12+ times. Imports from '../../src/stores/groceryStore'. |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.maestro/meal-plan-add-edit.yaml` | `app/(app)/(tabs)/plan.tsx` | `id: "plan-tab"` | BROKEN | Maestro references testID 'plan-tab' but no testID with that value found anywhere in app/ source. Additionally, appId is wrong on main. |
| `.maestro/grocery-generate.yaml` | `app/(app)/(tabs)/grocery.tsx` | `id: "grocery-tab"` | BROKEN | Maestro references testID 'grocery-tab' but no testID with that value found anywhere in app/ source. Additionally, appId is wrong on main. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| planStore tests pass (12 tests) | `npx jest tests/stores/planStore.test.ts --no-coverage` | PASS tests/stores/planStore.test.ts — 12 passed | PASS |
| groceryStore tests pass (12 tests) | `npx jest tests/stores/groceryStore.test.ts --no-coverage` | PASS tests/stores/groceryStore.test.ts — 12 passed | PASS |
| budgetStore tests pass | `npx jest tests/stores/budgetStore.test.ts --no-coverage` | PASS — 6 tests passed | PASS |
| leftoverStore tests pass | `npx jest tests/stores/leftoverStore.test.ts --no-coverage` | PASS — 8 tests passed | PASS |
| All 6 Maestro flows use com.sharedkitchen.app | `grep appId .maestro/meal-plan-*.yaml .maestro/grocery-*.yaml` | All return com.mise.app | FAIL |

Note: Worktree test suites fail with "supabaseUrl is required" — this is a pre-existing environment issue with worktrees lacking .env. Only the main project's test files are relevant.

### Requirements Coverage

| Requirement | Description | Source Plan | Status | Evidence |
|-------------|-------------|------------|--------|---------|
| PLAN-01 | User can add a recipe to the meal plan from recipe detail | 21-01, 21-02 | PARTIAL | Unit test verifies mealPlan Map population (assignRecipe Map test). Takeout auto-expense sub-path is not tested. Maestro flow exists but broken on main. |
| PLAN-02 | Day picker sheet shows 7 days and assigns recipe to selected day | 21-01, 21-02 | PARTIAL | planStore.weekDays() test confirms 7-day return. Maestro E2E flow exists but appId wrong on main. Human verification needed for UI. |
| PLAN-03 | Plan tab displays assigned meals on correct days | 21-01, 21-02 | PARTIAL | assignRecipe Map population test confirms store populates correctly. UI rendering requires human verification. |
| GROC-01 | Grocery items populate from planned meals | 21-01, 21-02 | PARTIAL | generateGroceryList unit test passes (creates list + populates items). Maestro flow exists but appId wrong on main. |
| GROC-02 | User can check off grocery items | 21-01, 21-02 | PARTIAL | removeItem tests pass. toggleItem pre-existing tests pass. Maestro check-off flow exists but appId wrong on main. |
| GROC-03 | Grocery list syncs across household members in real-time | 21-01 | PARTIAL | All 3 realtime helpers (_addItem, _updateItem, _removeItem) tested and passing. Real-time behavior requires human verification with two sessions. |
| BUDG-01 | Budget tab loads and displays monthly cost tracking | 21-01, 21-02 | VERIFIED | budgetStore pre-existing tests pass (6 tests). Auto-expense integration from takeout meals untested. |
| BUDG-02 | Weekly spending breakdown displays correctly | 21-01 | VERIFIED | budgetStore tests include weekly breakdown behavior. Store-level verified. |
| LEFT-01 | Leftovers screen loads and displays tracked items with freshness badges | 21-01 | VERIFIED | leftoverStore pre-existing tests pass (8 tests). Store-level verified. |

### Anti-Patterns Found

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| `tests/stores/planStore.test.ts` | Missing takeout auto-expense test — SUMMARY falsely claimed feature absent; planStore.ts lines 163-175 show it exists | Blocker | PLAN-01 truth unverified, BUDG-01 integration path untested |
| `21-01-SUMMARY.md` | Key decision "Skipped takeout auto-expense test because planStore.assignRecipe does not have mealSource/mealCost parameters or budgetStore integration" is factually incorrect — code exists at lines 5, 36-37, 94-95, 163-175 of planStore.ts | Warning | Creates false record that code doesn't exist |
| `.maestro/meal-plan-*.yaml` and `.maestro/grocery-*.yaml` (all 6) | appId fix commit 22541aa committed to worktree branch only, never merged to main | Blocker | All 6 Maestro flows cannot launch the app; E2E validation for PLAN-01/02/03 and GROC-01/02/03 is blocked |

### Human Verification Required

#### 1. Meal Planning UI — PLAN-01/02/03

**Test:** Open the app, navigate to a recipe detail screen, tap "Add to Plan," select a day and meal type, tap confirm. Then navigate to the Plan tab.
**Expected:** The assigned meal appears on the correct day card in the Plan tab.
**Why human:** Visual rendering of mealPlan Map in the Plan tab UI requires running app on simulator.

#### 2. Grocery List Real-Time Sync — GROC-03

**Test:** With two devices (or simulator + web) signed in to the same household, one user checks off a grocery item.
**Expected:** The checked state appears on the second device within a few seconds without requiring a refresh.
**Why human:** Real-time Supabase subscriptions cannot be tested without two live sessions.

#### 3. Maestro E2E Flows — PLAN-01/02/03, GROC-01/02/03 (after appId fix is merged)

**Test:** After merging the appId fix to main, run each of the 6 Maestro flows against a running iOS simulator.
**Expected:** Each flow completes without assertion failures.
**Why human:** Requires running iOS simulator with app installed; cannot verify programmatically.

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Missing takeout auto-expense test (Plan 01)**
The plan required a test verifying that `planStore.assignRecipe` automatically creates a budget expense when `mealSource` is 'takeout' and `mealCost` is provided. The SUMMARY claimed the feature doesn't exist and skipped the test. This claim is false: `src/stores/planStore.ts` lines 163-175 implement exactly this behavior (checking mealSource for 'takeout'/'eating-out', calling `useBudgetStore.getState().addExpense`). The test needs to be written. This leaves the PLAN-01 truth "auto-creates expense for takeout/eating-out meals" unverified, and the integration between planStore and budgetStore untested.

**Gap 2 — Maestro appId fix not on main (Plan 02)**
Commit `22541aa` (fix: update appId to com.sharedkitchen.app in 6 Maestro flows) was committed to branch `worktree-agent-ac6667d3` and never merged to main. The main branch currently has `appId: com.mise.app` in all 6 files (meal-plan-add-edit, meal-plan-clear, meal-plan-surprise-me, grocery-generate, grocery-check-off, grocery-manual-add). This means the E2E flows cannot launch the app, blocking Maestro-level validation of PLAN-01/02/03 and GROC-01/02/03.

Additionally, the Maestro flows reference `testID` values (`plan-tab`, `grocery-tab`) that do not appear anywhere in the app source — this is a pre-existing concern that will need resolution when flows are actually executed.

---

_Verified: 2026-03-27T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
