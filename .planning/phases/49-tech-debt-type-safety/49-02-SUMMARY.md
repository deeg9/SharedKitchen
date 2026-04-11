---
phase: 49-tech-debt-type-safety
plan: 02
subsystem: database
tags: [supabase, rls, typescript, migration, views]

requires:
  - phase: 48-feed-integration-save-to-collection
    provides: profiles table with handle and social columns
provides:
  - public_profiles VIEW restricting cross-user visibility to safe columns
  - Regenerated database.ts with all tables from live schema
  - Updated cross-user queries to use public_profiles view
affects: [50-cooking-mode-redesign, 51-comment-photo-attachments, 52-co-cook-tagging]

tech-stack:
  added: []
  patterns: [public_profiles VIEW for cross-user access, RLS defense-in-depth]

key-files:
  created:
    - supabase/migrations/00030_public_profiles_view.sql
  modified:
    - src/types/database.ts
    - src/hooks/useHandleForm.ts
    - src/stores/socialStore.ts

key-decisions:
  - "Used VIEW approach for column restriction (defense-in-depth) rather than application-level .select()"
  - "Regenerated database.ts inline preserving custom types rather than splitting into generated + manual files"

patterns-established:
  - "public_profiles VIEW: cross-user profile queries go through the VIEW, own-profile queries use profiles table directly"

requirements-completed: [DEBT-01, DEBT-04]

duration: 6min
completed: 2026-04-11
---

# Phase 49 Plan 02: public_profiles VIEW + Type Regeneration Summary

**public_profiles VIEW restricts cross-user profile access to safe columns (id, handle, display_name, avatar_url), database.ts regenerated with 9 previously missing tables**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-11
- **Completed:** 2026-04-11
- **Tasks:** 1/2 (Task 2 deferred — schema push requires manual auth)
- **Files modified:** 4

## Accomplishments
- Created migration 00030 with public_profiles VIEW exposing only safe columns
- Drops the broad "Authenticated users can read any profile" RLS policy
- Regenerated database.ts from live Supabase schema — added 9 missing tables (cook_logs, recipe_comments, meal_rsvps, push_tokens, subscriptions, ai_usage_log, meal_generation_log, processed_webhook_events, waitlist)
- Preserved all custom types (MealType, MealSource, Ingredient, InstructionStep, NutritionInfo)
- Updated cross-user queries in socialStore and useHandleForm to use public_profiles view

## Task Commits

1. **Task 1: Create public_profiles VIEW, regenerate types, update queries** - `5e55927` (feat)
2. **Task 2: [BLOCKING] Push schema to Supabase** - DEFERRED (requires `supabase db push` with database auth)

## Files Created/Modified
- `supabase/migrations/00030_public_profiles_view.sql` - VIEW creation, RLS policy drop, grants
- `src/types/database.ts` - Regenerated from live schema with custom types preserved
- `src/hooks/useHandleForm.ts` - Updated handle availability check to use public_profiles
- `src/stores/socialStore.ts` - Updated cross-user profile queries to use public_profiles

## Decisions Made
- VIEW approach chosen over .select() for defense-in-depth (DB enforces column restriction)
- Inline regeneration with manual type preservation (simpler than file splitting)

## Deviations from Plan
- Task 2 (supabase db push) could not be executed automatically — requires database password authentication

## Issues Encountered
- `supabase db push` requires interactive password authentication that cannot be automated
- TypeScript `never` errors persist (231 total) — many are in test fixtures that need updating to match new type structure, not just from missing tables

## User Setup Required
**Schema push required.** Run manually:
1. `supabase login` (if not authenticated)
2. `supabase db push` from project root
3. Verify VIEW works: `SELECT * FROM public_profiles LIMIT 5;`

## Next Phase Readiness
- Migration file ready, needs manual push
- Cross-user queries already updated to use public_profiles
- TypeScript never errors need further investigation (test fixtures + type relationships)

---
*Phase: 49-tech-debt-type-safety*
*Completed: 2026-04-11*
