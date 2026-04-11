# Phase 50: Cooking Mode Redesign - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users experience a visually rich step-by-step cooking flow with recipe imagery, categorized steps, contextual ingredients, and clear progress tracking. This redesigns the existing CookingMode.tsx (281 lines) and its supporting components (CookingProgress, StepCard, UnitToggle, IngredientSidebar, CookingTimer — 661 lines total).

</domain>

<decisions>
## Implementation Decisions

### Visual Layout & Hero Photo
- Fixed header band (~180px) with recipe hero photo, persistent at top of each step, step content scrolls beneath
- Colored pill badge above step text for category tag (e.g., "PREP" in amber, "GRILLING" in red)
- Ingredient chips displayed below step text showing only ingredients referenced in that step with amounts
- Steps with no matched ingredients show "No ingredients for this step" placeholder for layout consistency

### Navigation & Progress
- Horizontal pill segments progress bar — each step is a segment, filled = completed, current = highlighted (extends existing CookingProgress pattern)
- Bottom fixed bar with Previous / Ingredients / Next Step buttons. "Next Step" is primary (bold/filled), others secondary
- On the last step, "Next Step" changes to green "Done Cooking" button triggering the existing onCookComplete callback
- Metric/Imperial toggle persistent via AsyncStorage (already implemented with UNIT_PREF_KEY), positioned in header bar near progress

### Step Categorization & Ingredient Matching
- Categories derived via keyword matching on step text: "chop/dice/mince" → PREP, "grill/sear/char" → GRILLING, "simmer/boil/reduce" → SIMMERING, "bake/roast" → BAKING, "mix/combine/whisk" → MIXING, default → "COOK"
- Per-step ingredients matched via text matching — scan step text for ingredient names from recipe's ingredient list, match by name substring
- Metric/Imperial conversion uses existing unit-conversion.ts convertAmount() with metric/imperial mappings
- Category tag colors derived from existing colors theme: PREP=amber, GRILLING=red, SIMMERING=blue, BAKING=orange, MIXING=green, default=gray

### Claude's Discretion
- Animation transitions between steps
- Exact sizing and spacing of UI elements
- Error handling for missing recipe data
- Timer integration with the redesigned layout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/cooking/CookingMode.tsx` (281 lines) — main component with step navigation, unit toggle, sidebar
- `src/components/cooking/CookingProgress.tsx` (81 lines) — progress bar component
- `src/components/cooking/StepCard.tsx` — individual step rendering
- `src/components/cooking/UnitToggle.tsx` — metric/imperial toggle
- `src/components/cooking/IngredientSidebar.tsx` — full ingredient list sidebar
- `src/components/cooking/CookingTimer.tsx` (165 lines) — step timers
- `src/lib/unit-conversion.ts` (134 lines) — has convertAmount(), UnitSystem type, metric/imperial mappings

### Established Patterns
- State management via useState hooks (not Zustand) for local cooking state
- AsyncStorage for persisting unit preference
- expo-haptics for navigation feedback
- SafeAreaView with insets for proper layout
- Recipe type from database.ts with InstructionStep[] and Ingredient[]

### Integration Points
- CookingMode is opened from recipe detail view via `onCookComplete` callback
- InstructionStep type: { step_number, text, timers?: Array<{ duration_seconds, label }> }
- Ingredient type: { name, quantity, unit, category?, notes? }
- Recipe has image_url for hero photo

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
