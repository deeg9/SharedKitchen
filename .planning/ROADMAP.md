# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking. v4.0 (Phases 26-29) adds AI vision features: camera-based fridge/pantry scanning to bulk-add inventory, food photo identification for recipe discovery, and meal plan logging from photos. v5.0 (Phases 30-34) adds a Venmo-style social feed layer: kitchen profiles, follow/unfollow, auto-posted meals from the plan, feed with likes, comments, recipe saving, and push notifications for social interactions. v6.0 (Phases 35-38) integrates external food databases (USDA, Open Food Facts, FatSecret) to provide searchable food data, barcode scanning, and per-recipe/per-day nutrition display powered by AI-assisted ingredient matching. v7.0 (Phases 39-43) implements 14 Google Stitch UI designs across all major app surfaces. v8.0 (Phases 44-48) makes recipes social objects with per-user @handles, creator attribution, cook logging with photos, recipe comments, and feed integration for cooking events.

## Milestones

- **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- **v2.2 UI Polish & Bug Fixes** — Phases 13-15 (shipped 2026-03-27)
- **v2.3 Kitchen Switching** — Phases 16-17 (shipped 2026-03-27)
- **v2.4 Comprehensive QA Testing** — Phases 18-22 (shipped 2026-03-27)
- **v3.0 Video Recipe Import & Kitchen Tab** — Phases 23-25 (shipped 2026-03-29) — [Archive](milestones/v3.0-ROADMAP.md)
- **v4.0 AI Vision — Scan, Snap & Add** — Phases 26-29 (shipped 2026-03-30) — [Archive](milestones/v4.0-ROADMAP.md)
- **v5.0 Social Feed** — Phases 30-34 (shipped 2026-04-07) — [Archive](milestones/v5.0-ROADMAP.md)
- **v6.0 Food Data Integration** — Phases 35-38 (shipped 2026-04-09)
- ✅ **v7.0 Stitch UI Redesign** — Phases 39-43 (shipped 2026-04-09) — [Archive](milestones/v7.0-ROADMAP.md)
- 🚧 **v8.0 Social Recipes** — Phases 44-48 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-23</summary>

- [x] Phase 1: Foundation (3/3 plans) — Auth, households, design system, navigation
- [x] Phase 2: Core Features (3/3 plans) — Recipes, meal planning, grocery lists, real-time sync
- [x] Phase 3: Supporting Features (2/2 plans) — Budget, leftovers, AI suggestions, profile settings
- [x] Phase 4: Onboarding & Freemium (2/2 plans) — Onboarding flow, premium gating shell

</details>

<details>
<summary>v2.0 AI, Payments & Polish (Phases 5-9) — SHIPPED 2026-03-26</summary>

- [x] Phase 5: AI Fix & Payment Foundation (3/3 plans) — gpt-5-mini, Stripe subscriptions, server-authoritative gating
- [x] Phase 6: Push Notifications (2/2 plans) — Cooking reminders, leftover alerts, budget warnings
- [x] Phase 7: Real-Time Presence (2/2 plans) — Avatar stacks, activity toasts, Supabase Presence
- [x] Phase 8: Enhanced AI & Cooking Mode (3/3 plans) — JSON-LD extraction, meal generator, fullscreen cooking with timers
- [x] Phase 9: E2E Testing (3/3 plans) — 18 Maestro flows covering all journeys + negative paths

</details>

<details>
<summary>v2.1 Discovery, Checkout & Polish (Phases 10-12) — SHIPPED 2026-03-26</summary>

- [x] Phase 10: Recipe Discovery (2/2 plans) — Unify categories, FilterBar, verify filtering end-to-end
- [x] Phase 11: Stripe Test Mode E2E (2/2 plans) — Package install, webhook fix, env docs, checkout flow
- [x] Phase 12: Code Quality Polish (2/2 plans) — Error boundaries, TypeScript fixes, console cleanup, empty states

</details>

<details>
<summary>v2.2 UI Polish & Bug Fixes (Phases 13-15) — SHIPPED 2026-03-27</summary>

- [x] Phase 13: Layout & Safe Areas (2/2 plans) — Fix safe area violations, recipe detail layout, and filter bar z-index
- [x] Phase 14: Edge Function & Auth Polish (2/2 plans) — Repair generate-meal endpoint and redesign sign-in screen
- [x] Phase 15: Profile & Settings (2/2 plans) — Remove broken settings, searchable dietary input, household management

</details>

<details>
<summary>v2.3 Kitchen Switching (Phases 16-17) — SHIPPED 2026-03-27</summary>

- [x] Phase 16: Kitchen Switcher & Management (1/1 plans) — Kitchen store, switcher dropdown on profile, create/join flows
- [x] Phase 17: Data Scoping (1/1 plans) — Wire all Zustand stores to filter by active household_id, re-fetch on switch

</details>

<details>
<summary>v2.4 Comprehensive QA Testing (Phases 18-22) — SHIPPED 2026-03-27</summary>

- [x] Phase 18: Auth, Onboarding & Household QA (2/2 plans)
- [x] Phase 19: Recipe Browsing & Detail QA (2/2 plans)
- [x] Phase 20: Recipe Management & Cooking Mode QA (2/2 plans)
- [x] Phase 21: Planning, Grocery, Budget & Leftovers QA (2/2 plans)
- [x] Phase 22: Presence, Subscription, Notifications & Edge Cases QA (2/2 plans)

</details>

<details>
<summary>v3.0 Video Recipe Import & Kitchen Tab (Phases 23-25) — SHIPPED 2026-03-29</summary>

- [x] Phase 23: Core Video Import Pipeline (3/3 plans)
- [x] Phase 24: Share Sheet Integration (2/2 plans)
- [x] Phase 25: Kitchen Tab (2/2 plans)

</details>

<details>
<summary>v4.0 AI Vision — Scan, Snap & Add (Phases 26-29) — SHIPPED 2026-03-30</summary>

- [x] Phase 26: Vision Foundation (3/3 plans)
- [x] Phase 27: Fridge/Pantry Photo Scan (1/2 plans)
- [x] Phase 28: Food Photo to Recipe Discovery (2/2 plans)
- [x] Phase 29: Food Photo to Meal Logging (2/2 plans)

</details>

<details>
<summary>v5.0 Social Feed (Phases 30-34) — SHIPPED 2026-04-07</summary>

- [x] Phase 30: Social Database & Kitchen Profiles (3/3 plans)
- [x] Phase 31: Follow System (2/2 plans)
- [x] Phase 32: Feed & Auto-Post (2/2 plans)
- [x] Phase 33: Social Interactions & Moderation (3/3 plans)
- [x] Phase 34: Social Push Notifications (2/2 plans)

</details>

<details>
<summary>v6.0 Food Data Integration (Phases 35-38) — SHIPPED 2026-04-09</summary>

- [x] Phase 35: Data Foundation (2/2 plans)
- [x] Phase 36: Food Search (2/2 plans)
- [x] Phase 37: Barcode Scanning (2/2 plans)
- [x] Phase 38: Recipe Nutrition (2/2 plans)

</details>

<details>
<summary>v7.0 Stitch UI Redesign (Phases 39-43) — SHIPPED 2026-04-09</summary>

- [x] Phase 39: Shared Components & Dependencies (3/3 plans)
- [x] Phase 40: Independent Screen Redesigns (4/4 plans)
- [x] Phase 41: Plan Tab Redesign (2/2 plans)
- [x] Phase 42: Grocery List Redesign (2/2 plans)
- [x] Phase 43: Budget, Profile & Social Feed (3/3 plans)

</details>

### v8.0 Social Recipes (In Progress)

**Milestone Goal:** Make recipes social objects — owned by users with unique @handles, commentable, with cooking history, photo galleries, and feed integration.

- [x] **Phase 44: Handle System & Identity Foundation** - Per-user @handle usernames with onboarding enforcement and existing-user migration (completed 2026-04-11)
- [x] **Phase 45: Recipe Attribution & Creator Permissions** - Creator identity on recipes with ownership-based edit permissions and @handle search (completed 2026-04-11)
- [x] **Phase 46: Cook Log with Photos** - Cook logging from recipe detail, cooking mode, and meal plan with photo gallery and count badges (completed 2026-04-11)
- [x] **Phase 47: Recipe Comments** - Threaded recipe comments with visibility scoping and moderation (completed 2026-04-11)
- [x] **Phase 48: Feed Integration & Save to Collection** - Auto-post cook events to feed and save recipes from feed to own library (completed 2026-04-11)

## Phase Details

### Phase 44: Handle System & Identity Foundation
**Goal**: Every user has a unique @handle that identifies them across the app — new users set it during onboarding, existing users set it via a blocking interstitial
**Depends on**: Phase 43 (v7.0 complete)
**Requirements**: IDEN-01, IDEN-02, IDEN-04
**Success Criteria** (what must be TRUE):
  1. New user signing up is required to choose a unique @handle during the onboarding flow before accessing the app
  2. Existing user launching the app after the v8.0 update sees a blocking interstitial that requires them to set an @handle before proceeding
  3. @handle appears next to the user's name on recipes, comments, cook logs, and feed posts throughout the app
  4. @handle input validates format (lowercase alphanumeric + underscores), checks uniqueness in real time, and rejects reserved words
**Plans**: 5 plans
Plans:
- [x] 44-00-PLAN.md — Wave 0 test stubs for HandleInput, HandleSetupStep, HandleSetupInterstitial, FeedCard
- [x] 44-01-PLAN.md — DB migration, handle-utils, authStore handle state (TDD)
- [x] 44-02-PLAN.md — HandleInput component, onboarding step, blocking interstitial
- [x] 44-03-PLAN.md — Display @handle across feed, profile, and recipe detail
- [x] 44-04-PLAN.md — Handle change with 30-day cooldown in Edit Profile
**UI hint**: yes

### Phase 45: Recipe Attribution & Creator Permissions
**Goal**: Users see who created each recipe and only the creator can edit it — establishing clear recipe ownership while preserving collaborative access for legacy recipes
**Depends on**: Phase 44
**Requirements**: ATTR-01, ATTR-02, ATTR-03, ATTR-04, IDEN-03
**Success Criteria** (what must be TRUE):
  1. Recipe detail page displays "Created by @handle" with the creator's avatar below the recipe name
  2. Only the recipe creator sees the Edit button on recipes they created; non-creators can rate, comment, favorite, and save but cannot edit
  3. Legacy recipes (created before v8.0) are assigned to the household admin and remain editable by all household members
  4. User can search for other users by @handle from a search interface and navigate to their profile or recipes
**Plans**: 3 plans
Plans:
- [x] 45-01-PLAN.md — Migration: backfill legacy recipes + creator-scoped RLS policies
- [x] 45-02-PLAN.md — Creator attribution UI + conditional edit button on recipe detail
- [x] 45-03-PLAN.md — People search tab + public profile page
**UI hint**: yes

### Phase 46: Cook Log with Photos
**Goal**: Users can record when they cook a recipe with optional photos and notes — building a visible cooking history with count badges and photo galleries on every recipe
**Depends on**: Phase 45
**Requirements**: COOK-01, COOK-02, COOK-03, COOK-04, COOK-05, COOK-06
**Success Criteria** (what must be TRUE):
  1. User can tap "I Cooked This" on any recipe detail page to log a cook with an optional photo and note
  2. After completing cooking mode, user is prompted with a bottom sheet to log the cook with photo and note
  3. After a meal plan date passes, user is prompted to log whether they cooked the planned recipe
  4. Recipe detail shows a "Cooked N times" badge reflecting the total cook count, and a scrollable photo gallery of past cooks with dates and @handles
  5. Cook log photos are compressed and stored in Supabase Storage with CDN-backed display
**Plans**: 3 plans
Plans:
- [x] 46-01-PLAN.md — Migration, types, cookLogStore, photo upload helper
- [x] 46-02-PLAN.md — Recipe detail UI: CookLogButton, CookCountBadge, CookLogSheet, CookPhotoGallery
- [x] 46-03-PLAN.md — CookingMode post-cook prompt + Plan tab past meal banner
**UI hint**: yes

### Phase 47: Recipe Comments
**Goal**: Users can have conversations on recipes with threaded comments that are visually distinct from private recipe notes — enabling recipe discussion within households and across followed kitchens
**Depends on**: Phase 44
**Requirements**: CMNT-01, CMNT-02, CMNT-03, CMNT-04, CMNT-05
**Success Criteria** (what must be TRUE):
  1. User can add a comment on any recipe they can view, and comments appear in a dedicated section on the recipe detail page
  2. Comments support one level of threading — users can reply to a top-level comment and replies are visually nested underneath
  3. Comments are visible to household members and followers of the kitchen that owns the recipe (not globally public)
  4. Comment authors can delete their own comments
  5. Recipe comments are visually distinct from existing private recipe notes (different icon, label, and section placement)
**Plans**: 2 plans
Plans:
- [x] 47-01-PLAN.md — Migration, types, recipeCommentStore with threading logic (TDD)
- [x] 47-02-PLAN.md — Comment UI components + recipe detail integration
**UI hint**: yes

### Phase 48: Feed Integration & Save to Collection
**Goal**: Cooking events automatically appear in the social feed and users can save recipes from the feed or other kitchens into their own library — completing the social recipe loop
**Depends on**: Phase 46
**Requirements**: FEED-01, FEED-02, FEED-03, SAVE-01, SAVE-02
**Success Criteria** (what must be TRUE):
  1. When a user logs a cook, a feed post is automatically created showing the recipe name, cook's @handle, photo, and optional note
  2. Existing feed interactions (like, comment, save recipe) work on cook-log feed posts the same as on meal-plan feed posts
  3. User can save any recipe from the feed or another kitchen's profile to their own recipe library with one tap
  4. Saved recipes display "Saved from @handle's kitchen" attribution on the recipe detail page
**Plans**: 3 plans
Plans:
- [x] 48-01-PLAN.md — Migration, types, cookLogStore feed post hook
- [x] 48-02-PLAN.md — FeedCard cook-log rendering + saveRecipeFromPost RPC rewrite
- [x] 48-03-PLAN.md — SavedFromAttribution component + recipe detail integration
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 44 -> 45 -> 46 -> 47 -> 48 (Phase 47 can run in parallel with Phase 46 after Phase 44)

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-22 |
| 2. Core Features | v1.0 | 3/3 | Complete | 2026-03-22 |
| 3. Supporting Features | v1.0 | 2/2 | Complete | 2026-03-23 |
| 4. Onboarding & Freemium | v1.0 | 2/2 | Complete | 2026-03-23 |
| 5. AI Fix & Payment Foundation | v2.0 | 3/3 | Complete | 2026-03-25 |
| 6. Push Notifications | v2.0 | 2/2 | Complete | 2026-03-25 |
| 7. Real-Time Presence | v2.0 | 2/2 | Complete | 2026-03-25 |
| 8. Enhanced AI & Cooking Mode | v2.0 | 3/3 | Complete | 2026-03-26 |
| 9. E2E Testing | v2.0 | 3/3 | Complete | 2026-03-26 |
| 10. Recipe Discovery | v2.1 | 2/2 | Complete | 2026-03-26 |
| 11. Stripe Test Mode E2E | v2.1 | 2/2 | Complete | 2026-03-26 |
| 12. Code Quality Polish | v2.1 | 2/2 | Complete | 2026-03-26 |
| 13. Layout & Safe Areas | v2.2 | 2/2 | Complete | 2026-03-27 |
| 14. Edge Function & Auth Polish | v2.2 | 2/2 | Complete | 2026-03-27 |
| 15. Profile & Settings | v2.2 | 2/2 | Complete | 2026-03-27 |
| 16. Kitchen Switcher & Management | v2.3 | 1/1 | Complete | 2026-03-27 |
| 17. Data Scoping | v2.3 | 1/1 | Complete | 2026-03-27 |
| 18. Auth, Onboarding & Household QA | v2.4 | 2/2 | Complete | 2026-03-27 |
| 19. Recipe Browsing & Detail QA | v2.4 | 2/2 | Complete | 2026-03-27 |
| 20. Recipe Management & Cooking Mode QA | v2.4 | 2/2 | Complete | 2026-03-27 |
| 21. Planning, Grocery, Budget & Leftovers QA | v2.4 | 2/2 | Complete | 2026-03-27 |
| 22. Presence, Subscription, Notifications & Edge Cases QA | v2.4 | 2/2 | Complete | 2026-03-27 |
| 23. Core Video Import Pipeline | v3.0 | 3/3 | Complete | 2026-03-28 |
| 24. Share Sheet Integration | v3.0 | 2/2 | Complete | 2026-03-28 |
| 25. Kitchen Tab | v3.0 | 2/2 | Complete | 2026-03-29 |
| 26. Vision Foundation | v4.0 | 3/3 | Complete | 2026-03-30 |
| 27. Fridge/Pantry Photo Scan | v4.0 | 1/2 | Complete | 2026-03-30 |
| 28. Food Photo to Recipe Discovery | v4.0 | 2/2 | Complete | 2026-03-30 |
| 29. Food Photo to Meal Logging | v4.0 | 2/2 | Complete | 2026-03-30 |
| 30. Social Database & Kitchen Profiles | v5.0 | 3/3 | Complete | 2026-04-07 |
| 31. Follow System | v5.0 | 2/2 | Complete | 2026-04-07 |
| 32. Feed & Auto-Post | v5.0 | 2/2 | Complete | 2026-04-07 |
| 33. Social Interactions & Moderation | v5.0 | 3/3 | Complete | 2026-04-07 |
| 34. Social Push Notifications | v5.0 | 2/2 | Complete | 2026-04-07 |
| 35. Data Foundation | v6.0 | 2/2 | Complete | 2026-04-09 |
| 36. Food Search | v6.0 | 2/2 | Complete | 2026-04-09 |
| 37. Barcode Scanning | v6.0 | 2/2 | Complete | 2026-04-09 |
| 38. Recipe Nutrition | v6.0 | 2/2 | Complete | 2026-04-09 |
| 39. Shared Components & Dependencies | v7.0 | 3/3 | Complete | 2026-04-09 |
| 40. Independent Screen Redesigns | v7.0 | 4/4 | Complete | 2026-04-09 |
| 41. Plan Tab Redesign | v7.0 | 2/2 | Complete | 2026-04-09 |
| 42. Grocery List Redesign | v7.0 | 2/2 | Complete | 2026-04-10 |
| 43. Budget, Profile & Social Feed | v7.0 | 3/3 | Complete | 2026-04-10 |
| 44. Handle System & Identity Foundation | v8.0 | 5/4 | Complete   | 2026-04-11 |
| 45. Recipe Attribution & Creator Permissions | v8.0 | 3/3 | Complete    | 2026-04-11 |
| 46. Cook Log with Photos | v8.0 | 3/3 | Complete    | 2026-04-11 |
| 47. Recipe Comments | v8.0 | 2/2 | Complete    | 2026-04-11 |
| 48. Feed Integration & Save to Collection | v8.0 | 3/3 | Complete    | 2026-04-11 |

---
*Last updated: 2026-04-11 after Phase 48 planning*
