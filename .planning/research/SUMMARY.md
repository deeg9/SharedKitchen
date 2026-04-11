# Project Research Summary

**Project:** SharedKitchen v8.0 Social Recipes
**Domain:** Social recipe features for collaborative household cooking app
**Researched:** 2026-04-10
**Confidence:** HIGH

## Executive Summary

SharedKitchen v8.0 adds social identity and recipe engagement features to an existing React Native/Expo household cooking app backed by Supabase. The core additions are: a per-user @handle system, recipe creator attribution and edit permissions, cook logging with photos, recipe comments, version history, and feed integration for recipe events. The critical insight from research is that **no new npm dependencies are required** -- the entire feature set is achievable through Postgres schema additions (3 new tables, 3 modified tables, 1 new storage bucket) and new UI components using the existing library set (Expo SDK 55, Supabase JS, Zustand 5, expo-image pipeline).

The recommended approach follows a strict dependency chain: @handles first (everything references them), then creator permissions (establishes ownership model), then cook logging (largest feature, enables gallery and feed), then comments and version history (can parallel), and finally feed integration (consumes data from earlier phases). This order is not negotiable -- skipping the foundation layers creates cascading integration problems.

The top risks are: (1) retrofitting @handles onto existing users without locking them out, (2) changing recipe edit permissions without breaking existing collaborative editing behavior, and (3) cook log auto-creation from meal plans polluting data with ghost entries. All three have clear mitigation strategies documented in the research, but each requires careful implementation sequencing. The version history feature is the lowest-value, highest-complexity item and should be deferred if the milestone needs to be trimmed.

## Key Findings

### Recommended Stack

No new dependencies. The entire v8.0 scope is Postgres schema work on the backend and new screens/components on the frontend using existing libraries. This is a significant advantage -- zero dependency risk, zero new learning curve, and the existing photo pipeline (expo-camera, expo-image-picker, expo-image-manipulator, expo-image) already handles everything cook log photos need.

**Core technologies (all existing):**
- **Supabase Postgres**: 3 new tables (cook_logs, recipe_comments, recipe_versions), column additions to profiles/recipes/feed_posts, 7 migration files, new RLS policies
- **Supabase Storage**: 1 new bucket (cook-photos) following the existing meal-photos pattern
- **Zustand 5**: 1 new store (cookLogStore), extensions to recipeStore/authStore/socialStore/onboardingStore
- **Expo photo pipeline**: Reused as-is for cook log photo capture, compression (800px JPEG 0.5), and CDN-backed display

### Expected Features

**Must have (table stakes):**
- Unique @handle usernames with onboarding enforcement and existing-user migration
- Recipe attribution display ("Created by @username" / "Added by @username")
- Creator-only edit permissions (with backward compatibility for pre-v8.0 recipes)
- Basic cook log with optional photo and manual "I Cooked This" trigger
- Cook count badge on recipe detail ("Cooked 12 times")
- Save to collection from recipe detail screen (extend existing save beyond feed)

**Should have (differentiators):**
- Cook log auto-prompt from cooking mode completion and meal plan nudge
- Photo gallery on recipe detail from past cooks (household-scoped)
- Recipe comments with 1-level threading (distinct from feed comments and private notes)
- Feed auto-post on cook log creation (recipe_cooked post type)

**Defer to v8.1 or v9.0:**
- Version history for recipe edits (medium-high complexity, low initial demand)
- Cook count badges/milestones beyond simple count (needs usage data first)
- @mention parsing in comments (needs handles established first)
- Recipe creation auto-post to feed (noise; cooking is the interesting social event)

### Architecture Approach

The architecture extends SharedKitchen's established patterns: household-scoped RLS with is_household_member() checks, trigger-maintained denormalized counters (cook_count mirrors like_count/follow_count), fire-and-forget feed post creation, and Zustand stores with optimistic UI updates. New tables denormalize household_id directly (not just via recipe_id FK) to avoid RLS JOIN performance degradation. Cook log photos use a separate junction table (cook_log_photos) for clean 1:N modeling, and version history uses snapshot-on-write (full JSONB copy, not diffs) because recipes are small (~2-5KB) and diff reconstruction adds unnecessary complexity.

**Major components:**
1. **@Handle system** (profiles.handle + HandleInput + HandleSetupScreen) -- per-user identity foundation
2. **Cook log pipeline** (cook_logs + cook_log_photos + cookLogStore + CookLogSheet) -- largest new feature surface
3. **Recipe social layer** (RecipeAttribution + RecipeCommentSection + CookCountBadge + CookPhotoGallery + CreatorEditGuard) -- UI enrichment on RecipeDetailScreen
4. **Feed integration** (feed_posts.post_type + updated FeedCard variants) -- display layer for cook events

### Critical Pitfalls

1. **@Handle retrofit locks out existing users** -- Add username column as NULLABLE first, use client-side interstitial for migration, never enforce NOT NULL at DB level until all users have handles. Update the handle_new_user() auth trigger to not set username.
2. **Recipe ownership breaks collaborative editing** -- Use an is_creator_owned flag so only NEW recipes get creator-locked. Existing recipes keep household-wide editing. Do not flip the switch on old data.
3. **Cook log auto-creation produces ghost entries** -- NEVER auto-create cook logs from meal plan dates. Prompt after cooking mode completion. Use manual "I Cooked This" as the primary entry point. Planned does not equal cooked.
4. **Two comment systems confuse users** -- Recipe comments and feed post comments look similar but have different visibility scopes. Use distinct visual treatment ("Kitchen Notes" with notebook icon vs "Comments" with chat icon). Do not merge tables.
5. **Feed auto-post duplication** -- Creating a recipe, planning it, then cooking it could generate 3 feed posts. Do not auto-post on recipe creation. Only auto-post on cook events. Consolidate rather than duplicate.

## Implications for Roadmap

### Phase 1: Handle System and Profile Identity
**Rationale:** Foundational dependency -- every subsequent feature references @handles for attribution, comments, and social display. Must be first.
**Delivers:** profiles.handle column, UNIQUE index, format constraint, HandleInput component, HandleSetupScreen for onboarding, existing-user migration interstitial, authStore handle management, updated onboardingStore (7 steps).
**Addresses:** @handle usernames (table stakes), profile identity display
**Avoids:** Pitfall 1 (existing user lockout) via nullable column + interstitial; Pitfall 8 (username validation) via strict ASCII regex + reserved word list + case-insensitive unique index

### Phase 2: Creator Permissions and Recipe Attribution
**Rationale:** Establishes the ownership model that cook log, version history, and comments build on. Low complexity, high impact on UX clarity.
**Delivers:** New recipe UPDATE RLS policy (creator-only for new recipes), is_creator_owned flag, RecipeAttribution component, CreatorEditGuard component, canEditRecipe() in recipeStore, "Added by" vs "Created by" display logic.
**Addresses:** Recipe attribution (table stakes), creator edit permissions (table stakes)
**Avoids:** Pitfall 2 (ownership collision) via is_creator_owned flag preserving old behavior; Pitfall 11 (misleading created_by) via source_url-aware display text

### Phase 3: Cook Log with Photos
**Rationale:** Largest feature chunk and the engagement driver (Cookpad's Cooksnap is their top feature). Depends on Phase 2's ownership model but not on comments or feed changes.
**Delivers:** cook_logs table + RLS, cook_log_photos table, cook-photos storage bucket, recipes.cook_count + trigger, cookLogStore, CookLogSheet, CookLogPhotoUploader, CookCountBadge, CookPhotoGallery, cooking mode completion prompt, manual "I Cooked This" button, meal plan nudge for past dates.
**Addresses:** Cook log (table stakes), cook count display (table stakes), photo gallery (differentiator), auto-prompt from cooking mode (differentiator)
**Avoids:** Pitfall 5 (ghost entries) via prompt-only creation, never auto-create; Pitfall 10 (storage costs) via 800px/0.5 compression, 3 photo limit, separate bucket

### Phase 4: Recipe Comments
**Rationale:** Independent of cook log, only depends on Phase 1 (handles for comment attribution). Can be built in parallel with Phase 3 if resources allow.
**Delivers:** recipe_comments table + RLS, comment methods in recipeStore (fetch, add, delete), RecipeCommentSection component, 1-level threading via parent_id, extended report system for moderation.
**Addresses:** Recipe comments with threading (differentiator)
**Avoids:** Pitfall 3 (comment system confusion) via distinct visual treatment, "Kitchen Notes" labeling, link to feed comments where relevant

### Phase 5: Feed Integration and Polish
**Rationale:** Feed is the display layer for data created in Phases 3-4. Must come after cook logs exist. Also handles notification tuning.
**Delivers:** feed_posts.post_type column + cook_log_id FK, updated FeedCard for recipe_cooked variant, auto-post on cook log creation, notification batching, granular notification settings.
**Addresses:** Feed auto-post on cook (differentiator), notification management
**Avoids:** Pitfall 6 (feed duplication) by not auto-posting recipe creation, only cook events; Pitfall 13 (notification fatigue) via batching, granular toggles, default OFF for existing users

### Deferred: Version History (v8.1)
**Rationale:** Medium-high complexity, low initial user demand, JSONB diffing is a display nightmare for MVP. The data model (recipe_versions with full snapshots) can be added later without affecting other features.
**Would deliver:** recipe_versions table, snapshot-on-write trigger, VersionHistorySheet, timestamp + editor display (no detailed diff).

### Phase Ordering Rationale

- Phases 1-2 are strictly sequential: handles must exist before attribution can display them, and the ownership model must be set before cook logs reference it
- Phase 3 is the highest-value feature and should get the most development time
- Phase 4 can run in parallel with Phase 3 since recipe comments only depend on Phase 1
- Phase 5 must follow Phase 3 because feed integration consumes cook log data
- Version history is deferred because it delivers the least user value relative to its complexity, and can be cleanly added post-launch

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Handle migration UX for existing users needs careful design -- how to handle the blocking interstitial without frustrating active users. Test with a small cohort if possible.
- **Phase 3:** Cook log photo compression targets (800px/0.5 vs 1024px/0.6) should be validated visually on device. Gallery scroll performance with 50+ photos per recipe needs profiling.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Creator permissions is a straightforward RLS policy change with well-documented Supabase patterns.
- **Phase 4:** Recipe comments follow the exact same pattern as existing post_comments and recipe_notes. Table structure, RLS, and UI patterns are all established.
- **Phase 5:** Feed integration extends existing feed_posts infrastructure. The post_type column addition is a standard ALTER TABLE + UI conditional rendering.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against existing codebase -- zero new dependencies, all patterns already established in prior versions |
| Features | MEDIUM-HIGH | Feature priorities validated against Cookpad, SideChef, Pepper patterns. Some uncertainty on whether version history should ship at all in v8.0 |
| Architecture | HIGH | Based on direct codebase analysis of 24 existing migrations, 14 Zustand stores, and established data flow patterns |
| Pitfalls | HIGH | Critical pitfalls (handle retrofit, ownership collision, ghost cook logs) identified from codebase structure and confirmed by domain research |

**Overall confidence:** HIGH

### Gaps to Address

- **Existing user handle migration UX:** Research identifies the technical approach (nullable column + interstitial) but the exact UX flow (blocking modal vs. banner vs. settings prompt) needs design validation during Phase 1 planning
- **Recipe copy provenance:** The saved_recipes copy model creates orphaned copies when originals are deleted. Research recommends accepting this as a tradeoff, but source_recipe_id tracking needs to be designed into Phase 2
- **RLS performance at scale:** Denormalizing household_id onto new tables is recommended but not yet validated with EXPLAIN ANALYZE. Phase 1 should include performance benchmarking with realistic data volumes
- **Version history scope decision:** Research recommends deferring to v8.1. If stakeholders insist on shipping it in v8.0, it adds ~1 phase of work and the JSONB diff display should be kept minimal (timestamp + editor only)

## Sources

### Primary (HIGH confidence)
- SharedKitchen codebase: all migration files (00001-00024), Zustand stores, feedHelpers.ts, database types, package.json
- Supabase RLS documentation and Storage patterns

### Secondary (MEDIUM confidence)
- Cookpad Cooksnap blog posts (engagement patterns, photo-first cook logging)
- Trophy/CKBK gamification case study (personal milestones over leaderboards)
- SideChef UX best practices (comment system design)
- GetStream social app patterns (comment threading)
- Cookpad Harvard case study (social recipe platform dynamics)

### Tertiary (LOW confidence)
- Postgres temporal tables research (version history alternatives -- decided against)
- User migration patterns from Okta (handle retrofit strategies -- adapted for mobile context)

---
*Research completed: 2026-04-10*
*Ready for roadmap: yes*
