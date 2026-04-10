# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking. v4.0 (Phases 26-29) adds AI vision features: camera-based fridge/pantry scanning to bulk-add inventory, food photo identification for recipe discovery, and meal plan logging from photos. v5.0 (Phases 30-34) adds a Venmo-style social feed layer: kitchen profiles, follow/unfollow, auto-posted meals from the plan, feed with likes, comments, recipe saving, and push notifications for social interactions. v6.0 (Phases 35-38) integrates external food databases (USDA, Open Food Facts, FatSecret) to provide searchable food data, barcode scanning, and per-recipe/per-day nutrition display powered by AI-assisted ingredient matching. v7.0 (Phases 39-43) implements 14 Google Stitch UI designs across all major app surfaces — elevating the visual design while preserving all existing functionality, constrained by the existing design system.

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
- **v7.0 Stitch UI Redesign** — Phases 39-43 (in progress)

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

<details>
<summary>v6.0 Food Data Integration (Phases 35-38) — SHIPPED 2026-04-09</summary>

- [x] Phase 35: Data Foundation (2/2 plans) — Postgres schema, TypeScript types, unit conversion, and nutrition normalization layer
- [x] Phase 36: Food Search (2/2 plans) — Edge Functions for USDA/FatSecret search, client store, and searchable food interface
- [x] Phase 37: Barcode Scanning (2/2 plans) — Camera barcode scanner, Open Food Facts/FatSecret lookup, and add-to-pantry/grocery flows
- [x] Phase 38: Recipe Nutrition (2/2 plans) — AI-assisted ingredient matching, per-recipe nutrition computation, and nutrition display

</details>

### v7.0 Stitch UI Redesign (In Progress)

**Milestone Goal:** Implement 14 Google Stitch UI designs across all major app surfaces — preserving all existing functionality while elevating the visual design to match the Stitch reference screens, constrained by the existing SharedKitchen design system (colors, typography, spacing, tab bar, FAB).

- [x] **Phase 39: Shared Components & Dependencies** - Reusable UI primitives (DonutChart, ProgressBar, InsightCard, FilterChips, DateStrip) and new dependency installation that unblock all subsequent phases (completed 2026-04-09)
- [x] **Phase 40: Independent Screen Redesigns** - Onboarding (6 screens), Recipe Library, Cooking Mode, and Premium Upgrade — screens requiring no store changes (completed 2026-04-09)
- [x] **Phase 41: Plan Tab Redesign** - Flagship day-focused meal planner with hero card, date strip, day/week toggle, and grocery shortcut (completed 2026-04-09)
- [x] **Phase 42: Grocery List Redesign** - High-risk grocery screen with shopping progress, sync-with-plan, and enhanced item rows while preserving 4 real-time hooks (completed 2026-04-10)
- [x] **Phase 43: Budget, Profile & Social Feed** - Store-enhanced screens (budget insights, cooking stats) plus social feed redesign and cross-app Maestro test updates (completed 2026-04-10)

## Phase Details

### Phase 39: Shared Components & Dependencies
**Goal**: All reusable UI primitives needed by subsequent phases are built, tested, and importable — plus new npm dependencies are installed and verified
**Depends on**: Phase 38 (v6.0 complete)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06
**Success Criteria** (what must be TRUE):
  1. DonutChart component renders an animated SVG ring with configurable value, max, and label — verified in Budget and Profile contexts
  2. ProgressBar component renders an animated horizontal fill bar with value/max — verified in Grocery and Budget contexts
  3. InsightCard component displays an icon, message text, and optional badge — verified standalone
  4. FilterChips component renders a horizontally scrollable row of selectable pills with single-select behavior
  5. DateStrip component renders a scrollable horizontal day selector with today highlight and tap-to-select
**Plans**: 3 plans
Plans:
- [x] 39-01-PLAN.md — Install dependencies + build ProgressBar and InsightCard
- [x] 39-02-PLAN.md — Build FilterChips and DateStrip
- [x] 39-03-PLAN.md — Build DonutChart (animated SVG ring)
**UI hint**: yes

### Phase 40: Independent Screen Redesigns
**Goal**: Users experience the redesigned Onboarding, Recipe Library, Cooking Mode, and Premium Upgrade screens — all screens that need no store changes and can be built entirely from existing data
**Depends on**: Phase 39
**Requirements**: ONBR-01, ONBR-02, ONBR-03, ONBR-04, ONBR-05, ONBR-06, RCPE-01, RCPE-02, RCPE-03, RCPE-04, COOK-01, COOK-02, COOK-03, COOK-04, COOK-05, COOK-06, PREM-01, PREM-02, PREM-03, PREM-04
**Success Criteria** (what must be TRUE):
  1. New user completing onboarding passes through all 6 redesigned screens (Welcome, Create Kitchen, Invite, Add Recipes, Plan Week, All Set) with progress indicators and functional CTAs
  2. Recipe library displays full-width cards with description, cook time pill, difficulty badge, and rating — with horizontal filter chips (All, Quick Meals, Favorites) replacing the old FilterBar dropdown
  3. Cooking mode shows step photos, step type badges (PREP/COOKING/MARINATING), chef tip callouts, ingredient chips, and Previous/Next navigation buttons
  4. Premium upgrade screen displays hero photo, feature comparison table (Free vs Premium), and monthly/yearly pricing tiers with BEST VALUE badge
  5. All existing Maestro E2E flows touching these screens pass with updated testID references
**Plans**: 4 plans
Plans:
- [x] 40-01-PLAN.md — Redesign all 6 onboarding screens (Welcome through All Set)
- [x] 40-02-PLAN.md — Redesign Recipe Library with FilterChips and full-width cards
- [x] 40-03-PLAN.md — Redesign Cooking Mode with step photos, badges, tips, and Previous/Next buttons
- [x] 40-04-PLAN.md — Redesign Premium Upgrade screen with hero photo, comparison table, and pricing tiers
**UI hint**: yes

### Phase 41: Plan Tab Redesign
**Goal**: Users experience a day-focused meal planner as the app's flagship screen — with hero dinner card, horizontal date navigation, and day/week toggle
**Depends on**: Phase 39
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07
**Success Criteria** (what must be TRUE):
  1. User sees Day/Week toggle in the plan header and can switch between views, defaulting to Day view
  2. In Day view, user can swipe or tap the date strip to navigate days, with today's dinner displayed as a hero card showing recipe photo, description, presence indicator, and "Start Cooking" CTA
  3. Empty meal slots show soft illustrated placeholders with contextual prompts ("What's for breakfast?", "Lunch time?")
  4. User can toggle to Week view showing all 7 days with breakfast/lunch/dinner slots, with prev/next navigation working in both views
  5. Grocery shortcut card appears at screen bottom showing current week item count and linking to Kitchen tab
**Plans**: 2 plans
Plans:
- [x] 41-01-PLAN.md — Build HeroDinnerCard, DayViewMealSlot, and GroceryShortcutCard components
- [x] 41-02-PLAN.md — Wire Day/Week toggle, DateStrip, and new components into plan.tsx
**UI hint**: yes

### Phase 42: Grocery List Redesign
**Goal**: Users experience a redesigned grocery list with shopping progress tracking, plan sync, and enhanced item details — without any regression in real-time sync, presence, or camera flows
**Depends on**: Phase 39
**Requirements**: GROC-01, GROC-02, GROC-03, GROC-04, GROC-05
**Success Criteria** (what must be TRUE):
  1. Summary card at list top shows item count, estimated cost, and live presence avatars of other household members shopping
  2. Shopping progress bar displays "X of Y items checked" with animated fill that updates in real time as items are checked
  3. User can tap "Sync with Plan" to regenerate the grocery list from the current meal plan
  4. Item rows display quantity, estimated price, and source/category tags
  5. Segment control shows Shopping List (left) / On Hand (right) — and real-time sync, presence avatars, barcode scanning, and photo scanning all work without regression
**Plans**: 2 plans
Plans:
- [x] 42-01-PLAN.md — Redesign GrocerySummary, GroceryItem rows, and GrocerySection headers
- [x] 42-02-PLAN.md — Wire Sync with Plan button, swap segment order, pass presence to summary
**UI hint**: yes

### Phase 43: Budget, Profile & Social Feed
**Goal**: Users experience redesigned Budget dashboard with insights, Profile with cooking stats, and Social Feed with hero photos — the final screens completing the Stitch UI redesign
**Depends on**: Phase 39, Phase 41
**Requirements**: BUDG-01, BUDG-02, BUDG-03, BUDG-04, BUDG-05, PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, FEED-01, FEED-02, FEED-03, FEED-04, FEED-05
**Success Criteria** (what must be TRUE):
  1. Budget dashboard shows donut ring hero (spent vs budget), month picker navigation, budget insights cards with contextual messages, category progress bars, and weekly mini bar charts
  2. Profile screen shows cooking insights (streak counter, plan completion ring), most-cooked recipe with photo, household distribution chart, and grouped settings navigation rows for Preferences and Account sections
  3. Social feed displays a horizontal following avatar strip at top, hero-sized meal photos with overlay text, "Try this recipe" CTA buttons, quoted descriptions, and "View Full Recipe" actions
  4. All existing functionality (expense logging, settings changes, feed likes/comments/save) works without regression on redesigned screens
  5. Maestro E2E flows for budget, profile, and social feed screens pass with updated testID references
**Plans**: 3 plans
Plans:
- [x] 43-01-PLAN.md — Budget dashboard redesign (DonutChart, MonthPicker, insights, category bars, weekly charts)
- [x] 43-02-PLAN.md — Social feed redesign (FollowingStrip, hero photos, Try this recipe CTAs)
- [x] 43-03-PLAN.md — Profile redesign (CookingInsights, HouseholdDistribution, grouped settings)
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 39 -> 40 -> 41 -> 42 -> 43 (Phases 41 and 42 can run in parallel after 39)

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
| 39. Shared Components & Dependencies | v7.0 | 3/3 | Complete    | 2026-04-09 |
| 40. Independent Screen Redesigns | v7.0 | 4/4 | Complete    | 2026-04-09 |
| 41. Plan Tab Redesign | v7.0 | 2/2 | Complete    | 2026-04-09 |
| 42. Grocery List Redesign | v7.0 | 2/2 | Complete    | 2026-04-10 |
| 43. Budget, Profile & Social Feed | v7.0 | 3/3 | Complete   | 2026-04-10 |

---
*Last updated: 2026-04-07 after v7.0 roadmap creation*
