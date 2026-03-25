---
phase: 05-ai-fix-payment-foundation
plan: 01
subsystem: ai
tags: [openai, gpt-5-mini, structured-outputs, rate-limiting, caching, supabase-edge-functions]

# Dependency graph
requires:
  - phase: 02-core-features
    provides: parse-recipe-url Edge Function, ai.ts client module
provides:
  - Working recipe import with gpt-5-mini and structured outputs
  - Per-user AI rate limiting (10/day free, 50/day premium)
  - URL-based response caching (24h TTL) via ai_usage_log table
  - RateLimitError class for client-side 429 handling
affects: [05-02, 05-03, 08-enhanced-ai]

# Tech tracking
tech-stack:
  added: []
  patterns: [structured-outputs-json-schema, url-hash-caching, service-role-admin-writes, graceful-missing-table-check]

key-files:
  created:
    - supabase/migrations/00011_create_ai_usage_log.sql
  modified:
    - supabase/functions/parse-recipe-url/index.ts
    - src/lib/ai.ts

key-decisions:
  - "OPENAI_MODEL env var for model configurability (defaults to gpt-5-mini)"
  - "Graceful try/catch on subscriptions table query to avoid build dependency on Plan 02"
  - "Cache hits log tokens_used: 0 entries for accurate usage counting"

patterns-established:
  - "Structured outputs (json_schema) for all OpenAI API calls instead of json_object"
  - "URL hashing via Web Crypto SHA-256 for cache keys"
  - "Service-role admin client pattern for Edge Function DB writes"

requirements-completed: [AI-03, AI-07]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 5 Plan 1: Fix Recipe Import Summary

**Recipe import restored with gpt-5-mini, structured outputs, per-user rate limiting (10/50 daily), and 24h URL-based response caching**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T16:52:54Z
- **Completed:** 2026-03-25T16:54:51Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced deprecated gpt-4o-mini with gpt-5-mini (configurable via OPENAI_MODEL env var)
- Upgraded response_format from json_object to json_schema structured outputs for guaranteed schema compliance
- Added per-user rate limiting: 10 imports/day free, 50/day premium with graceful subscriptions table fallback
- Added URL-based response caching with 24h TTL to eliminate duplicate OpenAI calls
- Increased HTML truncation from 15K to 50K characters for better recipe extraction
- Added RateLimitError class to client AI module for UI-specific error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ai_usage_log table and update parse-recipe-url Edge Function** - `4b617a1` (feat)
2. **Task 2: Update client-side AI error handling for rate limits** - `eae79bf` (feat)

## Files Created/Modified
- `supabase/migrations/00011_create_ai_usage_log.sql` - AI usage tracking table with indexes and RLS
- `supabase/functions/parse-recipe-url/index.ts` - Full rewrite with gpt-5-mini, caching, rate limiting, structured outputs
- `src/lib/ai.ts` - Added RateLimitError class and 429 response handling

## Decisions Made
- OPENAI_MODEL env var allows runtime model switching without code changes (defaults to gpt-5-mini)
- Graceful try/catch on subscriptions table query so Plan 01 has no build-time dependency on Plan 02
- Cache hit entries logged with tokens_used: 0 for accurate rate limit counting (cache hits count toward daily limit)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ai_usage_log table ready for Plan 02 to reference (subscriptions table query already gracefully handled)
- RateLimitError class ready for UI components to catch and display rate limit messaging per UI-SPEC
- Edge Function ready for Phase 8 enhancements (JSON-LD extraction, image/nutrition parsing)

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 05-ai-fix-payment-foundation*
*Completed: 2026-03-25*
