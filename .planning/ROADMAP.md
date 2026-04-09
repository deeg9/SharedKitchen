# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking. v4.0 (Phases 26-29) adds AI vision features: camera-based fridge/pantry scanning to bulk-add inventory, food photo identification for recipe discovery, and meal plan logging from photos. v5.0 (Phases 30-34) adds a Venmo-style social feed layer: kitchen profiles, follow/unfollow, auto-posted meals from the plan, feed with likes, comments, recipe saving, and push notifications for social interactions. v6.0 (Phases 35-38) integrates external food databases (USDA, Open Food Facts, FatSecret) to provide searchable food data, barcode scanning for packaged foods, and per-recipe/per-day nutrition display powered by AI-assisted ingredient matching.

## Milestones

- **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- **v2.2 UI Polish & Bug Fixes** — Phases 13-15 (shipped 2026-03-27)
- **v2.3 Kitchen Switching** — Phases 16-17 (shipped 2026-03-27)
- **v2.4 Comprehensive QA Testing** — Phases 18-22 (shipped 2026-03-27)
- **v3.0 Video Recipe Import & Kitchen Tab** — Phases 23-25 (shipped 2026-03-29) — [Archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 AI Vision — Scan, Snap & Add** — Phases 26-29 (shipped 2026-03-30) — [Archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 Social Feed** — Phases 30-34 (shipped 2026-04-07) — [Archive](milestones/v5.0-ROADMAP.md)
- **v6.0 Food Data Integration** — Phases 35-38 (in progress)

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

<details>
<summary>v4.0 AI Vision — Scan, Snap & Add (Phases 26-29) — SHIPPED 2026-03-30</summary>

- [x] Phase 26: Vision Foundation (3/3 plans) — Camera capture, image compression, Edge Function with Gemini vision, rate limiting
- [x] Phase 27: Fridge/Pantry Photo Scan (2/2 plans) — Photo scan, review screen, bulk-add, dedup, multi-photo
- [x] Phase 28: Food Photo to Recipe Discovery (2/2 plans) — Dish identification, Serper web search, recipe import
- [x] Phase 29: Food Photo to Meal Logging (2/2 plans) — Dual-action UX, day/slot picker, Plan tab display

</details>

<details>
<summary>v5.0 Social Feed (Phases 30-34) — SHIPPED 2026-04-07</summary>

- [x] Phase 30: Social Database & Kitchen Profiles (3/3 plans) — DB foundation, kitchen profiles, search, invite links
- [x] Phase 31: Follow System (2/2 plans) — Follow/unfollow, follower/following lists
- [x] Phase 32: Feed & Auto-Post (2/2 plans) — Chronological feed on Plan tab, auto-post, photos, pagination
- [x] Phase 33: Social Interactions & Moderation (3/3 plans) — Likes, comments, save recipe, Cook This Too, report/block
- [x] Phase 34: Social Push Notifications (2/2 plans) — Edge Function + webhooks, social notification toggle

</details>

### v6.0 Food Data Integration (In Progress)

**Milestone Goal:** Integrate external food databases (USDA, Open Food Facts, FatSecret) to provide comprehensive nutrition data, barcode scanning, and searchable food/ingredient data that powers recipes, meal plans, and AI features.

- [x] **Phase 35: Data Foundation** - Postgres schema, TypeScript types, unit conversion, and nutrition normalization layer (completed 2026-04-09)
- [ ] **Phase 36: Food Search** - Edge Functions for USDA/FatSecret search, client store, and searchable food interface
- [ ] **Phase 37: Barcode Scanning** - Camera barcode scanner, Open Food Facts/FatSecret lookup, and add-to-pantry/grocery flows
- [ ] **Phase 38: Recipe Nutrition** - AI-assisted ingredient matching, per-recipe nutrition computation, and nutrition display on recipes and meal plans

## Phase Details

### Phase 35: Data Foundation
**Goal**: App has a canonical food data layer with numeric nutrition storage, unit conversion, and caching infrastructure ready for external API integration
**Depends on**: Phase 34 (v5.0 complete)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Nutrition data is stored as canonical numeric values (calories, protein, carbs, fat, fiber, sodium) per serving and per 100g in Postgres
  2. App can convert between common cooking units (cups, tbsp, oz, ml, g) using food-specific density tables
  3. Food data cache table exists with full-text search (tsvector + GIN index) and 30-day TTL cleanup
  4. TypeScript types (FoodItem, NutritionData) are defined and shared between client and Edge Functions
**Plans**: 2 plans
Plans:
- [x] 35-01-PLAN.md — Database migration (food_items + food_search_cache tables with indexes and RLS)
- [x] 35-02-PLAN.md — Nutrition utilities (density tables, computation functions) + database.ts types

### Phase 36: Food Search
**Goal**: Users can search for any food by name and see nutrition information from a unified database
**Depends on**: Phase 35
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. User can open a food search interface and type a food name to get results from USDA and FatSecret combined
  2. Each search result displays the food name, brand (if applicable), and key macros (calories, protein, carbs, fat)
  3. User can tap a search result to see a detailed nutrition breakdown with all tracked nutrients
  4. Search results are cached in Postgres so repeated queries do not hit external APIs
**Plans**: 2 plans
Plans:
- [ ] 36-01-PLAN.md — food-search Edge Function (USDA + FatSecret with cache-first lookup, normalization, rate limiting)
- [ ] 36-02-PLAN.md — Client store, API wrapper, and FoodSearchSheet UI (search, macro pills, inline nutrition detail)
**UI hint**: yes

### Phase 37: Barcode Scanning
**Goal**: Users can scan any packaged food barcode to instantly look up the product and add it to their pantry or grocery list
**Depends on**: Phase 36
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04
**Success Criteria** (what must be TRUE):
  1. User can point the device camera at a product barcode and the app reads it automatically
  2. Scanned barcode resolves to a product with name and nutrition data via Open Food Facts or FatSecret fallback
  3. User can add a scanned product directly to their pantry/fridge inventory with nutrition data attached
  4. User can add a scanned product to their grocery list with product details preserved
  5. When a barcode is not found, the app gracefully falls back to name-based food search
**Plans**: TBD
**UI hint**: yes

### Phase 38: Recipe Nutrition
**Goal**: Users see accurate nutrition information on every recipe and across their weekly meal plan, powered by AI-assisted ingredient matching
**Depends on**: Phase 37
**Requirements**: NUTR-01, NUTR-02, NUTR-03, NUTR-04
**Success Criteria** (what must be TRUE):
  1. App matches recipe ingredient text to food database entries using AI-assisted matching with user confirmation for low-confidence matches
  2. Per-recipe nutrition totals (calories, protein, carbs, fat per serving) are computed from matched ingredient data and cached on the recipe
  3. Recipe detail screen displays a nutrition card showing calories, protein, carbs, and fat per serving
  4. Plan tab shows aggregated daily and weekly nutrition totals for all planned meals
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 35 -> 36 -> 37 -> 38

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
| 35. Data Foundation | v6.0 | 2/2 | Complete    | 2026-04-09 |
| 36. Food Search | v6.0 | 0/2 | Planning complete | - |
| 37. Barcode Scanning | v6.0 | 0/0 | Not started | - |
| 38. Recipe Nutrition | v6.0 | 0/0 | Not started | - |

---
*Last updated: 2026-04-09 after Phase 36 planning complete*
