# Technology Stack: v8.0 Social Recipes

**Project:** SharedKitchen
**Researched:** 2026-04-10
**Scope:** Stack additions for @handle usernames, recipe attribution, recipe comments, cook log with photos, version history, and feed integration

## Key Finding: No New npm Dependencies Required

The existing stack (Expo SDK 55, Supabase JS 2.100+, Zustand 5, expo-image, expo-camera, expo-image-picker, expo-image-manipulator, @shopify/flash-list) already provides every client-side capability needed for v8.0. All new features are **Postgres schema + RLS policy** work on the backend, and **new screens/components** using existing libraries on the frontend.

**Confidence: HIGH** -- Verified against existing codebase patterns (feed photos, social tables, camera flows).

## What Needs to Change

### Database Schema Additions (Supabase Postgres)

| Table/Column | Purpose | Why |
|--------------|---------|-----|
| `profiles.username` (TEXT UNIQUE NOT NULL) | @handle system | Unique constraint with `LOWER()` index enforces case-insensitive uniqueness. Added to existing `profiles` table. |
| `profiles` broader SELECT RLS policy | @handle display on recipes, comments, attribution | Currently only own-user + co-household. Need "authenticated users can read username + avatar_url" for social contexts. |
| `recipe_comments` (new table) | Household-visible comments on recipes | Different from `post_comments` (feed-scoped, kitchen-level). Recipe comments are user-level within household. Different RLS, different display. Separate table. |
| `cook_logs` (new table) | Track when someone cooks a recipe with optional photos | Columns: id, recipe_id, user_id, household_id, meal_plan_id (nullable), photos (TEXT[]), notes, cooked_at, created_at. |
| `recipe_versions` (new table) | Track recipe edit history | Columns: id, recipe_id, version_number, changed_by, changes_snapshot (JSONB), created_at. Full snapshot per version. |
| `recipes.cook_count` (INT DEFAULT 0) | "Cooked N times" badge | Maintained by trigger on cook_logs INSERT/DELETE. Same pattern as follow_count, like_count. |
| Storage bucket: `cook-log-photos` | Cook log photo uploads | Same pattern as existing `meal-photos` bucket. Public read, authenticated write, user-folder scoped delete. |
| `feed_posts.type` (TEXT) | Distinguish post types in feed | New post types: `'recipe_created'`, `'cook_log'` alongside implicit existing `'meal_planned'`. Default existing rows to `'meal_planned'`. |
| `feed_posts.recipe_id` (UUID nullable) | Link feed posts to source recipe | Enables "View Recipe" from feed cards for recipe_created and cook_log posts. |

### RLS Policy Changes

| Table | Change | Rationale |
|-------|--------|-----------|
| `profiles` | Add SELECT policy: "Authenticated users can read profiles" | @handles need to be resolvable by any authenticated user for attribution display, comment author names. The profiles table contains no sensitive data (id, display_name, avatar_url, username, created_at). |
| `recipes` | Modify UPDATE policy: restrict to `created_by = auth.uid() OR created_by IS NULL` | Creator-only editing. Currently any household member can edit. The `OR NULL` clause handles legacy recipes created before `created_by` was tracked. |
| `recipe_comments` | Standard household-scoped policies | Same pattern as recipe_notes. Any household member can read/create; users can only delete their own. |
| `cook_logs` | Household-scoped read, user-scoped write | Any household member can see cook history; only the cook can create/edit/delete their own entries. |
| `recipe_versions` | Household-scoped read-only | Insert handled by trigger on recipes UPDATE. No direct user writes needed. |

### Edge Functions

No new Edge Functions required. All v8.0 operations are standard CRUD via supabase-js. The existing `social-push` Edge Function should be extended with new notification types (recipe comments, cook log activity) but doesn't need a new function.

### Existing Libraries That Cover New Features

| Feature | Existing Library | Existing Pattern |
|---------|-----------------|------------------|
| Cook log photo capture | `expo-camera` + `expo-image-picker` | `CameraSheet.tsx` from v4.0 |
| Cook log photo compression | `expo-image-manipulator` | 1024px JPEG 0.6 compression from existing photo flows |
| Cook log photo upload | `@supabase/supabase-js` Storage | `feedHelpers.ts` upload to `meal-photos` bucket |
| Cook log photo display | `expo-image` | Cached CDN-backed rendering on feed cards and recipe images |
| Photo gallery scroll | `ScrollView` horizontal or `@shopify/flash-list` | Cook logs typically have 1-5 photos; horizontal ScrollView suffices |
| @handle input validation | Built-in regex | `/^[a-zA-Z0-9_]{3,20}$/` -- no library needed |
| Username availability check | `supabase.from('profiles').select('id').eq('username', handle)` | Same pattern as kitchen search |
| Recipe comments list | `@shopify/flash-list` | Same pattern as `CommentSheet.tsx` for feed post comments |
| Version history display | `FlatList` | Simple chronological list, low item count per recipe |
| Optimistic UI | `zustand` | Same pattern used throughout v5.0 social features |
| Real-time comment updates | Supabase Realtime `postgres_changes` | Same subscription pattern as grocery sync, pantry sync |

## Recommended Stack (Unchanged + Schema)

### Core Framework (NO CHANGES)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React Native | 0.83.4 | UI framework | Existing |
| Expo SDK | 55 | Build toolchain | Existing |
| TypeScript | 5.9.2 | Type safety | Existing |
| expo-router | 55.0.11 | File-based routing | Existing |

### Backend (SCHEMA CHANGES ONLY)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Supabase Postgres | Latest | Database + RLS | Existing -- add 3 tables, modify 2 existing |
| Supabase Storage | Latest | Photo uploads | Existing -- add 1 new bucket |
| Supabase Realtime | Latest | Live updates | Existing -- subscribe to new tables |
| Supabase Edge Functions | Latest | Server push | Existing -- extend for new notification types |

### State Management (NO CHANGES)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Zustand | 5.0.12 | Client state | Existing -- add new store slices |

### Photo Pipeline (NO CHANGES)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| expo-camera | 55.0.15 | Photo capture | Existing |
| expo-image-picker | 55.0.18 | Gallery selection | Existing |
| expo-image-manipulator | 55.0.15 | Compression | Existing |
| expo-image | 55.0.8 | Cached display | Existing |

## Alternatives Considered

| Need | Recommended | Alternative | Why Not |
|------|-------------|-------------|---------|
| Username uniqueness | Postgres UNIQUE + LOWER() index | Application-level check | Race conditions. DB constraint is authoritative. |
| Version history storage | Full JSONB snapshot per version | Diff-only storage | Recipes are small (~2KB JSON). Full snapshots avoid complex diff reconstruction. Simpler code, negligible storage cost. |
| Version history | Simple version table | Postgres temporal tables (pg_audit) | Overkill. Simple table with trigger-on-update is readable and sufficient. |
| Recipe comments | New `recipe_comments` table | Reuse `post_comments` with polymorphic target | `post_comments` is kitchen-scoped; recipe comments are user-scoped within household. Different RLS, different identity model. Separate table is cleaner. |
| Cook log photos | Supabase Storage bucket | Base64 in JSONB column | Photos are persistent records (unlike transient vision scans). Storage with CDN is correct for persistent media. |
| @handle validation | Client regex + DB unique constraint | Dedicated Edge Function | `supabase.from('profiles').select().eq()` is sufficient for availability check. No server function needed. |
| Photo gallery | Horizontal ScrollView + expo-image | react-native-image-gallery | Additional dependency for 1-5 photo galleries is unnecessary overhead. |

## What NOT to Add

| Library/Tool | Why Not |
|--------------|---------|
| `react-native-image-gallery` / `react-native-image-zoom-viewer` | Cook log galleries are small (1-5 photos). Horizontal ScrollView + expo-image + optional fullscreen modal is sufficient. |
| `diff` / `json-diff` library | Version history uses full JSONB snapshots. Simple JS object key comparison for display. |
| Any username/mention parsing library | @handle mentions in v8.0 are display-only text (e.g., "Created by @username"), not interactive parsed links. |
| `pg_cron` | No TTL-based cleanup needed. Cook logs and versions are permanent records. |
| New Zustand middleware (immer, etc.) | Existing store patterns use spread-based immutable updates throughout the app. Stay consistent. |

## Critical Implementation Notes

### Username Migration Strategy
The `profiles` table has no `username` column. Adding `NOT NULL` requires a staged migration:
1. Add column as `TEXT UNIQUE` (nullable initially) with `CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles(LOWER(username))`
2. Add onboarding gate: require username setup before accessing any v8.0 social features
3. Existing users prompted to set username on next app open (blocking modal)
4. After adoption period, add `NOT NULL` constraint via subsequent migration

### Recipe Edit Permission Change
Currently any household member can edit any recipe (migration 00003 RLS). v8.0 restricts to creator-only. This is a **behavioral breaking change**:
1. New UPDATE policy: `USING (created_by = auth.uid() OR created_by IS NULL)`
2. Recipes with `created_by IS NULL` (pre-v1.0 imports) retain open editing
3. UI hides edit button for non-creators with clear messaging
4. Drop old "Users can update recipes in their household" UPDATE policy

### Cook Log Photo Storage Pattern
Follow the exact pattern from `src/lib/feedHelpers.ts`:
```
bucket: cook-log-photos
path: {user_id}/{recipe_id}/{timestamp}.jpg
compression: 1024px max dimension, JPEG quality 0.6 (via expo-image-manipulator)
```

### Feed Integration
Extend existing `feed_posts` table with a `type` column rather than creating a new table:
- `'meal_planned'` (default, existing behavior)
- `'recipe_created'` (auto-post when recipe created)
- `'cook_log'` (auto-post when cook log entry created)
Add nullable `recipe_id` FK to link back to source recipe for "View Recipe" actions.

## Postgres Features to Leverage

| Feature | Use Case |
|---------|----------|
| `CREATE UNIQUE INDEX ON profiles(LOWER(username))` | Case-insensitive username uniqueness without citext extension |
| Trigger on `recipes` UPDATE | Auto-create recipe_versions row capturing pre-update snapshot |
| Trigger on `cook_logs` INSERT/DELETE | Maintain `recipes.cook_count` counter (same pattern as like_count, follow_count) |
| `TEXT[]` column for cook_log photos | Array of Storage URLs. Simple, queryable, no junction table for 1-5 photos. |
| `GENERATED ALWAYS` or trigger | Auto-increment `version_number` per recipe in recipe_versions |

## Migration Files Needed

```
00025_add_usernames.sql           -- profiles.username column + unique index + RLS broadening
00026_create_recipe_comments.sql  -- recipe_comments table + RLS + comment_count on recipes
00027_create_cook_logs.sql        -- cook_logs table + RLS + cook_count trigger on recipes
00028_create_recipe_versions.sql  -- recipe_versions table + auto-create trigger on recipes UPDATE
00029_create_cook_log_photos_bucket.sql -- Storage bucket + RLS
00030_extend_feed_posts.sql       -- Add type column + recipe_id FK to feed_posts
00031_recipe_creator_permissions.sql -- Restrict recipe UPDATE to creator
```

## Installation

```bash
# No new npm packages required.
# All features built with existing dependencies.
```

## Sources

- Existing codebase: `supabase/migrations/00001_create_profiles.sql` -- current profiles schema, no username column
- Existing codebase: `supabase/migrations/00003_create_recipes.sql` -- recipes with created_by UUID, household-scoped RLS
- Existing codebase: `supabase/migrations/00018_create_social_tables.sql` -- social table patterns, counter triggers
- Existing codebase: `supabase/migrations/00019_create_meal_photos_bucket.sql` -- Storage bucket + RLS pattern
- Existing codebase: `src/lib/feedHelpers.ts` -- photo upload/compression pattern
- Existing codebase: `package.json` -- current dependency versions (Expo 55, Supabase 2.100+, Zustand 5.0.12)
