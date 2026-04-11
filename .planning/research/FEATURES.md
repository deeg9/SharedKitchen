# Feature Landscape: Stitch UI Redesign

**Domain:** Meal planning app — UI-only redesign across 14 screens
**Researched:** 2026-04-07
**Confidence:** HIGH (visual reference screens available, existing codebase inspected, competitor patterns surveyed)

---

## Table Stakes

Features users expect in a modern meal planning app. Missing = product feels dated or incomplete.

### Plan Tab

| # | Feature | Why Expected | Complexity | Existing Dependency | Notes |
|---|---------|--------------|------------|---------------------|-------|
| 1 | **Day/Week toggle** | Every major planner (Mealime, Paprika, Eat This Much) offers both views. Users want to zoom in on today. | Medium | `planStore.weekOffset`, `WeekHeader`, `DayCard` | Currently week-only with prev/next arrows. Need new `viewMode` state in planStore or local state. Day view is a single-day expansion of existing DayCard data. |
| 2 | **Horizontal date picker strip** | Standard mobile pattern (Google Calendar, Apple Health, fitness apps). Users expect tap-to-jump-to-day. | Medium | `planStore.weekDays()`, `getWeekDays()` in dates.ts | Build with FlatList horizontal or ScrollView. 5-day visible window (Mon-Fri from design), highlight today with filled circle. Can use custom component, no third-party lib needed. |
| 3 | **Hero dinner card** with large photo | Dinner is the app's core value ("what's for dinner?"). Hero treatment matches user mental model. | Medium | `planStore.mealPlan`, `MealPlanWithRecipe`, existing `DayCard` `MealSlot` | Replace compact day-card dinner slot with full-width card. Uses existing recipe image_url. Presence indicator already exists via `PresenceAvatarStack`. |
| 4 | **"Start Cooking" CTA on hero card** | Direct path from plan to cooking mode. Reduces tap count for primary action. | Low | `CookingMode` component, recipe data already in plan | Button that opens existing CookingMode with the hero recipe. One Pressable + router.push. |
| 7 | **Rich recipe cards** with descriptions, difficulty badges, ratings | Industry standard (AllRecipes, NYT Cooking, Paprika). Cards without descriptions feel like lists. | Medium | `RecipeCard`, `recipeStore`, existing `FilterBar` | Current RecipeCard shows name + time pill + cost pill. Add: 2-line description, difficulty badge (Beginner/Intermediate/Advanced), star rating. Data already exists in recipe.description. Rating from existing recipe.rating field. |
| 8 | **Shopping progress bar** ("12 of 18 items checked") | Every grocery app shows completion progress (AnyList, OurGroceries, Instacart). | Low | `groceryStore.summary()` already computes `checkedItems/totalItems` | `GrocerySummary` already has a basic progress bar. This is a visual upgrade: larger bar, "SHOPPING PROGRESS" label, "X of Y items checked" text. Minimal logic change. |
| 10 | **Donut ring chart** for budget | Visual budget tracking is standard in finance/budget apps (Mint, YNAB, Copilot). Linear progress bars are fine but ring charts feel more polished. | Medium | `budgetStore.monthlyTotal()`, `budgetStore.categoryTotals()`, `MonthlyProgress` | Replace linear progress bar with SVG donut ring. Use `react-native-svg` (likely already installed via expo deps) or lightweight custom SVG. Center shows "$X of $Y spent" + percentage. |
| 12 | **Month picker with arrows** for budget | Standard pattern in any monthly view (bank apps, analytics). Users need to navigate months. | Low | `budgetStore.selectedMonth`, `budgetStore.setSelectedMonth()` | Already have month selection in store. Just need `< September 2023 >` header component with prev/next arrows. |
| 14 | **Grouped settings** with navigation rows | iOS standard pattern (Apple Settings app). Users expect categorized settings. | Low | Profile screen, existing settings scattered across screens | Pure UI reorganization. Group into sections: Household, Preferences, Account & Subscription. Each row: icon + label + optional value + chevron. No new data needed. |

### Recipes Tab

| # | Feature | Why Expected | Complexity | Existing Dependency | Notes |
|---|---------|--------------|------------|---------------------|-------|
| 6 | **Filter chips** (All, Quick Meals, Favorites) | Horizontal scrollable chips are the standard mobile filter pattern (Google Maps, DoorDash, Airbnb). | Medium | `FilterBar` with dropdown modals, `recipeStore` filter state | Current FilterBar uses dropdown buttons. Stitch design shows horizontal pill chips. Need to replace dropdown-modal approach with always-visible scrollable chips. Different UX paradigm — simpler but less filter depth. |

### Grocery/Kitchen Tab

| # | Feature | Why Expected | Complexity | Existing Dependency | Notes |
|---|---------|--------------|------------|---------------------|-------|
| 9 | **"Sync with Plan" action button** | Users need to regenerate grocery list when plan changes. Must be discoverable. | Low | `groceryStore.generateGroceryList()` already exists | Currently triggered somewhere in the flow. Stitch design puts it as a prominent top-bar button. Pure UI relocation — the action already works. |

---

## Differentiators

Features that set SharedKitchen apart. Not universally expected, but elevate the experience.

| # | Feature | Value Proposition | Complexity | Existing Dependency | Notes |
|---|---------|-------------------|------------|---------------------|-------|
| 4a | **Soft empty states** with illustrations ("What's for breakfast?") | Emotional design that makes empty slots feel inviting, not broken. Most apps show "No meals planned" with a plus icon. SharedKitchen's warm illustration approach matches the "Tactile Sophistication" brand. | Medium | `EmptyState` component exists but is generic. `DayCard` has basic empty MealSlot | Need custom icons per meal type (breakfast, lunch). Stitch shows illustrated food icons with italic placeholder text. Use themed MaterialCommunityIcons with warm color palette. Key: inviting tone, not cold "empty" state. |
| 5 | **Cross-feature shortcut** ("Grocery List - 12 items needed") | Reduces tab-switching friction. Shows plan-aware grocery status on Plan tab. Unique cross-pollination most competitors lack. | Medium | `groceryStore.summary()`, plan tab layout | Card at bottom of day view showing grocery status. Needs groceryStore data available on Plan tab (already loaded as global Zustand store). Pressable navigates to Groceries tab. |
| 11 | **Budget insights cards** ("You spent 15% less on dining out") | Proactive intelligence, not just passive charts. YNAB does this well; most meal planners don't touch budget insights at all. | High | `budgetStore.categoryTotals()`, `budgetStore.weeklyBreakdown()` | Requires comparison logic: current month vs previous month per category. New computation in budgetStore or a derived selector. "SAVINGS ALERT" badge. Horizontal scrollable card carousel. This is net-new business logic, not just UI. |
| 13 | **Cooking insights** (streak, plan completion, most-cooked recipe) | Gamification/engagement that builds habit. Few meal planners track cooking streaks. | High | `planStore.mealPlan` history, need new queries | Stitch shows: cooking streak (consecutive days with dinner planned/cooked), plan completion % (circular progress), most-cooked recipe with count. All require new Supabase queries against historical meal_plans data. Not currently computed anywhere. |
| 15 | **Household distribution chart** | Shows who's contributing to cooking — social accountability for households. Unique to collaborative planning apps. | Medium | `planStore` data has `cook_id` field, `householdStore.members` | Horizontal stacked bar showing % of meals per household member. Needs aggregation query: count meals by cook_id for current month. New Supabase query or client-side computation from fetched plans. |
| 16 | **Step photos** and **Chef's Tips** in cooking mode | Elevates cooking mode from text instructions to visual guidance. Serious cooking apps (NYT Cooking, Tasty) show step photos. | Medium | `CookingMode`, `StepCard`, recipe `instructions` JSON | Step photos: need `image_url` field per instruction step in instructions JSON array. Chef's Tips: new `tip` field per step. Both require recipe data schema awareness. For imported recipes, AI extraction could populate tips. Photos depend on source recipe having per-step images — graceful degradation when missing. |
| 17 | **Following avatar strip** in feed | Instagram Stories-style horizontal avatar row creates social presence. Makes feed feel alive even with few posts. | Low | `socialStore` has follow data, kitchen profiles with avatars | Horizontal FlatList of followed kitchen avatars at top of feed. Tap navigates to kitchen profile. Data already available from socialStore. Pure UI addition — very impactful for perceived social activity. |
| 18 | **Feature comparison table** for premium upgrade | Clear free-vs-premium comparison drives conversion. Standard SaaS pattern. | Low | `SubscriptionSheet` already has `FREE_VS_PREMIUM` array | Current SubscriptionSheet has the data as a simple list. Stitch design shows proper comparison table with checkmarks/dashes, column headers, hero kitchen photo, and monthly/yearly pricing tiers. Visual upgrade of existing data. Yearly tier needs new Stripe price_id. |

---

## Anti-Features

Features to explicitly NOT build as part of this redesign.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Animated page transitions between Day/Week** | Over-engineering for a view toggle. Adds complexity, potential jank on lower-end devices. | Simple conditional render. Day view and Week view are different component trees, not animated transforms. |
| **Custom illustration assets per empty state** | Art direction scope creep. Commissioning/creating 3+ unique illustrations delays shipping. | Use themed MaterialCommunityIcons or simple SVG shapes with the existing color palette. Stitch designs show simple food icons, not complex illustrations. |
| **Real-time budget insights computation** | Budget insights comparing months requires fetching previous month data. Doing this on every render is wasteful. | Compute insights on budget tab mount or on explicit refresh. Cache the comparison result. |
| **Interactive donut chart with segment selection** | Tap-to-expand-segment adds touch handling complexity for minimal value. Budget categories are already shown in a list below. | Static donut ring with center text. Category breakdown stays as the existing list with progress bars. |
| **Yearly pricing tier backend work** | App uses Stripe external payments. Adding yearly tier requires new Stripe product/price creation, not just UI. | Show yearly tier in UI but flag as needing backend coordination. Can initially route to monthly checkout and add yearly once Stripe price_id is created. |
| **Drag-and-drop meal reordering in day view** | Complex gesture handling (react-native-gesture-handler + reanimated) for a rarely-used action. | Keep existing bottom sheet for editing/reassigning meals to slots. |
| **Per-step cooking photos from URL import** | Most recipe sites don't have per-step images in schema.org data. AI can't reliably generate them. | Show step photo slot only when data exists (graceful degradation). Don't block on having photos for every step. |

---

## Feature Dependencies

```
Day/Week Toggle (1) --> Horizontal Date Strip (2)
   (Date strip only makes sense in Day view; Week view uses existing WeekHeader)

Hero Dinner Card (3) --> Start Cooking CTA (4)
   (CTA lives on the hero card)

Hero Dinner Card (3) --> Soft Empty States (4a)
   (Empty states replace hero card when no dinner planned)

Filter Chips (6) --> Rich Recipe Cards (7)
   (Both are Recipes tab; chips filter the card list)

Shopping Progress Bar (8) + Sync with Plan Button (9)
   (Both are Grocery tab header area, co-dependent layout)

Donut Ring Chart (10) --> Month Picker (12)
   (Month picker controls which month the donut shows)

Donut Ring Chart (10) --> Budget Insights (11)
   (Insights appear below the donut, same screen)

Cooking Insights (13) and Household Distribution (15)
   (Both Profile screen sections, independent data but same layout pass)

Step Photos (16) is independent (Cooking Mode)
Following Avatar Strip (17) is independent (Feed)
Feature Comparison Table (18) is independent (Premium screen)
Grouped Settings (14) is independent (Profile screen)
```

---

## MVP Recommendation

### Phase 1: Plan Tab Redesign (highest user impact)
1. **Day/Week toggle** (1) - Fundamental UX shift, most visible change
2. **Horizontal date strip** (2) - Paired with day view
3. **Hero dinner card** (3) + **Start Cooking CTA** (4) - Flagship visual upgrade
4. **Soft empty states** (4a) - Emotional design for empty slots
5. **Cross-feature grocery shortcut** (5) - Cross-pollination between tabs

### Phase 2: Recipes + Grocery Tabs
6. **Filter chips** (6) - Replaces dropdown FilterBar
7. **Rich recipe cards** (7) - Description + difficulty + ratings
8. **Shopping progress bar** (8) - Visual upgrade of existing component
9. **Sync with Plan button** (9) - Relocation of existing action

### Phase 3: Budget + Profile
10. **Donut ring chart** (10) - New SVG component, biggest visual change on Budget tab
11. **Month picker** (12) - Simple navigation chrome
12. **Budget insights** (11) - New business logic (month-over-month comparison)
13. **Cooking insights** (13) - New Supabase queries for streak/completion/most-cooked
14. **Household distribution** (15) - New aggregation query
15. **Grouped settings** (14) - Pure UI reorganization

### Phase 4: Cooking Mode + Social + Premium
16. **Step photos + Chef's Tips** (16) - Schema evolution for instructions JSON
17. **Following avatar strip** (17) - Quick social upgrade
18. **Feature comparison table** (18) - Premium conversion upgrade

### Defer:
- **Yearly pricing tier backend**: Requires Stripe price_id creation beyond UI scope
- **Budget insights** could ship as static summary text in Phase 3, made dynamic later

---

## Complexity Summary

| Complexity | Count | Features |
|------------|-------|----------|
| **Low** | 7 | Start Cooking CTA (4), Shopping progress bar (8), Sync with Plan (9), Month picker (12), Grouped settings (14), Following avatar strip (17), Feature comparison table (18) |
| **Medium** | 9 | Day/Week toggle (1), Date strip (2), Hero dinner card (3), Soft empty states (4a), Cross-feature shortcut (5), Filter chips (6), Rich recipe cards (7), Donut ring chart (10), Household distribution (15), Step photos/tips (16) |
| **High** | 2 | Budget insights (11), Cooking insights (13) |

The "High" items are high because they require **new business logic and Supabase queries**, not just visual changes. Everything else is UI-only work against existing data.

---

## Existing Store/Component Impact

| Store | Changes Needed | Affected Features |
|-------|---------------|-------------------|
| `planStore` | Add `viewMode: 'day' \| 'week'` state, `selectedDate` for day view. Possibly new `fetchMealPlanForDay()` or reuse existing fetch with date range. | 1, 2, 3, 4, 4a, 5 |
| `recipeStore` | Modify filter state to support chip-based filtering (may just be UI change if filter categories map to existing filters). | 6, 7 |
| `groceryStore` | No store changes. `summary()` already provides progress data. | 8, 9 |
| `budgetStore` | Add `fetchPreviousMonth()` for insights comparison. Add `insights()` computed selector. | 10, 11, 12 |
| `socialStore` | No store changes. Follow data already available. | 17 |
| `subscriptionStore` | Add yearly price_id support if implementing yearly tier. | 18 |
| **New queries needed** | `fetchCookingStreak()`, `fetchPlanCompletion()`, `fetchMostCookedRecipe()`, `fetchHouseholdDistribution()` | 13, 15 |

| Component | Action | Affected Features |
|-----------|--------|-------------------|
| `WeekHeader` | Keep for week view, add Day/Week segmented control above it | 1 |
| `DayCard` | Major refactor into hero card layout for day view | 3, 4, 4a |
| `FilterBar` | Replace with horizontal chip bar | 6 |
| `RecipeCard` | Add description, difficulty badge, rating star | 7 |
| `GrocerySummary` | Visual upgrade with progress bar styling | 8 |
| `MonthlyProgress` | Replace with donut ring SVG component | 10 |
| `CookingMode` / `StepCard` | Add step photo, chef tip, ingredient chips | 16 |
| `FeedCard` / `FeedList` | Add avatar strip header, hero-sized photos, try-recipe CTA | 17 |
| `SubscriptionSheet` | Full redesign into comparison table layout with pricing tiers | 18 |
| **New components** | `DateStrip`, `HeroDinnerCard`, `MealEmptyState`, `GroceryShortcutCard`, `DonutRingChart`, `BudgetInsightCard`, `CookingInsightsSection`, `HouseholdDistributionBar`, `SettingsGroup`, `FollowingAvatarStrip`, `PremiumComparisonTable` | Various |

---

## Sources

- Stitch UI reference designs: `/Users/deeg/Downloads/SharedKitchenStitchUIv2/` (14 screens reviewed)
- SharedKitchen codebase: stores, components, theme tokens inspected
- [Meal Planning App Development Guide](https://developerbazaar.com/guide-to-meal-planner-app-development/)
- [Horizontal Calendar for React Native](https://dev.to/kharioki/horizontal-calendar-a-simple-date-picker-for-react-native-4h2)
- [react-native-calendar-strip](https://github.com/BugiDev/react-native-calendar-strip)
- [Donut Chart with React Native SVG](https://dev.to/franciscomendes10866/how-to-create-a-donut-chart-using-react-native-svg-30m9)
- [Animated Donut Chart with Reanimated](https://dev.to/dimaportenko/react-native-animated-donut-pie-chart-reanimated-svg-32od)
- [Empty State UX Best Practices](https://www.eleken.co/blog-posts/empty-state-ux)
- [Progress Indicator UI Design](https://mobbin.com/glossary/progress-indicator)
- [Best Meal Planning Apps 2026](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/)
