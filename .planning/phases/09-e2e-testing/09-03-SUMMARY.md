---
phase: 09-e2e-testing
plan: 03
subsystem: testing
tags: [maestro, e2e, grocery, premium, negative-paths, yaml]

# Dependency graph
requires:
  - phase: 09-e2e-testing
    plan: 01
    provides: testID props on all interactive elements
provides:
  - 4 grocery/premium E2E flow definitions
  - 3 negative path E2E flow definitions
  - coverage for grocery generate, check-off, manual add, premium checkout, failed payment, AI error, permissions denied
affects: [09-e2e-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [maestro negative path flows use optional assertions for graceful degradation]

key-files:
  created:
    - .maestro/grocery-generate.yaml
    - .maestro/grocery-check-off.yaml
    - .maestro/grocery-manual-add.yaml
    - .maestro/premium-checkout.yaml
    - .maestro/negative-failed-payment.yaml
    - .maestro/negative-ai-timeout.yaml
    - .maestro/negative-permissions-denied.yaml
  modified: []

key-decisions:
  - "Stripe checkout tested up to payment UI only -- cannot complete in E2E without test credentials"
  - "Negative payment flow uses back-navigation to simulate cancelled checkout rather than Stripe test card"
  - "Notification permissions deny path tests PermissionPrompt dismiss since Maestro cannot control iOS system dialogs"
  - "AI timeout flow uses 20s timeout for network error on invalid URL"

patterns-established:
  - "Negative path flows end with stability assertions (screen still accessible, key elements visible)"
  - "Optional assertions used where element presence depends on app state (e.g. which sections have items)"

requirements-completed: [TEST-04, TEST-05, TEST-06]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Phase 09 Plan 03: Grocery, Premium & Negative Path E2E Flows Summary

**7 Maestro E2E flows covering grocery list workflows, premium checkout, and 3 negative/failure paths**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T00:51:28Z
- **Completed:** 2026-03-26T00:53:00Z
- **Tasks:** 2
- **Files created:** 7

## Accomplishments
- Created grocery-generate.yaml flow: navigates to grocery tab, taps generate, asserts sections and summary appear
- Created grocery-check-off.yaml flow: loads grocery list, taps item to toggle checked state, verifies summary
- Created grocery-manual-add.yaml flow: opens add item FAB, enters "Extra Butter", submits, verifies item in list
- Created premium-checkout.yaml flow: navigates Profile > Subscription, verifies $9.99 pricing, taps upgrade button
- Created negative-failed-payment.yaml flow: initiates checkout, cancels/dismisses, verifies user stays on free tier
- Created negative-ai-timeout.yaml flow: enters invalid URL for recipe import, verifies error alert and app stability
- Created negative-permissions-denied.yaml flow: opens notification settings, dismisses permission prompt, verifies app continues

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Maestro flows for grocery list and premium checkout** - `75ffd77` (feat)
2. **Task 2: Create Maestro flows for negative/failure paths** - `141131e` (feat)

## Files Created
- `.maestro/grocery-generate.yaml` - Grocery list generation from meal plan
- `.maestro/grocery-check-off.yaml` - Toggle grocery item checked state
- `.maestro/grocery-manual-add.yaml` - Manual item add via FAB and AddItemSheet
- `.maestro/premium-checkout.yaml` - Premium subscription checkout up to payment UI
- `.maestro/negative-failed-payment.yaml` - Cancelled/failed payment stays on free tier
- `.maestro/negative-ai-timeout.yaml` - Invalid URL import shows error gracefully
- `.maestro/negative-permissions-denied.yaml` - Notification permission denial handled gracefully

## Decisions Made
- Stripe checkout tested up to payment UI only since Maestro E2E cannot provide Stripe test credentials for full checkout flow
- Negative payment flow simulates cancellation via back-navigation rather than injecting Stripe test decline card
- Notification permissions deny path uses the PermissionPrompt component dismiss flow since Maestro cannot interact with iOS system permission dialogs
- AI timeout flow uses 20-second timeout to allow network request to fail on unreachable domain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs
None - all flows reference actual testID props wired to real components.

## Self-Check: PASSED

All 7 Maestro YAML files verified on disk. Both task commits (75ffd77, 141131e) found in git log.

---
*Phase: 09-e2e-testing*
*Completed: 2026-03-26*
