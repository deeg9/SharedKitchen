# Quick Task 260410-k7a: Redesign DayViewMealSlot as rich meal cards - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Task Boundary

Redesign DayViewMealSlot as rich full-width meal cards with hero image, edit pencil, view recipe button, meal RSVP opt-in/opt-out, and detailed info. Includes DB migration for meal_rsvps table.

</domain>

<decisions>
## Implementation Decisions

### RSVP Default Behavior
- Default all household members to 'eating' (opt-out model)
- Users tap their avatar to toggle off if skipping a meal
- Less friction for shared kitchens

### Card Layout
- Image above content layout (Instagram-style)
- Full-width hero image on top (~140px), all text/buttons below
- Card structure top-to-bottom:
  1. Hero image (full width, ~140px)
  2. Meal label (BREAKFAST/LUNCH/DINNER) + edit pencil icon on right
  3. Recipe name (larger text)
  4. Description (1-2 lines from first instruction step)
  5. Meta row: time, estimated cost, servings
  6. Household member avatars (tap to toggle RSVP) + ingredient count pill
  7. "View Recipe" outlined pill button

### View Recipe Button
- Outlined pill button at bottom of card
- Clear CTA without being too heavy

### Interaction Model
- Tap card body → navigate to recipe detail screen
- Tap pencil icon → opens PlanEditSheet (change/remove recipe)
- Tap avatar → toggle eating/skipped RSVP for that user
- Tap "View Recipe" → navigate to recipe detail screen (same as card tap)

### Empty State
- Same tall card size with big placeholder area
- Icon + "Tap to add a recipe" + pencil icon to edit
- Ingredient count shows as just a number ("6 ingredients")

</decisions>

<specifics>
## Specific Ideas

- Hero image uses recipe.image_url with getDefaultRecipeImage fallback
- Description from recipe.instructions[0].text (existing pattern from HeroDinnerCard)
- Ingredient count from recipe.ingredients array length
- Household members from householdStore members list
- RSVP stored in new meal_rsvps table: (meal_plan_id, user_id, status: 'eating'|'skipped')
- On meal plan creation, auto-insert RSVP rows for all household members with status='eating'

</specifics>
