# Pitfalls Research

**Domain:** Adding social feed features (follow, feed, likes, comments) to a private household dinner planning app
**Researched:** 2026-04-06
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Household Data Leakage Through Social Feed

**What goes wrong:**
The entire existing data model is household-scoped behind strict RLS (`is_household_member` checks on every table). Adding a social feed means meal plans, recipes, and user profiles must become partially visible to followers who are NOT household members. Developers open up RLS too broadly (e.g., making recipes globally readable) and accidentally expose private household data -- grocery lists, budget info, pantry contents, leftovers, meal notes, assigned cooks, and household member names.

**Why it happens:**
The current RLS policies use a single `is_household_member()` gate on all tables. There is no concept of "public" vs "private" data. When adding feed visibility, it is tempting to add a permissive SELECT policy like `true` or `follower_id = auth.uid()` to recipes/meal_plans, which inadvertently exposes all columns and related data that should remain private.

**How to avoid:**
- Create a separate `feed_posts` table that contains only the data intended for public consumption (meal name, recipe name, photo URL, kitchen display name). Never expose raw `meal_plans`, `recipes`, or `households` rows to non-members.
- The feed post is a materialized snapshot, not a live join to household data. When a meal is shared, copy the shareable fields into `feed_posts`. This decouples the social layer from the private household layer entirely.
- Keep ALL existing RLS policies on `households`, `meal_plans`, `recipes`, `grocery_items`, `expenses`, `pantry_items`, and `leftovers` completely untouched. New social tables get their own independent policies.
- Audit rule: any migration that ALTERs an existing RLS policy on a household-scoped table is a red flag.

**Warning signs:**
- Any migration that modifies existing RLS policies on household-scoped tables
- Queries that JOIN `recipes` or `meal_plans` directly to `follows` without going through `feed_posts`
- Followers able to see recipe ingredients, instructions, grocery lists, or budget data
- The word "household_id" appearing in any follower-facing query

**Phase to address:**
Phase 1 (Data Model) -- the feed_posts table and its RLS policies must be designed before any UI work. This is the architectural firewall between private and public data.

---

### Pitfall 2: Exposing User Identity Across Household Boundaries

**What goes wrong:**
The current `profiles` table RLS only allows reading your own profile or co-household-members' profiles (via the joined policy in migration 00002). When followers view a kitchen's feed posts, they need to see display names and avatars. Developers add a broad SELECT policy to `profiles` (e.g., `true` for all authenticated users) which exposes ALL user profiles -- including email-derived display names that were never intended to be public.

**Why it happens:**
The existing profile visibility policy joins through `household_members` -- there is no mechanism for "this profile is visible because I follow their kitchen." The easy fix is making profiles globally readable, but this leaks private identity information.

**How to avoid:**
- Create a `kitchen_profiles` table (or view) that contains only public-facing kitchen information: kitchen display name, kitchen avatar, optional bio, follower count. This is separate from `profiles` (individual user data) and `households` (private household data).
- Feed posts reference `kitchen_id` and the `kitchen_profiles` table, never individual `user_id` or `profiles`.
- The social unit is the KITCHEN (household), not the USER. A kitchen has members, but followers see the kitchen identity only. Individual member names/avatars should not appear in the feed.
- Do NOT modify the existing profiles SELECT policy. Do NOT modify the existing households SELECT policy.

**Warning signs:**
- Any migration modifying the profiles or households SELECT policy
- Feed UI showing individual user names instead of kitchen names
- Followers able to enumerate household member lists
- `profiles.id` appearing as a foreign key in any social table visible to followers

**Phase to address:**
Phase 1 (Data Model) -- kitchen_profiles must be created as part of the follow/kitchen identity schema before any follow or feed UI is built.

---

### Pitfall 3: Default-Public Sharing Without Explicit Opt-In

**What goes wrong:**
Meals are auto-posted to the social feed without explicit user consent. Users who joined SharedKitchen for private household planning suddenly discover their dinner plans are visible to followers they forgot they had. This violates user expectations and erodes trust, especially for a product whose entire value proposition is private household coordination.

**Why it happens:**
The project spec says "auto-post meals from plan with manual share toggle." If the toggle defaults to ON, every meal plan entry becomes a feed post automatically. Users who set up follows during initial excitement may not realize every dinner is being broadcast.

**How to avoid:**
- Default the share toggle to OFF for the initial release. Users must explicitly opt in per meal or enable auto-sharing at the kitchen level.
- Add a kitchen-level "auto-share new meals" setting that defaults to OFF. Users must visit settings to enable it.
- Show a one-time education prompt when a user first enables sharing: "Meals you share will be visible to your followers. Your grocery list, budget, and other household data remain private."
- Never auto-share meals that were logged via the "notes" fallback (recipe-less photo meals from v4.0) -- these feel more personal and informal.
- When auto-sharing is enabled, show a visible indicator on the meal plan card so users always know which meals will be shared.

**Warning signs:**
- No share toggle visible on the meal plan creation/edit flow
- Feed posts appearing for meals the user never explicitly shared
- No kitchen-level sharing preference in settings
- User confusion or complaints about what is "public" vs "private"

**Phase to address:**
Phase 1 (Data Model) for the `is_shared` column default (FALSE), Phase 2 (Feed UI) for the toggle and education prompt.

---

### Pitfall 4: N+1 Queries and Unbounded Feed Loading

**What goes wrong:**
The feed query becomes: "For this user, get all kitchens they follow, then for each kitchen get recent shared meals, then for each meal get the recipe details, then get like counts, then get comments." This cascading query pattern creates N+1 problems that degrade linearly with the number of followed kitchens. Combined with unbounded loading (no pagination), the feed screen becomes a performance disaster.

**Why it happens:**
The existing codebase fetches data in Zustand stores that call Supabase directly (e.g., `recipeStore`, `planStore`). Developers follow the same pattern for the feed, making separate queries per followed kitchen. Supabase's client makes it easy to write `select('*, recipe(*), likes(*), comments(*)')` which generates massive JOIN queries.

**How to avoid:**
- Use a single denormalized query: `feed_posts` table contains kitchen name, meal name, recipe name, photo URL, like count, comment count -- no JOINs needed for the feed list view.
- Implement cursor-based pagination from day one. Use `created_at` + `id` as the cursor, not OFFSET. Fetch 20 posts per page.
- Like and comment counts should be denormalized counters on `feed_posts`, updated via triggers, not computed via `COUNT(*)` subqueries on every render.
- Use a single Postgres function or view for the feed query rather than multiple sequential client-side calls.
- Comments load lazily only when user taps into a post detail view -- never preloaded in the feed list.

**Warning signs:**
- Feed load time exceeding 500ms
- Multiple sequential `.from()` calls in the feed store
- No LIMIT clause on feed queries
- Like/comment counts computed via subquery per card

**Phase to address:**
Phase 1 (Data Model) for denormalized schema and pagination design. Phase 2 (Feed UI) for implementing cursor-based infinite scroll.

---

### Pitfall 5: RLS Performance Degradation on Follow-Based Queries

**What goes wrong:**
RLS policies on the `feed_posts` table use subqueries like `EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_kitchen_id = feed_posts.kitchen_id)`. This subquery executes per row, and without proper indexing and the `(select auth.uid())` wrapper, it becomes catastrophically slow as the feed table grows.

**Why it happens:**
The existing `is_household_member()` SECURITY DEFINER function works well because household membership is a tiny set (2-6 members). Follow relationships can be orders of magnitude larger (hundreds or thousands). The same RLS pattern that works for households will not scale for social feeds. Supabase documentation confirms that unwrapped `auth.uid()` calls evaluate per-row, causing up to 10,000x performance degradation.

**How to avoid:**
- Always wrap `auth.uid()` in a subselect: `(select auth.uid())` to cache it per statement, not per row. Supabase docs confirm this yields up to 99.99% improvement.
- Create a `SECURITY DEFINER` function `get_followed_kitchen_ids(p_user_id UUID)` that returns `UUID[]` and use `kitchen_id = ANY(get_followed_kitchen_ids((select auth.uid())))` in the policy. This avoids per-row subquery evaluation.
- Add composite indexes: `follows(follower_id, following_kitchen_id)` and `feed_posts(kitchen_id, created_at DESC)`.
- Always add explicit WHERE filters client-side that match the policy logic -- this helps Postgres construct better query plans even when RLS provides the same implicit filter.

**Warning signs:**
- Feed queries slowing as total feed_posts rows grow, even for users with few followed kitchens
- `EXPLAIN ANALYZE` showing sequential scans on `follows` table
- Supabase dashboard showing slow queries (>200ms) on feed-related tables

**Phase to address:**
Phase 1 (Data Model) -- must be built into the initial migration and RLS design, not retrofitted.

---

### Pitfall 6: No Moderation System Alongside Comments

**What goes wrong:**
Comments go live with no reporting mechanism, no spam detection, and no ability to remove abusive content. A single bad actor can post offensive comments on meal photos across many kitchens. Since SharedKitchen is a household/family app, exposure to inappropriate content is especially damaging to trust. Without tools to address it, there is no way to remove content, no way to block users, and no recourse for affected users.

**Why it happens:**
For an MVP social feed in a small community, moderation feels like over-engineering. "We only have 200 users, who would spam?" But even one incident with no tools to address it creates a crisis. Content moderation experts consistently identify skipping moderation at launch as a top mistake -- the cost of adding it retroactively during a crisis is 5-10x higher than building basic tools alongside comments.

**How to avoid:**
- Ship a `content_reports` table and basic report flow in the same phase as comments. It does not need AI moderation -- just a "Report" button that flags content and an admin query to review flags.
- Add a `blocked_kitchens` table so users can block kitchens whose comments they do not want to see. Client-side filtering is acceptable for MVP.
- Add an `is_hidden` boolean on comments so content can be soft-deleted without losing evidence for review.
- Rate-limit comments per user (e.g., max 20 comments per hour) via a simple count check in the Edge Function or RLS policy.
- Plain text only for comments. Strip all markup. Limit to 500 characters.

**Warning signs:**
- Comments feature shipping without a "Report" option in the UI
- No admin tooling for reviewing reported content (even a simple SQL query counts)
- No ability to hide/remove individual comments without deleting the row
- No rate limiting on comment creation

**Phase to address:**
Phase 3 (Interactions) -- must ship alongside comments, not as a follow-up.

---

### Pitfall 7: Notification Spam from Social Activity

**What goes wrong:**
Users who follow 20 kitchens start receiving push notifications for every new meal shared, every like on their posts, and every comment. The notification volume overwhelms the existing notification system (which currently only fires for cooking reminders, leftover expiry, and budget alerts -- all low-volume, high-signal) and users disable notifications entirely, losing the valuable household notifications too.

**Why it happens:**
The app already has push notifications via expo-notifications and Expo Push API. It is tempting to reuse the same channel for social activity. But household notifications are low-volume (3-5 per day maximum). Social notifications can be high-volume (50+ per day with active following). iOS does not let users selectively disable notification categories within a single app -- they either allow or disallow all.

**How to avoid:**
- Do NOT send push notifications for social activity in the initial release. Use in-app indicators only (badge count on feed tab, dot indicators on new posts).
- If push notifications are added later, use a separate notification category with its own toggle in app settings.
- Never send push notifications for likes. Only send for comments on YOUR posts, and batch those ("3 people commented on your meal").
- Respect the existing notification permission pre-prompt flow -- do not trigger a new permission request for social features.

**Warning signs:**
- Social notifications using the same code path as household notifications
- No per-category notification settings in the app
- Users reporting "too many notifications" after social feature launch
- Notification opt-out rate increasing after social features ship

**Phase to address:**
Phase 3 (Interactions) -- explicitly decide what does and does not trigger notifications before implementing likes/comments.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| JOINing live household tables for feed display instead of snapshotting into feed_posts | No data duplication | Feed queries coupled to private data, RLS complexity explosion, privacy risk | Never -- always snapshot into feed_posts |
| Storing like/comment counts as computed aggregates (COUNT subqueries) | No denormalization to maintain | O(n) per feed card on every render, degrades linearly | Never at scale -- denormalize counters from day one |
| Using OFFSET pagination for feed | Simple to implement | Performance degrades linearly, skips/duplicates when new posts arrive | Never for user-facing feed -- use cursor pagination |
| Single notification channel for household + social | Less code, fewer categories | Users disable all notifications to escape social spam, losing household alerts | Never -- keep channels separate even if social push is deferred |
| Skipping blocked/muted kitchen support | Faster MVP | First harassment incident has no mitigation path | Only if comments are not shipped yet |
| Making follow relationships symmetric (auto-follow-back) | Simpler data model | Users cannot curate their feed, forced reciprocity feels invasive for a cooking app | Never -- follows should be unidirectional |
| Using household_id as the social identifier in feed_posts | No new table needed | Leaks internal household UUID to followers, who could probe other endpoints | Never -- use a public-facing kitchen_profile_id |

## Integration Gotchas

Common mistakes when connecting social features to existing SharedKitchen systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Realtime for feed | Subscribing to `feed_posts` changes for live feed updates, creating a channel per user with broad filters | Use Realtime only for comment threads on a single open post. Poll or use badge counts for the main feed list. |
| Supabase Storage for feed photos | Storing shared meal photos in a bucket without proper RLS, making them accessible via URL guessing | Use signed URLs with short expiry, or serve through the existing Storage RLS patterns. Feed photos should be read-only to followers. |
| Existing recipe save flow | Copying the full recipe object (ingredients, instructions, timers) when user saves from feed | Save a snapshot of the recipe at share time into feed_posts or a published_recipes table. The original household recipe may be edited or deleted later -- the feed snapshot must be independent. |
| Supabase Auth identity | Using `auth.uid()` as the social identity in feed posts | Social identity is the kitchen (household), not the individual user. Multiple household members share one social identity. Use kitchen_profile_id. |
| Expo Push Notifications | Sending social push notifications through the same Edge Function as household notifications | Create a separate Edge Function (or at minimum separate logic branch) for social notifications with its own rate limiting and batching. |
| Plan tab integration | Replacing the existing Plan tab content with a social feed | Keep the Plan tab focused on the user's own meal plan. Add the social feed as a separate section (subtab, swipe, or new tab). Do not displace existing functionality. |
| Meal plan mutations | Creating feed_posts synchronously inside the meal plan save transaction | Create feed_posts asynchronously (trigger or background) so meal plan saves are not slowed by social layer failures. A failed feed post should never block a meal plan update. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fan-out on read (assembling feed at query time by joining follows + meal_plans) | Feed load time grows linearly with followed kitchen count | Use a denormalized feed_posts table. Fan-out on read is acceptable at SharedKitchen's scale (<10K users) but requires cursor pagination and denormalized counts. | >50 followed kitchens per user |
| COUNT(*) for likes/comments per feed card | Feed list view slows on scroll, especially with popular posts | Denormalize `like_count` and `comment_count` into feed_posts, update via Postgres trigger on insert/delete | >100 likes per post or >50 posts in a single feed load |
| Loading all comments for all visible feed posts at once | Memory spike, slow initial load, wasted bandwidth for comments user never reads | Lazy-load comments only when user taps into post detail view. Feed cards show comment_count only. | >10 comments per post average |
| Full recipe data embedded in feed cards | Large payloads per card, slow FlatList rendering | Feed cards show recipe name + photo only. Full recipe data loads on tap into detail. | >20 posts with full recipe payloads in feed |
| Supabase Realtime subscription per followed kitchen | Connection limit exhaustion (default 200 concurrent connections per project) | Use a single subscription with array-based filter, or avoid Realtime for feed entirely (poll on pull-to-refresh) | >20 followed kitchens per user |
| Unindexed follower lookups in RLS policies | Every feed query triggers sequential scan on follows table | Add composite index on `follows(follower_id, following_kitchen_id)` and use SECURITY DEFINER helper | >1,000 rows in follows table |

## Security Mistakes

Domain-specific security issues for social feed features.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Feed posts containing raw `household_id` visible to followers | Followers can probe other household-scoped endpoints using the leaked UUID | Feed posts reference `kitchen_profile_id` (a public-facing ID), never `household_id`. Ensure no API endpoint accepts household_id from non-members without RLS check. |
| No rate limiting on follow/unfollow requests | Spam follow bots, follower count manipulation, follow/unfollow harassment loops | Limit to 100 max followed kitchens per user. Rate-limit follow/unfollow to 10 per minute. Prevent self-follow. |
| Comments allowing HTML, markdown, or link injection | XSS if any WebView rendering is used, phishing links, misleading formatted content | Plain text only for comments. Strip all markup server-side. Limit to 500 characters. No clickable URLs. |
| Recipe "save from feed" bypassing premium gating | Free users saving unlimited recipes through feed instead of manual creation | Feed recipe saves count toward the same limits as recipe creation if any exist. Check subscription status server-side. |
| Invite codes discoverable through kitchen profiles | Non-members could join private households by finding invite codes on the public kitchen profile | Kitchen profiles must NEVER expose invite codes. Invite codes and kitchen profiles are completely separate concepts. |
| No input sanitization on kitchen profile bio/name | Stored XSS, inappropriate content in kitchen names | Sanitize and length-limit all user-provided text in kitchen profiles. No HTML/markdown. |

## UX Pitfalls

Common user experience mistakes when adding social features to a private app.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Forcing social features on existing users | Users who want private planning feel the app changed on them -- churn risk | Social feed is opt-in and additive. Existing Plan tab stays unchanged. Feed is a new section or subtab that users discover naturally. |
| Empty feed state with no guidance | New social users see a blank feed and do not understand how to populate it | Show a clear "Follow kitchens to see what they're cooking" prompt with a discovery/search mechanism or invite link flow. |
| No way to discover kitchens to follow | Users cannot find interesting kitchens, feed stays permanently empty, feature feels dead | Provide invite-link-based following (share your kitchen link) and optionally a kitchen search/browse. Do not rely on organic discovery alone. |
| Showing follower counts prominently | Turns a cozy, warm cooking app into a social status competition -- misaligned with the "Culinary Curator" design philosophy | De-emphasize or hide follower counts. Focus on the food, not the numbers. Show "X kitchens you follow" not "X followers this kitchen has." |
| Share toggle buried in settings | Users cannot easily control what gets shared on a per-meal basis, leading to frustration or accidental shares | Show the share toggle inline on the meal plan card or meal creation bottom sheet, clearly visible during the normal planning flow. |
| Comments without context | Flat comment lists with no attribution feel anonymous and potentially hostile | Show the commenter's kitchen name and avatar on each comment. Keep comments flat (no threading) for MVP, but provide clear identity context. |
| Treating "save recipe" as cloning the full recipe | Users expect a lightweight "bookmark" but get a full recipe clone in their library, creating duplicates and confusion | Save creates a reference/bookmark with attribution ("Saved from Kitchen X"). Recipe data is a snapshot, clearly marked as saved from feed. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Follow system:** Often missing unfollow confirmation, follow request rate limiting, and self-follow prevention -- verify all three exist
- [ ] **Feed pagination:** Often missing handling of new posts arriving while user scrolls (duplicates/skips with OFFSET) -- verify cursor-based pagination handles concurrent insertions
- [ ] **Like toggle:** Often missing optimistic UI rollback on network failure -- verify like state reverts if server request fails
- [ ] **Comment posting:** Often missing empty-string validation, max-length enforcement, and rate limiting -- verify all three are enforced server-side, not just client-side
- [ ] **Kitchen profile:** Often missing the case where a kitchen has no shared meals yet -- verify empty state exists
- [ ] **Recipe save from feed:** Often missing handling of original recipe deletion -- verify the saved snapshot is independent and survives the source being removed
- [ ] **Share toggle:** Often missing the "retroactive" case -- if a user turns sharing OFF, do existing feed posts get removed? Decide and implement consistently.
- [ ] **Feed post deletion:** Often missing cascade cleanup of likes and comments -- verify ON DELETE CASCADE on foreign keys from likes/comments to feed_posts
- [ ] **Block/Report:** Often missing immediate effect -- blocked kitchen's posts should hide from feed instantly (client-side filter), not just on next refresh
- [ ] **Multi-household users:** Often missing which kitchen identity is used when a user belongs to multiple households -- verify the active household context is clear when sharing
- [ ] **Existing RLS audit:** Often missing a verification that NO existing RLS policies were modified -- run a diff against migration 00001-00017 to confirm zero changes

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Household data leaked via overly permissive RLS | HIGH | Audit all feed-related RLS policies immediately. Drop overly permissive policies. Migrate feed_posts to use snapshots instead of JOINs. Notify affected users if PII was exposed. Review access logs. |
| N+1 feed queries causing timeouts | MEDIUM | Add denormalized feed_posts table if not present. Backfill from existing data. Swap queries. No client-side change if API contract is stable. |
| Notification spam causing opt-outs | MEDIUM | Add notification categories retroactively. Reset all social notification preferences to OFF. Consider a one-time apology/explanation in-app message. |
| No moderation tools after abuse incident | HIGH | Emergency deploy: add is_hidden column to comments, build admin flag review query, manually hide offending content via SQL. Reputational damage to a family-focused app is hard to undo. |
| User profiles exposed to all authenticated users | HIGH | Revert the RLS policy change immediately. Audit Supabase access logs for data exposure scope. Create kitchen_profiles table as the proper public-facing entity. |
| Auto-shared meals without user consent | MEDIUM | Set all existing feed_posts to hidden/draft. Add retroactive opt-in prompt. Let users review and explicitly re-share what they want public. |
| Feed performance degradation | LOW | Add missing indexes, wrap auth.uid() in subselect, add SECURITY DEFINER function. All fixable via migration without app update. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Household data leakage (#1) | Phase 1 (Data Model) | Zero changes to existing RLS policies in migrations 00001-00017. feed_posts contains only snapshot data. Manual RLS audit before merge. |
| User identity exposure (#2) | Phase 1 (Data Model) | kitchen_profiles table exists. No modifications to profiles or households SELECT policies. Feed shows kitchen names only, never individual user names to followers. |
| Default-public sharing (#3) | Phase 1 (Data Model) + Phase 2 (UI) | is_shared column defaults to FALSE in migration. Share toggle visible in UI with OFF as default state. |
| N+1 feed queries (#4) | Phase 1 (Data Model) | Single query returns paginated feed. EXPLAIN ANALYZE shows index scans, not sequential scans. Feed loads in <200ms. |
| RLS performance (#5) | Phase 1 (Data Model) | Feed query with 50 followed kitchens completes in <100ms. auth.uid() wrapped in subselect. SECURITY DEFINER function for follow lookup. |
| No moderation system (#6) | Phase 3 (Interactions) | Report button exists on every comment. content_reports table exists. Admin can hide comments. Comment rate limiting active. |
| Notification spam (#7) | Phase 3 (Interactions) | Social activity produces zero push notifications in v1. In-app badge indicators only. |
| Forced social on existing users | Phase 2 (Feed UI) | Existing Plan tab layout unchanged. Feed is additive. No existing workflow disrupted. |
| Empty feed state | Phase 2 (Feed UI) | Empty state component with clear call-to-action for discovering/following kitchens. |
| Multi-household identity | Phase 1 (Data Model) | Kitchen profile is tied to household, not user. Active household context determines which kitchen identity is used for social actions. |

## Sources

- SharedKitchen codebase: migrations 00001-00004 (current RLS policies, household/recipe/meal_plan data model, profile visibility rules)
- [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- performance best practices: subselect wrapping for auth.uid(), SECURITY DEFINER functions, index optimization, minimize joins in policies
- [Supabase RLS data leaking patterns](https://dev.to/gifteddev/why-your-supabase-app-might-be-leaking-user-data-and-how-to-fix-it-with-rls-2fbf) -- common mistakes with overly permissive policies
- [Supabase RLS best practices for multi-tenant apps](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- production patterns for role-based access
- [Facebook News Feed system design](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed) -- fan-out on read vs write tradeoffs, feed pagination patterns
- [Content moderation mistakes](https://getstream.io/blog/content-moderation-mistakes/) -- top 6 mistakes when building social features
- [Content moderation best practices 2025](https://arena.im/uncategorized/content-moderation-best-practices-for-2025/) -- hybrid moderation approaches
- [The Moderation Stack 2025](https://www.social.plus/blog/the-moderation-stack-what-every-in-app-community-needs-in-2025/) -- what every in-app community needs at launch

---
*Pitfalls research for: Social feed features in SharedKitchen v5.0*
*Researched: 2026-04-06*
