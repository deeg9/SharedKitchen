# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking. v4.0 (Phases 26-29) adds AI vision features: camera-based fridge/pantry scanning to bulk-add inventory, food photo identification for recipe discovery, and meal plan logging from photos.

## Milestones

- **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- **v2.2 UI Polish & Bug Fixes** — Phases 13-15 (shipped 2026-03-27)
- **v2.3 Kitchen Switching** — Phases 16-17 (shipped 2026-03-27)
- **v2.4 Comprehensive QA Testing** — Phases 18-22 (shipped 2026-03-27)
- **v3.0 Video Recipe Import & Kitchen Tab** — Phases 23-25 (shipped 2026-03-29) — [Archive](milestones/v3.0-ROADMAP.md)
- **v4.0 AI Vision — Scan, Snap & Add** — Phases 26-29

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

- [x] Phase 18: Auth, Onboarding & Household QA (2/2 plans) — Test auth flows, onboarding, profile management, and household create/invite/join
- [x] Phase 19: Recipe Browsing & Detail QA (2/2 plans) — Test recipe list, search, filters, detail display, ratings, favorites, notes, scaling
- [x] Phase 20: Recipe Management & Cooking Mode QA (2/2 plans) — Test recipe CRUD, URL import, cooking mode navigation, timers, unit toggle
- [x] Phase 21: Planning, Grocery, Budget & Leftovers QA (2/2 plans) — Test meal planning, grocery list sync, budget tracking, leftovers
- [x] Phase 22: Presence, Subscription, Notifications & Edge Cases QA (2/2 plans) — Test presence avatars, Stripe flow, push notifications, offline/error states

</details>

<details>
<summary>v3.0 Video Recipe Import & Kitchen Tab (Phases 23-25) — SHIPPED 2026-03-29</summary>

- [x] Phase 23: Core Video Import Pipeline (3/3 plans) — Edge Function video branch, Supadata transcript extraction, Gemini parsing, paste-URL flow, rate limiting
- [x] Phase 24: Share Sheet Integration (2/2 plans) — expo-share-intent for iOS share sheet, deep link routing to import flow
- [x] Phase 25: Kitchen Tab (2/2 plans) — Rename Grocery to Kitchen, segmented control, On Hand pantry tracking, grocery auto-copy

</details>

### v4.0 AI Vision — Scan, Snap & Add (Phases 26-29)

- [x] **Phase 26: Vision Foundation** - Shared camera capture, image compression, Edge Function with Gemini vision, rate limiting, and error handling (completed 2026-03-30)
- [x] **Phase 27: Fridge/Pantry Photo Scan** - Photograph shelves, review AI-identified items, bulk-add to On Hand inventory (completed 2026-03-30)
- [x] **Phase 28: Food Photo to Recipe Discovery** - Photograph food, identify dish, search web for recipes, import into recipe book (completed 2026-03-30)
- [ ] **Phase 29: Food Photo to Meal Logging** - After dish identification, log meal directly to weekly plan with day/slot selection

## Phase Details

### Phase 26: Vision Foundation
**Goal**: Users can capture photos within the app and have them processed by AI vision, with shared infrastructure that all vision features build on
**Depends on**: Phase 25
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. User can open a camera sheet from within the app, take a photo or select from gallery, and see the captured image
  2. Camera permission is requested with a friendly explanation before the system prompt appears, and denied permission shows a helpful recovery state
  3. Captured images are compressed on-device so that large iPhone photos do not cause upload failures or excessive latency
  4. Edge Function accepts images and returns structured AI analysis results, with vision calls tracked and rate-limited per user (free-tier caps enforced server-side)
**Plans:** 3/3 plans complete
Plans:
- [x] 26-01-PLAN.md — Client vision lib, camera components, permission hook, image compression
- [x] 26-02-PLAN.md — analyze-food-photo Edge Function with Gemini vision and rate limiting
- [x] 26-03-PLAN.md — Kitchen tab camera FAB integration and end-to-end wiring
**UI hint**: yes

### Phase 27: Fridge/Pantry Photo Scan
**Goal**: Users can photograph their fridge or pantry shelves and bulk-add identified items to their On Hand inventory
**Depends on**: Phase 26
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05
**Success Criteria** (what must be TRUE):
  1. User can photograph fridge/pantry shelves and see a list of AI-identified items with brand-level detail, quantities, and categories
  2. User can review the identified items on a confirmation screen -- editing names, removing incorrect items, and adding missed items before saving
  3. Confirmed items are bulk-added to On Hand inventory with correct categories, and appear immediately via real-time sync for all household members
  4. Items that already exist in On Hand are flagged as duplicates on the review screen rather than silently creating double entries
  5. User can take multiple photos (different shelves/areas) and merge all results into a single review screen before saving
**Plans:** 2/2 plans complete
Plans:
- [x] 27-01-PLAN.md — Scan types, duplicate detection, bulkAddPantryItems store method
- [ ] 27-02-PLAN.md — ScanReviewScreen UI, Kitchen tab wiring, multi-photo support
**UI hint**: yes

### Phase 28: Food Photo to Recipe Discovery
**Goal**: Users can photograph food or a screenshot and discover recipes for the identified dish
**Depends on**: Phase 26
**Requirements**: RCPE-01, RCPE-02, RCPE-03, RCPE-04
**Success Criteria** (what must be TRUE):
  1. User can photograph food or a screenshot and see the AI-identified dish name with a confidence indicator
  2. User can correct the dish name if the AI identification is wrong before searching for recipes
  3. App presents 2-3 recipe options from web search with title, source, and thumbnail for the identified dish
  4. User can select a recipe option and import it into their recipe book via the existing import pipeline
**Plans:** 2/2 plans complete
Plans:
- [x] 28-01-PLAN.md — search-recipes Edge Function (Serper.dev), client searchRecipes helper, types
- [x] 28-02-PLAN.md — DishIdentifiedSheet, RecipeResultsSheet UI, Kitchen tab identify intent wiring
**UI hint**: yes

### Phase 29: Food Photo to Meal Logging
**Goal**: Users can log a photographed meal directly to their weekly plan without needing a full recipe
**Depends on**: Phase 26, Phase 28
**Requirements**: MEAL-01, MEAL-02, MEAL-03
**Success Criteria** (what must be TRUE):
  1. After dish identification, user sees both "Find Recipes" and "Log as Meal" options -- choosing either path from a single photo
  2. User can select a specific day and meal slot (breakfast/lunch/dinner) to log the identified dish
  3. Logged meal appears on the weekly meal plan calendar and is visible to all household members
**Plans:** 1/2 plans executed
Plans:
- [x] 29-01-PLAN.md — MealSlotPickerSheet component, dual action buttons on DishIdentifiedSheet
- [ ] 29-02-PLAN.md — Wire meal logging flow in Kitchen tab, Plan tab display fix
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 26 -> 27 -> 28 -> 29

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
| 26. Vision Foundation | v4.0 | 3/3 | Complete    | 2026-03-30 |
| 27. Fridge/Pantry Photo Scan | v4.0 | 1/2 | Complete    | 2026-03-30 |
| 28. Food Photo to Recipe Discovery | v4.0 | 2/2 | Complete    | 2026-03-30 |
| 29. Food Photo to Meal Logging | v4.0 | 1/2 | In Progress|  |

---
*Last updated: 2026-03-30 after Phase 29 planning*
