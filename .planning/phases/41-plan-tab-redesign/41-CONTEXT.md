# Phase 41: Plan Tab Redesign - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Redesign the Plan tab (the app's home screen) from a week-list view to a day-focused layout with Day/Week toggle. Default to Day view showing today's meals as a hero card. Uses DateStrip from Phase 39 for day navigation. Existing data from planStore — no store changes needed (view toggle is local useState).

</domain>

<decisions>
## Implementation Decisions

### Day/Week Toggle
- Toggle in plan header: "Day" and "Week" pills (similar to existing My Plan/Feed segmented control)
- Default: Day view
- State: local useState in plan.tsx (NOT planStore — view preference is UI-only)
- When toggling to Week, show existing 7-day layout (refined but same structure)

### Day View Layout
- DateStrip component at top for day navigation (from Phase 39)
- Today's dinner as hero card: large recipe photo (expo-image), recipe name (headlineMd), description text, presence indicator ("Sarah is cooking"), "Start Cooking" CTA button
- Hero card uses Card variant="elevated" with shadows.editorial
- If no dinner planned: hero area shows soft empty state with illustration-style icon
- Below hero: Breakfast and Lunch as smaller meal slots with soft empty states
- Empty state prompts: "What's for breakfast?" and "Lunch time?" with food icons
- Tapping any meal slot opens existing PlanEditSheet (no changes to the sheet itself)

### Week View
- Same as current layout but with Day/Week toggle visible
- WeekHeader component stays (prev/next arrows, week label)
- DaySection components stay (date column + 3 meal slots)

### Grocery Shortcut Card
- Card at bottom of day view: grocery bag icon + "Grocery List" + "12 items needed this week"
- Taps navigate to Kitchen tab (index 2)
- Item count comes from groceryStore.items.length (already available)
- Only shown in Day view, not Week view

### Navigation
- Week navigation (prev/next, Today button) works in both views
- In Day view: DateStrip handles day selection, week arrows change the week
- In Week view: existing WeekHeader handles everything

### Claude's Discretion
- Hero card image height and aspect ratio
- Transition animation between Day and Week views
- Exact grocery shortcut card positioning

</decisions>

<code_context>
## Existing Code Insights

### Files to Modify
- `app/(app)/(tabs)/plan.tsx` — Main plan screen (currently 408 lines)
- `src/components/plan/DayCard.tsx` — Currently renders DaySection with 3 meal slots
- `src/components/plan/WeekHeader.tsx` — Week navigation arrows

### New Components Needed
- Hero dinner card (new, in src/components/plan/)
- Day view layout container
- Grocery shortcut card (new, in src/components/plan/)

### Reusable Assets (from Phase 39)
- `src/components/ui/DateStrip.tsx` — Horizontal day selector with today highlight
- `src/components/ui/Card.tsx` — Elevated/filled variants
- `expo-image` — For cached hero photo
- `expo-linear-gradient` — For gradient overlay on hero card

### Stores Used (read-only, no changes)
- planStore: weekOffset, mealPlan, weekDays, weekLabel, fetchMealPlan
- groceryStore: items (for shortcut count)
- householdStore: activeHouseholdId
- socialStore: myKitchenProfile (for feed segment)
- subscriptionStore: canAccess

### Established Patterns
- Segmented control: pill-shaped row, surfaceContainerLow bg, primary active state
- Bottom padding: TAB_BAR_HEIGHT + 80 for FAB clearance
- Surprise Me FAB stays as-is (existing component)

</code_context>

<specifics>
## Specific Ideas

- Stitch reference: /Users/deeg/Downloads/SharedKitchenStitchUIv2/day_focused_meal_planner/screen.png
- The My Plan/Feed segmented control stays — Day/Week toggle is a SECOND toggle within the "My Plan" segment
- Presence indicator on hero card: small avatar + "Sarah is cooking" text (from existing presence hooks if available)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
