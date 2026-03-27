# Requirements: SharedKitchen v2.4 — Comprehensive QA Testing

**Defined:** 2026-03-27
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time
**Goal:** Systematically test and validate every feature area of SharedKitchen to ensure production readiness

## v2.4 Requirements

### Onboarding & Auth

- [ ] **ONBOARD-01**: First-time user completes onboarding screens and is routed to the main app
- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign in with existing credentials
- [ ] **AUTH-03**: User session persists across app restart

### Recipe List

- [ ] **RLIST-01**: Recipes load and display in a 2-column grid
- [ ] **RLIST-02**: User can search recipes by name
- [ ] **RLIST-03**: User can filter recipes by category, cost, and prep time
- [ ] **RLIST-04**: Empty state displays when no recipes match filters

### Recipe Detail

- [ ] **RDETAIL-01**: Hero image loads (or default placeholder) with metadata pills (prep/cook/serves/cost)
- [ ] **RDETAIL-02**: Tags display below hero image
- [ ] **RDETAIL-03**: User can tap stars to rate a recipe and average rating updates
- [ ] **RDETAIL-04**: User can toggle heart to favorite/unfavorite a recipe
- [ ] **RDETAIL-05**: User can add a household tip/note and it appears with date
- [ ] **RDETAIL-06**: User can switch between x1/x2/x3 scale and ingredient amounts update
- [ ] **RDETAIL-07**: User can check off ingredients with strikethrough appearance

### Recipe Management

- [ ] **RMGMT-01**: User can create a recipe manually with all fields
- [ ] **RMGMT-02**: User can import a recipe from URL (JSON-LD extraction)
- [ ] **RMGMT-03**: User can edit an existing recipe and changes persist
- [ ] **RMGMT-04**: Start Cooking opens fullscreen cooking mode with step navigation

### Cooking Mode

- [ ] **COOK-01**: Steps display with horizontal swipe navigation and progress bar
- [ ] **COOK-02**: Timers start, pause, reset, and show countdown
- [ ] **COOK-03**: Unit toggle switches between metric/imperial in step text and ingredients
- [ ] **COOK-04**: Ingredient sidebar opens/closes with correct scaled amounts
- [ ] **COOK-05**: "Done Cooking" on last step returns to recipe detail

### Meal Planning

- [ ] **PLAN-01**: User can add a recipe to the meal plan from recipe detail
- [ ] **PLAN-02**: Day picker sheet shows 7 days and assigns recipe to selected day
- [ ] **PLAN-03**: Plan tab displays assigned meals on correct days

### Grocery List

- [ ] **GROC-01**: Grocery items populate from planned meals
- [ ] **GROC-02**: User can check off grocery items
- [ ] **GROC-03**: Grocery list syncs across household members in real-time

### Budget

- [ ] **BUDG-01**: Budget tab loads and displays monthly cost tracking
- [ ] **BUDG-02**: Weekly spending breakdown displays correctly

### Leftovers

- [ ] **LEFT-01**: Leftovers screen loads and displays tracked items with freshness badges

### Household

- [ ] **HOUSE-01**: User can create a new household
- [ ] **HOUSE-02**: User can generate an invite link/code
- [ ] **HOUSE-03**: User can join a household via invite code

### Profile

- [ ] **PROF-01**: Profile screen displays user info and cooking stats
- [ ] **PROF-02**: User can edit display name and avatar

### Presence

- [ ] **PRES-01**: Avatar stack appears on recipe detail when multiple users view the same recipe

### Subscription

- [ ] **SUB-01**: Subscription screen loads with pricing information
- [ ] **SUB-02**: Stripe checkout flow initiates correctly

### Notifications

- [ ] **NOTIF-01**: Permission prompt displays on first relevant action
- [ ] **NOTIF-02**: Cooking timer completion triggers notification

### Edge Cases

- [ ] **EDGE-01**: App shows appropriate loading states on slow network
- [ ] **EDGE-02**: Empty household state is handled gracefully
- [ ] **EDGE-03**: Screens handle missing/null data without crashes

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONBOARD-01 | — | Pending |
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| RLIST-01 | — | Pending |
| RLIST-02 | — | Pending |
| RLIST-03 | — | Pending |
| RLIST-04 | — | Pending |
| RDETAIL-01 | — | Pending |
| RDETAIL-02 | — | Pending |
| RDETAIL-03 | — | Pending |
| RDETAIL-04 | — | Pending |
| RDETAIL-05 | — | Pending |
| RDETAIL-06 | — | Pending |
| RDETAIL-07 | — | Pending |
| RMGMT-01 | — | Pending |
| RMGMT-02 | — | Pending |
| RMGMT-03 | — | Pending |
| RMGMT-04 | — | Pending |
| COOK-01 | — | Pending |
| COOK-02 | — | Pending |
| COOK-03 | — | Pending |
| COOK-04 | — | Pending |
| COOK-05 | — | Pending |
| PLAN-01 | — | Pending |
| PLAN-02 | — | Pending |
| PLAN-03 | — | Pending |
| GROC-01 | — | Pending |
| GROC-02 | — | Pending |
| GROC-03 | — | Pending |
| BUDG-01 | — | Pending |
| BUDG-02 | — | Pending |
| LEFT-01 | — | Pending |
| HOUSE-01 | — | Pending |
| HOUSE-02 | — | Pending |
| HOUSE-03 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PRES-01 | — | Pending |
| SUB-01 | — | Pending |
| SUB-02 | — | Pending |
| NOTIF-01 | — | Pending |
| NOTIF-02 | — | Pending |
| EDGE-01 | — | Pending |
| EDGE-02 | — | Pending |
| EDGE-03 | — | Pending |

**Coverage:**
- v2.4 requirements: 46 total
- Mapped to phases: 0
- Unmapped: 46

## Out of Scope

| Feature | Reason |
|---------|--------|
| Performance/load testing | Requires specialized tooling and infrastructure |
| Security penetration testing | Requires dedicated security audit |
| Android testing | iOS-only app |
| Accessibility audit (VoiceOver) | Separate milestone if needed |
| CI/CD pipeline integration | Testing infrastructure, not feature testing |

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after initial definition*
