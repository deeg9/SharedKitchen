# Architecture Research

**Domain:** Social feed features for collaborative dinner planning app (SharedKitchen v5.0)
**Researched:** 2026-04-06
**Confidence:** HIGH

## System Overview

```
Existing Architecture (unchanged)
===================================
React Native + Expo  -->  Supabase (Postgres + Auth + Realtime + Storage + Edge Functions)
Zustand stores       -->  RLS policies scoped to household_id via is_household_member()

New Social Layer (v5.0)
===================================
┌──────────────────────────────────────────────────────────────────┐
│                        UI Layer                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ FeedTab  │  │ FeedCard  │  │ Comments │  │ KitchenProfile │  │
│  │ (Plan)   │  │ Component │  │ Sheet    │  │ Screen         │  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬─────────┘  │
│       └───────────────┴─────────────┴───────────────┘            │
├──────────────────────────────────────────────────────────────────┤
│                     State Layer (Zustand)                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │ feedStore  │  │ socialStore │  │ recipeStore  │ (modified)   │
│  │ (NEW)      │  │ (NEW)       │  │ +saveFromFeed│              │
│  └────────────┘  └─────────────┘  └──────────────┘              │
├──────────────────────────────────────────────────────────────────┤
│                    Data Layer (Supabase)                          │
│  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐ │
│  │ feed_posts   │  │ follows  │  │ post_likes │  │ post_     │ │
│  │              │  │          │  │            │  │ comments  │ │
│  └──────────────┘  └──────────┘  └────────────┘  └───────────┘ │
│  ┌──────────────────┐  ┌─────────────────────┐                  │
│  │ kitchen_profiles │  │ meal-photos bucket  │                  │
│  └──────────────────┘  └─────────────────────┘                  │
├──────────────────────────────────────────────────────────────────┤
│                    Real-time Layer                                │
│  ┌──────────────────────────────────────────────┐                │
│  │ postgres_changes on post_likes, post_comments│                │
│  │ (NOT on feed_posts -- poll/manual refresh)   │                │
│  └──────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `feedStore` (NEW) | Feed data, pagination, like/unlike, post creation | Zustand store, cursor-based fetch |
| `socialStore` (NEW) | Follows, follower counts, kitchen discovery | Zustand store, follow/unfollow actions |
| `recipeStore` (MODIFIED) | Add `saveRecipeFromFeed()` to clone recipe into household | Extend existing store |
| `FeedCard` (NEW) | Render single feed post with interactions | Component in `src/components/feed/` |
| `CommentsSheet` (NEW) | Bottom sheet for viewing/adding comments | Component in `src/components/feed/` |
| `KitchenProfile` (NEW) | Public view of a kitchen's recent meals | Screen in `app/(app)/kitchen/` |
| `useFeedSync` (NEW) | Realtime subscription for likes/comments on visible posts | Hook in `src/hooks/` |

## Database Schema

### New Tables

#### `kitchen_profiles`
Public-facing profile for a household. Decoupled from `households` so private data stays private.

```sql
CREATE TABLE kitchen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Rationale:** The existing `households` table contains private data (invite_code, created_by). A separate `kitchen_profiles` table lets us expose only what should be public, with simple RLS: anyone can SELECT public profiles; only household admins can UPDATE their own.

#### `follows`
User-to-kitchen follow relationship (not user-to-user, because kitchens are the social unit).

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_user_id, following_kitchen_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_user_id);
CREATE INDEX idx_follows_following ON follows(following_kitchen_id);
```

**Key decision:** Users follow kitchens (households), not individual users. This matches SharedKitchen's household-centric model where meals belong to households.

#### `feed_posts`
Auto-generated when a meal is added to a plan (with share toggle).

```sql
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  posted_by UUID NOT NULL REFERENCES profiles(id),
  caption TEXT,
  photo_url TEXT,
  meal_name TEXT NOT NULL,
  meal_type TEXT,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_posts_kitchen ON feed_posts(kitchen_id);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
-- Composite index for feed query (fan-out-on-read)
CREATE INDEX idx_feed_posts_kitchen_created ON feed_posts(kitchen_id, created_at DESC);
```

**Key decisions:**
- `meal_name` is denormalized from meal_plan/recipe so posts survive if the source meal is deleted.
- `like_count` and `comment_count` are denormalized counters updated via triggers. Avoids COUNT(*) on every feed card render.
- `recipe_id` is nullable -- recipe-less meals (photo meal logging from v4.0) can still be shared.

#### `post_likes`

```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

#### `post_comments`

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_post_comments_post_created ON post_comments(post_id, created_at);
```

#### `saved_recipes` (bridge table)

```sql
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  target_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_recipe_id)
);
```

**Rationale:** When a user saves a recipe from the feed, we clone it into their household's `recipes` table (so they own it). `saved_recipes` tracks the lineage to avoid duplicate saves and could show "saved from Kitchen X."

### Denormalized Counter Triggers

```sql
-- Like count trigger
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Comment count trigger (same pattern)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
```

## RLS Policies

### Design Principle: Social data is public-by-read, private-by-write

Unlike existing household-scoped RLS (`is_household_member()`), social tables use a different model:
- **Read:** Visible if the kitchen is public OR the user follows the kitchen
- **Write:** Only the owner/author can create/modify

### RLS Helper Function

```sql
-- Check if user follows a kitchen or is a member of that kitchen's household
CREATE OR REPLACE FUNCTION can_view_kitchen(p_kitchen_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kitchen_profiles kp
    WHERE kp.id = p_kitchen_id
    AND (
      kp.is_public = true
      OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_user_id = p_user_id AND f.following_kitchen_id = p_kitchen_id)
      OR EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = kp.household_id AND hm.user_id = p_user_id)
    )
  );
$$;
```

**Performance note:** Using `SECURITY DEFINER` avoids recursive RLS checks (same pattern as existing `is_household_member`). The function short-circuits on `is_public = true` for the common case.

### Policy Examples

```sql
-- kitchen_profiles: public profiles readable by anyone authenticated
CREATE POLICY "Anyone can view public kitchens"
  ON kitchen_profiles FOR SELECT
  USING (is_public = true OR is_household_member(household_id, auth.uid()));

CREATE POLICY "Household admins can update kitchen profile"
  ON kitchen_profiles FOR UPDATE
  USING (is_household_admin(household_id, auth.uid()));

-- follows: users manage their own follows
CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  USING (follower_user_id = auth.uid() OR following_kitchen_id IN (
    SELECT id FROM kitchen_profiles WHERE is_household_member(household_id, auth.uid())
  ));

CREATE POLICY "Users can follow kitchens"
  ON follows FOR INSERT
  WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (follower_user_id = auth.uid());

-- feed_posts: visible to followers and own household
CREATE POLICY "Users can view feed posts from followed kitchens"
  ON feed_posts FOR SELECT
  USING (can_view_kitchen(kitchen_id, auth.uid()));

CREATE POLICY "Household members can create posts"
  ON feed_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kitchen_profiles kp
    WHERE kp.id = kitchen_id
    AND is_household_member(kp.household_id, auth.uid())
  ));

-- post_likes: viewable on visible posts, users manage their own
CREATE POLICY "Users can view likes on visible posts"
  ON post_likes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feed_posts fp
    WHERE fp.id = post_likes.post_id
    AND can_view_kitchen(fp.kitchen_id, auth.uid())
  ));

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike"
  ON post_likes FOR DELETE
  USING (user_id = auth.uid());

-- post_comments: same visibility as likes
CREATE POLICY "Users can view comments on visible posts"
  ON post_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feed_posts fp
    WHERE fp.id = post_comments.post_id
    AND can_view_kitchen(fp.kitchen_id, auth.uid())
  ));

CREATE POLICY "Users can add comments"
  ON post_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (user_id = auth.uid());
```

## Architectural Patterns

### Pattern 1: Fan-Out-on-Read for Feed

**What:** When a user opens the feed, query all posts from kitchens they follow, sorted by created_at DESC. No pre-materialized timeline table.

**Why this over fan-out-on-write:** SharedKitchen is a small-scale social app (households, not millions of followers). Fan-out-on-write adds complexity (materialized feed tables, async workers) that is not justified. Fan-out-on-read with proper indexes handles the scale SharedKitchen will see.

**Trade-offs:**
- PRO: Simple schema, no write amplification, no stale-feed bugs
- PRO: New follows immediately show historical posts (no backfill needed)
- CON: Feed query joins follows + feed_posts (mitigated by composite index)
- CON: Theoretically slower at extreme scale (irrelevant for this app)

**Feed Query:**
```sql
SELECT fp.*, kp.display_name, kp.avatar_url,
  EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = fp.id AND pl.user_id = $1) as is_liked
FROM feed_posts fp
JOIN kitchen_profiles kp ON kp.id = fp.kitchen_id
WHERE fp.kitchen_id IN (
  SELECT following_kitchen_id FROM follows WHERE follower_user_id = $1
)
AND fp.created_at < $2  -- cursor: last post's created_at
ORDER BY fp.created_at DESC
LIMIT 20;
```

**Supabase client equivalent:**
```typescript
const { data } = await supabase
  .from('feed_posts')
  .select(`
    *,
    kitchen_profiles!inner(display_name, avatar_url),
    post_likes!left(user_id)
  `)
  .in('kitchen_id', followedKitchenIds)
  .lt('created_at', cursor)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Pattern 2: Cursor-Based Pagination

**What:** Use `created_at` as the cursor for infinite scroll, not offset-based pagination.

**Why:** Offset-based pagination breaks when new posts are inserted (items shift). Cursor-based pagination is stable and performant with the `idx_feed_posts_kitchen_created` index.

**Implementation:**
```typescript
// In feedStore
fetchFeed: async (followedIds: string[], cursor?: string) => {
  let query = supabase
    .from('feed_posts')
    .select('*, kitchen_profiles(display_name, avatar_url)')
    .in('kitchen_id', followedIds)
    .order('created_at', { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  // ...
  const nextCursor = data.length === 20 ? data[data.length - 1].created_at : null;
  return { posts: data, nextCursor };
}
```

**React Native infinite scroll:** Use `FlatList` with `onEndReached` to trigger next page fetch. The cursor is the `created_at` of the last post in the current list.

### Pattern 3: Optimistic UI for Likes

**What:** Update like state locally before server confirms.

**Why:** Like/unlike must feel instant. Network round-trip would make the app feel sluggish.

```typescript
toggleLike: async (postId: string, userId: string, isLiked: boolean) => {
  // Optimistic update
  set((state) => ({
    posts: state.posts.map(p =>
      p.id === postId
        ? { ...p, is_liked: !isLiked, like_count: p.like_count + (isLiked ? -1 : 1) }
        : p
    ),
  }));

  try {
    if (isLiked) {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    }
  } catch {
    // Rollback on failure
    set((state) => ({
      posts: state.posts.map(p =>
        p.id === postId
          ? { ...p, is_liked: isLiked, like_count: p.like_count + (isLiked ? 1 : -1) }
          : p
      ),
    }));
  }
}
```

### Pattern 4: Auto-Post with Share Toggle

**What:** When a meal is added to the plan, auto-create a feed post if the kitchen has sharing enabled. Add a toggle on the meal assignment bottom sheet.

**Implementation approach:** Extend `planStore.assignRecipe()` to optionally create a `feed_posts` row. The share toggle default comes from `kitchen_profiles.is_public`. Users can override per-meal.

```typescript
// In planStore.assignRecipe(), after successful meal plan insert:
if (shouldShare && kitchenProfileId) {
  await supabase.from('feed_posts').insert({
    kitchen_id: kitchenProfileId,
    meal_plan_id: mealPlanId,
    recipe_id: recipeId,
    posted_by: userId,
    meal_name: recipeName || notes || 'Unnamed meal',
    meal_type: mealType,
    photo_url: photoUrl,
  });
}
```

## Data Flow

### Feed Loading Flow

```
User opens Plan tab -> FeedSegment active
    |
feedStore.fetchFeed(followedKitchenIds, null)
    |
Supabase query: feed_posts JOIN kitchen_profiles
WHERE kitchen_id IN (followed) ORDER BY created_at DESC LIMIT 20
    |
RLS: can_view_kitchen() checks public OR follows OR membership
    |
Response -> feedStore.posts[] -> FlatList renders FeedCards
    |
onEndReached -> feedStore.fetchFeed(followedKitchenIds, lastCursor)
```

### Like Flow

```
User taps heart icon on FeedCard
    |
feedStore.toggleLike(postId, userId, isLiked)
    |
Optimistic: update local state immediately
    |
Supabase: INSERT/DELETE post_likes
    |
DB trigger: update feed_posts.like_count +/- 1
    |
Success -> no action (already updated)
Error -> rollback local state
```

### Recipe Save Flow

```
User taps "Save Recipe" on FeedCard
    |
recipeStore.saveRecipeFromFeed(sourceRecipeId, targetHouseholdId)
    |
1. Fetch source recipe (RLS allows via can_view_kitchen)
2. Clone into target household's recipes (new ID, new household_id)
3. Insert saved_recipes row (tracks lineage)
    |
Toast: "Recipe saved to your kitchen!"
```

### Post Creation Flow

```
User assigns meal in Plan tab (existing assignRecipe flow)
    |
Share toggle checked? (default: kitchen_profiles.is_public)
    |
YES -> planStore creates meal_plan row + feed_posts row
NO  -> planStore creates meal_plan row only (existing behavior)
```

## Real-Time Strategy

### What to make real-time and what not to

| Data | Real-time? | Mechanism | Rationale |
|------|-----------|-----------|-----------|
| New feed posts | NO | Pull-to-refresh | Feed refresh is user-initiated; postgres_changes on a multi-kitchen query is expensive |
| Likes on visible posts | YES (lightweight) | postgres_changes on post_likes filtered by post_id | Only subscribe to posts currently visible on screen; manageable scale |
| Comments on open post | YES | postgres_changes on post_comments filtered by post_id | Only when comments sheet is open; single post scope |
| Follow/unfollow | NO | Immediate local state update | Rare action, no real-time need |
| Like/comment counts | NO | Denormalized in feed_posts, updated by triggers | Counts refresh on next feed fetch |

**Critical constraint from Supabase docs:** postgres_changes processes on a single thread and every change event triggers an RLS check per subscriber. Subscribing all users to all feed_posts changes would create a bottleneck. Instead, subscribe only to specific post_ids when actively viewing interactions.

```typescript
// useFeedSync.ts -- only subscribe to likes/comments on visible posts
export function useFeedSync(visiblePostIds: string[]) {
  useEffect(() => {
    if (visiblePostIds.length === 0) return;

    const channel = supabase
      .channel('feed-interactions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=in.(${visiblePostIds.join(',')})`,
      }, (payload) => {
        useFeedStore.getState()._addComment(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [visiblePostIds.join(',')]);
}
```

## Image Storage for Meal Photos

### New Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (feed photos are public)
CREATE POLICY "Public read for meal photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos');

-- Authenticated upload
CREATE POLICY "Authenticated upload meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');

-- Users can delete own photos (stored as {user_id}/{filename})
CREATE POLICY "Users can delete own meal photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Photo handling:** Reuse the existing `expo-image-manipulator` compression pipeline from v4.0 (1024px JPEG 0.6). Upload to `meal-photos/{user_id}/{uuid}.jpg` via Supabase Storage. Store the public URL in `feed_posts.photo_url`.

**Difference from v4.0 vision flow:** v4.0 uses base64 in JSON body because images are transient (analyzed by Gemini, not stored). Feed photos ARE persisted, so they go to Storage.

## Recommended Project Structure

```
src/
├── stores/
│   ├── feedStore.ts          # NEW: feed posts, pagination, likes
│   ├── socialStore.ts        # NEW: follows, kitchen profiles, discovery
│   ├── recipeStore.ts        # MODIFIED: add saveRecipeFromFeed()
│   └── planStore.ts          # MODIFIED: add share toggle to assignRecipe()
├── hooks/
│   ├── useFeedSync.ts        # NEW: realtime for visible post interactions
│   └── ... (existing hooks unchanged)
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx       # NEW: single post card (photo, caption, interactions)
│   │   ├── FeedList.tsx       # NEW: FlatList with infinite scroll
│   │   ├── LikeButton.tsx     # NEW: heart icon with optimistic toggle
│   │   ├── CommentsSheet.tsx  # NEW: bottom sheet for comments
│   │   ├── ShareToggle.tsx    # NEW: toggle for meal assignment sheet
│   │   └── KitchenAvatar.tsx  # NEW: kitchen avatar + name row
│   ├── plan/
│   │   └── ... (existing, MODIFIED to add feed segment)
│   └── ... (existing unchanged)
├── types/
│   └── database.ts            # MODIFIED: add social table types
└── lib/
    └── supabase.ts            # UNCHANGED
app/
├── (app)/
│   ├── (tabs)/
│   │   └── plan.tsx           # MODIFIED: add segmented control (My Plan | Feed)
│   ├── kitchen/
│   │   └── [id].tsx           # NEW: kitchen profile screen
│   └── ... (existing unchanged)
```

## Integration Points with Existing Architecture

### Existing Tables Referenced by Social Tables

| Social Table | References | Relationship |
|-------------|-----------|--------------|
| `kitchen_profiles` | `households(id)` | 1:1 -- each household has one public profile |
| `feed_posts` | `meal_plans(id)`, `recipes(id)`, `profiles(id)` | Source meal, source recipe, posting user |
| `follows` | `profiles(id)`, `kitchen_profiles(id)` | User follows kitchen |
| `saved_recipes` | `recipes(id)` x2 | Source recipe -> cloned recipe |

### Existing Stores Modified

| Store | Modification | Details |
|-------|-------------|---------|
| `planStore` | Add share toggle param to `assignRecipe()` | Optional `shouldShare` boolean + feed_posts insert |
| `recipeStore` | Add `saveRecipeFromFeed()` action | Clone recipe into user's household |
| `householdStore` | Add `kitchenProfile` state | Fetch/create kitchen profile for active household |

### Existing Components Modified

| Component | Modification |
|-----------|-------------|
| Plan tab (`plan.tsx`) | Add segmented control: "My Plan" (existing) vs "Feed" (new FeedList) |
| Meal assignment bottom sheet | Add ShareToggle component |
| Profile screen | Add follower/following counts, link to kitchen profile setup |

### New Screens/Routes

| Route | Purpose |
|-------|---------|
| `app/(app)/kitchen/[id].tsx` | Public kitchen profile with recent posts |
| Comments are a bottom sheet, not a route | Keeps navigation simple |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Fan-out-on-read with current schema is perfectly fine. Single Postgres instance handles it. |
| 1k-10k users | Add `pg_trgm` index on kitchen_profiles.display_name for search. Monitor RLS policy performance on feed query. Consider caching followed kitchen IDs in feedStore to avoid re-fetching. |
| 10k+ users | If feed query slows: add a materialized `user_feed` table (fan-out-on-write via trigger). Switch feed real-time to Broadcast instead of postgres_changes. This is unlikely to be needed. |

### First Bottleneck: Feed Query Performance

The feed query joins follows + feed_posts. With the composite index `(kitchen_id, created_at DESC)` and limited to 20 rows, this should stay fast until a user follows hundreds of kitchens. Monitor with `EXPLAIN ANALYZE`.

### Second Bottleneck: RLS on Social Tables

The `can_view_kitchen()` function does up to 3 subqueries. Being `SECURITY DEFINER` with `STABLE` marking helps Postgres cache results within a transaction. If it becomes slow, consider a materialized view of follow relationships.

## Anti-Patterns

### Anti-Pattern 1: Subscribing All Users to All Feed Changes via Realtime

**What people do:** Subscribe to `postgres_changes` on `feed_posts` table globally to show new posts in real-time.
**Why it's wrong:** Every insert triggers an RLS authorization check for every subscriber. At 100 users, a single post triggers 100 RLS checks on a single thread. This is the documented Supabase Realtime bottleneck.
**Do this instead:** Use pull-to-refresh for new feed posts. Only use postgres_changes for scoped interactions (likes/comments on specific post_ids currently on screen).

### Anti-Pattern 2: Storing Feed Photos as Base64 in the Database

**What people do:** Store meal photos as base64 strings in feed_posts rows (following the v4.0 vision pattern).
**Why it's wrong:** Feed photos are displayed repeatedly to many users. Base64 in Postgres bloats the table, increases query transfer size, and cannot be CDN-cached.
**Do this instead:** Upload to Supabase Storage `meal-photos` bucket. Store the public URL in `feed_posts.photo_url`. Storage is CDN-backed.

### Anti-Pattern 3: COUNT(*) for Like/Comment Counts on Every Render

**What people do:** Query `SELECT COUNT(*) FROM post_likes WHERE post_id = X` for every feed card.
**Why it's wrong:** N+1 query problem. 20 feed cards = 20 count queries.
**Do this instead:** Denormalize counts into `feed_posts.like_count` and `comment_count`, maintained by triggers.

### Anti-Pattern 4: Fan-Out-on-Write at This Scale

**What people do:** Create a `user_feed` materialized timeline table that gets a row inserted for every follower when a post is created.
**Why it's wrong:** Adds write amplification, requires async workers or triggers, creates consistency issues, and is unnecessary for an app where users follow dozens of kitchens, not millions.
**Do this instead:** Fan-out-on-read with proper indexes. Revisit only if query performance degrades at 10k+ users.

## Suggested Build Order

Based on dependency analysis:

1. **Database foundation** - Migrations for all new tables, RLS policies, triggers, storage bucket
2. **Kitchen profiles + follows** - `kitchen_profiles` table, `socialStore`, follow/unfollow UI, kitchen profile screen
3. **Feed posts + display** - `feed_posts` table, `feedStore`, FeedCard component, FeedList with pagination, Plan tab segmented control
4. **Auto-post from plan** - Modify `planStore.assignRecipe()` with share toggle, meal photo upload to Storage
5. **Interactions** - Likes (optimistic UI), comments (bottom sheet), real-time sync for visible posts
6. **Recipe saving** - `saveRecipeFromFeed()`, saved_recipes tracking

**Rationale:** Each phase builds on the previous. Kitchen profiles must exist before follows. Follows must exist before the feed query works. Feed display must work before interactions make sense. Recipe saving is independent and can come last.

## Sources

- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks) -- postgres_changes single-thread limitation, Broadcast alternative
- [Supabase Postgres Changes Docs](https://supabase.com/docs/guides/realtime/postgres-changes) -- subscription patterns, filter syntax
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- SECURITY DEFINER pattern, policy structure
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- bucket policies
- [Fan-Out Patterns - GetStream](https://getstream.io/glossary/fan-out/) -- fan-out-on-read vs write tradeoffs
- [Supabase Pagination Discussion](https://github.com/orgs/supabase/discussions/2141) -- cursor-based pagination patterns
- Existing codebase: `is_household_member()` SECURITY DEFINER pattern from `00002_create_households.sql`
- Existing codebase: Storage bucket RLS from `00008_create_storage_buckets.sql`
- Existing codebase: postgres_changes pattern from `src/hooks/useGrocerySync.ts`

---
*Architecture research for: SharedKitchen v5.0 Social Feed*
*Researched: 2026-04-06*
