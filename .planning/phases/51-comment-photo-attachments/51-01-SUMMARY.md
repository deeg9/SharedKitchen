---
phase: 51-comment-photo-attachments
plan: 01
subsystem: database, api
tags: [supabase-storage, expo-image-manipulator, photo-upload, comments]

# Dependency graph
requires: []
provides:
  - "photo_url column on recipe_comments table"
  - "uploadCommentPhoto helper (compress + upload to comment-photos bucket)"
  - "RecipeComment/RecipeCommentInsert types with photo_url"
  - "addComment store method with optional photoUri param"
affects: [51-02-PLAN, 51-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [comment photo upload follows cook log photo pattern with 0.7 quality]

key-files:
  created:
    - supabase/migrations/00031_comment_photo_url.sql
    - src/lib/commentPhotoHelpers.ts
  modified:
    - src/types/database.ts
    - src/stores/recipeCommentStore.ts
    - __tests__/stores/recipeCommentStore.test.ts

key-decisions:
  - "Comment photos use 0.7 JPEG quality (vs 0.8 for cook logs) per CONTEXT.md"
  - "Storage path is userId/timestamp.jpg (no recipeId prefix, unlike cook logs)"

patterns-established:
  - "Comment photo upload: same lazy-import + compress + upload pattern as cook log photos"

requirements-completed: [CMNT-P04]

# Metrics
duration: 2min
completed: 2026-04-12
---

# Phase 51 Plan 01: Comment Photo Backend Plumbing Summary

**Nullable photo_url column on recipe_comments with upload helper compressing to 1200px JPEG 0.7 and storing in comment-photos bucket**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-12T00:13:38Z
- **Completed:** 2026-04-12T00:15:59Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Migration adds nullable photo_url text column to recipe_comments
- Upload helper follows exact cook log pattern: lazy-import expo-image-manipulator, compress 1200px 0.7 JPEG, upload to Supabase Storage comment-photos bucket
- RecipeComment and RecipeCommentInsert types updated with photo_url field
- Store addComment accepts optional photoUri, uploads before insert, includes photo_url in DB row

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration, types, and upload helper** - `5cd0ad2` (feat)
2. **Task 2: Update recipeCommentStore to support photo upload** - `faad3a3` (feat)

## Files Created/Modified
- `supabase/migrations/00031_comment_photo_url.sql` - ALTER TABLE adds photo_url column
- `src/lib/commentPhotoHelpers.ts` - uploadCommentPhoto function (compress + upload)
- `src/types/database.ts` - photo_url added to recipe_comments Row/Insert/Update and RecipeComment/RecipeCommentInsert interfaces
- `src/stores/recipeCommentStore.ts` - addComment wired with photoUri param and uploadCommentPhoto call
- `__tests__/stores/recipeCommentStore.test.ts` - Test helper updated with photo_url field

## Decisions Made
- Comment photos use 0.7 JPEG quality (lower than cook logs 0.8) per CONTEXT.md decision
- Storage path uses userId/timestamp.jpg without recipeId prefix (comments already link to recipe via DB)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test helper and optimistic comment missing photo_url**
- **Found during:** Task 1 (type updates)
- **Issue:** Adding photo_url to RecipeComment interface broke existing test helper (makeComment) and optimistic comment object which didn't include the new required field
- **Fix:** Added `photo_url: null` to test helper default and optimistic comment object
- **Files modified:** `__tests__/stores/recipeCommentStore.test.ts`, `src/stores/recipeCommentStore.ts`
- **Verification:** npx tsc --noEmit shows no new errors (remaining errors are pre-existing SelectQueryError)
- **Committed in:** `5cd0ad2` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Auto-fix necessary for type correctness after adding required field. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. The comment-photos Supabase Storage bucket will need to be created (handled by Plan 02 schema push).

## Next Phase Readiness
- Backend plumbing complete: migration, types, helper, store all ready
- Plan 02 can push schema and create storage bucket
- Plan 03 can wire up the UI to attach and display comment photos
