# Requirements: SharedKitchen v2.4 — Comprehensive QA Testing

**Defined:** 2026-03-27
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time
**Goal:** Systematically test and validate every feature area of SharedKitchen to ensure production readiness

## v2.4 Requirements

### Onboarding & Auth

- [x] **ONBOARD-01**: First-time user completes onboarding screens and is routed to the main app
- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with existing credentials
- [x] **AUTH-03**: User session persists across app restart

### Recipe List

- [x] **RLIST-01**: Recipes load and display in a 2-column grid
- [x] **RLIST-02**: User can search recipes by name
- [x] **RLIST-03**: User can filter recipes by category, cost, and prep time
- [x] **RLIST-04**: Empty state displays when no recipes match filters

### Recipe Detail

- [x] **RDETAIL-01**: Hero image loads (or default placeholder) with metadata pills (prep/cook/serves/cost)
- [x] **RDETAIL-02**: Tags display below hero image
- [x] **RDETAIL-03**: User can tap stars to rate a recipe and average rating updates
- [x] **RDETAIL-04**: User can toggle heart to favorite/unfavorite a recipe
- [x] **RDETAIL-05**: User can add a household tip/note and it appears with date
- [x] **RDETAIL-06**: User can switch between x1/x2/x3 scale and ingredient amounts update
- [x] **RDETAIL-07**: User can check off ingredients with strikethrough appearance

### Recipe Management

- [x] **RMGMT-01**: User can create a recipe manually with all fields
- [x] **RMGMT-02**: User can import a recipe from URL (JSON-LD extraction)
- [x] **RMGMT-03**: User can edit an existing recipe and changes persist
- [x] **RMGMT-04**: Start Cooking opens fullscreen cooking mode with step navigation

### Cooking Mode

- [x] **COOK-01**: Steps display with horizontal swipe navigation and progress bar
- [x] **COOK-02**: Timers start, pause, reset, and show countdown
- [x] **COOK-03**: Unit toggle switches between metric/imperial in step text and ingredients
- [x] **COOK-04**: Ingredient sidebar opens/closes with correct scaled amounts
- [x] **COOK-05**: "Done Cooking" on last step returns to recipe detail

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

- [x] **HOUSE-01**: User can create a new household
- [x] **HOUSE-02**: User can generate an invite link/code
- [x] **HOUSE-03**: User can join a household via invite code

### Profile

- [x] **PROF-01**: Profile screen displays user info and cooking stats
- [x] **PROF-02**: User can edit display name and avatar

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
| ONBOARD-01 | Phase 18 | Complete |
| AUTH-01 | Phase 18 | Complete |
| AUTH-02 | Phase 18 | Complete |
| AUTH-03 | Phase 18 | Complete |
| RLIST-01 | Phase 19 | Complete |
| RLIST-02 | Phase 19 | Complete |
| RLIST-03 | Phase 19 | Complete |
| RLIST-04 | Phase 19 | Complete |
| RDETAIL-01 | Phase 19 | Complete |
| RDETAIL-02 | Phase 19 | Complete |
| RDETAIL-03 | Phase 19 | Complete |
| RDETAIL-04 | Phase 19 | Complete |
| RDETAIL-05 | Phase 19 | Complete |
| RDETAIL-06 | Phase 19 | Complete |
| RDETAIL-07 | Phase 19 | Complete |
| RMGMT-01 | Phase 20 | Complete |
| RMGMT-02 | Phase 20 | Complete |
| RMGMT-03 | Phase 20 | Complete |
| RMGMT-04 | Phase 20 | Complete |
| COOK-01 | Phase 20 | Complete |
| COOK-02 | Phase 20 | Complete |
| COOK-03 | Phase 20 | Complete |
| COOK-04 | Phase 20 | Complete |
| COOK-05 | Phase 20 | Complete |
| PLAN-01 | Phase 21 | Pending |
| PLAN-02 | Phase 21 | Pending |
| PLAN-03 | Phase 21 | Pending |
| GROC-01 | Phase 21 | Pending |
| GROC-02 | Phase 21 | Pending |
| GROC-03 | Phase 21 | Pending |
| BUDG-01 | Phase 21 | Pending |
| BUDG-02 | Phase 21 | Pending |
| LEFT-01 | Phase 21 | Pending |
| HOUSE-01 | Phase 18 | Complete |
| HOUSE-02 | Phase 18 | Complete |
| HOUSE-03 | Phase 18 | Complete |
| PROF-01 | Phase 18 | Complete |
| PROF-02 | Phase 18 | Complete |
| PRES-01 | Phase 22 | Pending |
| SUB-01 | Phase 22 | Pending |
| SUB-02 | Phase 22 | Pending |
| NOTIF-01 | Phase 22 | Pending |
| NOTIF-02 | Phase 22 | Pending |
| EDGE-01 | Phase 22 | Pending |
| EDGE-02 | Phase 22 | Pending |
| EDGE-03 | Phase 22 | Pending |

**Coverage:**
- v2.4 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

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
*Last updated: 2026-03-27 after roadmap creation (traceability mapped)*
