# Requirements: Mise

**Defined:** 2026-03-22
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v1 Requirements

### Meal Planning

- [ ] **PLAN-01**: User can view a weekly dinner calendar showing 7 days with recipe name, cook assignment avatar, prep time, and cost badges
- [ ] **PLAN-02**: User can navigate between weeks (previous/next arrows) and jump to current week via "Today" pill
- [ ] **PLAN-03**: User can tap a day card to open a bottom sheet for editing (choose recipe, assign cook, add notes)
- [ ] **PLAN-04**: User can clear a day's meal plan
- [ ] **PLAN-05**: Empty day cards show dashed outline with "+" and "Add Dinner" text
- [ ] **PLAN-06**: User can tap "Surprise Me" FAB to get a random dinner suggestion with shuffle and 3 alternative options
- [ ] **PLAN-07**: User can add a randomly suggested recipe directly to their plan

### Recipes

- [ ] **RECP-01**: User can browse recipes in a searchable 2-column grid with category filter chips
- [ ] **RECP-02**: User can view recipe detail with hero image, metadata pills, star rating, ingredients with checkboxes, step-by-step instructions, and notes
- [ ] **RECP-03**: User can scale recipe portions (x1, x2, x3) and ingredient amounts update accordingly
- [ ] **RECP-04**: User can rate recipes 1-5 stars
- [ ] **RECP-05**: User can add notes to recipes (e.g., "Use guanciale next time")
- [ ] **RECP-06**: User can create a recipe manually with name, photo, category, prep/cook time, servings, cost, ingredients, instructions, and tags
- [ ] **RECP-07**: User can import a recipe from a URL using AI parsing (paste link, AI extracts recipe data)
- [ ] **RECP-08**: User can favorite/heart recipes
- [ ] **RECP-09**: User can add a recipe to their meal plan from the recipe detail page

### Grocery

- [ ] **GROC-01**: User can generate a grocery list from the current week's meal plan
- [ ] **GROC-02**: Grocery items are grouped by store section (Proteins, Produce, Dairy & Eggs, Pantry)
- [ ] **GROC-03**: Each grocery item shows name, quantity/unit, and estimated price
- [ ] **GROC-04**: User can check off items with a circular checkbox (green check, line-through, avatar shown)
- [ ] **GROC-05**: Checked items move to a collapsed "Completed" section at the bottom
- [ ] **GROC-06**: Summary bar shows item count, estimated total, items checked, and progress bar
- [ ] **GROC-07**: User can manually add items to the grocery list
- [ ] **GROC-08**: Grocery list syncs in real-time across household members via Supabase Realtime

### Budget

- [ ] **BUDG-01**: User can view monthly spending progress bar showing amount spent vs budget target
- [ ] **BUDG-02**: Three metric cards show spending by category (Groceries, Dining Out, Takeout) with amounts and percentages
- [ ] **BUDG-03**: Weekly breakdown section with expandable cards showing date range, total, and category breakdown
- [ ] **BUDG-04**: User can log an expense via FAB (amount, category, description, date)

### Household & Auth

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with Google OAuth
- [x] **AUTH-03**: User session persists across app restarts
- [x] **HOUS-01**: User can create a household with a custom name
- [x] **HOUS-02**: User can invite members via share code or copy link
- [x] **HOUS-03**: Invited user can join a household from an invite link
- [x] **HOUS-04**: User can view household members with avatars and roles (admin/member)
- [x] **HOUS-05**: User can belong to and switch between multiple households

### Onboarding

- [ ] **ONBR-01**: First-run onboarding: welcome screen with app description
- [ ] **ONBR-02**: Create household step with name input
- [ ] **ONBR-03**: Invite members step with share link/code and skip option
- [ ] **ONBR-04**: Add first recipes step (import from URL or pick from starter suggestions)
- [ ] **ONBR-05**: Plan your week step (assign meals for first 2-3 days)
- [ ] **ONBR-06**: "All set" completion screen with confetti animation

### Profile & Settings

- [x] **PROF-01**: User can view and edit profile (avatar, name)
- [ ] **PROF-02**: User can view cooking stats (times cooked this month, distribution chart)
- [ ] **PROF-03**: User can set dietary preferences (vegetarian, gluten-free, dairy-free, etc.)
- [ ] **PROF-04**: User can toggle dark mode
- [ ] **PROF-05**: User can configure notifications (cooking reminders, leftover alerts, budget warnings, household activity)
- [x] **PROF-06**: User can sign out

### Leftovers

- [ ] **LEFT-01**: User can add leftover items (name, date made, use-by date, portions, status, notes)
- [ ] **LEFT-02**: Leftover items show freshness status badges (Fresh, Use Soon, Frozen, Expired)
- [ ] **LEFT-03**: Summary bar shows item count and status breakdown
- [ ] **LEFT-04**: User can adjust portions remaining with a stepper

### AI Features

- [ ] **AI-01**: AI can parse a recipe URL and extract structured recipe data (name, ingredients, instructions, times, servings)
- [ ] **AI-02**: AI generates suggestion cards based on user history ("You haven't made X in 3 weeks")

### Freemium

- [ ] **PREM-01**: Premium badge displays on profile for subscribed users
- [ ] **PREM-02**: Upgrade prompts/gates appear for premium-only features
- [ ] **PREM-03**: Subscription management UI (current plan display, upgrade button) — no real payment processing

### Design System

- [x] **DSGN-01**: App follows "Culinary Curator" design system — tonal layering, no-line rule, ambient shadows, ghost borders
- [x] **DSGN-02**: Consistent Material Design 3 color tokens (olive green primary, burnt orange accent, warm cream surfaces)
- [x] **DSGN-03**: Plus Jakarta Sans for headlines, Inter for body/labels, Material Symbols Outlined icons
- [x] **DSGN-04**: 5-tab bottom navigation with glassmorphic background (Plan, Recipes, Grocery, Budget, Profile)
- [x] **DSGN-05**: All modals/bottom sheets have slide-up animations with drag handles
- [x] **DSGN-06**: Skeleton loading states for lists and optimistic UI updates for checkboxes/forms

## v2 Requirements

### Premium Dashboard

- **DASH-01**: Cooking distribution chart (who cooked how many times)
- **DASH-02**: Spending trend line chart (weekly dinner spending over 4-8 weeks)
- **DASH-03**: Category breakdown chart (recipe categories used this month)
- **DASH-04**: Top 5 highest-rated recipes list with "last made" date

### Enhanced Features

- **ENH-01**: Drag-and-drop meal block reordering on weekly calendar
- **ENH-02**: Android build
- **ENH-03**: Apple Sign-In
- **ENH-04**: In-app purchase / subscription payment processing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real payment processing | Freemium shell only — validate PMF before investing in IAP |
| Android build | iOS-first for v1; cross-platform foundation ready via Expo |
| Web client | Mobile-first product, no web version planned |
| Social features beyond household | No public profiles or cross-household recipe sharing |
| Meal prep / batch cooking | Keep it simple per-day planning for v1 |
| Grocery delivery integration | No Instacart/DoorDash integration |
| Real-time chat | Household coordination via meal plan, not messaging |
| Video content in recipes | Text + photos only; video adds storage/bandwidth complexity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| HOUS-01 | Phase 1 | Complete |
| HOUS-02 | Phase 1 | Complete |
| HOUS-03 | Phase 1 | Complete |
| HOUS-04 | Phase 1 | Complete |
| HOUS-05 | Phase 1 | Complete |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 1 | Complete |
| DSGN-05 | Phase 1 | Complete |
| DSGN-06 | Phase 1 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-06 | Phase 1 | Complete |
| RECP-01 | Phase 2 | Pending |
| RECP-02 | Phase 2 | Pending |
| RECP-03 | Phase 2 | Pending |
| RECP-04 | Phase 2 | Pending |
| RECP-05 | Phase 2 | Pending |
| RECP-06 | Phase 2 | Pending |
| RECP-07 | Phase 2 | Pending |
| RECP-08 | Phase 2 | Pending |
| RECP-09 | Phase 2 | Pending |
| AI-01 | Phase 2 | Pending |
| PLAN-01 | Phase 2 | Pending |
| PLAN-02 | Phase 2 | Pending |
| PLAN-03 | Phase 2 | Pending |
| PLAN-04 | Phase 2 | Pending |
| PLAN-05 | Phase 2 | Pending |
| PLAN-06 | Phase 2 | Pending |
| PLAN-07 | Phase 2 | Pending |
| GROC-01 | Phase 2 | Pending |
| GROC-02 | Phase 2 | Pending |
| GROC-03 | Phase 2 | Pending |
| GROC-04 | Phase 2 | Pending |
| GROC-05 | Phase 2 | Pending |
| GROC-06 | Phase 2 | Pending |
| GROC-07 | Phase 2 | Pending |
| GROC-08 | Phase 2 | Pending |
| BUDG-01 | Phase 3 | Pending |
| BUDG-02 | Phase 3 | Pending |
| BUDG-03 | Phase 3 | Pending |
| BUDG-04 | Phase 3 | Pending |
| LEFT-01 | Phase 3 | Pending |
| LEFT-02 | Phase 3 | Pending |
| LEFT-03 | Phase 3 | Pending |
| LEFT-04 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| PROF-02 | Phase 3 | Pending |
| PROF-03 | Phase 3 | Pending |
| PROF-04 | Phase 3 | Pending |
| PROF-05 | Phase 3 | Pending |
| ONBR-01 | Phase 4 | Pending |
| ONBR-02 | Phase 4 | Pending |
| ONBR-03 | Phase 4 | Pending |
| ONBR-04 | Phase 4 | Pending |
| ONBR-05 | Phase 4 | Pending |
| ONBR-06 | Phase 4 | Pending |
| PREM-01 | Phase 4 | Pending |
| PREM-02 | Phase 4 | Pending |
| PREM-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
