# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking. v4.0 (Phases 26-29) adds AI vision features: camera-based fridge/pantry scanning to bulk-add inventory, food photo identification for recipe discovery, and meal plan logging from photos. v5.0 (Phases 30-34) adds a Venmo-style social feed layer: kitchen profiles, follow/unfollow, auto-posted meals from the plan, feed with likes, comments, recipe saving, and push notifications for social interactions. v6.0 (Phases 35-38) integrates external food databases (USDA, Open Food Facts, FatSecret) to provide searchable food data, barcode scanning, and per-recipe/per-day nutrition display powered by AI-assisted ingredient matching. v7.0 (Phases 39-43) implements 14 Google Stitch UI designs across all major app surfaces. v8.0 (Phases 44-48) makes recipes social objects with per-user @handles, creator attribution, cook logging with photos, recipe comments, and feed integration for cooking events. v9.0 (Phases 49-52) redesigns cooking mode into a beautiful step-by-step experience, adds photo attachments to comments, co-cook tagging on cook logs, and cleans up v8.0 tech debt.

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
- **v7.0 Stitch UI Redesign** — Phases 39-43 (shipped 2026-04-09) — [Archive](milestones/v7.0-ROADMAP.md)
- ✅ **v8.0 Social Recipes** — Phases 44-48 (shipped 2026-04-11)
- 🚧 **v9.0 Cooking Experience** — Phases 49-52 (in progress)

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

<details>
<summary>v8.0 Social Recipes (Phases 44-48) — SHIPPED 2026-04-11</summary>

- [x] Phase 44: Handle System & Identity Foundation (5/5 plans) — Per-user @handle usernames with onboarding enforcement and existing-user migration
- [x] Phase 45: Recipe Attribution & Creator Permissions (3/3 plans) — Creator identity on recipes with ownership-based edit permissions and @handle search
- [x] Phase 46: Cook Log with Photos (3/3 plans) — Cook logging from recipe detail, cooking mode, and meal plan with photo gallery and count badges
- [x] Phase 47: Recipe Comments (2/2 plans) — Threaded recipe comments with visibility scoping and moderation
- [x] Phase 48: Feed Integration & Save to Collection (3/3 plans) — Auto-post cook events to feed and save recipes from feed to own library

</details>

### v9.0 Cooking Experience (In Progress)

**Milestone Goal:** Redesign the cooking mode into a beautiful step-by-step experience and enhance social cooking features with photo comments and co-cook tagging.

- [ ] **Phase 49: Tech Debt & Type Safety** - RLS scoping, store-level validation enforcement, and TypeScript type fixes from v8.0
- [ ] **Phase 50: Cooking Mode Redesign** - Recipe hero image, step categories, per-step ingredients, progress bar, and enhanced navigation
- [ ] **Phase 51: Comment Photo Attachments** - Camera icon in comment input, thumbnail display, tap-to-expand, Supabase Storage
- [ ] **Phase 52: Co-Cook Tagging** - "Who did you cook with?" @handle mentions on cook log posts with feed display

## Phase Details

### Phase 49: Tech Debt & Type Safety
**Goal**: The codebase is hardened against security gaps and type errors left over from v8.0 -- profiles expose only safe columns, handle validation runs server-side, and TypeScript compiles without `never` inference hacks
**Depends on**: Phase 48 (v8.0 complete)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Profiles RLS SELECT policy returns only handle, display_name, and avatar_url -- querying profiles from another user's session does not expose email, phone, or other private columns
  2. Calling authStore.updateHandle with a reserved word (e.g., "admin", "support") is rejected at the store level before any DB call
  3. Calling authStore.updateHandle within 30 days of the last handle change is rejected at the store level with a clear cooldown message
  4. Running `npx tsc --noEmit` produces zero errors related to `never` type inference on database type definitions
**Plans:** 1/2 plans executed
Plans:
- [x] 49-01-PLAN.md — Store-level handle validation with reserved words and 30-day cooldown
- [ ] 49-02-PLAN.md — public_profiles VIEW, database.ts type regeneration, and schema push

### Phase 50: Cooking Mode Redesign
**Goal**: Users experience a visually rich step-by-step cooking flow with recipe imagery, categorized steps, contextual ingredients, and clear progress tracking
**Depends on**: Phase 49
**Requirements**: COOK-R01, COOK-R02, COOK-R03, COOK-R04, COOK-R05, COOK-R06
**Success Criteria** (what must be TRUE):
  1. Cooking mode displays the recipe hero photo at the top of each step, providing visual context throughout the cooking flow
  2. Each step shows a category tag (e.g., PREP, GRILLING, SIMMERING) derived from the step's content, helping the cook understand what phase of cooking they are in
  3. Each step shows only the ingredients needed for that specific step rather than the full recipe ingredient list
  4. A segmented progress bar at the top shows the cook's position across all steps, and Previous / Ingredients / Next Step buttons provide clear navigation
  5. A Metric/Imperial toggle at the top converts all ingredient amounts between measurement systems within the cooking view
**Plans**: TBD
**UI hint**: yes

### Phase 51: Comment Photo Attachments
**Goal**: Users can attach photos to recipe and feed comments -- showing off their cook results, asking questions about a step, or sharing modifications visually
**Depends on**: Phase 49
**Requirements**: CMNT-P01, CMNT-P02, CMNT-P03, CMNT-P04
**Success Criteria** (what must be TRUE):
  1. Comment input bar includes a camera/media icon that lets the user attach a photo before submitting the comment
  2. Comments with photos display a thumbnail image inline within the comment body
  3. Tapping a comment photo thumbnail opens a full-size view of the image
  4. Comment photos are compressed client-side and stored in Supabase Storage with CDN-backed URLs
**Plans**: TBD
**UI hint**: yes

### Phase 52: Co-Cook Tagging
**Goal**: Users can tag who they cooked with when logging a cook -- making cooking a social activity that credits participants and appears in the feed
**Depends on**: Phase 49
**Requirements**: COCOOK-01, COCOOK-02, COCOOK-03
**Success Criteria** (what must be TRUE):
  1. Cook log sheet includes a "Who did you cook with?" field where the user can search and tag other users by @handle
  2. Tagged co-cooks appear on the cook log feed post (e.g., "cooked with @alice and @bob")
  3. Co-cook relationships are stored in a cook_log_participants table linking cook log entries to user profiles
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 49 -> 50 -> 51 -> 52 (Phases 51 and 52 can run in parallel after Phase 49)

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
| 44. Handle System & Identity Foundation | v8.0 | 5/5 | Complete | 2026-04-11 |
| 45. Recipe Attribution & Creator Permissions | v8.0 | 3/3 | Complete | 2026-04-11 |
| 46. Cook Log with Photos | v8.0 | 3/3 | Complete | 2026-04-11 |
| 47. Recipe Comments | v8.0 | 2/2 | Complete | 2026-04-11 |
| 48. Feed Integration & Save to Collection | v8.0 | 3/3 | Complete | 2026-04-11 |
| 49. Tech Debt & Type Safety | v9.0 | 1/2 | In Progress|  |
| 50. Cooking Mode Redesign | v9.0 | 0/0 | Not started | - |
| 51. Comment Photo Attachments | v9.0 | 0/0 | Not started | - |
| 52. Co-Cook Tagging | v9.0 | 0/0 | Not started | - |

---
*Last updated: 2026-04-11 after Phase 49 planning*
