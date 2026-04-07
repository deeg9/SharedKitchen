---
phase: 32-feed-auto-post
plan: "01"
subsystem: api
tags: [zustand, supabase-storage, feed, auto-post, pagination]

requires:
  - phase: 30-02
    provides: socialStore with myKitchenProfile, kitchen profile CRUD
  - phase: 30-01
    provides: feed_posts table, kitchen_profiles table, follows table
provides:
  - createFeedPost helper (fire-and-forget feed post creation)
  - uploadMealPhoto helper (compress + upload to Supabase Storage)
  - Auto-post hook in planStore.assignRecipe
  - fetchFeedPosts with cursor pagination in socialStore
  - meal-photos storage bucket with RLS
affects: [32-02-feed-ui, social-feed]

tech-stack:
  added: []
  patterns: [fire-and-forget-auto-post, cursor-pagination-feed, lazy-import-compression]

key-files:
  created:
    - src/lib/feedHelpers.ts
    - supabase/migrations/00019_create_meal_photos_bucket.sql
  modified:
    - src/stores/planStore.ts
    - src/stores/socialStore.ts

key-decisions:
  - "Auto-post is fire-and-forget: failure never blocks meal planning"
  - "Feed query includes own kitchen posts alongside followed kitchens"
  - "Cursor pagination uses created_at DESC with .lt() for next page"

patterns-established:
  - "Fire-and-forget pattern: wrap non-critical side effects in try/catch with empty catch"
  - "Feed pagination: cursor-based with feedHasMore flag (length === limit)"

requirements-completed: [FEED-01, FEED-04]

duration: 1m33s
completed: 2026-04-07
---

# Phase 32 Plan 01: Auto-Post & Feed Data Layer Summary

**Auto-post hook in planStore creates feed_post rows on meal assignment, with meal photo upload to Supabase Storage and cursor-paginated feed queries in socialStore**

## Performance

- **Duration:** 1m 33s
- **Started:** 2026-04-07T19:27:30Z
- **Completed:** 2026-04-07T19:29:03Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 2

## Accomplishments
- meal-photos Supabase Storage bucket with public read, authenticated write, and owner-scoped update/delete RLS policies
- feedHelpers.ts with createFeedPost (fire-and-forget insert) and uploadMealPhoto (compress via compressForVision, upload to Storage, update feed_post.photo_url)
- planStore.assignRecipe now auto-creates a feed_post after successful meal assignment when kitchen profile exists
- socialStore extended with feedPosts state, fetchFeedPosts (two-step: get following IDs then query feed_posts with cursor pagination), refreshFeed, and clearFeed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create meal-photos bucket migration and feed helper functions** - `dd8f22e` (feat)
2. **Task 2: Wire auto-post into planStore and extend socialStore with feed methods** - `8e7a97a` (feat)

## Files Created/Modified
- `supabase/migrations/00019_create_meal_photos_bucket.sql` - Storage bucket for meal photos with RLS policies
- `src/lib/feedHelpers.ts` - createFeedPost and uploadMealPhoto helper functions
- `src/stores/planStore.ts` - Added auto-post block after meal assignment (imports createFeedPost + useSocialStore)
- `src/stores/socialStore.ts` - Added FeedPost import, feed state fields, fetchFeedPosts with cursor pagination, refreshFeed, clearFeed

## Decisions Made
- Auto-post is fire-and-forget: wrapped in try/catch with empty catch so feed post creation failures never block meal planning
- Feed query includes the user's own kitchen ID alongside followed kitchens so users see their own posts in the feed
- Used created_at DESC cursor pagination with .lt() matching the established pattern from fetchFollowers

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

The meal-photos storage bucket must be created in Supabase if migrations are not run automatically:
- Supabase Dashboard -> Storage -> New Bucket -> 'meal-photos', public=true

## Next Phase Readiness
- socialStore feed methods ready for Plan 02 feed UI to call fetchFeedPosts and render FeedPost cards
- createFeedPost and uploadMealPhoto ready for camera integration in feed cards
- meal-photos bucket ready to receive uploaded photos

---
*Phase: 32-feed-auto-post*
*Completed: 2026-04-07*

## Self-Check: PASSED
