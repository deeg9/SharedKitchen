# Phase 43: Budget, Profile & Social Feed - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Redesign 3 remaining screens: Budget dashboard (donut ring, month picker, insights, category bars), Profile (cooking insights, household distribution, grouped settings), Social Feed (following strip, hero photos, try-recipe CTAs). This is the only phase requiring new Zustand store methods for budget insights and cooking stats.

</domain>

<decisions>
## Implementation Decisions

### Budget Dashboard (BUDG-01 through BUDG-05)
- DonutChart component (from Phase 39) as hero: total spent vs budget target, percentage badge
- Month picker: left/right arrow buttons with month label (e.g., "September 2023")
- budgetStore needs: `setSelectedMonth(date)` method + `previousMonthTotal()` computed method for insights
- Budget Insights section: InsightCard (from Phase 39) showing month-over-month comparisons
- Example insight: "You spent 15% less on dining out this month" with SAVINGS ALERT badge
- Category progress bars: ProgressBar (from Phase 39) inline with each category card
- Per-category budget: fixed 60/25/15 split of total budget (Groceries 60%, Dining Out 25%, Takeout 15%)
- Weekly breakdown with mini bar charts (can use simple View rectangles, no SVG needed)

### Profile & Settings (PROF-01 through PROF-05)
- Cooking Insights section: DonutChart for plan completion %, streak counter with fire emoji
- planStore needs: `fetchCookingStats(householdId)` method returning {streak, completionPercent, mostCookedRecipe}
- Streak: count consecutive days with at least 1 meal planned, starting from today backwards
- Plan completion: meals planned / (days in month * 3) as percentage
- Most-cooked recipe: recipe appearing most in meal_plans this month, with photo and count badge
- Household distribution: stacked horizontal bar showing cooking contribution per member
- Data: count meal_plans grouped by created_by user within current month
- Grouped settings: Preferences section (Dietary, Default Servings, Notifications) as navigation rows with chevrons
- Account section (Manage Subscription, Dark Mode toggle, Data Export) as navigation rows
- Settings rows push to detail screens (existing for Dietary/Subscription, placeholder for others)

### Social Feed (FEED-01 through FEED-05)
- Following avatar strip: horizontal ScrollView of followed kitchen avatars at top of feed
- Data from socialStore.following (already fetched)
- Hero-sized meal photos: larger Image component on FeedCard with overlay text for meal name
- "Try this recipe" CTA button on feed cards (alongside existing like/comment actions)
- Quoted description text: italic description below meal name
- "View Full Recipe" action: navigates to recipe/[id] screen
- Feed header: "Feed" title consistent with other screen headers

### Claude's Discretion
- Exact donut ring value/sublabel formatting
- Insights card message text generation logic
- Streak calculation edge cases (what counts as "consecutive")
- Profile section ordering and spacing
- Feed card layout proportions

</decisions>

<code_context>
## Existing Code Insights

### Files to Modify
- Budget: `app/(app)/(tabs)/budget.tsx`, `src/components/budget/MonthlyProgress.tsx`, `src/components/budget/CategoryCard.tsx`, `src/components/budget/WeeklyBreakdown.tsx`, `src/stores/budgetStore.ts`
- Profile: `app/(app)/(tabs)/profile.tsx`, `src/stores/planStore.ts`
- Social Feed: `src/components/social/FeedCard.tsx`, `src/components/social/FeedList.tsx`

### New Components Needed
- Budget: MonthPicker (simple header with arrows), BudgetInsights (InsightCard wrapper)
- Profile: CookingInsights, HouseholdDistribution, SettingsSection

### Reusable Assets (from Phase 39)
- DonutChart, ProgressBar, InsightCard — all used heavily in this phase

### Store Changes Needed
- budgetStore: `setSelectedMonth()`, `previousMonthTotal()`, `categoryBudgets()` (fixed split)
- planStore: `fetchCookingStats()` — new Supabase query for streak, completion, most-cooked

</code_context>

<specifics>
## Specific Ideas

- Stitch references:
  - /Users/deeg/Downloads/SharedKitchenStitchUIv2/refined_budget_dashboard/screen.png
  - /Users/deeg/Downloads/SharedKitchenStitchUIv2/refined_profile_stats/screen.png
  - /Users/deeg/Downloads/SharedKitchenStitchUIv2/social_feed/screen.png
- Budget category split: Groceries 60%, Dining Out 25%, Takeout 15% of budgetTarget
- Profile: cooking stats section replaces the minimal "You've cooked X times" line

</specifics>

<deferred>
## Deferred Ideas

- Dark mode audit for all redesigned screens (POLSH-01 — future requirement)
- Skeleton loading state parity (POLSH-02 — future requirement)

</deferred>
