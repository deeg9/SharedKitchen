---
phase: 47-recipe-comments
plan: 01
subsystem: database
tags: [postgres, rls, zustand, threading, optimistic-updates, comments]

requires:
  - phase: 44-handle-system
    provides: "profiles table with handle column for comment author display"
  - phase: 45-recipe-attribution
    provides: "recipes.created_by FK for delete policy authorization"
provides:
  - "recipe_comments table with RLS policies for household+follower visibility"
  - "comment_count column on recipes maintained by trigger"
  - "RecipeComment TypeScript types (RecipeComment, RecipeCommentInsert, RecipeCommentWithProfile, ThreadedComment)"
  - "recipeCommentStore with fetchComments, addComment, deleteComment, setReplyingTo, clearComments"
  - "groupComments pure function for single-level comment threading"
affects: [47-02-recipe-comments-ui]

tech-stack:
  added: []
  patterns: [optimistic-comment-insert-with-rollback, single-level-reply-threading, reply-to-reply-flattening]

key-files:
  created:
    - supabase/migrations/00028_create_recipe_comments.sql
    - src/stores/recipeCommentStore.ts
    - __tests__/stores/recipeCommentStore.test.ts
  modified:
    - src/types/database.ts

key-decisions:
  - "Reply-to-reply flattening: groupComments resolves nested replies to root parent client-side for single-level threading"
  - "Optimistic insert uses crypto.randomUUID() for temp ID, replaced with real data on API success"

patterns-established:
  - "Comment threading: groupComments pure function separates threading logic from store for testability"
  - "Dual-table optimistic: addComment optimistically updates comments array AND commentCount"

requirements-completed: [CMNT-01, CMNT-02, CMNT-03, CMNT-04]

duration: 3min
completed: 2026-04-11
---

# Phase 47 Plan 01: Recipe Comments Data Layer Summary

**recipe_comments table with threaded RLS, comment_count trigger, and Zustand store with optimistic updates and single-level reply threading**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T17:38:05Z
- **Completed:** 2026-04-11T17:41:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- recipe_comments migration with 3 RLS policies: SELECT (household+followers via kitchen_profiles/follows join), INSERT (household members with user_id spoofing prevention), DELETE (author OR recipe creator)
- comment_count column on recipes table maintained by SECURITY DEFINER trigger
- recipeCommentStore with optimistic addComment/deleteComment, fetchComments with profile join, and groupComments pure function for single-level threading
- 8 unit tests covering groupComments threading (empty, top-level, replies, reply-to-reply flattening) and store actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create recipe_comments migration with RLS and comment_count trigger** - `f66871f` (feat)
2. **Task 2: Add TypeScript types and create recipeCommentStore with tests**
   - RED: `2ca96bc` (test) - failing tests for types and store
   - GREEN: `ec7a80b` (feat) - implement store, all 8 tests pass

## Files Created/Modified
- `supabase/migrations/00028_create_recipe_comments.sql` - Table, 3 RLS policies, indexes, comment_count trigger
- `src/types/database.ts` - RecipeComment, RecipeCommentInsert, RecipeCommentWithProfile, ThreadedComment types
- `src/stores/recipeCommentStore.ts` - Zustand store with threading, optimistic updates, fetch/add/delete/reply/clear
- `__tests__/stores/recipeCommentStore.test.ts` - 8 unit tests for groupComments and store actions

## Decisions Made
- Reply-to-reply flattening handled client-side in groupComments (resolves to root parent via recursive lookup)
- Optimistic insert uses crypto.randomUUID() for temp ID, replaced with server data on success
- fetchComments also queries recipes.comment_count for accurate server-side count

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer complete: migration ready for application via Supabase MCP
- Types and store ready for Plan 02 UI components (CommentSheet, CommentBubble, CommentInput)
- groupComments threading logic ready for rendering threaded comment lists

---
*Phase: 47-recipe-comments*
*Completed: 2026-04-11*
