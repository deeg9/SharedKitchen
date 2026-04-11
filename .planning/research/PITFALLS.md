# Domain Pitfalls: v8.0 Social Recipes

**Domain:** Adding social recipe features to existing collaborative cooking app
**Researched:** 2026-04-10
**Confidence:** HIGH (based on codebase analysis + domain research)

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or broken existing features.

### Pitfall 1: @Handle Retrofit Blocks Existing Users

**What goes wrong:** Adding a required `username` column to `profiles` with a UNIQUE NOT NULL constraint breaks every existing user. If the migration enforces NOT NULL immediately, existing rows fail the constraint. If you add a username gate to the app before providing a migration path, existing users get locked out on app launch.

**Why it happens:** The app has existing users with profiles created by `handle_new_user()` trigger (migration 00001) that only set `display_name`. There is no username field anywhere in the current schema. Forcing all users through a "pick your username" interstitial on first app open after the update is the only viable path, but getting the timing wrong (DB migration before client update, or client update before DB migration) creates a window where the app breaks.

**Consequences:** Users cannot use the app after update. If NOT NULL is enforced at DB level before all clients update, Supabase Auth trigger `handle_new_user()` also breaks for new signups (it doesn't set username).

**Prevention:**
1. Add `username` column as NULLABLE first with a UNIQUE constraint (allow NULL but enforce uniqueness for non-null values)
2. Update `handle_new_user()` trigger to NOT set username (keep it null for new signups too)
3. Add client-side "choose username" interstitial that appears when `profiles.username IS NULL`
4. Only after all users have usernames (or after a grace period), consider adding NOT NULL via a separate migration
5. Use `UNIQUE` index with `WHERE username IS NOT NULL` to allow multiple NULLs

**Detection:** Test the migration against a database snapshot with existing profiles. Verify the auth trigger still works for new signups.

**Phase:** Must be Phase 1 (foundation) -- everything else depends on usernames existing.

### Pitfall 2: Recipe Ownership Collision with Household-Scoped RLS

**What goes wrong:** Recipes currently belong to `household_id` with RLS policy `is_household_member(household_id, auth.uid())`. Adding "only creator can edit" breaks the existing model where ANY household member can edit ANY household recipe. The current UPDATE policy on recipes is: `USING (is_household_member(household_id, auth.uid()))` -- no creator check.

**Why it happens:** v8.0 wants creator-only edit permissions, but the app has 7 versions of recipes being freely edited by all household members. Changing UPDATE RLS to `created_by = auth.uid()` immediately breaks the collaborative editing that households expect for their shared recipes.

**Consequences:** Either (a) you break collaborative editing for existing recipes that have no meaningful `created_by` (imported recipes, AI-generated recipes, starter recipes all may have `created_by` set to whoever happened to trigger the import), or (b) you create a confusing split where some recipes are editable by all and others only by creator.

**Prevention:**
1. Add `is_creator_owned BOOLEAN DEFAULT false` to recipes. Only NEW recipes created after v8.0 get `is_creator_owned = true`
2. Existing recipes keep their current behavior (all household members can edit)
3. Modify UPDATE RLS to: `USING (is_household_member(household_id, auth.uid()) AND (NOT is_creator_owned OR created_by = auth.uid()))`
4. New recipes created via the social flow get creator-locked. Old recipes stay collaborative
5. Optional: Add a "lock this recipe" action for creators who want to restrict editing

**Detection:** Query `SELECT created_by, COUNT(*) FROM recipes GROUP BY created_by` to understand current ownership distribution. Check if any recipes have NULL `created_by`.

**Phase:** Must be Phase 1 or 2 -- RLS changes affect everything downstream.

### Pitfall 3: Two Comment Systems Create UX Confusion

**What goes wrong:** The app already has `post_comments` (flat comments on feed posts, scoped to kitchen_id via `post_comments.kitchen_id`). v8.0 adds recipe comments (scoped to a recipe, visible to household members). Users see comments in the feed and comments on the recipe and cannot understand why they are different, why different people see them, or why their feed comment doesn't appear on the recipe.

**Why it happens:** Feed comments are kitchen-to-kitchen social interactions (public). Recipe comments are household-internal collaboration. They serve different purposes but look similar in the UI. A user might comment "Great recipe!" on a feed post and expect the recipe creator to see it on their recipe detail page.

**Consequences:** Users comment in the wrong place. Creators miss feedback. Household members see recipe comments but not feed comments (and vice versa). Moderating two separate comment systems doubles complexity.

**Prevention:**
1. Make the visual distinction unmistakable: recipe comments use a "Notes" or "Kitchen Notes" label with a notebook icon, while feed comments remain "Comments" with a chat icon
2. Consider whether recipe comments should aggregate feed comments about that recipe (read-only mirror) -- this creates a single view for the creator
3. On recipe detail, if the recipe was shared to feed and has feed comments, show a "See X comments from followers" link that opens the feed post
4. Do NOT try to merge the two systems into one table -- the visibility scopes are fundamentally different (household vs public)

**Detection:** User testing with a prototype. Watch where users try to comment and whether they find feedback from both channels.

**Phase:** Phase 3 (recipe comments) should explicitly reference this distinction in the design spec.

### Pitfall 4: Version History Table Bloat and Query Performance

**What goes wrong:** Naively storing full recipe snapshots on every edit creates massive table bloat. A recipe with JSONB `ingredients` (array of objects) and JSONB `instructions` (array of objects) can be 5-20KB per version. Ten edits = 50-200KB per recipe. At scale this kills query performance and storage costs.

**Why it happens:** The simple approach is "copy entire row to history table on every update." With JSONB columns containing full ingredient lists and instruction sets, each version is large. The `recipes_updated_at` trigger already fires on every update, making it tempting to just add a history insert there.

**Consequences:** `recipe_versions` table grows 10-50x faster than `recipes`. Queries that join version history become slow. Supabase free/pro tier storage limits hit sooner. Restoring a version requires copying large JSONB blobs back.

**Prevention:**
1. Store only changed fields per version, not full snapshots. Use a `changes JSONB` column that records `{"field": "ingredients", "old": [...], "new": [...]}`
2. OR: Store full snapshots but limit version count (keep last 10 versions, prune older ones via a scheduled function)
3. Add version history via trigger on the existing `recipes_updated_at` trigger -- piggyback on what already fires
4. Index `recipe_versions(recipe_id, created_at DESC)` for efficient "show history" queries
5. Do NOT fetch version history by default on recipe detail -- lazy-load only when user taps "History"

**Detection:** Monitor `pg_total_relation_size('recipe_versions')` after launch. Set an alert if it exceeds 2x the recipes table size.

**Phase:** Phase 4 (version history) -- implement after core social features are stable. This is additive and can be deferred.

### Pitfall 5: Cook Log Auto-Creation from Meal Plan Creates Ghost Entries

**What goes wrong:** The spec says "auto-logged from meal plan." If a cook log entry is automatically created whenever a meal plan date passes, users get cook logs for meals they never actually cooked (plans change, dinner gets skipped, they ordered takeout). The "Cooked 47 times" badge becomes meaningless.

**Why it happens:** The meal_plans table has `plan_date` and `recipe_id`. It is tempting to create a cron job or trigger that inserts a cook_log entry when `plan_date <= now()`. But planned != cooked.

**Consequences:** Inflated cook counts destroy trust in the feature. Users cannot distinguish "actually cooked" from "was on the plan." If cook logs feed into the social feed ("@user cooked Pad Thai!"), false auto-posts damage credibility.

**Prevention:**
1. NEVER auto-create cook logs. Instead, PROMPT after cooking: when a user completes cooking mode, or when a planned meal date passes, show a "Did you cook this?" prompt
2. The "I Cooked This" button on recipe detail is the primary entry point -- manual and intentional
3. Cooking mode completion is the best auto-trigger signal (user explicitly went through steps), but still confirm
4. Show a gentle nudge on the Plan tab for past dates: "Log your cook for last night's dinner?" with one-tap confirm
5. Keep cook_log entries with a `source` field: 'manual', 'cooking_mode', 'prompt' -- to track how logs are created

**Detection:** Monitor ratio of cook_logs to meal_plans. If ratio approaches 1:1, something is auto-creating too aggressively.

**Phase:** Phase 3 (cook log) -- get this right from the start, very hard to fix retroactively if data is polluted.

## Moderate Pitfalls

### Pitfall 6: Feed Auto-Post Duplication for Recipe Events

**What goes wrong:** The existing feed auto-posts when meals are added to the plan (v5.0). v8.0 adds "auto-post when recipe created or cooked." If someone creates a recipe, adds it to their plan, and then cooks it, three feed posts appear: "created a recipe," "planned Pad Thai for Tuesday," and "cooked Pad Thai." This feels spammy and floods followers' feeds.

**Why it happens:** Each auto-post trigger operates independently. The existing `feed_posts` creation happens on meal plan insert. New triggers would fire on recipe insert and cook_log insert. No deduplication logic exists.

**Prevention:**
1. Consolidate: When a cook log is created for a recipe that was already posted to feed (via meal plan), UPDATE the existing feed post to show "cooked" status with photo, rather than creating a new post
2. Do NOT auto-post recipe creation. Only auto-post when cooked (the interesting social event). Recipe creation is noise; cooking is signal
3. Add a `feed_post_type` enum to `feed_posts`: 'planned', 'cooked', 'recipe_created' -- then deduplicate by (kitchen_id, recipe_id, meal_date, type)
4. Rate-limit feed posts per kitchen: max 3 per day to prevent spam

**Detection:** Query `SELECT kitchen_id, DATE(created_at), COUNT(*) FROM feed_posts GROUP BY 1,2 HAVING COUNT(*) > 5` to find spammy kitchens.

**Phase:** Phase 4 (feed integration) -- must be designed alongside cook log, not bolted on after.

### Pitfall 7: "Save to Collection" Creates Orphaned Recipe Copies

**What goes wrong:** The existing `saved_recipes` table stores a reference to the original `recipe_id`. But the v5.0 `saveRecipeFromPost` function actually copies the full recipe into the saver's household (creating a new row in `recipes`). If the original creator edits their recipe, saved copies are stale. If the original is deleted, the saved copy survives but attribution says "Saved from Kitchen X" pointing to nothing.

**Why it happens:** The current architecture creates full copies because recipes are household-scoped (RLS). User B cannot read User A's recipe directly -- they need their own copy. This is a fundamental tension between "recipes belong to households" and "recipes are social objects."

**Consequences:** Stale copies proliferate. "Cooked 50 times" on the original doesn't count cooks of copies. Attribution links break when originals are deleted. Storage doubles for popular recipes.

**Prevention:**
1. Accept that copies are the correct model for a household-scoped app. The alternative (shared recipes readable across households) requires a massive RLS rewrite
2. Add `source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL` to recipes table for provenance tracking
3. When displaying "Saved from Kitchen X," gracefully handle NULL (original deleted): show "Originally from a kitchen" or similar
4. Do NOT try to keep copies in sync with originals -- this creates a distributed consistency problem that is not worth solving
5. Cook counts should be per-recipe-row, not aggregated across copies. Each household's copy has its own cook history

**Detection:** Query `SELECT source_recipe_id, COUNT(*) FROM recipes WHERE source_recipe_id IS NOT NULL GROUP BY 1 ORDER BY 2 DESC` to see most-copied recipes.

**Phase:** Phase 2 (recipe attribution) should establish the `source_recipe_id` pattern early.

### Pitfall 8: Username Validation Edge Cases

**What goes wrong:** Username validation that seems simple (@handle with alphanumeric + underscores) has edge cases: Unicode homoglyphs (Cyrillic "a" vs Latin "a"), offensive words, reserved words (admin, support, help), case sensitivity confusion (@Kitchen vs @kitchen), and squatting.

**Why it happens:** Building a username system from scratch without studying how Twitter/Instagram handle these issues.

**Prevention:**
1. Lowercase-only storage and display. Case-insensitive UNIQUE constraint: `CREATE UNIQUE INDEX idx_profiles_username ON profiles(LOWER(username))`
2. ASCII alphanumeric + underscore only (no dots, no hyphens, no Unicode). Regex: `^[a-z][a-z0-9_]{2,29}$`
3. Minimum 3 characters, maximum 30
4. Reserved word blocklist: admin, support, help, sharedkitchen, official, mod, moderator, system, null, undefined, etc.
5. No profanity filter needed at SharedKitchen's scale -- handle manually via reports
6. Must start with a letter (prevents `_hidden` or `123numeric` handles)

**Detection:** Unit test the validation regex against edge cases before shipping.

**Phase:** Phase 1 (handle system) -- get validation right before any usernames are created.

### Pitfall 9: RLS Policy Performance Degradation with New Tables

**What goes wrong:** Every new table (cook_logs, recipe_comments, recipe_versions) needs RLS policies that join through `recipes` to check `household_id` via `is_household_member()`. The existing pattern (used in `recipe_ratings`, `recipe_notes`) does a subquery per row: `EXISTS (SELECT 1 FROM recipes r WHERE r.id = X AND is_household_member(r.household_id, auth.uid()))`. With 5+ tables doing this join, query planning degrades.

**Why it happens:** `is_household_member()` is already called in RLS for recipes, recipe_ratings, recipe_notes, grocery_items, meal_plans, leftovers, expenses, AND all social tables use `is_kitchen_member()`. Each new table adds another set of per-row subqueries.

**Prevention:**
1. Denormalize `household_id` onto cook_logs and recipe_comments tables directly (not just via recipe_id FK). This avoids the JOIN to recipes in RLS
2. Use `SECURITY DEFINER` functions for complex multi-table checks to reduce repeated subquery overhead
3. Ensure `is_household_member()` is marked `STABLE` (it already is based on similar `is_kitchen_member()`) so Postgres can cache results within a query
4. Test RLS performance with realistic data volumes: 100 recipes, 500 cook_logs, 200 comments -- measure query times

**Detection:** Use `EXPLAIN ANALYZE` on queries against new tables to verify RLS doesn't cause sequential scans.

**Phase:** Phase 1 (database schema) -- design the denormalization pattern before creating tables.

### Pitfall 10: Photo Storage Costs Spiral from Cook Log Gallery

**What goes wrong:** Cook logs with photos ("here is my version!") mean every cook event can upload 1-3 photos. At 1MB compressed per photo, a recipe cooked 50 times with photos = 50-150MB per recipe. Supabase Pro plan includes 100GB storage; a popular household could burn through this surprisingly fast.

**Why it happens:** Photo uploads are frictionless (good UX) but expensive (bad economics). The existing photo upload flow uses `expo-image-manipulator` for compression (1024px JPEG 0.6), which is good, but there is no per-user or per-household storage quota.

**Prevention:**
1. Compress cook log photos aggressively: 800px max dimension, JPEG 0.5 quality (these are gallery thumbnails, not hero images). Target ~200KB per photo
2. Limit photos per cook log entry: max 3 photos
3. Consider Supabase Image Transformations for on-demand resizing rather than storing multiple sizes
4. Add `cook-log-photos` as a separate Storage bucket with its own RLS policies (don't pollute existing buckets)
5. Display gallery photos as thumbnails; load full resolution only on tap
6. Future: implement storage cleanup for deleted cook logs (CASCADE in DB doesn't clean Storage)

**Detection:** Monitor Supabase Storage dashboard monthly. Set budget alert at 50GB.

**Phase:** Phase 3 (cook log with photos) -- bake compression and limits in from day one.

## Minor Pitfalls

### Pitfall 11: Existing `created_by` Data is Unreliable for Attribution

**What goes wrong:** Displaying "Created by @username" on recipe detail requires `recipes.created_by` to be accurate. But for URL-imported recipes, AI-generated recipes, and starter recipes, `created_by` just records who tapped the button, not a meaningful "author." Showing "@diego created Grandma's Famous Lasagna" when Diego just imported it from a URL is misleading.

**Prevention:**
1. Distinguish `created_by` (who added it to the system) from `original_author` (recipe source). Keep `created_by` for DB purposes; display "Added by @username" not "Created by @username" for imported recipes
2. Check `source_url` -- if present, display "Imported by @username from [source]" instead of "Created by"
3. Only show "Created by" for recipes with no `source_url` (truly original recipes)

**Phase:** Phase 2 (recipe attribution) -- simple display logic, low risk.

### Pitfall 12: Version History for JSONB Fields is Hard to Diff

**What goes wrong:** The `ingredients` and `instructions` columns are JSONB arrays. Showing a meaningful diff ("added 1 tsp salt to step 3") requires deep JSONB comparison, not just "ingredients changed." Raw JSONB diffs are unreadable to users.

**Prevention:**
1. For MVP version history, just show timestamps and who edited: "Edited by @diego on Apr 10" -- no detailed diff
2. Store the full snapshot (not a diff) so users can "view this version" without reconstruction
3. Defer detailed diffing to a future milestone -- it is a display problem, not a data problem
4. If you must diff, compare at the array-element level: added ingredient X, removed ingredient Y, changed step 3 text

**Phase:** Phase 4 (version history) -- keep it simple. Timestamp + editor is sufficient for v8.0.

### Pitfall 13: Notification Fatigue from New Social Events

**What goes wrong:** v8.0 adds new notification triggers: someone commented on your recipe, someone cooked your recipe, someone saved your recipe. Combined with existing notifications (follow, like, feed comment), users get overwhelmed.

**Prevention:**
1. Batch notifications: "3 people cooked your Pad Thai this week" instead of 3 separate pushes
2. Add granular notification settings: recipe comments, cook notifications, save notifications (separate toggles)
3. Default new notification types to OFF for existing users, ON for new users
4. Rate-limit: max 5 social push notifications per day per user

**Phase:** Phase 5 (notifications) -- ship as the final phase, after all features stabilize.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| @Handle System | Existing users locked out (Pitfall 1) | Nullable column + interstitial migration flow |
| @Handle System | Username validation edge cases (Pitfall 8) | Strict ASCII regex, reserved word list, case-insensitive unique |
| Recipe Attribution | `created_by` is misleading for imports (Pitfall 11) | "Added by" vs "Created by" display logic based on `source_url` |
| Recipe Attribution | Ownership vs household editing conflict (Pitfall 2) | `is_creator_owned` flag, preserve old behavior |
| Recipe Comments | Confusion with feed comments (Pitfall 3) | Distinct visual treatment, "Kitchen Notes" labeling |
| Cook Log | Ghost entries from auto-creation (Pitfall 5) | Never auto-create; prompt-based + manual "I Cooked This" |
| Cook Log Photos | Storage cost spiral (Pitfall 10) | Aggressive compression, 3 photo limit, separate bucket |
| Version History | Table bloat (Pitfall 4) | Limit stored versions, lazy-load only |
| Version History | JSONB diff is hard (Pitfall 12) | MVP: timestamp + editor only, no detailed diff |
| Feed Integration | Duplicate posts for same recipe (Pitfall 6) | Consolidate events, don't auto-post creation |
| Save to Collection | Orphaned copies (Pitfall 7) | Accept copies model, `source_recipe_id` for provenance |
| All New Tables | RLS performance (Pitfall 9) | Denormalize `household_id` onto new tables |
| Notifications | Fatigue from new event types (Pitfall 13) | Batch, granular toggles, default OFF for existing users |

## Sources

- SharedKitchen codebase analysis: `supabase/migrations/00001_create_profiles.sql`, `00003_create_recipes.sql`, `00004_create_meal_plans.sql`, `00018_create_social_tables.sql`
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS disabled by default on SQL-created tables, deny-all without policies
- [Supabase Storage Optimizations](https://supabase.com/docs/guides/storage/production/scaling) -- image transformation, cache-control, egress optimization
- [Implementing System-Versioned Tables in Postgres](https://hypirion.com/musings/implementing-system-versioned-tables-in-postgres) -- concurrent update issues, GiST constraint pitfalls
- [Store revisions of content in PostgreSQL](https://kaustavdm.in/versioning-content-postgresql/) -- trigger-based version history patterns
- [Supabase RLS Security Scanner](https://vibeappscanner.com/supabase-row-level-security) -- 170+ apps with exposed databases due to missing RLS
- [UX Best Practices for Recipe Platforms](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites) -- comment system design patterns
- [User Migration: The Definitive Guide](https://developer.okta.com/blog/2019/02/15/user-migration-the-definitive-guide) -- forced migration and username change pitfalls
