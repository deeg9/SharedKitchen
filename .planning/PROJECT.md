# Mise

## What This Is

Mise is a collaborative dinner planning mobile app for couples, roommates, and families. It combines a shared weekly meal calendar, recipe library, auto-generated grocery lists with real-time sync, and budget tracking — all in one warm, inviting interface that feels like "Notion meets your favorite cookbook." Built with React Native + Expo for iOS, backed by Supabase.

## Core Value

Households can collaboratively plan, shop for, and cook dinners together in real-time — eliminating the daily "what's for dinner?" friction.

## Current Milestone: v2.0 AI, Payments & Polish

**Goal:** Level up Mise with advanced AI features, real Stripe payments for premium, push notifications, real-time collaboration visibility, and comprehensive end-to-end testing across all features.

**Target features:**
- Enhanced AI recipe extraction from web URLs
- AI-powered random meal generator based on preferences, history, dietary needs
- Push notification system (cooking reminders, leftover alerts, budget warnings, household activity)
- Real-time visibility when household members check off recipes or grocery items
- Stripe integration for real payment processing (subscriptions, checkout, billing)
- Premium tier system with actual gated features and paid unlock
- Comprehensive end-to-end testing across all existing and new features

## Requirements

### Validated

- ✓ Weekly dinner calendar with day cards — v1.0 Phase 2
- ✓ Shared recipe library with search, filters, 2-column grid — v1.0 Phase 2
- ✓ AI-powered recipe import from URL — v1.0 Phase 2
- ✓ Manual recipe creation — v1.0 Phase 2
- ✓ Recipe detail with scaling, ratings, notes — v1.0 Phase 2
- ✓ Grocery list auto-generated, grouped by section — v1.0 Phase 2
- ✓ Real-time grocery list sync via Supabase Realtime — v1.0 Phase 2
- ✓ Manual grocery item additions — v1.0 Phase 2
- ✓ Monthly budget dashboard with category breakdown — v1.0 Phase 3
- ✓ Weekly spending breakdown — v1.0 Phase 3
- ✓ Quick expense logging — v1.0 Phase 3
- ✓ Household creation and management — v1.0 Phase 1
- ✓ Multi-household support — v1.0 Phase 1
- ✓ Household invite system — v1.0 Phase 1
- ✓ Email/password and Google OAuth auth — v1.0 Phase 1
- ✓ User profile with avatar, name, cooking stats — v1.0 Phase 1/3
- ✓ "Surprise Me" random dinner generator — v1.0 Phase 2
- ✓ Edit meal plan day via bottom sheet — v1.0 Phase 2
- ✓ Leftover tracker with freshness badges — v1.0 Phase 3
- ✓ AI suggestion cards — v1.0 Phase 3
- ✓ Onboarding flow — v1.0 Phase 4
- ✓ Dietary preferences/restrictions — v1.0 Phase 3
- ✓ Dark mode — v1.0 Phase 3
- ✓ Notification settings UI — v1.0 Phase 3
- ✓ Freemium gating UI (shell only) — v1.0 Phase 4
- ✓ 5-tab bottom navigation — v1.0 Phase 1
- ✓ Culinary Curator design system — v1.0 Phase 1

### Active

- [ ] Enhanced AI recipe extraction from web (improved scraping, broader site support)
- [ ] AI-powered random meal generator (preferences, history, dietary-aware suggestions)
- [ ] Push notification system (cooking reminders, leftover alerts, budget warnings, household activity)
- [ ] Real-time visibility for recipe/grocery check-offs (live avatars, activity indicators)
- [ ] Stripe subscription integration (checkout, billing portal, webhook handling)
- [ ] Premium tier with real payment gating (replace freemium shell with actual subscriptions)
- [ ] Premium analytics dashboard (cooking distribution, spending trends, top rated meals)
- [ ] Comprehensive E2E testing (all existing + new features)

### Out of Scope

- Android build — iOS only for v2.0; cross-platform foundation ready via Expo
- Web version — mobile-first, no web client
- Social features beyond household (no public profiles, no recipe sharing outside household)
- Meal prep / batch cooking workflows — keep it simple per-day planning
- Grocery delivery integration (Instacart, etc.)
- Real-time chat — household coordination via meal plan, not messaging
- Video content in recipes — text + photos only

## Context

- Architecture spec lives at `/Users/deeg/Desktop/mise-stitch-prompt.md` — comprehensive UI/screen definitions for all 5 tabs, detail pages, onboarding, and design notes
- **Stitch UI screens** already generated at `stitch_ui/stitch_grocery_list/` — 16 screens as static HTML/Tailwind mockups with screenshots. These are the front-end reference designs to translate into React Native components:
  - `plan_home` — Weekly dinner calendar (Tab 1)
  - `recipes_library` — Recipe grid with search/filters (Tab 2)
  - `refined_recipe_detail_street_tacos_al_pastor` — Recipe detail page
  - `add_recipe_form` — Add/edit recipe form
  - `grocery_list` — Grocery checklist grouped by section (Tab 3)
  - `budget_dashboard` — Monthly spending dashboard (Tab 4)
  - `profile_household_updated` — Profile & household management (Tab 5)
  - `random_dinner_generator` — Surprise Me modal
  - `household_invite_join_landing_page` — Invite/join household
  - `onboarding_welcome`, `onboarding_create_household`, `onboarding_invite_members`, `onboarding_add_first_recipes`, `onboarding_all_set` — Onboarding flow
  - `mise_waitlist_landing_page` — Marketing landing page
  - `mise_en_place/DESIGN.md` — Full design system documentation ("The Culinary Curator")
- Landing page already built at `index.html` (Tailwind CSS, static marketing page with waitlist)
- Design language: warm cream/off-white backgrounds, deep olive/sage green primary (#334537), burnt orange accent (#904d00), Material Design 3 color tokens, Plus Jakarta Sans headers, Inter body text, rounded outlined Material Symbols icons
- Design philosophy: "Tactile Sophistication" — no-line rule (use tonal layering not borders), ambient shadows, ghost borders, breathing room, intentional asymmetry
- 8px spacing grid, rounded corners, subtle shadows, skeleton loading states, optimistic UI updates
- Real-time collaboration is central — Supabase Realtime for grocery sync, household activity

## Constraints

- **Platform**: iOS only (React Native + Expo, EAS Build)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Auth**: Email/password + Google OAuth via Supabase Auth
- **AI**: Need an LLM API for recipe URL parsing and suggestion generation (likely Claude or OpenAI)
- **Design**: Must match the established Material Design 3 color system and typography from the landing page
- **Monetization**: Freemium shell only — UI gates without payment processing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo over native Swift | Cross-platform foundation even though v1 is iOS-only; faster development with Expo tooling | — Pending |
| Supabase over Firebase | Postgres flexibility, built-in Realtime for grocery sync, Row Level Security for household data isolation | — Pending |
| Multi-household from day one | Users may have separate households (roommates + family); easier to architect upfront than retrofit | — Pending |
| Freemium shell without payments | Ship faster, validate product-market fit before investing in IAP/subscription infrastructure | — Pending |
| Real-time grocery sync from v1 | Core to the collaborative value prop — pull-to-refresh would undermine the "together" feeling | — Pending |
| AI features in v1 | URL import reduces friction for recipe entry; suggestions drive engagement and re-engagement | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after milestone v2.0 started*
