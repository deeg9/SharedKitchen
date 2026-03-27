# Roadmap: SharedKitchen

## Overview

SharedKitchen delivers a collaborative dinner planning app for households. v1.0 (Phases 1-4) shipped the full MVP. v2.0 (Phases 5-9) added Stripe payments, enhanced AI, push notifications, real-time presence, cooking mode, and E2E testing. v2.1 (Phases 10-12) added recipe discovery filters, Stripe test mode E2E, and code quality polish. v2.2 (Phases 13-15) fixes layout bugs, polishes the sign-in screen, repairs the meal generator edge function, and cleans up profile/settings. v2.3 (Phases 16-17) adds multi-kitchen switching so users can belong to multiple kitchens and have all app data scoped to the active one. v2.4 (Phases 18-22) systematically tests and validates every feature area to ensure production readiness.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 AI, Payments & Polish** — Phases 5-9 (shipped 2026-03-26) — [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v2.1 Discovery, Checkout & Polish** — Phases 10-12 (shipped 2026-03-26)
- 🚧 **v2.2 UI Polish & Bug Fixes** — Phases 13-15
- 📋 **v2.3 Kitchen Switching** — Phases 16-17
- 📋 **v2.4 Comprehensive QA Testing** — Phases 18-22

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
<summary>🚧 v2.2 UI Polish & Bug Fixes (Phases 13-15)</summary>

- [ ] **Phase 13: Layout & Safe Areas** - Fix safe area violations, recipe detail layout, and filter bar z-index
- [ ] **Phase 14: Edge Function & Auth Polish** - Repair generate-meal endpoint and redesign sign-in screen
- [ ] **Phase 15: Profile & Settings** - Remove broken settings, searchable dietary input, household management

</details>

### v2.3 Kitchen Switching (Phases 16-17)

- [ ] **Phase 16: Kitchen Switcher & Management** - Kitchen store, switcher dropdown on profile, create/join flows
- [ ] **Phase 17: Data Scoping** - Wire all Zustand stores to filter by active household_id, re-fetch on switch

### v2.4 Comprehensive QA Testing (Phases 18-22)

- [x] **Phase 18: Auth, Onboarding & Household QA** - Test auth flows, onboarding, profile management, and household create/invite/join (completed 2026-03-27)
- [x] **Phase 19: Recipe Browsing & Detail QA** - Test recipe list, search, filters, detail display, ratings, favorites, notes, scaling (completed 2026-03-27)
- [x] **Phase 20: Recipe Management & Cooking Mode QA** - Test recipe CRUD, URL import, cooking mode navigation, timers, unit toggle (completed 2026-03-27)
- [x] **Phase 21: Planning, Grocery, Budget & Leftovers QA** - Test meal planning, grocery list sync, budget tracking, leftovers (completed 2026-03-27)
- [ ] **Phase 22: Presence, Subscription, Notifications & Edge Cases QA** - Test presence avatars, Stripe flow, push notifications, offline/error states

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
**Plans:** 2 plans
Plans:
- [ ] 14-01-PLAN.md — Diagnose and fix generate-meal edge function deployment + secrets + client error handling
- [ ] 14-02-PLAN.md — Create AppLogo component and redesign sign-in screen with branded styling
**UI hint**: yes

### Phase 15: Profile & Settings
**Goal**: Profile screen offers only working settings with improved dietary input and household management
**Depends on**: Phase 14
**Requirements**: SETTINGS-01, SETTINGS-02, SETTINGS-03
**Success Criteria** (what must be TRUE):
  1. Profile screen no longer shows a Dark Mode toggle or an App Settings section
  2. User can type to search and select dietary restrictions from a searchable dropdown instead of scrolling through static chips
  3. Household management area presents members, invite actions, and household switching in a clear, usable layout
**Plans:** 2 plans
Plans:
- [ ] 15-01-PLAN.md — Remove App Settings section and add searchable dietary restrictions
- [ ] 15-02-PLAN.md — Redesign household management and update tests
**UI hint**: yes

### Phase 16: Kitchen Switcher & Management
**Goal**: Users can see, switch between, create, and join kitchens from the profile page
**Depends on**: Phase 15
**Requirements**: KITCHEN-01, KITCHEN-02, KITCHEN-03, KITCHEN-04
**Success Criteria** (what must be TRUE):
  1. Profile page displays a dropdown listing every kitchen the user belongs to, with the active kitchen visually highlighted
  2. Tapping a different kitchen in the dropdown switches the active kitchen, and the selection persists after closing and reopening the app
  3. User can tap "Create Kitchen", enter a name, and see the new kitchen appear in the dropdown as the active kitchen
  4. User can tap "Join Kitchen", enter an invite code, and see the joined kitchen appear in the dropdown
**Plans:** 1 plan
Plans:
- [ ] 16-01-PLAN.md — Kitchen switcher dropdown on profile page with create/join action buttons
**UI hint**: yes

### Phase 17: Data Scoping
**Goal**: All app data reflects the active kitchen — switching kitchens shows that kitchen's plans, recipes, groceries, and budget
**Depends on**: Phase 16
**Requirements**: SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04, SCOPE-05
**Success Criteria** (what must be TRUE):
  1. Plan tab shows only meal plans belonging to the active kitchen; switching kitchens immediately shows the other kitchen's meal plans
  2. Recipes tab shows only recipes belonging to the active kitchen; switching kitchens immediately shows the other kitchen's recipes
  3. Grocery tab shows only grocery lists and items for the active kitchen; switching kitchens immediately shows the other kitchen's groceries
  4. Budget tab shows only expenses and budget settings for the active kitchen; switching kitchens immediately shows the other kitchen's budget
  5. Switching kitchens triggers all Zustand stores to re-fetch their data — no stale data from the previous kitchen is visible
**Plans:** 1 plan
Plans:
- [ ] 17-01-PLAN.md — Add store clear() methods, create useKitchenDataSync hook, wire into tab layout

### Phase 18: Auth, Onboarding & Household QA
**Goal**: Auth flows, onboarding, profile, and household management all work correctly end-to-end
**Depends on**: Phase 17
**Requirements**: ONBOARD-01, AUTH-01, AUTH-02, AUTH-03, PROF-01, PROF-02, HOUSE-01, HOUSE-02, HOUSE-03
**Success Criteria** (what must be TRUE):
  1. A first-time user completes all onboarding screens, creates an account with email/password, and lands on the main app with correct initial state
  2. An existing user can sign in with saved credentials, and their session persists across app restarts without re-authentication
  3. Profile screen displays the user's name, avatar, and cooking stats, and the user can successfully edit their display name and avatar
  4. User can create a new household, generate an invite code, and a second user can join via that invite code — both see the shared household
**Plans:** 2/2 plans complete
Plans:
- [x] 18-01-PLAN.md — Auth store + onboarding store unit tests (sign-up, sign-in, session, step navigation)
- [x] 18-02-PLAN.md — Profile screen test fixes, edit-profile tests, household store action tests (create, join, invite)

### Phase 19: Recipe Browsing & Detail QA
**Goal**: Recipe list browsing, search, filtering, and all recipe detail interactions work correctly
**Depends on**: Phase 18
**Requirements**: RLIST-01, RLIST-02, RLIST-03, RLIST-04, RDETAIL-01, RDETAIL-02, RDETAIL-03, RDETAIL-04, RDETAIL-05, RDETAIL-06, RDETAIL-07
**Success Criteria** (what must be TRUE):
  1. Recipes load in a 2-column grid, user can search by name and see results update, and filtering by category/cost/prep time narrows results correctly
  2. When no recipes match the active filters, an empty state message displays instead of a blank screen
  3. Recipe detail shows hero image (or placeholder), metadata pills (prep/cook/serves/cost), and tags below the hero
  4. User can rate a recipe with stars, toggle favorite, add a household note (visible with date), scale ingredients (x1/x2/x3), and check off ingredients with strikethrough
**Plans:** 2/2 plans complete
Plans:
- [ ] 19-01-PLAN.md — Expand recipeStore unit tests (cost/time filters, notes, fetchRecipeDetail, error handling)
- [x] 19-02-PLAN.md — Maestro E2E flows for recipe list search/filter and recipe detail interactions

### Phase 20: Recipe Management & Cooking Mode QA
**Goal**: Recipe creation, editing, URL import, and fullscreen cooking mode all function correctly
**Depends on**: Phase 19
**Requirements**: RMGMT-01, RMGMT-02, RMGMT-03, RMGMT-04, COOK-01, COOK-02, COOK-03, COOK-04, COOK-05
**Success Criteria** (what must be TRUE):
  1. User can create a recipe manually with all fields filled and it appears in the recipe list; user can edit it and changes persist after navigating away
  2. User can import a recipe from a URL, the JSON-LD extraction populates all fields, and the imported recipe appears in the library
  3. Cooking mode opens fullscreen with step-by-step navigation, progress bar, and horizontal swiping between steps
  4. Timers start, pause, and reset correctly; unit toggle switches between metric/imperial in both step text and ingredients; ingredient sidebar shows correct scaled amounts
  5. Tapping "Done Cooking" on the last step returns the user to the recipe detail screen
**Plans:** 2/2 plans complete
Plans:
- [x] 20-01-PLAN.md — Recipe store CRUD tests (updateRecipe, deleteRecipe) + expanded CookingMode component tests
- [x] 20-02-PLAN.md — Maestro E2E flows: fix appId on recipe-create/import, new cooking-mode flow

### Phase 21: Planning, Grocery, Budget & Leftovers QA
**Goal**: Meal planning, grocery list generation and sync, budget tracking, and leftover management all work correctly
**Depends on**: Phase 20
**Requirements**: PLAN-01, PLAN-02, PLAN-03, GROC-01, GROC-02, GROC-03, BUDG-01, BUDG-02, LEFT-01
**Success Criteria** (what must be TRUE):
  1. User can add a recipe to the meal plan via day picker, and the assigned meal appears on the correct day in the Plan tab
  2. Grocery items populate from planned meals, user can check them off, and changes sync to other household members in real-time
  3. Budget tab loads with monthly cost tracking and weekly spending breakdown displaying correctly
  4. Leftovers screen loads and displays tracked items with freshness badges
**Plans:** 2/2 plans complete
Plans:
- [ ] 21-01-PLAN.md — Expand planStore + groceryStore unit tests (error paths, Map population, generateGroceryList, realtime helpers)
- [ ] 21-02-PLAN.md — Update appId in 6 Maestro flows (meal-plan + grocery) from com.mise.app to com.sharedkitchen.app

### Phase 22: Presence, Subscription, Notifications & Edge Cases QA
**Goal**: Real-time presence, Stripe subscription, push notifications, and edge case handling all work correctly
**Depends on**: Phase 21
**Requirements**: PRES-01, SUB-01, SUB-02, NOTIF-01, NOTIF-02, EDGE-01, EDGE-02, EDGE-03
**Success Criteria** (what must be TRUE):
  1. When multiple users view the same recipe, avatar stacks appear on the recipe detail screen showing who else is viewing
  2. Subscription screen loads with pricing information and the Stripe checkout flow initiates correctly
  3. Permission prompt displays on first relevant action, and cooking timer completion triggers a notification
  4. App shows appropriate loading states on slow network, empty household state is handled gracefully, and screens handle missing/null data without crashes
**Plans:** 1/2 plans executed
Plans:
- [ ] 22-01-PLAN.md — subscriptionStore unit tests + usePermissionPrompt/useNotificationSetup hook tests (edge cases)
- [x] 22-02-PLAN.md — Update appId in 4 Maestro flows (premium-checkout, negative-*) from com.mise.app to com.sharedkitchen.app

## Progress

**Execution Order:** Phases execute in numeric order: 13 -> 14 -> 15 -> 16 -> 17 -> 18 -> 19 -> 20 -> 21 -> 22

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
| 13. Layout & Safe Areas | v2.2 | 0/2 | Not started | - |
| 14. Edge Function & Auth Polish | v2.2 | 0/2 | Not started | - |
| 15. Profile & Settings | v2.2 | 0/2 | Not started | - |
| 16. Kitchen Switcher & Management | v2.3 | 0/1 | Not started | - |
| 17. Data Scoping | v2.3 | 0/1 | Not started | - |
| 18. Auth, Onboarding & Household QA | v2.4 | 2/2 | Complete    | 2026-03-27 |
| 19. Recipe Browsing & Detail QA | v2.4 | 2/2 | Complete    | 2026-03-27 |
| 20. Recipe Management & Cooking Mode QA | v2.4 | 2/2 | Complete    | 2026-03-27 |
| 21. Planning, Grocery, Budget & Leftovers QA | v2.4 | 0/2 | Complete    | 2026-03-27 |
| 22. Presence, Subscription, Notifications & Edge Cases QA | v2.4 | 1/2 | In Progress|  |

---
*Last updated: 2026-03-27 after Phase 22 planning*
