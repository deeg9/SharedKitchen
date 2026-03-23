# Mise

## What This Is

Mise is a collaborative dinner planning mobile app for couples, roommates, and families. It combines a shared weekly meal calendar, recipe library, auto-generated grocery lists with real-time sync, and budget tracking — all in one warm, inviting interface that feels like "Notion meets your favorite cookbook." Built with React Native + Expo for iOS, backed by Supabase.

## Core Value

Households can collaboratively plan, shop for, and cook dinners together in real-time — eliminating the daily "what's for dinner?" friction.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Weekly dinner calendar with day cards showing recipe, cook assignment, prep time, cost
- [ ] Shared recipe library with search, category filters, and 2-column grid
- [ ] AI-powered recipe import from URL (scrape/parse recipe data)
- [ ] Manual recipe creation with ingredients, instructions, tags, photos
- [ ] Recipe detail view with ingredient checkboxes, scaling, step-by-step instructions, notes, ratings
- [ ] Grocery list auto-generated from weekly plan, grouped by store section
- [ ] Real-time grocery list sync (see partner checking items off live via Supabase Realtime)
- [ ] Manual grocery item additions
- [ ] Monthly budget dashboard with spending progress bar, category breakdown (groceries/dining out/takeout)
- [ ] Weekly spending breakdown with expandable cards
- [ ] Quick expense logging (amount, category, description, date)
- [ ] Household creation and management (name, members, roles)
- [ ] Multi-household support (users can switch between households)
- [ ] Household invite system (share code/link to join)
- [ ] User authentication via email/password and Google OAuth
- [ ] User profile with avatar, name, cooking stats
- [ ] "Surprise Me" random dinner generator with shuffle and multiple options
- [ ] Edit meal plan day via bottom sheet (pick recipe, assign cook, add notes)
- [ ] Leftover tracker with freshness status badges and use-by dates
- [ ] AI suggestion cards ("You haven't made X in 3 weeks — it's a 5-star favorite!")
- [ ] Onboarding flow (welcome, create household, invite, add recipes, plan first week)
- [ ] Dietary preferences/restrictions toggles
- [ ] Dark mode support
- [ ] Notification settings (cooking reminders, leftover alerts, budget warnings, household activity)
- [ ] Premium dashboard with analytics (cooking distribution, spending trends, category breakdown, top rated meals)
- [ ] Freemium gating UI (premium badge, upgrade prompts — no real payments wired)
- [ ] 5-tab bottom navigation (Plan, Recipes, Grocery, Budget, Profile)

### Out of Scope

- In-app purchases / payment processing — freemium shell only, no real transactions in v1
- Android build — iOS only for v1 launch
- Web version — mobile-first, no web client
- Social features beyond household (no public profiles, no recipe sharing outside household)
- Meal prep / batch cooking workflows — keep it simple per-day planning
- Integration with external grocery delivery services (Instacart, etc.)

## Context

- Architecture spec lives at `/Users/deeg/Desktop/mise-stitch-prompt.md` — comprehensive UI/screen definitions for all 5 tabs, detail pages, onboarding, and design notes
- Landing page already built at `index.html` (Tailwind CSS, static marketing page with waitlist)
- Design language: warm cream/off-white backgrounds, deep olive/sage green primary (#334537), burnt orange accent (#904d00), Material Design 3 color tokens, Plus Jakarta Sans headers, Inter body text, rounded outlined Material Symbols icons
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

---
*Last updated: 2026-03-22 after initialization*
