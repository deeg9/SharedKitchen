# Requirements: Mise

**Defined:** 2026-03-22
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v1 Requirements (Complete)

### Meal Planning

- [x] **PLAN-01**: User can view a weekly dinner calendar showing 7 days with recipe name, cook assignment avatar, prep time, and cost badges
- [x] **PLAN-02**: User can navigate between weeks (previous/next arrows) and jump to current week via "Today" pill
- [x] **PLAN-03**: User can tap a day card to open a bottom sheet for editing (choose recipe, assign cook, add notes)
- [x] **PLAN-04**: User can clear a day's meal plan
- [x] **PLAN-05**: Empty day cards show dashed outline with "+" and "Add Dinner" text
- [x] **PLAN-06**: User can tap "Surprise Me" FAB to get a random dinner suggestion with shuffle and 3 alternative options
- [x] **PLAN-07**: User can add a randomly suggested recipe directly to their plan

### Recipes

- [x] **RECP-01**: User can browse recipes in a searchable 2-column grid with category filter chips
- [x] **RECP-02**: User can view recipe detail with hero image, metadata pills, star rating, ingredients with checkboxes, step-by-step instructions, and notes
- [x] **RECP-03**: User can scale recipe portions (x1, x2, x3) and ingredient amounts update accordingly
- [x] **RECP-04**: User can rate recipes 1-5 stars
- [x] **RECP-05**: User can add notes to recipes (e.g., "Use guanciale next time")
- [x] **RECP-06**: User can create a recipe manually with name, photo, category, prep/cook time, servings, cost, ingredients, instructions, and tags
- [x] **RECP-07**: User can import a recipe from a URL using AI parsing (paste link, AI extracts recipe data)
- [x] **RECP-08**: User can favorite/heart recipes
- [x] **RECP-09**: User can add a recipe to their meal plan from the recipe detail page

### Grocery

- [x] **GROC-01**: User can generate a grocery list from the current week's meal plan
- [x] **GROC-02**: Grocery items are grouped by store section (Proteins, Produce, Dairy & Eggs, Pantry)
- [x] **GROC-03**: Each grocery item shows name, quantity/unit, and estimated price
- [x] **GROC-04**: User can check off items with a circular checkbox (green check, line-through, avatar shown)
- [x] **GROC-05**: Checked items move to a collapsed "Completed" section at the bottom
- [x] **GROC-06**: Summary bar shows item count, estimated total, items checked, and progress bar
- [x] **GROC-07**: User can manually add items to the grocery list
- [x] **GROC-08**: Grocery list syncs in real-time across household members via Supabase Realtime

### Budget

- [x] **BUDG-01**: User can view monthly spending progress bar showing amount spent vs budget target
- [x] **BUDG-02**: Three metric cards show spending by category (Groceries, Dining Out, Takeout) with amounts and percentages
- [x] **BUDG-03**: Weekly breakdown section with expandable cards showing date range, total, and category breakdown
- [x] **BUDG-04**: User can log an expense via FAB (amount, category, description, date)

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

- [x] **ONBR-01**: First-run onboarding: welcome screen with app description
- [x] **ONBR-02**: Create household step with name input
- [x] **ONBR-03**: Invite members step with share link/code and skip option
- [x] **ONBR-04**: Add first recipes step (import from URL or pick from starter suggestions)
- [x] **ONBR-05**: Plan your week step (assign meals for first 2-3 days)
- [x] **ONBR-06**: "All set" completion screen with confetti animation

### Profile & Settings

- [x] **PROF-01**: User can view and edit profile (avatar, name)
- [x] **PROF-02**: User can view cooking stats (times cooked this month, distribution chart)
- [x] **PROF-03**: User can set dietary preferences (vegetarian, gluten-free, dairy-free, etc.)
- [x] **PROF-04**: User can toggle dark mode
- [x] **PROF-05**: User can configure notifications (cooking reminders, leftover alerts, budget warnings, household activity)
- [x] **PROF-06**: User can sign out

### Leftovers

- [x] **LEFT-01**: User can add leftover items (name, date made, use-by date, portions, status, notes)
- [x] **LEFT-02**: Leftover items show freshness status badges (Fresh, Use Soon, Frozen, Expired)
- [x] **LEFT-03**: Summary bar shows item count and status breakdown
- [x] **LEFT-04**: User can adjust portions remaining with a stepper

### AI Features

- [x] **AI-01**: AI can parse a recipe URL and extract structured recipe data (name, ingredients, instructions, times, servings)
- [x] **AI-02**: AI generates suggestion cards based on user history ("You haven't made X in 3 weeks")

### Freemium

- [x] **PREM-01**: Premium badge displays on profile for subscribed users
- [x] **PREM-02**: Upgrade prompts/gates appear for premium-only features
- [x] **PREM-03**: Subscription management UI (current plan display, upgrade button) — no real payment processing

### Design System

- [x] **DSGN-01**: App follows "Culinary Curator" design system — tonal layering, no-line rule, ambient shadows, ghost borders
- [x] **DSGN-02**: Consistent Material Design 3 color tokens (olive green primary, burnt orange accent, warm cream surfaces)
- [x] **DSGN-03**: Plus Jakarta Sans for headlines, Inter for body/labels, Material Symbols Outlined icons
- [x] **DSGN-04**: 5-tab bottom navigation with glassmorphic background (Plan, Recipes, Grocery, Budget, Profile)
- [x] **DSGN-05**: All modals/bottom sheets have slide-up animations with drag handles
- [x] **DSGN-06**: Skeleton loading states for lists and optimistic UI updates for checkboxes/forms

## v2 Requirements

### Payments & Premium

- [ ] **PAY-01**: User can purchase a premium subscription ($9.99/mo) via Stripe checkout
- [x] **PAY-02**: Subscription state is server-authoritative (Supabase `subscriptions` table updated by Stripe webhooks, not AsyncStorage)
- [x] **PAY-03**: Stripe webhook Edge Function handles subscription lifecycle events (created, updated, canceled, payment failed) with idempotent processing
- [ ] **PAY-04**: User can manage subscription via Stripe-hosted billing portal (cancel, update payment method)
- [x] **PAY-05**: Premium features are enforced server-side via RLS policies, not just client-side checks

### AI Features

- [x] **AI-03**: Recipe import uses gpt-5-mini with structured outputs replacing deprecated gpt-4o-mini
- [x] **AI-04**: Recipe extraction tries JSON-LD/schema.org structured data first, falls back to LLM only when missing
- [x] **AI-05**: AI extracts recipe images and nutrition info from source URLs when available
- [x] **AI-06**: AI-powered meal generator suggests new recipes based on dietary prefs, cooking history, current leftovers, and remaining budget
- [x] **AI-07**: AI features include per-user rate limiting and response caching to control costs

### Push Notifications

- [x] **NOTIF-01**: App registers Expo push tokens and stores them in `push_tokens` table with device info
- [x] **NOTIF-02**: User sees contextual permission explanation before notification access prompt
- [x] **NOTIF-03**: User receives local scheduled cooking reminders before meal prep time
- [x] **NOTIF-04**: User receives push alert when a leftover is approaching its use-by date (1 day before, day of)
- [x] **NOTIF-05**: User receives push alert when household spending exceeds 80% or 100% of monthly budget target

### Real-Time Collaboration

- [x] **RT-01**: User sees live avatar stacks on grocery list screen showing who else is currently viewing
- [x] **RT-02**: User sees live avatar stacks on recipe detail screen showing who else is currently viewing
- [x] **RT-03**: User sees toast notifications when household members check off grocery items or modify meal plans
- [x] **RT-04**: Presence state uses Supabase Realtime Presence with debounced sync events (separate from data channels)

### Cooking Mode

- [x] **COOK-01**: User can enter fullscreen step-by-step cooking mode from recipe detail showing one instruction per screen
- [x] **COOK-02**: Cooking mode has step pagination (prev/next arrows), "Step X of Y" indicator, and progress bar
- [x] **COOK-03**: Steps with time references show embedded tappable countdown timers (start/pause/reset)
- [x] **COOK-04**: User can toggle between metric and imperial units for ingredients and instruction text
- [x] **COOK-05**: AI extraction parses time durations from instruction text to auto-generate timer data for cooking mode

### E2E Testing

- [x] **TEST-01**: Maestro E2E flows cover auth (signup, login, logout) and onboarding
- [ ] **TEST-02**: Maestro E2E flows cover recipe creation, AI import, and detail view
- [ ] **TEST-03**: Maestro E2E flows cover meal planning (add, edit, clear, Surprise Me)
- [ ] **TEST-04**: Maestro E2E flows cover grocery list (generate, check off, manual add, real-time sync)
- [ ] **TEST-05**: Maestro E2E flows cover premium subscription checkout and gated feature access
- [ ] **TEST-06**: Maestro E2E flows cover negative paths (failed payment, denied permissions, AI timeout)

## Future Requirements

### Premium Analytics (v2.1)

- **DASH-01**: Cooking distribution chart (who cooked how many times)
- **DASH-02**: Spending trend line chart (weekly dinner spending over 4-8 weeks)
- **DASH-03**: Category breakdown chart (recipe categories used this month)
- **DASH-04**: Top 5 highest-rated recipes list with "last made" date

### Enhanced Features (v3+)

- **ENH-01**: Drag-and-drop meal block reordering on weekly calendar
- **ENH-02**: Android build
- **ENH-03**: Apple Sign-In
- **ENH-04**: Household activity remote push notifications (server-triggered to other members)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Apple IAP | Stripe external payment viable post-Epic v. Apple ruling; ~3% vs 15-30% commission |
| Multi-tier premium | Single tier sufficient; binary free/premium simplifies Stripe + gating |
| Android build | iOS-first for v2.0; Expo cross-platform foundation ready |
| Real-time chat | Activity feed provides lightweight collaborative awareness |
| AI-generated recipe images | Uncanny-valley food images reduce trust; extract from source URLs |
| Offline-first sync engine | Optimistic UI + Supabase Realtime sufficient; offline edits defeat collaborative purpose |
| Web client | Mobile-first product |
| Meal prep / batch cooking | Per-day planning kept simple |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAY-01 | Phase 5 | Pending |
| PAY-02 | Phase 5 | Complete |
| PAY-03 | Phase 5 | Complete |
| PAY-04 | Phase 5 | Pending |
| PAY-05 | Phase 5 | Complete |
| AI-03 | Phase 5 | Complete |
| AI-07 | Phase 5 | Complete |
| NOTIF-01 | Phase 6 | Complete |
| NOTIF-02 | Phase 6 | Complete |
| NOTIF-03 | Phase 6 | Complete |
| NOTIF-04 | Phase 6 | Complete |
| NOTIF-05 | Phase 6 | Complete |
| RT-01 | Phase 7 | Complete |
| RT-02 | Phase 7 | Complete |
| RT-03 | Phase 7 | Complete |
| RT-04 | Phase 7 | Complete |
| AI-04 | Phase 8 | Complete |
| AI-05 | Phase 8 | Complete |
| AI-06 | Phase 8 | Complete |
| COOK-01 | Phase 8 | Complete |
| COOK-02 | Phase 8 | Complete |
| COOK-03 | Phase 8 | Complete |
| COOK-04 | Phase 8 | Complete |
| COOK-05 | Phase 8 | Complete |
| TEST-01 | Phase 9 | Complete |
| TEST-02 | Phase 9 | Pending |
| TEST-03 | Phase 9 | Pending |
| TEST-04 | Phase 9 | Pending |
| TEST-05 | Phase 9 | Pending |
| TEST-06 | Phase 9 | Pending |

**Coverage:**
- v2 requirements: 30 total
- Mapped to phases: 30/30
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-25 after v2.0 roadmap creation*
