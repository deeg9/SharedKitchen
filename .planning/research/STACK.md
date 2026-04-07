# Stack Research

**Domain:** Social feed features for collaborative dinner planning app
**Researched:** 2026-04-06
**Confidence:** HIGH

## Context: What Already Exists

The existing stack handles most of what the social feed needs. This research focuses exclusively on **new additions and pattern changes** required for v5.0.

**Already in place (DO NOT add):**
- `@supabase/supabase-js` ^2.100.0 -- Postgres, Auth, Realtime, Storage, Edge Functions
- `@shopify/flash-list` ^2.3.1 -- performant lists (already used in scan review)
- `expo-notifications` ~55.0.13 -- local notifications + push token registration
- `expo-image-picker` ~55.0.13 -- photo capture
- `expo-image-manipulator` ~55.0.11 -- client-side compression
- `zustand` ^5.0.12 -- state management
- `date-fns` ^4.1.0 -- date formatting
- `react-native-reanimated` 4.2.1 -- animations
- `@gorhom/bottom-sheet` -- modal sheets
- Supabase Realtime (`postgres_changes` + Presence) -- proven patterns in `useGrocerySync`, `useActivityToast`, `usePresence`
- `push_tokens` table with user_id, expo_push_token, RLS policies, and device tracking

## Recommended Stack Additions

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `expo-image` | ~55.0.8 | Cached image rendering in feed | React Native's built-in `Image` (currently used everywhere in the app) has no disk caching, no blurhash placeholders, no progressive loading. A social feed with many meal photos will cause visible loading flicker and memory pressure without these. `expo-image` uses SDWebImage (iOS) under the hood with automatic memory + disk cache management. Part of Expo SDK 55, no native rebuild needed. |
| Supabase Storage | (included in `@supabase/supabase-js`) | Meal photo persistence | Currently photos are transient (base64 in JSON body for vision analysis). Social feed photos must be persisted and served via CDN URLs. Supabase Storage is already part of the installed SDK -- just needs bucket creation and RLS policies. No new dependency. |
| Supabase Database Webhooks + Edge Function | (infrastructure, no npm dep) | Server-side push notifications for social interactions | Current notifications are ALL local (cooking reminders, leftover alerts, budget warnings via `scheduleNotificationAsync`). Social notifications (someone liked your meal, new comment, new follower) require server-triggered push. The existing `push_tokens` table and Expo Push API token registration are already in place. Need one new Edge Function + database webhook triggers. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | -- | -- | -- |

**Why no new supporting libraries:** The social feed features are fundamentally CRUD + real-time subscriptions + image display. The existing stack covers all of this. Adding libraries for "social" features (feed frameworks, notification services, activity stream SDKs) would be over-engineering for a kitchen-following feed with low post volume.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI (`supabase`) | Storage bucket setup, new migrations, Edge Function deployment | Already installed and used for existing Edge Functions |

## Installation

```bash
# Only ONE new package needed
npx expo install expo-image
```

That is the only `npm install` required. Everything else is infrastructure configuration (Supabase Storage buckets, database tables, RLS policies, Edge Functions).

## Key Integration Patterns

### 1. Feed Pagination: Cursor-based with Supabase + FlashList

Use Supabase's `.lt()` cursor for keyset pagination. Do NOT use offset-based `.range(start, end)` pagination because it breaks when new posts are inserted (items get skipped or duplicated).

```typescript
// Pattern: keyset/cursor pagination via created_at
const { data } = await supabase
  .from('feed_posts')
  .select('*, kitchen:kitchens(name, avatar_url), likes_count, comments_count')
  .in('kitchen_id', followedKitchenIds)
  .lt('created_at', cursor) // cursor = last item's created_at
  .order('created_at', { ascending: false })
  .limit(20);
```

Use FlashList's `onEndReached` with `onEndReachedThreshold={0.5}` for infinite scroll trigger. FlashList (`@shopify/flash-list` ^2.3.1) is already installed and used in `ScanReviewScreen` and `ListExtractReviewScreen`.

### 2. Real-time Feed Updates: Follow Existing Patterns

The existing `useGrocerySync` and `useActivityToast` hooks establish the Realtime pattern. For the social feed, create a `useFeedSync` hook. Important constraint:

**Supabase Realtime filter limitation:** `postgres_changes` only supports `eq` filters on a single column, not `in`. For a feed with multiple followed kitchens, two options exist:

- **Option A:** Subscribe to one channel per followed kitchen. Supabase allows up to 100 concurrent channels.
- **Option B (recommended):** Subscribe to ALL inserts on `feed_posts` and filter client-side in the callback. Use a Set of followed kitchen IDs for O(1) lookup.

**Use Option B.** The feed volume for a dinner-planning app is low (a few posts per day per kitchen). Client-side filtering on a single channel is simpler and avoids managing channel-per-follow lifecycle. Matches the existing `useActivityToast` pattern which also subscribes broadly and filters by `currentUserId`.

### 3. Image Handling: Supabase Storage + expo-image

```
Flow: Camera/picker -> expo-image-manipulator (compress to 1024px JPEG 0.6)
      -> Supabase Storage upload -> CDN URL stored in feed_posts.photo_url
      -> expo-image (cached display with blurhash placeholder)
```

- Create a `meal-photos` Storage bucket with public read access (photos are meant to be shared)
- Upload compressed images reusing existing 1024px JPEG 0.6 compression pattern from vision features
- Store the public URL in the `feed_posts.photo_url` column
- Display with `expo-image` which provides: disk caching (SDWebImage), blurhash placeholders during load, memory management for scroll performance, progressive JPEG support

**Do NOT use Supabase Storage signed URLs.** Meal photos in the feed are public to followers -- use `getPublicUrl()` for simple, cacheable CDN URLs without token expiry concerns.

### 4. Push Notifications for Social: Server-side Edge Function

Current architecture: all notifications are LOCAL (scheduled on device via `Notifications.scheduleNotificationAsync`). Social notifications must be SERVER-TRIGGERED because the event originates from another user's device.

```
Flow: User A likes a post
      -> INSERT into likes table
      -> Database Webhook fires on INSERT
      -> Edge Function: send-social-notification
        -> Reads push_tokens for post author (User B)
        -> Sends via Expo Push API: POST https://exp.host/--/api/v2/push/send
        -> Notification arrives on User B's device
```

What already exists:
- `push_tokens` table with `user_id`, `expo_push_token`, RLS policies, device tracking
- `registerPushToken()` function that upserts tokens on app launch
- `NotificationSettings` with `householdActivity` toggle (extend with `socialActivity`)

What needs to be built:
1. One new Edge Function: `send-social-notification`
2. Database webhook triggers on: `likes` INSERT, `comments` INSERT, `follows` INSERT
3. Edge Function looks up recipient's push tokens and sends via Expo Push API
4. Store `EXPO_ACCESS_TOKEN` as Supabase secret (for enhanced push security)
5. Notification deduplication (don't spam if 10 people like a post in quick succession -- batch or throttle)

### 5. State Management: New Zustand Stores

Follow existing store patterns (`groceryStore`, `planStore`, `recipeStore`):

| Store | Responsibility |
|-------|---------------|
| `feedStore` | Feed posts, pagination cursor, loading states, optimistic like/unlike, prepend new posts from Realtime |
| `socialStore` | Follow/unfollow, follower/following counts, followed kitchen IDs (used for feed queries and Realtime filtering) |

Comments can live in `feedStore` as a nested concern (comments are always viewed in context of a post). Do NOT create a separate `commentStore` -- it adds indirection for a simple list.

### 6. Recipe Saving: No New Infrastructure

"Save recipe from feed" is just an INSERT into the existing `recipes` table with the current user's `household_id`. The recipe data comes from the feed post's linked `recipe_id`. This is a simple Supabase query -- no new table needed. Track the save source via a `source_feed_post_id` column on `recipes` or a separate `saved_recipes` junction table if you want to show "saved from [Kitchen Name]" attribution.

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `expo-image` | React Native `Image` (current) | No caching, no placeholders, will cause visible jank in image-heavy feed scroll |
| `expo-image` | `react-native-fast-image` | Unmaintained since 2023, not compatible with Expo managed workflow. `expo-image` is the official Expo replacement with better performance. |
| Supabase Storage | Cloudinary / AWS S3 | Another service to manage, separate billing, separate auth. Supabase Storage is included in the plan, has CDN via `supabase.co/storage/v1/object/public/`, and uses existing RLS auth. |
| Cursor pagination (keyset via `created_at`) | Offset pagination (`.range(0, 20)`) | Offset breaks with real-time inserts: items get skipped or duplicated when new posts push the offset window. |
| Database Webhooks -> Edge Function | Supabase `pg_net` extension | Database webhooks are simpler to configure (visible in Supabase Dashboard), follow documented patterns, and don't require installing a Postgres extension. |
| Client-side Realtime filter (Option B) | Per-kitchen channels (Option A) | Simpler -- one channel, no lifecycle management per follow/unfollow. Feed volume is low enough that filtering a few extra posts client-side is negligible. |
| Separate `feedStore` + `socialStore` | Single monolithic `socialStore` | Violates existing codebase convention of domain-specific stores. Feed pagination state and follow relationship state have different lifecycles. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Stream / GetStream.io | Massive over-engineering. Adds cost ($499+/mo for production), complexity, vendor lock-in. Feed is simple chronological with no algorithmic ranking. | Supabase Postgres + RLS + Realtime |
| React Query / TanStack Query | Codebase uses Zustand exclusively for all data fetching and caching. Adding a second state/cache layer creates confusion about source of truth and doubles the patterns developers must learn. | Zustand stores with pagination state |
| `react-native-fast-image` | Unmaintained since 2023, requires custom dev client, incompatible with Expo managed workflow | `expo-image` |
| Notification service (OneSignal, Knock, Novu) | Push token registration already exists, Expo Push API is straightforward, volume is low. A notification service adds recurring cost for no benefit at this scale. | Direct Expo Push API calls from Edge Function |
| `expo-av` or video players | Out of scope per PROJECT.md ("text + photos only, no video content in recipes"). Don't add video support to feed. | Static images only |
| Algolia / Typesense for kitchen search | Supabase `ilike` or full-text search via `tsvector` is sufficient for finding kitchens by name at this scale (< 10K kitchens). | Supabase `ilike` search |
| Firebase Cloud Messaging directly | Already using Expo Push API which abstracts FCM/APNs. Adding FCM directly bypasses existing push infrastructure and adds a second notification pathway. | Expo Push API via Edge Function |
| WebSocket-based "live feed" | Supabase Realtime `postgres_changes` already provides this. Don't build custom WebSocket handling. | Existing Supabase Realtime pattern |

## Database Schema Additions (no npm deps, just migrations)

These are the Postgres tables needed. All accessed through existing `@supabase/supabase-js`.

| Table | Purpose | Key Columns | Indexes |
|-------|---------|-------------|---------|
| `follows` | Follow relationships between kitchens | `follower_id (UUID, FK users)`, `following_kitchen_id (UUID, FK households)`, `created_at` | Composite unique on (follower_id, following_kitchen_id), index on following_kitchen_id |
| `feed_posts` | Shared meals appearing in feed | `id`, `kitchen_id (FK households)`, `meal_plan_id (FK meal_plans)`, `recipe_id (FK recipes, nullable)`, `photo_url (text, nullable)`, `caption`, `created_at` | Index on (kitchen_id, created_at DESC), index on created_at DESC |
| `likes` | Post likes | `user_id`, `feed_post_id`, `created_at` | Composite unique on (user_id, feed_post_id), index on feed_post_id |
| `comments` | Post comments | `id`, `user_id`, `feed_post_id`, `content (text)`, `created_at` | Index on (feed_post_id, created_at) |
| `kitchen_profiles` | Public kitchen profile data | `household_id`, `display_name`, `bio`, `avatar_url`, `is_public (boolean)`, `created_at` | Index on household_id (unique) |

All tables use RLS following existing patterns (`auth.uid()` checks). The `follows` table needs a policy that allows users to see who follows a kitchen but only modify their own follow records.

**Denormalized counts:** Add `likes_count` and `comments_count` columns to `feed_posts` maintained by Postgres triggers (not computed on every query). This avoids N+1 count queries in the feed list.

## Environment Variables (New)

| Variable | Where | Purpose |
|----------|-------|---------|
| `EXPO_ACCESS_TOKEN` | Supabase Edge Function secrets | Enhanced security for Expo Push API. Set via `supabase secrets set EXPO_ACCESS_TOKEN=...` |

One new secret. The Expo Access Token is created at [expo.dev/accounts/settings/access-tokens](https://expo.dev/accounts/settings/access-tokens).

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `expo-image` ~55.0.8 | Expo SDK 55, React Native 0.83.x | Same SDK versioning scheme as all Expo packages. Must match SDK major version. |
| `@supabase/supabase-js` ^2.100.0 | Supabase Storage, Realtime, Edge Functions | Already installed. Storage API is part of the client -- no version change needed. |
| `@shopify/flash-list` ^2.3.1 | React Native 0.83.x, Reanimated 4.x | Already installed and working. |

## Migration Effort Summary

| Category | Effort | Details |
|----------|--------|---------|
| New npm packages | Minimal | Just `expo-image` (`npx expo install expo-image`) |
| Supabase Storage setup | Low | Create `meal-photos` bucket, add RLS policy for public read, add upload helper |
| Database migrations | Medium | 5 new tables + RLS policies + indexes + 2 count trigger functions |
| Edge Function for push | Medium | One new `send-social-notification` function following existing patterns |
| Database Webhooks | Low | 3 webhook triggers (likes INSERT, comments INSERT, follows INSERT) configured in Dashboard |
| Zustand stores | Medium | 2 new stores (`feedStore`, `socialStore`) following existing patterns |
| Realtime subscription | Low | One new `useFeedSync` hook following `useGrocerySync` pattern |
| Feed UI components | Medium-High | Feed card, comment sheet, kitchen profile screen, follow button -- but these are UI, not stack |

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- expo-image version 55.0.8 confirmed compatible with SDK 55 (HIGH confidence)
- [expo-image npm](https://www.npmjs.com/package/expo-image) -- Latest version 55.0.8, uses SDWebImage on iOS (HIGH confidence)
- [Expo Image Documentation](https://docs.expo.dev/versions/latest/sdk/image/) -- Caching, blurhash, progressive loading features confirmed (HIGH confidence)
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications) -- Edge Function + Database Webhook pattern for Expo Push confirmed as official pattern (HIGH confidence)
- Codebase: `src/hooks/useGrocerySync.ts` -- Realtime `postgres_changes` subscription pattern (HIGH confidence)
- Codebase: `src/hooks/useActivityToast.ts` -- Broad subscription + client-side filter pattern (HIGH confidence)
- Codebase: `src/lib/notifications.ts` -- Push token registration, local notification scheduling, existing `NotificationSettings` (HIGH confidence)
- Codebase: `supabase/migrations/00013_create_push_tokens.sql` -- Push token table schema confirmed (HIGH confidence)
- Codebase: `package.json` -- All existing dependency versions verified (HIGH confidence)

---
*Stack research for: SharedKitchen v5.0 Social Feed*
*Researched: 2026-04-06*
