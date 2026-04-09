# Phase 40: Independent Screen Redesigns - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Redesign 4 independent screen surfaces that require NO Zustand store changes: Onboarding (6 steps), Recipe Library, Cooking Mode, and Premium Upgrade. All data comes from existing stores. Uses shared components from Phase 39 (FilterChips, DateStrip, ProgressBar, InsightCard, DonutChart). Stitch reference designs at `/Users/deeg/Downloads/SharedKitchenStitchUIv2/`.

</domain>

<decisions>
## Implementation Decisions

### Onboarding (6 screens)
- Welcome: hero kitchen photo, "SharedKitchen" branding (NOT "Mise"), Get Started/Sign In CTAs, feature highlights at bottom
- Create Household: step progress indicator, illustration, "Name your kitchen" input with ghost border focus state
- Invite Members: invite code display with copy button and share-via icons (message, email, system share)
- Add First Recipes: progress counter "0 of 3 added", starter recipe cards with photos, "Import from URL" option
- Plan Your Week: day-by-day meal slot pickers, saved recipes list at bottom with drag-to-assign
- All Set: glassmorphism celebration card on blurred background, "Go to my kitchen" CTA
- All 6 steps use existing onboardingStore — no data changes, only visual treatment

### Recipe Library
- Horizontal FilterChips component (from Phase 39) replacing existing dropdown FilterBar
- Full-width recipe cards (replacing 2-column grid) with: description text, cook time pill, difficulty badge derived from prep+cook time, rating star
- Search bar visible at top of screen
- "Import New Recipe" CTA card at end of list
- Existing RecipeGrid component gets major rework; RecipeCard becomes full-width

### Cooking Mode
- Step photo at top (from recipe.instructions[n].image_url if available, placeholder if not)
- Timer card: step name, countdown, Start button (prominent placement above instruction)
- Step type badge: PREP/COOKING/MARINATING derived from instruction text keywords
- Chef's Tip callout: parse "tip:" or "note:" prefixes from instruction text, display in styled card
- Ingredient chips: list current step's ingredients as chips below instruction
- Previous/Next Step buttons replacing horizontal swipe navigation
- Existing CookingMode.tsx and StepCard.tsx get reworked

### Premium Upgrade
- Hero kitchen photo with editorial headline using Plus Jakarta Sans displayLg
- Feature comparison table: 2-column (Free vs Premium) with checkmarks and feature descriptions
- Monthly ($9.99/mo) and yearly tiers displayed — yearly shows "BEST VALUE" badge
- Note: yearly Stripe price_id doesn't exist yet — show UI but yearly CTA is non-functional
- Replace existing UpgradePrompt modal with dedicated full-screen subscription.tsx redesign

### Claude's Discretion
- Exact layout proportions and spacing within each screen
- Animation transitions between onboarding steps
- Recipe card description truncation (2 lines recommended)
- Step photo placeholder design when no image available

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 39)
- `src/components/ui/FilterChips.tsx` — horizontal scrollable single-select pills
- `src/components/ui/ProgressBar.tsx` — animated horizontal fill bar
- `src/components/ui/InsightCard.tsx` — icon + message + badge card
- `src/components/ui/DonutChart.tsx` — animated SVG ring chart
- `src/components/ui/DateStrip.tsx` — scrollable day selector

### Files to Modify
- Onboarding: `src/components/onboarding/WelcomeStep.tsx`, `CreateHouseholdStep.tsx`, `InviteMembersStep.tsx`, `AddRecipesStep.tsx`, `PlanWeekStep.tsx`, `AllSetStep.tsx`, `OnboardingProgress.tsx`
- Recipes: `src/components/recipes/RecipeGrid.tsx`, `RecipeCard.tsx`, `FilterBar.tsx`
- Cooking: `src/components/cooking/CookingMode.tsx`, `StepCard.tsx`
- Premium: `app/(app)/subscription.tsx`

### Established Patterns
- StyleSheet.create with theme tokens from src/theme/
- Named exports, functional components
- Bottom sheets via @gorhom/bottom-sheet
- expo-linear-gradient for gradient backgrounds (installed in Phase 39)
- expo-image for cached image rendering

</code_context>

<specifics>
## Specific Ideas

- Stitch designs: `/Users/deeg/Downloads/SharedKitchenStitchUIv2/{screen_name}/screen.png`
- Design constraints: see memory `project_stitch_design_constraints.md` — tab bar, FAB, branding stay as-is
- Branding: "SharedKitchen" everywhere (Stitch designs say "Mise" or "The Culinary Curator" — override)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
