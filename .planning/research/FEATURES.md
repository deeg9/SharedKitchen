# Feature Landscape: v8.0 Social Recipes

**Domain:** Social recipe features for collaborative household cooking app
**Researched:** 2026-04-10
**Confidence:** MEDIUM-HIGH (patterns well-established across Cookpad, SideChef, Pepper, Sourbros)

## Existing Features (Already Built -- Do NOT Rebuild)

These are shipped and working. New features must integrate with, not duplicate, them.

| Feature | Version | Notes |
|---------|---------|-------|
| Recipe library with search/filters | v1.0+ | Recipes scoped to household_id, `created_by` tracks author user_id |
| Recipe ratings (1-5 stars) | v1.0 | Per-user via recipe_ratings table |
| Recipe notes (private per user) | v1.0 | Per-user via recipe_notes table |
| Social feed with follows/likes/comments | v5.0 | Kitchen-to-kitchen model, flat comments on feed posts |
| Kitchen profiles (name, avatar, bio, follower counts) | v5.0 | kitchen_profiles table, no @handle field yet |
| Recipe saving from feed | v5.0 | saved_recipes table with source_kitchen_id provenance |
| Cook This Too (save + add to meal plan) | v5.0 | One-tap flow already exists |
| Report/block moderation | v5.0 | reported_content + blocked_kitchens tables |
| Feed auto-post from meal plan | v5.0 | Fires when meal plan entry created |
| Cooking mode with step-by-step timers | v2.0 | Fullscreen cooking mode exists, natural trigger point for cook log |

## Table Stakes

Features users expect from any social recipe platform. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Unique @handle usernames** | Social identity is foundational. Cookpad uses usernames, Instagram/TikTok trained users to expect @handles. Required for attribution, mentions, and discoverability. | Medium | Onboarding flow update, migration for existing users | Add `handle` column to profiles table, unique constraint, validation (lowercase, alphanumeric + underscores, 3-20 chars). Must handle existing users who lack handles via forced setup screen on next app open. |
| **Recipe attribution ("Created by @username")** | Every social recipe platform shows who made a recipe. Cookpad, Pepper, and all competitors display author with avatar. Without this, recipes feel anonymous and uncredited. | Low | @handle system | Display-only change on recipe detail screen. Already have `created_by` user_id on recipes table. Show avatar + @handle + "Created by" label. |
| **Creator edit permissions** | Cookpad and all social recipe platforms restrict editing to the recipe creator. Others can save/copy/rate but not modify someone else's recipe. Standard content ownership pattern. | Low | None -- already have `created_by` on recipes | RLS policy change + UI gate (hide edit button for non-creators). Currently any household member can edit any recipe. Key decision: household admins should still be able to delete (not edit) recipes for moderation. |
| **Cook log (basic)** | Cookpad's "Cooksnap" is their number one engagement driver -- users photograph what they cooked and attach it to the recipe. Tracking "I made this" is table stakes for any social recipe app. | Medium | Supabase Storage (already used for feed photos), new cook_logs table | Core flow: after cooking mode ends OR manual "I cooked this" button on recipe detail -> optional photo + optional note -> save. |
| **Cook count display** | "Cooked 12 times" builds recipe credibility and user cooking identity. Cookpad shows cooksnap counts prominently on every recipe. Users expect to see social proof. | Low | cook_logs table (from cook log feature) | Aggregate count from cook_logs, displayed as badge on recipe detail. Include both household count and total public count. |
| **Save to collection (enhanced)** | Already have basic save from feed. But saving any recipe you can see (not just from feed) is expected. Users browse recipes in other kitchens' profiles and need to save from there. | Low | Existing saved_recipes table | Extend save button to recipe detail screen (not just feed cards). Minor UI addition. |

## Differentiators

Features that set SharedKitchen apart. Not expected, but valued. These leverage SharedKitchen's unique household-first model.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Cook log with photos (rich)** | Goes beyond Cookpad's Cooksnap by integrating with meal plan. Auto-log when household member completes cooking mode or marks meal as done from plan. Photo prompted but optional. Creates a household cooking history, not just individual. | Medium | cook_logs table, Supabase Storage, meal plan integration | Three entry points: (1) post-cooking-mode prompt, (2) auto-log from meal plan completion, (3) manual "I cooked this" button on recipe detail. All three funnel to same cook_log creation flow. |
| **Photo gallery from past cooks** | "Gallery" section on recipe detail showing all cook log photos across the household. Visual proof that a recipe works. No major competitor does this well at the household level. Cookpad shows individual cooksnaps but not aggregated per-recipe galleries. | Medium | cook_logs with photo_url, UI gallery component | Horizontal scrollable or grid gallery on recipe detail. Scope: household cooks only (not public). Shows who cooked it and when. |
| **Recipe comments (household-visible, threaded)** | Distinct from existing flat feed post comments. Recipe comments are tied to the recipe itself, persist permanently, and are visible to everyone in the household. Threaded one level deep for Q&A ("How spicy is this?" / "Medium, I used 2 peppers"). Cookpad has recipe comments; SharedKitchen's household context makes them more intimate and useful. | Medium-High | New recipe_comments table (separate from post_comments), threading via parent_id | Key design decision: visibility scope. Recommend household members + recipe creator can see and post comments. One-level threading only (parent_id, not deep nesting). Extend existing report system for moderation. |
| **Feed integration (auto-post on create/cook)** | Currently feed only auto-posts from meal plan. Extending to auto-post when a recipe is created ("Kitchen X just added Chicken Tikka Masala") or cooked ("Kitchen X just cooked Pasta Carbonara -- cooked 5 times!") enriches the feed with recipe-centric content beyond just meal planning. | Medium | Existing feed_posts infrastructure, cook_logs, recipe creation hook | Two new auto-post triggers: (1) recipe creation, (2) cook log creation with photo. Both use existing feed_posts table. Add a `post_type` column to discriminate between meal-plan posts, recipe-creation posts, and cook-log posts for different card rendering. |
| **Version history for recipe edits** | Track what changed when recipes are edited. Useful when a recipe "stops tasting right" -- you can see the creator swapped butter for oil. No mainstream consumer cooking app does this; it is a power feature borrowed from collaborative document editing (Google Docs, GitHub). | Medium-High | New recipe_versions table (JSONB snapshot), UI for viewing history | Store full recipe snapshot on each save. Display as timeline: "Apr 5: Updated ingredients" with ability to view old version. Storage growth concern: recipe JSONB is ~2-5KB per version, manageable. |
| **Cook count badges / milestones** | "First Cook", "5x Cook", "Weekly Warrior" (cooked 7 days straight). Gamification drives engagement per CKBK case study -- effective patterns are consistency badges, exploration badges, specialization badges. Key insight from research: personal milestones, not competitive leaderboards. | Low-Medium | cook_logs table, badge definition logic | Start simple: milestone badges on recipe ("Household favorite -- cooked 5 times!") and user profile ("50 recipes cooked this month"). Avoid leaderboards -- SharedKitchen is collaborative, not competitive. |

## Anti-Features

Features to explicitly NOT build in v8.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Recipe forking / remixing** | Adds massive complexity (provenance chains, attribution disputes, "which version is canonical?"). Cookpad has "remix" but it creates confusion about ownership. SharedKitchen's household model makes this even messier -- who owns the fork? | Use "Save to collection" which copies the recipe to your library. No formal fork chain. If users want to modify, they save and edit their own copy freely. |
| **Deep threaded comments (Reddit-style)** | Deep nesting is terrible on mobile UX. Even Cookpad uses flat or 1-level comments. Recipe discussions are short Q&A exchanges, not multi-branch debates. | One-level threading only: top-level comment + replies. No reply-to-reply nesting. |
| **Public recipe profiles / marketplace** | SharedKitchen is household-first, not a recipe publishing platform. Public profiles exist via kitchen_profiles, but turning recipes into a public marketplace changes the product's identity and introduces content moderation scale issues. | Keep recipe visibility scoped: household sees all, followers see what is shared via feed. No public recipe browsing outside follow graph. |
| **@mention notifications in comments** | Adds complexity to comment parsing (regex for @handles, notification routing, edge cases with renamed handles). Low value for v8.0 scope when comments are household-scoped. | Ship plain text comments first. @mentions can be a v9.0 enhancement once handles are established and usage patterns are clear. |
| **Recipe collaboration / co-editing** | Google Docs-style real-time collaboration on recipes is engineering-heavy (conflict resolution, OT/CRDT, real-time cursors) and very low-value for a cooking app where recipes are typically authored by one person. | Single creator owns and edits. Others comment with suggestions. Creator can incorporate feedback manually. |
| **Competitive leaderboards** | SharedKitchen's core value is collaborative household cooking. Leaderboards create unhealthy dynamics ("I cook more than you") in family/roommate settings. Research confirms gamification in family apps should be personal, not competitive. | Personal milestones and badges only. "You cooked 50 recipes!" not "You're ranked #2 in your household." |
| **Community recipe ratings (separate from existing)** | Adding a second rating system (community ratings vs household ratings) creates confusion. Yummly's failure to maintain rating quality is a cautionary tale. | Keep existing 1-5 star ratings per user. Cook count serves as implicit social proof signal. |

## Feature Dependencies

```
@handle system ──────────────────┐
                                 v
                          Recipe attribution ("Created by @username")
                                 │
                                 v
                          Creator edit permissions (RLS: only creator can edit)
                                 │
cook_logs table ────────────────>│
  │                              v
  ├── Cook count display ──> Recipe detail UI updates
  │                              │
  ├── Photo gallery ────────>────┘
  │
  ├── Auto-log from meal plan ──> Meal plan integration
  │
  └── Feed auto-post on cook ──> Feed integration
                                     ^
Recipe creation auto-post ───────────┘

recipe_comments table ──> Recipe comments (threaded)
                              │
                              └── Moderation (extend existing report system)

recipe_versions table ──> Version history
                              │
                              └── Recipe edit flow changes (save snapshot before edit)

Save to collection ──> Extend existing saved_recipes (minimal new work)
```

## Critical Path

The dependency graph reveals a clear build order:

1. **@handle system** -- foundational identity layer, everything references it
2. **Recipe attribution + creator permissions** -- uses handles, gates editing, low complexity
3. **cook_logs table + basic logging** -- enables count, gallery, feed integration
4. **Recipe comments** -- independent of cook logs, can parallel with step 3
5. **Feed integration** -- depends on cook logs and recipe creation hooks
6. **Photo gallery + badges** -- polish layer on top of cook_logs data
7. **Version history** -- lowest priority, highest complexity, can be deferred

## MVP Recommendation

**Must ship (table stakes):**
1. @handle system with onboarding enforcement and existing-user migration
2. Recipe attribution display ("Created by @username") on recipe detail
3. Creator edit permissions (only creator can edit; household admin can delete)
4. Basic cook log with optional photo (manual button + post-cooking-mode prompt)
5. Cook count badge on recipe detail
6. Save to collection from recipe detail (extend existing save beyond feed)

**Should ship (key differentiators):**
7. Cook log auto-trigger from meal plan completion
8. Photo gallery on recipe detail
9. Recipe comments with 1-level threading
10. Feed auto-post on recipe create and cook

**Defer to v8.1 or v9.0:**
11. Version history for recipe edits (Medium-High complexity, low initial user demand)
12. Cook count badges/milestones beyond simple count (needs usage data to inform design)
13. @mention support in comments (needs handles to be established first)

## Complexity Budget

| Feature | Estimated Effort | Risk Level |
|---------|-----------------|------------|
| @handle system + migration | 1 phase | Low risk, but existing-user migration needs careful UX |
| Recipe attribution + permissions | 0.5 phase | Low risk -- RLS + UI display |
| Cook log (all entry points) | 1 phase | Medium risk -- three trigger points, photo upload, storage |
| Recipe comments (threaded) | 1 phase | Medium risk -- new table, threading, moderation extension |
| Feed integration (auto-post) | 0.5 phase | Low risk -- extending existing auto-post infrastructure |
| Photo gallery | 0.5 phase | Low risk -- UI component reading from cook_logs |
| Save to collection (enhanced) | 0.25 phase | Low risk -- extending existing saved_recipes |
| Version history | 1 phase | Medium-High risk -- snapshot strategy, diff UI, storage |
| Badges/milestones | 0.5 phase | Low risk -- derived from existing data |
| **Total** | **~6.25 phases** | **Defer version history to fit in ~5 phases** |

## Sources

- [Cookpad Cooksnap: "A Cooksnap is worth 1,000 Words"](https://blog.cookpad.com/us/a-cooksnap-is-worth-1-000-words/) -- MEDIUM confidence
- [Cookpad Cooksnaps: Cook it! Snap it! Share it!](https://blog.cookpad.com/uk/all-about-cooksnaps-cook-it-snap-it-share-it/) -- MEDIUM confidence
- [Cookpad recipe view statistics](https://blog.cookpad.com/in/recipe-views-statistics/) -- MEDIUM confidence
- [Trophy: Gamification for recipe apps (CKBK case study)](https://trophy.so/blog/building-cooking-habits-gamification-ideas-for-recipe-apps) -- MEDIUM confidence, verified via full page fetch
- [GetStream: Building social media app (comment threading patterns)](https://getstream.io/blog/build-a-social-media-app/) -- MEDIUM confidence
- [SideChef UX best practices for recipe platforms](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites) -- MEDIUM confidence
- [Cookpad: Spreading joy of cooking (Harvard case study)](https://d3.harvard.edu/platform-digit/submission/cookpad-spreading-the-joy-of-cooking-worldwide/) -- MEDIUM confidence
- SharedKitchen existing codebase: database.ts types, socialStore.ts, recipes table schema -- HIGH confidence
