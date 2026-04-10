# Requirements: SharedKitchen

**Defined:** 2026-04-09
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v7.0 Requirements

Requirements for Stitch UI Redesign milestone. Each maps to roadmap phases.

### Shared Components

- [x] **COMP-01**: App includes a reusable animated donut ring chart component (SVG-based, accepts value/max/label props)
- [x] **COMP-02**: App includes a reusable animated progress bar component (horizontal fill, accepts value/max props)
- [x] **COMP-03**: App includes a reusable insight card component (icon, message, badge, used across budget and profile)
- [x] **COMP-04**: App includes a reusable filter chips component (horizontal scrollable, single-select, used on recipes and potentially other screens)
- [x] **COMP-05**: App includes a reusable horizontal date strip component (scrollable day selector with today highlight)
- [x] **COMP-06**: react-native-svg and expo-linear-gradient are installed and verified working

### Meal Planner

- [x] **PLAN-01**: User sees a Day/Week toggle in the plan header, defaulting to Day view
- [x] **PLAN-02**: User can swipe or tap the horizontal date strip to navigate between days in Day view
- [x] **PLAN-03**: User sees today's dinner as a hero card with large recipe photo, description, presence indicator, and "Start Cooking" CTA
- [x] **PLAN-04**: Empty meal slots show soft illustrated placeholders with inviting prompts ("What's for breakfast?", "Lunch time?")
- [x] **PLAN-05**: User can toggle to Week view to see all 7 days with breakfast/lunch/dinner slots (existing layout, refined)
- [x] **PLAN-06**: User sees a grocery shortcut card at the bottom showing item count for the current week, linking to Kitchen tab
- [x] **PLAN-07**: Week navigation (prev/next arrows, Today button) works in both Day and Week views

### Recipe Library

- [x] **RCPE-01**: User sees a horizontal filter chip row (All, Quick Meals, Favorites) above the recipe list
- [x] **RCPE-02**: Recipe cards display as full-width cards with description text, cook time pill, difficulty badge, and rating star
- [x] **RCPE-03**: User sees an "Import New Recipe" CTA card at the bottom of the recipe list
- [x] **RCPE-04**: Search bar is visible at the top of the recipes screen

### Grocery & Kitchen

- [x] **GROC-01**: User sees a summary card at the top showing item count, estimated cost, and presence avatars
- [x] **GROC-02**: User sees a shopping progress bar ("12 of 18 items checked") with animated fill
- [ ] **GROC-03**: User can tap "Sync with Plan" in the header to regenerate the grocery list from the current meal plan
- [x] **GROC-04**: Grocery item rows show quantity, estimated price, and source/category tags
- [ ] **GROC-05**: Segment control order is Shopping List (left) / On Hand/Pantry (right)

### Budget Dashboard

- [x] **BUDG-01**: User sees a donut ring chart hero showing total spent vs budget with percentage
- [x] **BUDG-02**: User can navigate between months using left/right arrow month picker
- [x] **BUDG-03**: User sees a Budget Insights section with contextual cards (e.g., "You spent 15% less on dining out this month")
- [x] **BUDG-04**: Spending categories show inline progress bars (spent vs budget per category)
- [x] **BUDG-05**: Weekly breakdown section shows mini bar charts per week

### Profile & Settings

- [ ] **PROF-01**: User sees a Cooking Insights section with streak counter and plan completion percentage ring
- [ ] **PROF-02**: User sees their most-cooked recipe with photo and frequency badge
- [ ] **PROF-03**: User sees a household distribution chart showing cooking contribution per member
- [ ] **PROF-04**: Preferences (Dietary, Default Servings, Notifications) display as grouped navigation rows that push to detail screens
- [ ] **PROF-05**: Account & Subscription section (Manage Subscription, Dark Mode toggle, Data Export) displays as grouped navigation rows

### Onboarding

- [x] **ONBR-01**: Welcome screen (Step 1/6) shows hero kitchen photo, tagline, Get Started/Sign In CTAs, and feature highlights
- [x] **ONBR-02**: Create Household screen (Step 2/6) shows illustration, "Name your kitchen" prompt with input field
- [x] **ONBR-03**: Invite Members screen (Step 3/6) shows invite code with copy/share actions and share-via icons
- [x] **ONBR-04**: Add First Recipes screen (Step 4/6) shows progress counter (0 of 3), starter recipe cards, and "Import from URL" option
- [x] **ONBR-05**: Plan Your Week screen (Step 5/6) shows day-by-day meal slot pickers with saved recipes list
- [x] **ONBR-06**: All Set screen (Step 6/6) shows celebration glassmorphism card with "Go to my kitchen" CTA

### Cooking Mode

- [x] **COOK-01**: Cooking mode shows a step photo at the top of each instruction step
- [x] **COOK-02**: Timer card displays prominently with step name, countdown, and Start button
- [x] **COOK-03**: Step type badge (MARINATING, PREP, COOKING) appears above the instruction text
- [x] **COOK-04**: Chef's Tip callout card appears when a tip is available for the current step
- [x] **COOK-05**: Ingredient chips for the current step are listed below the instruction text
- [x] **COOK-06**: Previous/Next Step navigation buttons replace horizontal swipe for step advancement

### Social Feed

- [x] **FEED-01**: Feed shows a horizontal following avatar strip at the top with kitchen photos
- [x] **FEED-02**: Feed cards display hero-sized meal photos with overlay text for meal name
- [x] **FEED-03**: Feed cards include a "Try this recipe" CTA button
- [x] **FEED-04**: Feed cards show quoted description text and "View Full Recipe" action
- [x] **FEED-05**: Feed header shows "Feed" title with consistent navigation

### Premium Upgrade

- [x] **PREM-01**: Upgrade screen shows a hero kitchen photo with editorial headline
- [x] **PREM-02**: Feature comparison table shows Free vs Premium columns with checkmarks and feature descriptions
- [x] **PREM-03**: Monthly and yearly pricing tiers are displayed with "BEST VALUE" badge on yearly
- [x] **PREM-04**: CTA buttons for each pricing tier (Get Monthly / Upgrade to Premium)

## Future Requirements

### Post-v7.0 Polish

- **POLSH-01**: Dark mode audit for all redesigned screens
- **POLSH-02**: Skeleton loading state parity for new component layouts
- **POLSH-03**: Haptic feedback on key interactions (toggle, filter selection)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New backend APIs or Edge Functions | UI-only milestone — all data comes from existing stores |
| New database tables or migrations | Visual redesign only, no schema changes |
| Yearly Stripe pricing tier | Requires new Stripe price_id creation — business decision deferred |
| AI-generated Chef's Tips | Tips come from recipe instruction text or are static, not AI-generated |
| Recipe difficulty field in DB | Derived from prep+cook time, not stored separately |
| Android-specific UI adjustments | iOS-first; cross-platform via Expo foundation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | Phase 39 | Complete |
| COMP-02 | Phase 39 | Complete |
| COMP-03 | Phase 39 | Complete |
| COMP-04 | Phase 39 | Complete |
| COMP-05 | Phase 39 | Complete |
| COMP-06 | Phase 39 | Complete |
| PLAN-01 | Phase 41 | Complete |
| PLAN-02 | Phase 41 | Complete |
| PLAN-03 | Phase 41 | Complete |
| PLAN-04 | Phase 41 | Complete |
| PLAN-05 | Phase 41 | Complete |
| PLAN-06 | Phase 41 | Complete |
| PLAN-07 | Phase 41 | Complete |
| RCPE-01 | Phase 40 | Complete |
| RCPE-02 | Phase 40 | Complete |
| RCPE-03 | Phase 40 | Complete |
| RCPE-04 | Phase 40 | Complete |
| GROC-01 | Phase 42 | Complete |
| GROC-02 | Phase 42 | Complete |
| GROC-03 | Phase 42 | Pending |
| GROC-04 | Phase 42 | Complete |
| GROC-05 | Phase 42 | Pending |
| BUDG-01 | Phase 43 | Complete |
| BUDG-02 | Phase 43 | Complete |
| BUDG-03 | Phase 43 | Complete |
| BUDG-04 | Phase 43 | Complete |
| BUDG-05 | Phase 43 | Complete |
| PROF-01 | Phase 43 | Pending |
| PROF-02 | Phase 43 | Pending |
| PROF-03 | Phase 43 | Pending |
| PROF-04 | Phase 43 | Pending |
| PROF-05 | Phase 43 | Pending |
| ONBR-01 | Phase 40 | Complete |
| ONBR-02 | Phase 40 | Complete |
| ONBR-03 | Phase 40 | Complete |
| ONBR-04 | Phase 40 | Complete |
| ONBR-05 | Phase 40 | Complete |
| ONBR-06 | Phase 40 | Complete |
| COOK-01 | Phase 40 | Complete |
| COOK-02 | Phase 40 | Complete |
| COOK-03 | Phase 40 | Complete |
| COOK-04 | Phase 40 | Complete |
| COOK-05 | Phase 40 | Complete |
| COOK-06 | Phase 40 | Complete |
| FEED-01 | Phase 43 | Complete |
| FEED-02 | Phase 43 | Complete |
| FEED-03 | Phase 43 | Complete |
| FEED-04 | Phase 43 | Complete |
| FEED-05 | Phase 43 | Complete |
| PREM-01 | Phase 40 | Complete |
| PREM-02 | Phase 40 | Complete |
| PREM-03 | Phase 40 | Complete |
| PREM-04 | Phase 40 | Complete |

**Coverage:**
- v7.0 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-07 after roadmap creation — all 44 requirements mapped to phases 39-43*
