---
phase: 23-core-video-import-pipeline
plan: 01
subsystem: api
tags: [video-import, supadata, gemini, transcript, rate-limiting, regex]

requires:
  - phase: 09-ai-recipe-import
    provides: parse-recipe-url Edge Function, ai_usage_log table, Gemini integration
provides:
  - isVideoUrl() pure function for client-side video URL detection
  - Edge Function video branch with Supadata transcript + Gemini parsing
  - Monthly rate limiting for video imports (3 free, unlimited premium)
  - Non-recipe transcript rejection via is_recipe field
affects: [23-02-client-video-import-flow, 24-share-sheet-integration]

tech-stack:
  added: [supadata-rest-api]
  patterns: [video-url-detection-regex, supadata-async-polling, video-transcript-gemini-prompt, monthly-rate-limit-window]

key-files:
  created: [src/lib/videoUrl.ts, __tests__/lib/videoUrl.test.ts]
  modified: [supabase/functions/parse-recipe-url/index.ts]

key-decisions:
  - "Moved premium status check before cache/rate-limit sections so both video and article branches share it"
  - "Video cache uses function_name parse-video-recipe to avoid collision with article cache"
  - "Non-recipe rejection uses is_recipe boolean plus minimum 2 ingredients and 1 instruction validation"

patterns-established:
  - "Video URL detection: regex array with .some() pattern in src/lib/videoUrl.ts"
  - "Supadata 202 polling: 3 retries at 5s intervals with dedicated AbortController at 40s"
  - "Video-specific Gemini prompt: conversational speech extraction with measurement inference defaults"
  - "Monthly rate limit: calendar month window via monthStart.setDate(1) on ai_usage_log"

requirements-completed: [VURL-01, VURL-02, VURL-03, VURL-04, TRANS-01, TRANS-02, TRANS-03, PARSE-01, PARSE-02, PARSE-03, RATE-01, RATE-02]

duration: 3min
completed: 2026-03-28
---

# Phase 23 Plan 01: Video URL Detection & Edge Function Pipeline Summary

**isVideoUrl() regex detector for TikTok/Instagram/YouTube plus full Edge Function video branch with Supadata transcript extraction, Gemini parsing, monthly rate limiting, and non-recipe rejection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T22:58:36Z
- **Completed:** 2026-03-28T23:01:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created isVideoUrl() pure function with 13 passing tests covering all video platforms and non-video fallthrough
- Extended parse-recipe-url Edge Function with complete video import pipeline: Supadata transcript fetch (with 202 async polling), Gemini video-specific prompt with measurement inference, monthly rate limiting (3 free/unlimited premium), non-recipe rejection
- Existing article import path fully preserved and unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Create videoUrl.ts with TDD tests** - `6eda44c` (test)
2. **Task 2: Extend Edge Function with video branch** - `8dbd79a` (feat)

## Files Created/Modified
- `src/lib/videoUrl.ts` - Pure function isVideoUrl() with VIDEO_URL_PATTERNS regex array
- `__tests__/lib/videoUrl.test.ts` - 13 test cases for TikTok, Instagram, YouTube, and non-video URLs
- `supabase/functions/parse-recipe-url/index.ts` - Added video branch with Supadata + Gemini + rate limiting + non-recipe rejection

## Decisions Made
- Moved premium status check before both branches so video and article paths share it (was previously only used by article path)
- Video cache hit logs are non-blocking (fire-and-forget) to match existing article cache pattern
- Supadata 402/403 errors return 503 "temporarily unavailable" rather than exposing API credit details
- is_recipe field is deleted from response before returning to client (internal validation only)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Premium check refactored to shared position**
- **Found during:** Task 2
- **Issue:** Plan noted the premium check needed to be moved before the video branch. Implemented as specified -- extracted from article-only position to shared early position.
- **Fix:** Moved isPremium determination to right after auth, before urlHash computation
- **Files modified:** supabase/functions/parse-recipe-url/index.ts
- **Verification:** Both video and article branches correctly reference isPremium
- **Committed in:** 8dbd79a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical -- per plan instruction)
**Impact on plan:** Refactoring was explicitly called for in the plan. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all code paths are fully implemented with real API integrations.

## User Setup Required
**SUPADATA_API_KEY** must be provisioned in Supabase secrets before video import works:
```bash
supabase secrets set SUPADATA_API_KEY=sk_your_key_here
```

## Next Phase Readiness
- isVideoUrl() ready for import in ai.ts (Plan 02 will wire client-side routing)
- Edge Function ready to receive type='video' requests from client
- Plan 02 will modify ai.ts parseRecipeUrl() to detect video URLs and call Edge Function with type='video'
- Plan 02 will add video-specific UX to add recipe screen (progress modal, usage counter, upgrade prompt)

---
*Phase: 23-core-video-import-pipeline*
*Completed: 2026-03-28*
