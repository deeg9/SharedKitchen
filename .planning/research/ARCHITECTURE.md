# Architecture: Stitch UI Redesign Integration

**Project:** SharedKitchen v7.0
**Researched:** 2026-04-07
**Confidence:** HIGH (based on direct codebase analysis and Stitch design screenshots)

## Overview

The 14 Stitch screens map onto the existing codebase as **visual replacements** of existing components with minimal store changes. The architecture is already well-structured for this: feature-organized components, Zustand stores with computed methods, and a centralized theme system. The redesign is primarily a component-layer effort with surgical store additions.

---

## Screen-to-Component Mapping

### 1. Day-Focused Meal Planner (plan.tsx)

**Current:** `WeekHeader` + vertical scroll of `DaySection` cards for 7 days, with `My Plan / Feed` segmented control.

**Stitch:** Day/Week toggle, horizontal date strip (Mon-Fri), hero dinner card for selected day, empty slots with illustrations, grocery shortcut card.

| What Changes | Type | Component |
|---|---|---|
| WeekHeader replaced with DateStrip + Day/Week toggle | **Replace** | `src/components/plan/WeekHeader.tsx` -> new `DateStrip.tsx` + `ViewToggle.tsx` |
| DayCard becomes HeroDinnerCard (day view) | **New** | `src/components/plan/HeroDinnerCard.tsx` |
| Empty meal slots with illustrations | **Modify** | `src/components/plan/DayCard.tsx` (MealSlot subcomponent) |
| Grocery shortcut card | **New** | `src/components/plan/GroceryShortcutCard.tsx` |
| Week view retains existing 7-day scroll | **Keep** | Existing `DaySection` rendering in plan.tsx |
| plan.tsx screen orchestration | **Modify** | `app/(app)/(tabs)/plan.tsx` |

**Store changes:**
- `planStore` needs NO new state for Day/Week toggle. This is **local UI state** in plan.tsx. Rationale: the toggle affects only the visual rendering of the same underlying data (weekOffset + mealPlan). It does not change what data is fetched, does not need persistence across app restarts, and is not consumed by any other component. A `useState<'day' | 'week'>('day')` in plan.tsx is the correct choice.
- `planStore` already has `weekDays()` and per-day meal lookup via `makePlanKey`. The day view just renders one day's data instead of seven.
- Need a `selectedDate` local state (default: today) to drive the date strip highlight and hero card content.

### 2. Refined Recipes Library (recipes.tsx)

**Current:** `FilterBar` with dropdowns + `RecipeGrid` (2-column) of `RecipeCard` components. FAB menu for add/generate/identify.

**Stitch:** Horizontal filter chips (All, Quick Meals, Favorites), full-width recipe cards with description, difficulty badge, rating star.

| What Changes | Type | Component |
|---|---|---|
| FilterBar becomes horizontal chip row | **Replace** | `src/components/recipes/FilterBar.tsx` -> new `FilterChips.tsx` |
| RecipeCard gets description, difficulty badge | **Modify** | `src/components/recipes/RecipeCard.tsx` |
| RecipeGrid changes from 2-col to 1-col full-width | **Modify** | `src/components/recipes/RecipeGrid.tsx` |
| Search bar in header | **Modify** | `app/(app)/(tabs)/recipes.tsx` |

**Store changes:** None. `recipeStore` already has `filteredRecipes()` with category/cost/time filters. Difficulty can be derived from existing `prep_time_minutes` + `instructions.length` without store changes (computed in component or utility function).

### 3. Refined Grocery/Kitchen List (grocery.tsx)

**Current:** `GrocerySummary` card + `GrocerySection` groups + `Shopping List / On Hand` segmented control. Header has "Sync with Plan" functionality buried in menu.

**Stitch:** "Sync with Plan" button prominently in header, shopping progress bar ("12 of 18 items checked"), summary card with presence avatars, enhanced item rows with quantity/price.

| What Changes | Type | Component |
|---|---|---|
| GrocerySummary enhanced with progress bar text + presence avatars | **Modify** | `src/components/grocery/GrocerySummary.tsx` |
| Sync with Plan button in header | **Modify** | `app/(app)/(tabs)/grocery.tsx` header area |
| GroceryItem rows show price + category tag | **Modify** | `src/components/grocery/GroceryItem.tsx` |
| Completed section collapsible at bottom | **Already exists** | `GrocerySection` with `defaultCollapsed` |

**Store changes:** None. `groceryStore.summary()` already returns `totalItems`, `checkedItems`, `estimatedTotal`, `progressPercent`. All data needed for the Stitch design is already computed.

### 4. Refined Budget Dashboard (budget.tsx)

**Current:** `MonthlyProgress` (linear progress bar) + `CategoryCard` rows + `WeeklyBreakdown`. Month navigation via arrows.

**Stitch:** Donut ring chart hero with "$426 of $600 spent" + percentage, Budget Insights section, category rows with inline progress bars, weekly breakdown with mini bar charts.

| What Changes | Type | Component |
|---|---|---|
| MonthlyProgress becomes donut ring | **Replace** | `src/components/budget/MonthlyProgress.tsx` -> new `BudgetDonutHero.tsx` |
| New Budget Insights section | **New** | `src/components/budget/BudgetInsights.tsx` |
| CategoryCard gets inline progress bar | **Modify** | `src/components/budget/CategoryCard.tsx` |
| WeeklyBreakdown gets mini bar charts | **Modify** | `src/components/budget/WeeklyBreakdown.tsx` |
| Month picker in header | **Modify** | `app/(app)/(tabs)/budget.tsx` |

**Store changes:**
- `budgetStore` needs new computed methods for insights:
  - `categoryBudgets()` -- per-category budget allocation (new data or derived from budgetTarget split)
  - `insights()` -- compares current month to previous month to generate "You spent 15% less on dining out" style messages
- This requires `budgetStore.fetchExpenses` to optionally fetch previous month data for comparison. Moderate addition.
- The donut chart is purely visual -- `monthlyTotal()` and `budgetTarget` already provide the data.

### 5. Refined Profile with Cooking Insights (profile.tsx)

**Current:** Avatar + name + email, household card, dietary preferences, servings, notification toggles, subscription management. `cookingCount` computed from current week's `mealPlan` data.

**Stitch:** Profile hero with avatar + premium badge, Household card, Cooking Insights section (cooking streak, plan completion %, most cooked recipe), Household Distribution bar, grouped settings navigation.

| What Changes | Type | Component |
|---|---|---|
| Profile hero section | **New** | `src/components/profile/ProfileHero.tsx` |
| Cooking Insights cards | **New** | `src/components/profile/CookingInsights.tsx` |
| Household Distribution bar | **New** | `src/components/profile/HouseholdDistribution.tsx` |
| Grouped settings navigation | **Modify** | `app/(app)/(tabs)/profile.tsx` restructured |

**Data source for cooking insights:**
- **Cooking streak:** Count consecutive days with at least one planned meal from `meal_plans` table. Requires a new query in `planStore` or a dedicated helper: `SELECT DISTINCT plan_date FROM meal_plans WHERE household_id = $1 ORDER BY plan_date DESC`. Then count consecutive days from today backward.
- **Plan completion %:** Meals planned vs meals actually marked with a recipe this month. Already partially available: `mealPlan` entries where `recipe_id IS NOT NULL` vs total entries. Can be computed client-side from existing store data.
- **Most cooked recipe:** `SELECT recipe_id, COUNT(*) FROM meal_plans WHERE household_id = $1 AND recipe_id IS NOT NULL GROUP BY recipe_id ORDER BY count DESC LIMIT 1`. New query needed.
- **Household distribution:** Meals per member. `SELECT cook_id, COUNT(*) FROM meal_plans WHERE household_id = $1 AND cook_id IS NOT NULL GROUP BY cook_id`. New query needed.

Best approach: Add a `fetchCookingStats(householdId: string)` method to `planStore` (not a new store) that fetches all four metrics in one Supabase query batch. This avoids a new store and keeps cooking data co-located with plan data.

### 6. Onboarding Redesign (6 screens)

**Current:** 6 step components in `src/components/onboarding/`: WelcomeStep, CreateHouseholdStep, InviteMembersStep, AddRecipesStep, PlanWeekStep, AllSetStep. Driven by `onboardingStore` with `currentStep: 0-5`.

**Stitch:** Same 6 steps, new visual treatment -- hero images, step indicator pills, editorial typography, glassmorphism on AllSet screen.

| What Changes | Type | Component |
|---|---|---|
| WelcomeStep visual overhaul | **Modify in-place** | `src/components/onboarding/WelcomeStep.tsx` |
| CreateHouseholdStep visual overhaul | **Modify in-place** | `src/components/onboarding/CreateHouseholdStep.tsx` |
| InviteMembersStep visual overhaul + invite code display | **Modify in-place** | `src/components/onboarding/InviteMembersStep.tsx` |
| AddRecipesStep visual overhaul + recipe cards | **Modify in-place** | `src/components/onboarding/AddRecipesStep.tsx` |
| PlanWeekStep visual overhaul + day-by-day layout | **Modify in-place** | `src/components/onboarding/PlanWeekStep.tsx` |
| AllSetStep glassmorphism celebration | **Modify in-place** | `src/components/onboarding/AllSetStep.tsx` |
| OnboardingProgress pill-style indicators | **Modify in-place** | `src/components/onboarding/OnboardingProgress.tsx` |

**Store changes:** None. `onboardingStore` already has `currentStep`, `nextStep`, `prevStep`, `completeOnboarding`. The redesign is purely visual.

**Recommendation: In-place update, not new components.** The 1:1 mapping is exact (same 6 steps, same data flow, same store). Creating new components would mean duplicating all the business logic wiring. Simply re-style the existing components.

### 7. Cooking Mode Redesign

**Current:** FlatList-based horizontal swipe through steps. `StepCard`, `CookingTimer`, `CookingProgress`, `IngredientSidebar`, `UnitToggle`.

**Stitch:** Step photo at top, timer card with "START" button, step category chip ("MARINATING"), large editorial instruction text, Chef's Tip callout, ingredient chips at bottom, Previous/Next Step navigation buttons.

| What Changes | Type | Component |
|---|---|---|
| StepCard redesigned with photo + editorial text + chef tip | **Modify** | `src/components/cooking/StepCard.tsx` |
| CookingTimer gets prominent card treatment | **Modify** | `src/components/cooking/CookingTimer.tsx` |
| New step category chip | **New** | Inline in StepCard (not a separate component) |
| New Chef's Tip callout | **New** | `src/components/cooking/ChefTip.tsx` |
| New ingredient chips for current step | **New** | `src/components/cooking/StepIngredients.tsx` |
| Previous/Next buttons replace horizontal swipe | **Modify** | `src/components/cooking/CookingMode.tsx` navigation |
| CookingProgress updated | **Modify** | `src/components/cooking/CookingProgress.tsx` |

**Store changes:** None. Recipe data (instructions with timer durations, ingredients) already exists. Chef tips can be extracted from instruction text or added as optional fields.

### 8. Social Feed Redesign

**Current:** `FeedList` with `FeedCard` components. FeedCard shows kitchen avatar, name, meal description, photo, likes/comments.

**Stitch:** Hero-sized photos, following avatar strip at top, "Try this recipe" CTA, view full recipe button, richer card layout with pull quotes.

| What Changes | Type | Component |
|---|---|---|
| Following avatar strip at top of feed | **New** | `src/components/social/FollowingStrip.tsx` |
| FeedCard hero photo + "Try this recipe" CTA | **Modify** | `src/components/social/FeedCard.tsx` |
| "View Full Recipe" button on cards | **Modify** | `src/components/social/FeedCard.tsx` |
| Feed header | **Modify** | Plan.tsx feed segment area |

**Store changes:** None. `socialStore` already has `following`, `feedPosts`, `loadFeed`. The avatar strip uses existing `following` array data.

### 9. Premium Upgrade Screen

**Current:** `SubscriptionSheet.tsx` as a bottom sheet with perk list and checkout button.

**Stitch:** Full-screen modal with hero kitchen image, feature comparison table (Free vs Premium), monthly/yearly pricing tiers, gradient CTA buttons.

| What Changes | Type | Component |
|---|---|---|
| SubscriptionSheet becomes full-screen or new screen | **Replace** | `src/components/premium/SubscriptionSheet.tsx` -> new `PremiumUpgradeScreen.tsx` |
| Feature comparison table | **New** | Inline in PremiumUpgradeScreen |
| Monthly/Yearly pricing toggle | **New** | Inline in PremiumUpgradeScreen |
| UpgradePrompt updated to open new screen | **Modify** | `src/components/premium/UpgradePrompt.tsx` |

**Store changes:** `subscriptionStore` may need to support yearly pricing if not already. The Stitch design shows $4.99/mo and $39.99/yr. Current code only has $9.99/mo. This is a **pricing decision** not an architecture decision -- the store just needs a `selectedPlan: 'monthly' | 'yearly'` local state in the component and the Stripe checkout URL parameterized by price ID.

---

## New Reusable Components to Build First

These patterns appear across multiple Stitch screens and should be extracted as shared components before screen-specific work begins.

### 1. DonutChart (react-native-svg)

**Used by:** Budget dashboard (donut hero), Profile (plan completion ring)

```
src/components/ui/DonutChart.tsx
Props: { value: number; max: number; size: number; strokeWidth: number; color: string }
```

Requires adding `react-native-svg` as a dependency (or using it if already present). This is the only new npm dependency likely needed.

### 2. HorizontalDateStrip

**Used by:** Meal planner day view

```
src/components/plan/DateStrip.tsx
Props: { dates: Date[]; selectedDate: Date; onSelectDate: (date: Date) => void }
```

Horizontal ScrollView with day-of-week labels and date numbers. Highlight on selected date.

### 3. FilterChips

**Used by:** Recipes library

```
src/components/ui/FilterChips.tsx
Props: { options: string[]; selected: string; onSelect: (option: string) => void }
```

Horizontal scroll of pill-shaped chips. Could also be used by future filter UIs.

### 4. ProgressBar (enhanced)

**Used by:** Grocery (shopping progress), Budget (category progress bars)

The existing progress bars in GrocerySummary and MonthlyProgress are inline StyleSheet implementations. Extract to a reusable component:

```
src/components/ui/ProgressBar.tsx
Props: { value: number; max: number; label?: string; showText?: boolean; color?: string }
```

### 5. InsightCard

**Used by:** Budget insights, Profile cooking insights

```
src/components/ui/InsightCard.tsx
Props: { icon: string; title: string; value: string; subtitle?: string; badge?: string }
```

Consistent card for stat/insight display across budget and profile.

---

## Screens That Can Be Redesigned Independently (No Cross-Dependencies)

These screens have **zero data flow dependencies** on each other and can be built in any order or in parallel:

| Screen | Why Independent |
|---|---|
| Recipes library | Only reads from recipeStore. No new store methods. |
| Grocery list | Only reads from groceryStore. No new store methods. |
| Cooking mode | Opens as a modal from recipe detail. Self-contained. |
| Premium upgrade | Opens as a modal/sheet. Self-contained. |
| Onboarding (all 6) | Only runs once on first launch. Fully isolated flow. |

## Screens With Dependencies

| Screen | Depends On | Why |
|---|---|---|
| Meal planner | Reusable DateStrip, ViewToggle | New components needed first |
| Budget dashboard | DonutChart, InsightCard, budgetStore.insights() | New component + store method |
| Profile | DonutChart, InsightCard, planStore.fetchCookingStats() | New component + store method |
| Social feed | FollowingStrip (but this is small) | Minor new component |

---

## Suggested Build Order

### Phase 1: Shared Components (Foundation)
Build reusable components that multiple screens need:
1. `DonutChart` (budget + profile need it)
2. `ProgressBar` (budget + grocery need it)
3. `InsightCard` (budget + profile need it)
4. `FilterChips` (recipes needs it)
5. `DateStrip` + `ViewToggle` (planner needs it)

### Phase 2: Independent Screen Redesigns (Parallel-Safe)
These can all be built simultaneously with no conflicts:
1. **Onboarding** (6 steps) -- in-place visual updates, zero store changes, fully isolated
2. **Recipes library** -- FilterChips integration, RecipeCard enhancement, grid layout change
3. **Grocery list** -- ProgressBar integration, summary card update, item row enhancement
4. **Cooking mode** -- StepCard redesign, ChefTip, StepIngredients, navigation buttons
5. **Premium upgrade** -- New full-screen component replacing bottom sheet

### Phase 3: Store-Enhanced Screens (Sequential)
These need store additions completed before UI work:
1. **Budget dashboard** -- Add `budgetStore.insights()` + `categoryBudgets()`, then build BudgetDonutHero + BudgetInsights
2. **Profile** -- Add `planStore.fetchCookingStats()`, then build CookingInsights + HouseholdDistribution + ProfileHero

### Phase 4: Complex Screen Redesigns
These have the most moving parts and benefit from Phase 1 components being ready:
1. **Meal planner** -- Day/Week toggle, DateStrip, HeroDinnerCard, GroceryShortcutCard. Most complex screen with multiple new sub-components.
2. **Social feed** -- FollowingStrip, FeedCard hero photos, Try Recipe CTAs

---

## Data Flow Changes Summary

| Store | Change | Screens Affected |
|---|---|---|
| `planStore` | Add `fetchCookingStats(householdId)` returning streak, completion %, most cooked, distribution | Profile |
| `budgetStore` | Add `insights()` computed method + optional previous month fetch | Budget |
| `budgetStore` | Add `categoryBudgets()` for per-category budget allocation | Budget |
| All others | No changes | -- |

**Total store changes: 2 stores, 3 new methods.** Everything else is component-layer work.

---

## New vs Modified Components Summary

### New Components (17)
| Component | Location | Used By |
|---|---|---|
| DonutChart | `src/components/ui/DonutChart.tsx` | Budget, Profile |
| ProgressBar | `src/components/ui/ProgressBar.tsx` | Budget, Grocery |
| InsightCard | `src/components/ui/InsightCard.tsx` | Budget, Profile |
| FilterChips | `src/components/ui/FilterChips.tsx` | Recipes |
| DateStrip | `src/components/plan/DateStrip.tsx` | Plan |
| ViewToggle | `src/components/plan/ViewToggle.tsx` | Plan |
| HeroDinnerCard | `src/components/plan/HeroDinnerCard.tsx` | Plan |
| GroceryShortcutCard | `src/components/plan/GroceryShortcutCard.tsx` | Plan |
| BudgetDonutHero | `src/components/budget/BudgetDonutHero.tsx` | Budget |
| BudgetInsights | `src/components/budget/BudgetInsights.tsx` | Budget |
| ChefTip | `src/components/cooking/ChefTip.tsx` | Cooking Mode |
| StepIngredients | `src/components/cooking/StepIngredients.tsx` | Cooking Mode |
| FollowingStrip | `src/components/social/FollowingStrip.tsx` | Social Feed |
| ProfileHero | `src/components/profile/ProfileHero.tsx` | Profile |
| CookingInsights | `src/components/profile/CookingInsights.tsx` | Profile |
| HouseholdDistribution | `src/components/profile/HouseholdDistribution.tsx` | Profile |
| PremiumUpgradeScreen | `src/components/premium/PremiumUpgradeScreen.tsx` | Premium |

### Modified Components (14)
| Component | What Changes |
|---|---|
| `plan/WeekHeader.tsx` | May be kept for week view; day view uses DateStrip instead |
| `plan/DayCard.tsx` | MealSlot gets illustration placeholders for empty state |
| `recipes/FilterBar.tsx` | Replaced by FilterChips (may be deleted) |
| `recipes/RecipeCard.tsx` | Add description, difficulty badge, rating |
| `recipes/RecipeGrid.tsx` | Switch to single-column layout |
| `grocery/GrocerySummary.tsx` | Add progress text, presence avatars |
| `grocery/GroceryItem.tsx` | Show price + category tag |
| `budget/CategoryCard.tsx` | Add inline progress bar |
| `budget/WeeklyBreakdown.tsx` | Add mini bar charts |
| `cooking/StepCard.tsx` | Photo, editorial text, category chip |
| `cooking/CookingTimer.tsx` | Prominent card treatment |
| `cooking/CookingMode.tsx` | Button navigation instead of horizontal swipe |
| `social/FeedCard.tsx` | Hero photo, Try Recipe CTA, View Full Recipe |
| `premium/UpgradePrompt.tsx` | Point to new full-screen upgrade |

### Modified In-Place (7 onboarding components)
| Component | What Changes |
|---|---|
| `onboarding/WelcomeStep.tsx` | Hero image, editorial typography, feature value props |
| `onboarding/CreateHouseholdStep.tsx` | Door illustration, step pills, editorial heading |
| `onboarding/InviteMembersStep.tsx` | Group photo, invite code card, share options |
| `onboarding/AddRecipesStep.tsx` | Progress counter, recipe cards with photos |
| `onboarding/PlanWeekStep.tsx` | Day-by-day meal slot layout, saved recipes sidebar |
| `onboarding/AllSetStep.tsx` | Glassmorphism card, blurred background |
| `onboarding/OnboardingProgress.tsx` | Pill-style step indicators |

### Modified Screens (5 tab screens)
| Screen | Scope of Change |
|---|---|
| `app/(app)/(tabs)/plan.tsx` | Day/Week toggle state, DateStrip, conditional rendering |
| `app/(app)/(tabs)/recipes.tsx` | FilterChips, search bar, layout |
| `app/(app)/(tabs)/grocery.tsx` | Sync with Plan button, header layout |
| `app/(app)/(tabs)/budget.tsx` | Month picker, DonutHero, Insights section |
| `app/(app)/(tabs)/profile.tsx` | ProfileHero, CookingInsights, HouseholdDistribution, grouped settings |

### Modified Stores (2)
| Store | Methods Added |
|---|---|
| `planStore.ts` | `fetchCookingStats(householdId)` |
| `budgetStore.ts` | `insights()`, `categoryBudgets()` |

---

## New Dependencies

| Package | Purpose | Confidence |
|---|---|---|
| `react-native-svg` | DonutChart, mini bar charts | HIGH -- standard RN package, widely used |

No other new npm dependencies expected. All other UI patterns (gradient buttons, glassmorphism on AllSet) can be achieved with existing `expo-linear-gradient` (if installed) or `react-native-reanimated` + existing theme tokens.

---

## Architecture Anti-Patterns to Avoid

### 1. Do NOT create a "Stitch" component directory
Keep new components in their existing feature directories (`plan/`, `budget/`, `ui/`). The Stitch redesign is not a separate feature -- it is a visual upgrade of existing features.

### 2. Do NOT add view mode to planStore
The Day/Week toggle is local UI state. Putting it in the store would over-engineer the data flow and couple unrelated components. `useState` in plan.tsx is correct.

### 3. Do NOT create new screens for redesigned tabs
The 5 tab screens stay in their existing files. The redesign happens by swapping out child components, not by creating new route files.

### 4. Do NOT duplicate onboarding logic
In-place update the 6 existing step components. They already wire into `onboardingStore` correctly. Creating parallel components means maintaining two sets of business logic.

### 5. Do NOT fetch cooking stats on every profile render
The `fetchCookingStats` method should be called once on profile mount with results cached in the store. Cooking streak and most-cooked-recipe are not real-time metrics.

---

## Key Decision Answers

### Q1: Day/Week toggle -- planStore or local state?
**Answer: Local state.** The toggle does not affect data fetching (both views use the same `weekOffset` + `mealPlan`), does not need cross-component access, and does not need persistence. `useState<'day' | 'week'>('day')` in plan.tsx.

### Q2: Budget donut chart and insights -- does budgetStore need new methods?
**Answer: Yes, two new computed methods.** `insights()` compares current month to previous month (requires fetching two months of expenses). `categoryBudgets()` splits the budget target across categories (could be a fixed 60/25/15 split or user-configurable later). The donut chart itself uses existing `monthlyTotal()` and `budgetTarget`.

### Q3: Profile cooking insights -- where does data come from?
**Answer: New `planStore.fetchCookingStats()` method.** It runs 3-4 Supabase queries (streak, most cooked, distribution) against the existing `meal_plans` table. Results cached in planStore state. No new tables, no new Edge Functions.

### Q4: Onboarding -- in-place update or new components?
**Answer: In-place update.** Same 6 steps, same `onboardingStore`, same data flow. Only the JSX/styles change. Creating new components would duplicate business logic for zero architectural benefit.

### Q5: Which screens can be redesigned independently?
**Answer: Recipes, Grocery, Cooking Mode, Premium, Onboarding.** These five have no cross-dependencies and no new store methods needed.

### Q6: Which screens share new patterns needing shared components first?
**Answer: Budget + Profile share DonutChart and InsightCard. Budget + Grocery share ProgressBar. Plan needs DateStrip + ViewToggle.** Building these 5 reusable components first unblocks all dependent screens.

---

## Sources

- Direct codebase analysis of all 13 Zustand stores, 5 tab screens, 22 component directories
- 14 Stitch design screenshots from `/Users/deeg/Downloads/SharedKitchenStitchUIv2/`
- Design constraints from `project_stitch_design_constraints.md` memory file
- DESIGN.md ("Culinary Curator" design system) from Stitch reference directory
