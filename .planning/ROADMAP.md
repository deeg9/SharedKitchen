# Roadmap: Mise

## Overview

Mise delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) adds recipe discovery filters, completes Stripe test mode E2E, and polishes code quality.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- 🔄 **v2.1 Discovery, Checkout & Polish** — Phases 10-12

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

### v2.1 Discovery, Checkout & Polish (Phases 10-12)

- [ ] Phase 10: Recipe Discovery (2 plans) — Unify categories, commit FilterBar, verify filtering end-to-end
  - DISC-01, DISC-02, DISC-03, DISC-04, DISC-05
  - Plans:
    - [ ] 10-01-PLAN.md — Unify category list into shared constant, update FilterBar + RecipeForm, commit
    - [ ] 10-02-PLAN.md — Unit tests for filteredRecipes(), verify AI import category contract
- [ ] Phase 11: Stripe Test Mode E2E (est. 1 plan) — Document env vars, verify full checkout→webhook→subscription flow
  - PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
- [ ] Phase 12: Code Quality Polish (est. 2 plans) — Error boundaries, TypeScript fixes, console cleanup, empty states
  - QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05

## Progress

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
| 10. Recipe Discovery | v2.1 | 0/2 | Planned | — |
| 11. Stripe Test Mode E2E | v2.1 | 0/1 | Pending | — |
| 12. Code Quality Polish | v2.1 | 0/2 | Pending | — |

---
*Last updated: 2026-03-25 after Phase 10 planning*
