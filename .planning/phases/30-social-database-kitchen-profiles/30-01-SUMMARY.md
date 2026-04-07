---
phase: 30-social-database-kitchen-profiles
plan: "01"
subsystem: database
tags: [social, database, migration, rls, triggers, types]
dependency_graph:
  requires: [households, household_members, meal_plans, recipes]
  provides: [kitchen_profiles, follows, feed_posts, post_likes, post_comments, saved_recipes, blocked_kitchens, is_kitchen_member]
  affects: [database.ts]
tech_stack:
  added: [expo-image]
  patterns: [trigger-maintained-counters, kitchen-to-kitchen-follows, security-definer-helper]
key_files:
  created:
    - supabase/migrations/00018_create_social_tables.sql
  modified:
    - src/types/database.ts
    - package.json
    - package-lock.json
decisions:
  - Used (select auth.uid()) wrapper in all RLS policies for performance
  - is_kitchen_member helper joins kitchen_profiles to household_members for RLS checks
  - GREATEST(count - 1, 0) in decrement triggers to prevent negative counts
metrics:
  duration: 2m10s
  completed: "2026-04-07T18:24:41Z"
---

# Phase 30 Plan 01: Social Database Migration & TypeScript Types Summary

Single migration (00018) creating all 7 social tables with RLS policies, 3 trigger-maintained counter functions, and is_kitchen_member helper; TypeScript types for all tables added to database.ts; expo-image installed for avatar/photo rendering.

## What Was Built

### Migration 00018: Complete Social Data Layer
- **7 tables**: kitchen_profiles, follows, feed_posts, post_likes, post_comments, saved_recipes, blocked_kitchens
- **22 RLS policies** across all tables using `(select auth.uid())` subselect wrapper
- **3 triggers**: follow count (follower_count + following_count on kitchen_profiles), like count and comment count on feed_posts
- **1 helper function**: `is_kitchen_member()` SECURITY DEFINER function joining kitchen_profiles to household_members
- **Kitchen-to-kitchen follow model**: follower_kitchen_id + following_kitchen_id with self-follow CHECK constraint
- **Invite code**: reuses households pattern `substr(md5(random()::text), 1, 8)`

### TypeScript Types
- Row/Insert/Update types for all 7 social tables in Database interface
- 11 convenience type aliases exported (KitchenProfile, Follow, FeedPost, PostLike, PostComment, SavedRecipe, BlockedKitchen, etc.)
- KitchenProfileWithRecipeCount extended interface

### Dependencies
- expo-image ~55.0.8 installed for cached image rendering in social features

## Deviations from Plan

None - plan executed exactly as written.

## Task Completion

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Create social tables migration (00018) | f79e062 | Complete |
| 2 | Add social table TypeScript types and install expo-image | f39aee3 | Complete |
| 3 | Apply migration to Supabase | - | Requires manual SQL execution |

## Pending Action

Task 3 requires manual execution of the migration SQL in Supabase Dashboard SQL Editor. The migration file is ready at `supabase/migrations/00018_create_social_tables.sql`. After running, verify all 7 tables appear in the Table Editor with RLS enabled.

## Self-Check: PASSED
