# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness. v3.0 (Phases 23-25) adds video recipe import from TikTok, Instagram, YouTube, and any video URL via paste or share sheet, with transcript-based AI extraction, freemium rate limiting, and a unified Kitchen tab with pantry tracking.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- ✅ **v2.2 UI Polish & Bug Fixes** — Phases 13-15 (shipped 2026-03-27)
- ✅ **v2.3 Kitchen Switching** — Phases 16-17 (shipped 2026-03-27)
- ✅ **v2.4 Comprehensive QA Testing** — Phases 18-22 (shipped 2026-03-27)
- 🚧 **v3.0 Video Recipe Import & Kitchen Tab** — Phases 23-25

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-23</summary>

- [x] Phase 1: Foundation (3/3 plans) — Auth, households, design system, navigation
- [x] Phase 2: Core Features (3/3 plans) — Recipes, meal planning, grocery lists, real-time sync
- [x] Phase 3: Supporting Features (2/2 plans) — Budget, leftovers, AI suggestions, profile settings
- [x] Phase 4: Onboarding & Freemium (2/2 plans) — Onboarding flow, premium gating shell

</details>

<details>
<summary>✅ v2.0 AI, Payments & Polish (Phases 5-9) — SHIPPED 2026-03-26</summary>

- [x] Phase 5: AI Fix & Payment Foundation (3/3 plans) — gpt-5-mini, Stripe subscriptions, server-authoritative gating
- [x] Phase 6: Push Notifications (2/2 plans) — Cooking reminders, leftover alerts, budget warnings
- [x] Phase 7: Real-Time Presence (2/2 plans) — Avatar stacks, activity toasts, Supabase Presence
- [x] Phase 8: Enhanced AI & Cooking Mode (3/3 plans) — JSON-LD extraction, meal generator, fullscreen cooking with timers
- [x] Phase 9: E2E Testing (3/3 plans) — 18 Maestro flows covering all journeys + negative paths

</details>

<details>
<summary>✅ v2.1 Discovery, Checkout & Polish (Phases 10-12) — SHIPPED 2026-03-26</summary>

- [x] Phase 10: Recipe Discovery (2/2 plans) — Unify categories, FilterBar, verify filtering end-to-end
- [x] Phase 11: Stripe Test Mode E2E (2/2 plans) — Package install, webhook fix, env docs, checkout flow
- [x] Phase 12: Code Quality Polish (2/2 plans) — Error boundaries, TypeScript fixes, console cleanup, empty states

</details>

<details>
<summary>✅ v2.2 UI Polish & Bug Fixes (Phases 13-15) — SHIPPED 2026-03-27</summary>

- [x] Phase 13: Layout & Safe Areas (2/2 plans) — Fix safe area violations, recipe detail layout, and filter bar z-index
- [x] Phase 14: Edge Function & Auth Polish (2/2 plans) — Repair generate-meal endpoint and redesign sign-in screen
- [x] Phase 15: Profile & Settings (2/2 plans) — Remove broken settings, searchable dietary input, household management

</details>

<details>
<summary>✅ v2.3 Kitchen Switching (Phases 16-17) — SHIPPED 2026-03-27</summary>

- [x] Phase 16: Kitchen Switcher & Management (1/1 plans) — Kitchen store, switcher dropdown on profile, create/join flows
- [x] Phase 17: Data Scoping (1/1 plans) — Wire all Zustand stores to filter by active household_id, re-fetch on switch

</details>

<details>
<summary>✅ v2.4 Comprehensive QA Testing (Phases 18-22) — SHIPPED 2026-03-27</summary>

- [x] Phase 18: Auth, Onboarding & Household QA (2/2 plans) — Test auth flows, onboarding, profile management, and household create/invite/join
- [x] Phase 19: Recipe Browsing & Detail QA (2/2 plans) — Test recipe list, search, filters, detail display, ratings, favorites, notes, scaling
- [x] Phase 20: Recipe Management & Cooking Mode QA (2/2 plans) — Test recipe CRUD, URL import, cooking mode navigation, timers, unit toggle
- [x] Phase 21: Planning, Grocery, Budget & Leftovers QA (2/2 plans) — Test meal planning, grocery list sync, budget tracking, leftovers
- [x] Phase 22: Presence, Subscription, Notifications & Edge Cases QA (2/2 plans) — Test presence avatars, Stripe flow, push notifications, offline/error states

</details>

### v3.0 Video Recipe Import & Kitchen Tab (Phases 23-25)

- [x] **Phase 23: Core Video Import Pipeline** - Edge Function video branch, Supadata transcript extraction, Gemini parsing, paste-URL flow, rate limiting (completed 2026-03-28)
- [x] **Phase 24: Share Sheet Integration** - expo-share-intent for iOS share sheet, deep link routing to import flow (completed 2026-03-28)
- [x] **Phase 25: Kitchen Tab** - Rename Grocery tab to Kitchen with segmented control (On Hand | Shopping List), pantry/fridge tracking, auto-move from grocery (completed 2026-03-29)

## Phase Details

### Phase 23: Core Video Import Pipeline
**Goal**: Users can paste a video URL from TikTok, Instagram, YouTube, or any video source and get a complete recipe extracted from the video's transcript
**Depends on**: Phase 22 (last phase of v2.4)
**Requirements**: VURL-01, VURL-02, VURL-03, VURL-04, TRANS-01, TRANS-02, TRANS-03, PARSE-01, PARSE-02, PARSE-03, IMPORT-01, IMPORT-02, IMPORT-03, IMPORT-04, RATE-01, RATE-02, RATE-03, RATE-04
**Success Criteria** (what must be TRUE):
  1. User can paste a TikTok, Instagram Reel, YouTube, or generic video URL into the existing recipe import field and the app routes it to the video import pipeline instead of HTML extraction
  2. After pasting a video URL, the user sees a loading state, then a preview of the extracted recipe with title, ingredients, steps, and metadata -- with an option to edit before saving
  3. Non-recipe videos (e.g., a dance video or news clip) show a clear error message instead of a hallucinated recipe
  4. Free users see a usage counter ("2 of 3 imports used this month") and are blocked with an upgrade prompt after 3 video imports per month; premium users import unlimited videos
  5. Saved video-imported recipes include a link back to the original source video
**Plans**: 3 plans
Plans:
- [x] 23-01-PLAN.md — Video URL detection (TDD) + Edge Function video branch (Supadata + Gemini + rate limiting)
- [x] 23-02-PLAN.md — Client ai.ts video routing + add-recipe UI (progress, usage counter, upgrade prompt)
- [ ] 23-03-PLAN.md — Human verification of end-to-end video import flow
**UI hint**: yes

### Phase 24: Share Sheet Integration
**Goal**: Users can share a video URL from TikTok, Instagram, or YouTube directly to SharedKitchen via the iOS share sheet, triggering video import automatically
**Depends on**: Phase 23
**Requirements**: SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):
  1. SharedKitchen appears as an option in the iOS share sheet when sharing a URL from TikTok, Instagram, or YouTube
  2. Tapping SharedKitchen in the share sheet opens the app and immediately begins the video import flow with the shared URL pre-filled
  3. Share sheet import works correctly whether the app was in the foreground, background, or not running at all
**Plans**: 2 plans
Plans:
- [x] 24-01-PLAN.md — Install expo-share-intent, configure iOS share extension, wire ShareIntentProvider + auto-import
- [ ] 24-02-PLAN.md — Native rebuild + real-device human verification of share sheet flow
**UI hint**: yes

### Phase 25: Kitchen Tab
**Goal**: Rename the middle Grocery tab to Kitchen with a segmented control (On Hand | Shopping List). On Hand tracks fridge/pantry items with manual add and auto-move from checked grocery items. Shopping List is the existing grocery checklist.
**Depends on**: Phase 24
**Requirements**: KITCHEN-01, KITCHEN-02, KITCHEN-03, KITCHEN-04, KITCHEN-05, KITCHEN-06
**Success Criteria** (what must be TRUE):
  1. Bottom tab bar shows "Kitchen" instead of "Grocery" with a fridge/kitchen icon
  2. Kitchen screen has a segmented control at top with "On Hand" and "Shopping List" tabs
  3. Shopping List tab shows the existing grocery checklist (unchanged functionality)
  4. On Hand tab shows pantry/fridge items with name, quantity, and optional expiry
  5. User can manually add items to On Hand
  6. Checking off a grocery item in Shopping List automatically adds it to On Hand
**Plans**: 2 plans
Plans:
- [x] 25-01-PLAN.md — Supabase pantry_items migration, TypeScript types, pantryStore, usePantrySync
- [x] 25-02-PLAN.md — Rename tab to Kitchen, segmented control UI, On Hand list, add pantry sheet, grocery auto-copy
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 23 -> 24 -> 25

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
| 23. Core Video Import Pipeline | v3.0 | 2/3 | Complete    | 2026-03-28 |
| 24. Share Sheet Integration | v3.0 | 1/2 | Complete    | 2026-03-28 |
| 25. Kitchen Tab | v3.0 | 2/2 | Complete   | 2026-03-29 |

---
*Last updated: 2026-03-29 after Phase 25 planning*
