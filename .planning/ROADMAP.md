# Roadmap: Mise

## Overview

Mise delivers a collaborative dinner planning app for households in four phases: first we establish the foundation (auth, households, design system, navigation), then build the three core feature pillars (recipes, meal planning, grocery lists with real-time sync), then add supporting features (budget tracking, leftovers, AI suggestions, profile settings), and finally polish with onboarding and freemium gating.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, households, design system, tab navigation, and core app shell
- [ ] **Phase 2: Core Features** - Recipes, meal planning, and grocery lists with real-time sync
- [ ] **Phase 3: Supporting Features** - Budget tracking, leftovers, AI suggestions, and profile settings
- [ ] **Phase 4: Onboarding and Freemium** - First-run onboarding flow and premium gating UI

## Phase Details

### Phase 1: Foundation
**Goal**: Users can sign up, create a household, invite members, and navigate a polished app shell with consistent design
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, HOUS-01, HOUS-02, HOUS-03, HOUS-04, HOUS-05, DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, PROF-01, PROF-06
**Success Criteria** (what must be TRUE):
  1. User can create an account with email/password or Google OAuth, and their session persists across app restarts
  2. User can create a household, invite others via share code/link, and invited users can join successfully
  3. User can view household members with avatars and roles, and switch between multiple households
  4. App displays 5-tab bottom navigation with the Culinary Curator design system applied (tonal layering, correct typography, color tokens, skeleton loading states)
  5. User can view/edit their profile and sign out
**Plans**: TBD

Plans:
- [ ] 01-01: Expo project setup, Supabase integration, auth flows
- [ ] 01-02: Household management and multi-household support
- [ ] 01-03: Design system, tab navigation, profile screen

### Phase 2: Core Features
**Goal**: Users can manage recipes, plan weekly dinners, and shop from an auto-generated grocery list that syncs in real-time across the household
**Depends on**: Phase 1
**Requirements**: RECP-01, RECP-02, RECP-03, RECP-04, RECP-05, RECP-06, RECP-07, RECP-08, RECP-09, AI-01, PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, GROC-01, GROC-02, GROC-03, GROC-04, GROC-05, GROC-06, GROC-07, GROC-08
**Success Criteria** (what must be TRUE):
  1. User can browse, search, and filter recipes in a 2-column grid, and view full recipe details with scaling, ratings, notes, and favoriting
  2. User can create recipes manually and import recipes from a URL via AI parsing
  3. User can view the weekly dinner calendar, navigate between weeks, and edit day cards (assign recipe, cook, notes) or clear them
  4. User can use "Surprise Me" to get random dinner suggestions and add them to the plan
  5. User can generate a grocery list from the week's plan, check items off (with real-time sync visible to household members), and manually add items
**Plans**: TBD

Plans:
- [ ] 02-01: Recipe library, detail view, and manual creation
- [ ] 02-02: AI recipe import and meal planning calendar
- [ ] 02-03: Grocery list with real-time sync

### Phase 3: Supporting Features
**Goal**: Users can track spending, manage leftovers, receive AI suggestions, and configure their preferences
**Depends on**: Phase 2
**Requirements**: BUDG-01, BUDG-02, BUDG-03, BUDG-04, LEFT-01, LEFT-02, LEFT-03, LEFT-04, AI-02, PROF-02, PROF-03, PROF-04, PROF-05
**Success Criteria** (what must be TRUE):
  1. User can view monthly budget progress, category spending breakdown, weekly spending cards, and log expenses
  2. User can add leftover items with freshness badges and manage portions
  3. User sees AI suggestion cards based on cooking history on the plan screen
  4. User can view cooking stats, set dietary preferences, toggle dark mode, and configure notification settings
**Plans**: TBD

Plans:
- [ ] 03-01: Budget dashboard and expense logging
- [ ] 03-02: Leftover tracker, AI suggestions, and profile settings

### Phase 4: Onboarding and Freemium
**Goal**: New users experience a guided first-run flow, and the app presents freemium upgrade prompts for premium features
**Depends on**: Phase 3
**Requirements**: ONBR-01, ONBR-02, ONBR-03, ONBR-04, ONBR-05, ONBR-06, PREM-01, PREM-02, PREM-03
**Success Criteria** (what must be TRUE):
  1. First-time user completes a multi-step onboarding flow: welcome, create household, invite members, add recipes, plan first meals, and sees confetti on completion
  2. Premium badge displays on subscribed user profiles and upgrade prompts appear at gated features
  3. User can view subscription management UI showing current plan and upgrade button (no real payment)
**Plans**: TBD

Plans:
- [ ] 04-01: Onboarding flow
- [ ] 04-02: Freemium gating and premium UI

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Core Features | 0/3 | Not started | - |
| 3. Supporting Features | 0/2 | Not started | - |
| 4. Onboarding and Freemium | 0/2 | Not started | - |
