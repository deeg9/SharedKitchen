# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- 🚧 **v2.2 UI Polish & Bug Fixes** — Phases 13-15

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

### v2.2 UI Polish & Bug Fixes (Phases 13-15)

- [ ] **Phase 13: Layout & Safe Areas** - Fix safe area violations, recipe detail layout, and filter bar z-index
- [ ] **Phase 14: Edge Function & Auth Polish** - Repair generate-meal endpoint and redesign sign-in screen
- [ ] **Phase 15: Profile & Settings** - Remove broken settings, searchable dietary input, household management

## Phase Details

### Phase 13: Layout & Safe Areas
**Goal**: All screens render correctly within safe area boundaries with no overlapping or hidden UI elements
**Depends on**: Nothing (first phase of v2.2)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, RECIPE-01
**Success Criteria** (what must be TRUE):
  1. Every bottom sheet and modal shows its X button and header fully visible below the status bar on notched iPhones
  2. Profile screen content starts below the status bar and does not scroll behind clock/WiFi/battery indicators
  3. Recipe detail "Start Cooking" and "Add to Plan" buttons are properly sized with clear spacing and no overlap
  4. Recipe detail hero image displays without a white card overlay obscuring it
  5. Opening the "What should we cook" popup fully covers the filter bar — no category/cost/time controls bleed through
**Plans:** 2 plans
Plans:
- [ ] 13-01-PLAN.md — BottomSheet safe area insets + Profile screen safe area padding
- [ ] 13-02-PLAN.md — Recipe detail button layout, hero overlay fix, FilterBar z-index containment
**UI hint**: yes

### Phase 14: Edge Function & Auth Polish
**Goal**: Users can generate AI meal suggestions without errors and encounter a polished, branded sign-in experience
**Depends on**: Phase 13
**Requirements**: EDGE-01, AUTH-01
**Success Criteria** (what must be TRUE):
  1. Tapping "What should we cook" returns meal suggestion cards with cost/time/leftover badges — no error toasts or empty states
  2. Sign-in screen displays the SharedKitchen logo above the app title with a cohesive visual design matching the Culinary Curator design system
**Plans**: TBD
**UI hint**: yes

### Phase 15: Profile & Settings
**Goal**: Profile screen offers only working settings with improved dietary input and household management
**Depends on**: Phase 14
**Requirements**: SETTINGS-01, SETTINGS-02, SETTINGS-03
**Success Criteria** (what must be TRUE):
  1. Profile screen no longer shows a Dark Mode toggle or an App Settings section
  2. User can type to search and select dietary restrictions from a searchable dropdown instead of scrolling through static chips
  3. Household management area presents members, invite actions, and household switching in a clear, usable layout
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 13 → 14 → 15

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
| 13. Layout & Safe Areas | v2.2 | 0/2 | Planning | - |
| 14. Edge Function & Auth Polish | v2.2 | 0/0 | Not started | - |
| 15. Profile & Settings | v2.2 | 0/0 | Not started | - |

---
*Last updated: 2026-03-26 after Phase 13 planning*
