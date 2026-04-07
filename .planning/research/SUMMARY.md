# Project Research Summary

**Project:** SharedKitchen v5.0 -- Social Feed
**Domain:** Social feed features for collaborative household dinner planning app
**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

SharedKitchen v5.0 adds a social feed layer to an existing household meal planning app built on React Native (Expo SDK 55) with Supabase as the backend. The key architectural insight across all research is that the social layer must be a clean, decoupled addition -- not a modification of existing household-scoped infrastructure. The existing codebase already provides nearly everything needed: Supabase client, FlashList for performant lists, Realtime subscriptions, push token registration, image capture/compression, and Zustand state management. Only one new npm package is required (`expo-image` for cached feed photo rendering). Everything else is infrastructure configuration (database tables, RLS policies, Storage buckets, one Edge Function).

The recommended approach is fan-out-on-read with a denormalized `feed_posts` table that snapshots shareable meal data. Kitchens (households) are the social unit, not individual users -- this is SharedKitchen's primary differentiator against Cookpad, Whisk, and Allrecipes, all of which use individual-user social models. Auto-posting from the meal plan with zero content-creation friction (the Venmo model) is the second differentiator. The feed query uses cursor-based pagination over a composite index, likes/comments use denormalized counters maintained by triggers, and Realtime is scoped narrowly to visible post interactions only (not the full feed).

The dominant risk is household data leakage. The entire existing data model sits behind strict `is_household_member()` RLS gates. Adding social visibility requires a separate public-facing data layer (`kitchen_profiles`, `feed_posts`) that never JOINs to private household tables. Every pitfall researcher and architecture decision converges on this: the social layer is a snapshot layer, not a live view into household data. Secondary risks include RLS performance degradation on follow-based queries (mitigated by SECURITY DEFINER functions and `(select auth.uid())` wrapping), notification spam from social activity (mitigated by deferring push notifications to in-app indicators only for v5.0), and missing moderation tools alongside comments (mitigated by shipping a basic report/block system in the same phase as comments).

## Key Findings

### Recommended Stack

The existing stack covers nearly all requirements. SharedKitchen already uses Supabase (Postgres, Auth, Realtime, Storage, Edge Functions), FlashList, expo-notifications, expo-image-picker, expo-image-manipulator, Zustand, and Reanimated. The social feed is fundamentally CRUD plus real-time subscriptions plus image display -- no new frameworks needed.

**Core additions:**
- `expo-image` ~55.0.8: Cached image rendering with blurhash placeholders and disk caching (SDWebImage) -- React Native's built-in Image has no caching and will cause visible jank in an image-heavy feed
- Supabase Storage `meal-photos` bucket: Persisting meal photos as CDN-served URLs instead of transient base64 (which is how v4.0 vision features work)
- Supabase Database Webhooks + Edge Function: Server-triggered push notifications for social interactions (existing notifications are all local/device-scheduled)

**Explicitly avoid:** GetStream ($499+/mo, over-engineering), React Query (codebase uses Zustand exclusively), react-native-fast-image (unmaintained, incompatible with Expo), OneSignal/Knock/Novu (existing Expo Push API is sufficient), video players (out of scope), Algolia (Supabase ilike is sufficient at this scale).

### Expected Features

**Must have (table stakes):**
- Kitchen-to-kitchen follow/unfollow with asymmetric model (like Instagram, not mutual friends)
- Chronological feed of meals from followed kitchens with cursor-based pagination
- Feed cards: kitchen avatar, meal name, day/slot context, recipe photo, timestamp
- Like (heart) on feed items with optimistic UI
- Flat comments (no threading)
- Save recipe from feed to own library (clone with provenance tracking)
- Share toggle per meal (controls what auto-posts)
- Kitchen profile (public view: name, avatar, bio, recipe count, follower counts)
- Push notifications for social events (followers, likes, comments)
- Kitchen discovery/search

**Should have (differentiators):**
- Household-level social identity (kitchens follow kitchens, unique in the cooking app space)
- Meal context in feed (day + slot, not just recipe name)
- Auto-post from meal plan with zero friction (Venmo model)
- Cooksnap-style meal photos leveraging v4.0 camera infrastructure
- "Cook This Too" one-tap add-to-plan from feed

**Defer (v5.x/v6+):**
- Comment threading/replies
- Public global feed / explore tab
- Algorithmic feed ranking
- Direct messaging between kitchens
- Emoji reactions beyond heart
- Stories / ephemeral content

### Architecture Approach

The architecture adds a clean social layer on top of the existing Supabase + Zustand stack. Five new database tables (`kitchen_profiles`, `follows`, `feed_posts`, `post_likes`, `post_comments`) with independent RLS policies that never touch existing household-scoped tables. Two new Zustand stores (`feedStore` for feed data/pagination/likes, `socialStore` for follows/kitchen profiles). Fan-out-on-read for the feed query (no materialized timeline table -- unnecessary at SharedKitchen's scale). Realtime is used sparingly: pull-to-refresh for new posts, postgres_changes only for likes/comments on currently visible posts.

**Major components:**
1. `feedStore` + `FeedList`/`FeedCard` -- Feed data, cursor pagination, infinite scroll, optimistic likes
2. `socialStore` + `KitchenProfile` screen -- Follow relationships, kitchen profiles, discovery/search
3. `useFeedSync` hook -- Scoped Realtime subscriptions for interactions on visible posts only
4. `send-social-notification` Edge Function -- Server-triggered push via Expo Push API on like/comment/follow inserts
5. `meal-photos` Storage bucket + `expo-image` -- Photo persistence and cached display with blurhash placeholders

### Critical Pitfalls

1. **Household data leakage** -- The biggest risk. Never JOIN live household tables for feed display. `feed_posts` must be a snapshot of shareable data. Zero modifications to existing RLS policies on household-scoped tables. Audit every migration.
2. **User identity exposure across household boundaries** -- Create `kitchen_profiles` as the public-facing entity. Feed posts reference kitchen_profile_id, never user_id or household_id directly. Do not modify existing profiles/households SELECT policies.
3. **Default-public sharing without opt-in** -- Default share toggle to OFF. Require explicit opt-in per meal or kitchen-level setting. Show education prompt on first enable.
4. **RLS performance on follow-based queries** -- Wrap `auth.uid()` in `(select auth.uid())`, use SECURITY DEFINER functions for follow lookups, add composite indexes on follows and feed_posts.
5. **Notification spam killing household notification value** -- Do NOT send push for social activity in v5.0 initial release. Use in-app indicators only. If added later, use separate notification category with independent toggle.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Database Foundation and Kitchen Identity

**Rationale:** Every other phase depends on the data model. Kitchen profiles must exist before follows. Follows must exist before the feed query. The RLS design is the architectural firewall between private household data and public social data -- getting this wrong is the highest-risk pitfall.
**Delivers:** All 5 new database tables with RLS policies, triggers for denormalized counters, Storage bucket for meal photos, `kitchen_profiles` CRUD, helper functions (`can_view_kitchen`, `get_followed_kitchen_ids`).
**Addresses:** Feed item data model, kitchen profile, share toggle data layer (is_shared default FALSE).
**Avoids:** Pitfall 1 (data leakage), Pitfall 2 (identity exposure), Pitfall 4 (N+1 queries via denormalized schema), Pitfall 5 (RLS performance via proper indexes and SECURITY DEFINER).

### Phase 2: Follow System and Kitchen Discovery

**Rationale:** The follow graph must exist before the feed has any content to show. Follow/unfollow is the core social primitive that everything builds on.
**Delivers:** `socialStore`, follow/unfollow UI, kitchen search/discovery, kitchen profile screen, follower/following counts.
**Addresses:** Follow/unfollow kitchens, kitchen discovery/search, kitchen profile public view.
**Avoids:** Empty feed state (users build their follow graph before seeing the feed).

### Phase 3: Feed Display and Auto-Post

**Rationale:** With kitchen profiles and follows in place, the feed can now query and display content. Auto-post from meal plan creates the content that populates the feed.
**Delivers:** `feedStore` with cursor pagination, FeedList/FeedCard components, Plan tab segmented control (My Plan | Feed), auto-post from `planStore.assignRecipe()` with share toggle, meal photo upload to Storage, `expo-image` integration for cached display.
**Addresses:** Chronological feed, feed cards, auto-post with share toggle, meal photos on feed.
**Uses:** `expo-image` (new), Supabase Storage `meal-photos` bucket, FlashList (existing).

### Phase 4: Social Interactions

**Rationale:** Interactions (likes, comments, save recipe) attach to feed items -- the feed must exist and have content first. Moderation tools (report/block) MUST ship alongside comments.
**Delivers:** Like/unlike with optimistic UI, comments bottom sheet, `useFeedSync` for real-time interaction updates, save recipe from feed, report/block system, comment rate limiting.
**Addresses:** Likes, comments, save recipe from feed, basic moderation.
**Avoids:** Pitfall 6 (no moderation alongside comments), Pitfall 7 (notification spam -- use in-app indicators only, no push).

### Phase 5: Server-Side Push Notifications

**Rationale:** Push notifications are the engagement loop but are the highest risk for spam and user annoyance. Defer to last phase so the social features are validated before adding push. In-app indicators from Phase 4 provide engagement feedback in the interim.
**Delivers:** `send-social-notification` Edge Function, database webhooks on likes/comments/follows, notification deduplication/batching, separate notification category with independent toggle in settings.
**Addresses:** Push notifications for social events.
**Avoids:** Pitfall 7 (notification spam) by shipping as a separate, carefully controlled phase.

### Phase Ordering Rationale

- Dependency chain: Database schema -> kitchen profiles -> follows -> feed content -> feed display -> interactions -> notifications. Each phase produces what the next phase consumes.
- Risk front-loading: The highest-risk pitfall (data leakage) is addressed in Phase 1 before any UI work begins. RLS design is validated before any social data flows.
- Privacy-first: Share toggle defaults to OFF, social is opt-in and additive, push notifications are deferred to the final phase.
- Existing code stability: No existing Plan tab workflows are disrupted until Phase 3, which adds a segmented control rather than replacing content.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** RLS policy design for social tables needs careful review -- the interaction between `can_view_kitchen()`, existing `is_household_member()`, and Supabase's per-row RLS evaluation is nuanced. Run EXPLAIN ANALYZE on feed queries with realistic data volumes.
- **Phase 5:** Notification deduplication/batching strategy needs design. How to avoid spamming when 10 people like a post in quick succession. Expo Push API rate limits and batching patterns need verification.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Well-documented asymmetric follow pattern. Simple CRUD on follows table.
- **Phase 3:** Cursor-based pagination with FlashList is a standard pattern. Auto-post is a simple INSERT trigger.
- **Phase 4:** Optimistic like toggle, flat comment list, bottom sheet -- all well-established React Native patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only one new npm package needed. All other stack elements already installed and proven in the codebase. Version compatibility verified against Expo SDK 55. |
| Features | HIGH | Feature landscape well-documented across Cookpad, Venmo, Whisk, and Allrecipes comparables. Clear dependency chain and MVP definition. |
| Architecture | HIGH | Fan-out-on-read at this scale is well-justified. Schema design follows established Supabase patterns. Existing codebase conventions (Zustand stores, Realtime hooks, RLS functions) provide clear templates. |
| Pitfalls | HIGH | All pitfalls sourced from Supabase documentation, existing codebase analysis, and documented social feature failure patterns. Prevention strategies are concrete and phase-mapped. |

**Overall confidence:** HIGH

### Gaps to Address

- **Expo Push API batching limits:** The exact rate limits and optimal batching strategy for Expo Push API when sending social notifications to many recipients need verification during Phase 5 planning.
- **Multi-household feed context:** When a user belongs to multiple households, which kitchen identity is active for social actions? The architecture assumes active household context but the exact UX flow for switching needs design during Phase 2 planning.
- **Recipe cloning edge cases:** When saving a recipe from feed, how to handle recipes with photos stored in the source household's Storage path. Need to verify whether photo URLs remain accessible or need to be copied during Phase 4 planning.
- **Supabase Realtime `in` filter support:** The architecture recommends filtering post_likes/post_comments by `post_id=in.(...)` but the exact filter syntax and limitations for array-based filters in postgres_changes need verification during Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- Expo SDK 55 Changelog -- expo-image version 55.0.8 compatibility confirmed
- Supabase Push Notifications Guide -- Edge Function + Database Webhook pattern for Expo Push
- Supabase Realtime Benchmarks -- postgres_changes single-thread limitation
- Supabase RLS Documentation -- SECURITY DEFINER pattern, auth.uid() subselect optimization
- Existing codebase: `useGrocerySync.ts`, `useActivityToast.ts`, `notifications.ts`, `push_tokens` migration, all existing Zustand stores

### Secondary (MEDIUM confidence)
- Cookpad blog posts -- feature patterns for cooking social apps (follow, cooksnaps, community)
- GetStream fan-out documentation -- fan-out-on-read vs write tradeoffs
- Content moderation best practices (GetStream, Arena.im, Social Plus) -- moderation requirements at launch

### Tertiary (LOW confidence)
- Supabase Realtime `in` filter syntax for postgres_changes -- needs runtime verification, documentation is sparse on array filters

---
*Research completed: 2026-04-06*
*Ready for roadmap: yes*
