# Roadmap: Mise

## Overview

Mise delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP: auth, households, recipes, meal planning, grocery sync, budget, leftovers, AI suggestions, onboarding, and freemium gating. v2.0 (Phases 5-9) levels up with real Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and comprehensive E2E testing.

## Milestones

- :white_check_mark: **v1.0 MVP** - Phases 1-4 (shipped 2026-03-23)
- :construction: **v2.0 AI, Payments & Polish** - Phases 5-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-03-23</summary>

- [x] **Phase 1: Foundation** - Auth, households, design system, tab navigation, and core app shell (completed 2026-03-23)
- [x] **Phase 2: Core Features** - Recipes, meal planning, and grocery lists with real-time sync (completed 2026-03-23)
- [x] **Phase 3: Supporting Features** - Budget tracking, leftovers, AI suggestions, and profile settings (completed 2026-03-23)
- [x] **Phase 4: Onboarding and Freemium** - First-run onboarding flow and premium gating UI (completed 2026-03-23)

</details>

### v2.0 AI, Payments & Polish

- [ ] **Phase 5: AI Fix & Payment Foundation** - Fix broken recipe import, build Stripe subscription checkout, server-authoritative premium gating
- [ ] **Phase 6: Push Notifications** - Token registration, cooking reminders, leftover alerts, budget warnings
- [x] **Phase 7: Real-Time Presence** - Live avatar stacks and activity toasts for household collaboration visibility (completed 2026-03-25)
- [ ] **Phase 8: Enhanced AI & Cooking Mode** - Smarter recipe extraction, AI meal generator, fullscreen step-by-step cooking
- [ ] **Phase 9: E2E Testing** - Maestro flows covering all user journeys and negative paths

## Phase Details

### Phase 5: AI Fix & Payment Foundation
**Goal**: Recipe import works again (gpt-5-mini) and users can purchase and manage real premium subscriptions via Stripe with server-enforced gating
**Depends on**: Phase 4
**Requirements**: AI-03, AI-07, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):
  1. User can import a recipe from a URL and receive correctly parsed recipe data (gpt-5-mini replacing deprecated gpt-4o-mini)
  2. User can tap "Upgrade" and complete a $9.99/mo premium subscription checkout via Stripe
  3. User can access the Stripe billing portal to manage or cancel their subscription
  4. Premium features are enforced server-side via RLS policies -- bypassing the client UI does not grant access
  5. AI features enforce per-user rate limits and cache duplicate requests to control costs
**Plans:** 0/3 plans executed

Plans:
- [x] 05-01-PLAN.md — Fix recipe import (gpt-5-mini + structured outputs) and add AI rate limiting/caching
- [x] 05-02-PLAN.md — Create subscriptions table, Stripe webhook handler, and subscriptionStore
- [x] 05-03-PLAN.md — Wire Stripe checkout + billing portal to UI, rewire all premium components

**UI hint**: yes

### Phase 6: Push Notifications
**Goal**: Users receive timely push notifications for cooking reminders, expiring leftovers, and budget warnings
**Depends on**: Phase 5
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05
**Success Criteria** (what must be TRUE):
  1. App registers push tokens on device and stores them in the database with device info
  2. User sees a contextual explanation of why notifications are valuable before the OS permission prompt appears
  3. User receives a local notification reminding them to start cooking before meal prep time
  4. User receives a push alert when a leftover item is approaching its use-by date
  5. User receives a push alert when household spending crosses 80% or 100% of the monthly budget
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — Notification service, push token registration, permission pre-prompt, DB migration
- [x] 06-02-PLAN.md — Wire scheduling into stores (cooking reminders, leftover alerts, budget warnings) and profile toggles

### Phase 7: Real-Time Presence
**Goal**: Users can see who else in their household is viewing the same screen and get live activity updates
**Depends on**: Phase 5
**Requirements**: RT-01, RT-02, RT-03, RT-04
**Success Criteria** (what must be TRUE):
  1. User sees avatar stacks on the grocery list screen showing which household members are currently viewing it
  2. User sees avatar stacks on recipe detail screens showing who else is viewing the same recipe
  3. User sees toast notifications when a household member checks off a grocery item or modifies the meal plan
  4. Presence state syncs smoothly without phantom avatar flickering (debounced Supabase Presence)
**Plans:** 2/2 plans complete

Plans:
- [x] 07-01-PLAN.md — Build usePresence hook, useActivityToast hook, PresenceAvatarStack, and ActivityToast components with tests
- [x] 07-02-PLAN.md — Wire presence and activity toasts into grocery and recipe detail screens

**UI hint**: yes

### Phase 8: Enhanced AI & Cooking Mode
**Goal**: AI recipe extraction is smarter and cheaper, the meal generator gives context-aware suggestions, and users can cook step-by-step with timers
**Depends on**: Phase 5, Phase 7
**Requirements**: AI-04, AI-05, AI-06, COOK-01, COOK-02, COOK-03, COOK-04, COOK-05
**Success Criteria** (what must be TRUE):
  1. Recipe import tries JSON-LD/schema.org structured data first and only falls back to LLM when structured data is missing
  2. Recipe import extracts images and nutrition info from source URLs when available
  3. User can generate meal suggestions that account for dietary preferences, cooking history, current leftovers, and remaining budget
  4. User can enter fullscreen cooking mode from a recipe and navigate step-by-step with progress indication
  5. Steps with time references display tappable countdown timers (start/pause/reset) auto-generated from AI-parsed durations
**Plans:** 3 plans

Plans:
- [x] 08-01-PLAN.md — JSON-LD extraction, nutrition/image/timer fields, enhanced parse-recipe-url Edge Function
- [x] 08-02-PLAN.md — AI meal generator Edge Function and MealGeneratorSheet UI
- [ ] 08-03-PLAN.md — Fullscreen cooking mode with step navigation, timers, and unit conversion

**UI hint**: yes

### Phase 9: E2E Testing
**Goal**: All major user journeys and failure paths have Maestro E2E test coverage ensuring v2.0 is production-ready
**Depends on**: Phase 8
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Maestro flows successfully run through auth (signup, login, logout) and onboarding
  2. Maestro flows cover recipe creation, AI import, and recipe detail viewing
  3. Maestro flows cover meal planning operations (add, edit, clear, Surprise Me) and grocery list workflows (generate, check off, manual add)
  4. Maestro flows cover premium subscription checkout and verify gated feature access
  5. Maestro flows cover negative paths: failed payment, denied notification permissions, AI timeout, and expired subscription
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8 -> 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/3 | Complete | 2026-03-23 |
| 2. Core Features | v1.0 | 3/3 | Complete | 2026-03-23 |
| 3. Supporting Features | v1.0 | 2/2 | Complete | 2026-03-23 |
| 4. Onboarding and Freemium | v1.0 | 2/2 | Complete | 2026-03-23 |
| 5. AI Fix & Payment Foundation | v2.0 | 0/3 | Planned    |  |
| 6. Push Notifications | v2.0 | 0/2 | Planned | - |
| 7. Real-Time Presence | v2.0 | 2/2 | Complete   | 2026-03-25 |
| 8. Enhanced AI & Cooking Mode | v2.0 | 0/3 | Planned | - |
| 9. E2E Testing | v2.0 | 0/0 | Not started | - |
