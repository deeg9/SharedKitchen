---
phase: 23-core-video-import-pipeline
plan: 02
subsystem: ai, ui
tags: [video-import, rate-limiting, progress-ui, edge-function, supabase]

requires:
  - phase: 23-01
    provides: "videoUrl.ts isVideoUrl utility, Edge Function video branch with Supadata+Gemini"
provides:
  - "Client-side video URL routing in parseRecipeUrl via isVideoUrl"
  - "VideoRateLimitError class for 429 video limit responses"
  - "getVideoImportCount query for monthly usage tracking"
  - "Video-specific progress messages in add-recipe UI"
  - "Usage counter and upgrade prompt UI components"
affects: [24-share-sheet-integration]

tech-stack:
  added: []
  patterns: ["Video URL early-exit in parseRecipeUrl before HTML fetch", "Separate progress message arrays for video vs web imports"]

key-files:
  created: []
  modified:
    - src/lib/ai.ts
    - app/(app)/recipe/add.tsx

key-decisions:
  - "VideoRateLimitError as separate class from RateLimitError for distinct error handling in UI"
  - "Usage counter hidden when used=0 to avoid clutter for users who haven't tried video import"
  - "3-second progress intervals for video (longer than 2-second web) reflecting longer operation"

patterns-established:
  - "Video URL detection via isVideoUrl() before any fetch in parseRecipeUrl"
  - "Edge Function called with type='video' for video-specific backend routing"

requirements-completed: [IMPORT-01, IMPORT-02, IMPORT-03, IMPORT-04, RATE-03, RATE-04]

duration: 2min
completed: 2026-03-28
---

# Phase 23 Plan 02: Client-Side Video Import Flow Summary

**Video URL routing in parseRecipeUrl with Edge Function video branch, video-specific progress UI, monthly usage counter, and upgrade prompt for rate-limited users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-28T23:03:07Z
- **Completed:** 2026-03-28T23:05:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Video URLs detected via isVideoUrl() and routed directly to Edge Function with type='video', skipping HTML fetch
- VideoRateLimitError class handles 429 responses with video-specific limit/used/remaining fields
- getVideoImportCount queries ai_usage_log for monthly video usage tracking
- Add-recipe screen shows video-specific progress ("Extracting transcript..." -> "Parsing recipe..." -> "Almost done!")
- Usage counter displays "X of 3 video imports used this month" when usage > 0
- Rate limit errors surface an upgrade prompt card linking to subscription settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Add video URL routing and VideoRateLimitError to ai.ts** - `6a862b2` (feat)
2. **Task 2: Add video progress UI, usage counter, and upgrade prompt to add.tsx** - `d417641` (feat)

## Files Created/Modified
- `src/lib/ai.ts` - Added isVideoUrl import, VideoRateLimitError class, callEdgeFunctionForVideo helper, getVideoImportCount query, video URL branch in parseRecipeUrl
- `app/(app)/recipe/add.tsx` - Added video/web progress message arrays, videoUsage state + useEffect fetch, isVideoUrl detection in handleImport, VideoRateLimitError handling, usage counter UI, upgrade prompt card with styles

## Decisions Made
- VideoRateLimitError is a separate class from RateLimitError to allow distinct instanceof checks in the UI without conflating article and video rate limits
- Usage counter is hidden when used=0 to keep the UI clean for users who have never used video import
- Progress interval set to 3 seconds for video (vs 2 seconds for web) to match the longer video extraction operation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client-side video import flow complete -- users can paste TikTok/Instagram/YouTube URLs and get recipe extraction with progress feedback
- Phase 24 (share sheet integration) can build on this foundation for receiving URLs from other apps
- Edge Function video branch (from Plan 01) provides the backend; this plan wires it to the UI

---
*Phase: 23-core-video-import-pipeline*
*Completed: 2026-03-28*
