---
phase: 24-share-sheet-integration
plan: 01
subsystem: ui
tags: [expo-share-intent, share-sheet, ios, deep-linking, expo-router]

# Dependency graph
requires:
  - phase: 23-core-video-import-pipeline
    provides: "isVideoUrl detection, parseRecipeUrl pipeline, VideoRateLimitError"
provides:
  - "iOS share extension configuration via expo-share-intent"
  - "+native-intent.ts deep link routing for share intents"
  - "ShareIntentProvider wrapping root layout"
  - "Auto-import flow on add-recipe screen from share sheet"
affects: [24-share-sheet-integration]

# Tech tracking
tech-stack:
  added: [expo-share-intent]
  patterns: [native-intent redirect, ShareIntentProvider context, handleImportUrl shared code path]

key-files:
  created:
    - app/+native-intent.ts
  modified:
    - app.json
    - package.json
    - app/_layout.tsx
    - app/(app)/recipe/add.tsx

key-decisions:
  - "ShareIntentProvider placed inside GestureHandlerRootView but outside StripeProvider for independence"
  - "handleImportUrl extracted as shared code path for both manual paste and share sheet import"
  - "300ms delay before auto-import to allow UI to render"

patterns-established:
  - "Native intent redirect: +native-intent.ts intercepts share extension deep links and routes to app screens"
  - "Share intent auto-import: useShareIntentContext reads shared URL, resetShareIntent clears state, handleImportUrl processes"

requirements-completed: [SHARE-01, SHARE-02, SHARE-03]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 24 Plan 01: Share Sheet Integration Summary

**iOS share extension via expo-share-intent with auto-import routing from share sheet to add-recipe screen**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-28T23:28:57Z
- **Completed:** 2026-03-28T23:30:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed expo-share-intent with iOS URL activation rules (web URL + web page)
- Created +native-intent.ts that intercepts share extension deep links and redirects to add-recipe screen
- Wrapped root layout with ShareIntentProvider for share intent context
- Wired add-recipe screen to auto-trigger import when receiving a URL via share sheet, reusing same code path as manual paste

## Task Commits

Each task was committed atomically:

1. **Task 1: Install expo-share-intent and configure native share extension** - `485127f` (feat)
2. **Task 2: Wire ShareIntentProvider and auto-import on add-recipe screen** - `08871a9` (feat)

## Files Created/Modified
- `app/+native-intent.ts` - Expo Router native intent handler that routes share extension deep links to add-recipe screen
- `app.json` - Added expo-share-intent plugin with iOS activation rules
- `package.json` - Added expo-share-intent dependency
- `app/_layout.tsx` - Wrapped app content with ShareIntentProvider
- `app/(app)/recipe/add.tsx` - Added useShareIntentContext hook, extracted handleImportUrl, added auto-import useEffect

## Decisions Made
- ShareIntentProvider placed inside GestureHandlerRootView but outside StripeProvider (share intent is independent of Stripe)
- Extracted handleImportUrl as shared code path for both manual paste and share sheet import (DRY)
- 300ms delay before auto-triggering import to allow UI to render the URL in the input field

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. Note: expo-share-intent requires `expo prebuild --clean` and real-device testing for the native share extension to work (already documented in STATE.md blockers).

## Next Phase Readiness
- Share sheet integration fully wired from native extension through to auto-import
- Ready for Phase 24 Plan 02 (E2E testing of share flow)
- Requires native rebuild (`expo prebuild --clean`) to activate the iOS share extension

---
*Phase: 24-share-sheet-integration*
*Completed: 2026-03-28*
