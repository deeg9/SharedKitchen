# Phase 50: Cooking Mode Redesign - Research

**Researched:** 2026-04-11
**Domain:** React Native UI redesign (Expo, step-by-step cooking flow)
**Confidence:** HIGH

## Summary

This phase redesigns the existing cooking mode components (~940 lines across 6 files) to add a fixed hero image header, expanded step categorization, per-step ingredient display, and layout adjustments to match the UI-SPEC. The existing codebase already has most of the building blocks: step navigation with haptics, segmented progress bar, unit toggle with AsyncStorage persistence, ingredient sidebar, timers, and unit conversion. The work is primarily restructuring layout and expanding the category/badge system.

The most significant changes are: (1) moving the hero image from inside the scrollable StepCard to a fixed header band in CookingMode, (2) expanding `deriveStepType` from 3 categories to 7, (3) adding an empty-state message for steps with no matched ingredients, and (4) adjusting spacing/sizing to match the UI-SPEC contract.

**Primary recommendation:** Modify the 3 existing components (CookingMode, StepCard, CookingProgress) in-place rather than creating new components. The existing architecture is sound and the changes are additive.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed header band (~180px) with recipe hero photo, persistent at top of each step, step content scrolls beneath
- Colored pill badge above step text for category tag (e.g., "PREP" in amber, "GRILLING" in red)
- Ingredient chips displayed below step text showing only ingredients referenced in that step with amounts
- Steps with no matched ingredients show "No ingredients for this step" placeholder
- Horizontal pill segments progress bar -- each step is a segment, filled = completed, current = highlighted
- Bottom fixed bar with Previous / Ingredients / Next Step buttons. "Next Step" is primary, others secondary
- On last step, "Next Step" changes to green "Done Cooking" button triggering onCookComplete callback
- Metric/Imperial toggle persistent via AsyncStorage (UNIT_PREF_KEY), positioned in header bar
- Categories derived via keyword matching: chop/dice/mince -> PREP, grill/sear/char -> GRILLING, simmer/boil/reduce -> SIMMERING, bake/roast -> BAKING, mix/combine/whisk -> MIXING, marinat* -> MARINATING, default -> COOK
- Per-step ingredients matched via text matching -- scan step text for ingredient names, match by name substring
- Category tag colors from existing theme: PREP=amber, GRILLING=red, SIMMERING=blue, BAKING=orange, MIXING=green, default=gray

### Claude's Discretion
- Animation transitions between steps
- Exact sizing and spacing of UI elements (guided by UI-SPEC)
- Error handling for missing recipe data
- Timer integration with the redesigned layout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COOK-R01 | Cooking mode displays recipe hero image at top of each step | Hero image moves from StepCard scroll area to fixed header band in CookingMode. Image component (expo-image) already used in StepCard. |
| COOK-R02 | Each step shows a category tag derived from step content | Expand existing `deriveStepType()` in StepCard from 3 types to 7 types. Add GRILLING, SIMMERING, BAKING, MIXING. Update BADGE_STYLES map. |
| COOK-R03 | Each step shows only ingredients relevant to that step | Already implemented: `getStepIngredients()` in CookingMode does substring matching. Ingredient chips render in StepCard. Add empty-state text. |
| COOK-R04 | Segmented progress bar showing current step position | Already implemented in CookingProgress. Minor adjustment: segment gap from 2px to 4px per UI-SPEC. |
| COOK-R05 | Bottom navigation: Previous / Ingredients / Next Step | Already implemented in CookingMode. Verify sizing matches UI-SPEC (24px horizontal padding on Next, 16px vertical). |
| COOK-R06 | Metric/Imperial toggle converts ingredient amounts | Already implemented: UnitToggle + AsyncStorage + convertUnit/convertIngredient in unit-conversion.ts. Position in header near close button. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| react-native | UI framework | Project foundation [VERIFIED: codebase] |
| expo-image | Image rendering with transitions | Already used in StepCard for hero photo [VERIFIED: StepCard.tsx line 3] |
| expo-haptics | Navigation feedback | Already used in CookingMode [VERIFIED: CookingMode.tsx line 7] |
| @react-native-async-storage/async-storage | Unit pref persistence | Already used for UNIT_PREF_KEY [VERIFIED: CookingMode.tsx line 8] |
| @expo/vector-icons | Icons (MaterialCommunityIcons) | Already used throughout [VERIFIED: CookingMode.tsx line 6] |

### Supporting (already in project)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| react-native-safe-area-context | Safe area insets | Header/bottom nav padding [VERIFIED: CookingMode.tsx line 9] |
| expo-notifications | Timer completion alerts | Used by CookingTimer [VERIFIED: CookingTimer.tsx line 4] |

No new dependencies needed. This phase is pure UI restructuring using existing libraries.

## Architecture Patterns

### Current Component Structure (no change)
```
src/components/cooking/
  CookingMode.tsx        # Main container -- MODIFY (layout restructure)
  CookingProgress.tsx    # Segmented bar -- MODIFY (gap tweak)
  StepCard.tsx           # Step rendering -- MODIFY (category expansion, layout)
  UnitToggle.tsx         # Unit switcher -- NO CHANGE
  IngredientSidebar.tsx  # Full list overlay -- NO CHANGE
  CookingTimer.tsx       # Timer card -- NO CHANGE
```

### Pattern 1: Fixed Header + Scrollable Content
**What:** Move the hero Image out of StepCard (which is inside ScrollView) into a fixed View in CookingMode above the ScrollView.
**When to use:** When an element must remain visible while content scrolls.
**Current state:** Image is inside StepCard inside ScrollView -- it scrolls away. [VERIFIED: StepCard.tsx line 79-84, CookingMode.tsx line 125-141]

```typescript
// Source: [VERIFIED: existing CookingMode.tsx pattern]
// NEW layout structure in CookingMode:
<View style={{ flex: 1, paddingTop: insets.top }}>
  {/* Header: close + unit toggle */}
  <View style={headerStyles}>...</View>
  
  {/* Fixed hero image band -- NOT in ScrollView */}
  <Image source={{ uri: imageUrl }} style={{ height: 180, width: '100%' }} contentFit="cover" transition={200} />
  
  {/* Progress bar */}
  <CookingProgress ... />
  
  {/* Scrollable step content */}
  <ScrollView style={{ flex: 1 }} key={`step-${currentStep}`}>
    <StepCard ... />  {/* No longer renders the image */}
  </ScrollView>
  
  {/* Fixed bottom nav */}
  <View style={bottomNavStyles}>...</View>
</View>
```

### Pattern 2: Keyword-Based Step Categorization
**What:** Expand `deriveStepType()` from 3 categories to 7 with corresponding badge colors.
**Current state:** Only MARINATING, PREP, COOKING exist. [VERIFIED: StepCard.tsx lines 23-42]

```typescript
// Source: [VERIFIED: 50-CONTEXT.md decisions + 50-UI-SPEC.md interaction contract]
type StepType = 'PREP' | 'GRILLING' | 'SIMMERING' | 'BAKING' | 'MIXING' | 'MARINATING' | 'COOK';

function deriveStepType(text: string): StepType {
  const lower = text.toLowerCase();
  if (lower.includes('marinat')) return 'MARINATING';
  if (/chop|dice|mince|slice|peel|wash|rinse|measure|prep/.test(lower)) return 'PREP';
  if (/grill|sear|char/.test(lower)) return 'GRILLING';
  if (/simmer|boil|reduce/.test(lower)) return 'SIMMERING';
  if (/bake|roast/.test(lower)) return 'BAKING';
  if (/mix|combine|whisk/.test(lower)) return 'MIXING';
  return 'COOK';
}
```

### Pattern 3: Per-Step Ingredient Matching
**What:** Already implemented in CookingMode.getStepIngredients(). Substring match with min 3 char names.
**Current state:** Fully working. [VERIFIED: CookingMode.tsx lines 84-93]
**Enhancement needed:** Add empty-state rendering in StepCard when `ingredients` array is empty.

### Anti-Patterns to Avoid
- **Moving ingredient matching logic into StepCard:** Keep it in CookingMode (parent) where it has access to all ingredients. StepCard just renders what it receives. [VERIFIED: current pattern is correct]
- **Creating new component files:** The existing 6-file structure is sufficient. Adding more components for this scope adds unnecessary indirection.
- **Using Animated API for step transitions:** The existing `key={step-${currentStep}}` pattern on ScrollView forces a remount which is simple and effective. Adding Animated transitions is discretionary and should be minimal (e.g., opacity fade) if done at all.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unit conversion | Custom conversion logic | Existing `convertUnit()`, `convertIngredient()`, `convertInstructionText()` in unit-conversion.ts | Already handles metric/imperial with smart rounding [VERIFIED: unit-conversion.ts] |
| Default images | Image URL resolution | Existing `getDefaultRecipeImage()` in lib/images.ts | Category-seeded placeholder selection [VERIFIED: images.ts] |
| Safe area handling | Manual inset calculations | `useSafeAreaInsets()` from react-native-safe-area-context | Already used in CookingMode [VERIFIED: CookingMode.tsx] |
| Timer notifications | Custom notification scheduling | Existing CookingTimer component | Full start/pause/reset + expo-notifications [VERIFIED: CookingTimer.tsx] |

## Common Pitfalls

### Pitfall 1: SIMMERING Badge Color Mismatch
**What goes wrong:** The UI-SPEC specifies SIMMERING uses `tertiaryContainer` (#d0e4ff blue) and `tertiary` (#00497e blue), but the ACTUAL theme tokens are `tertiaryContainer: '#535b4c'` (dark green) and `tertiary: '#3b4436'` (dark green). These are NOT blue.
**Why it happens:** The UI-SPEC assumed tertiary was blue, but the actual Culinary Curator theme uses green-toned tertiaries. [VERIFIED: colors.ts lines 23-26 vs UI-SPEC lines 87-88]
**How to avoid:** Use hardcoded hex values for SIMMERING badge (`#d0e4ff` bg, `#00497e` text) since no existing theme token maps to blue. Alternatively, add new color tokens. The UI-SPEC's intent (blue for simmering/water) is clear even though it cited wrong token names.
**Warning signs:** Badge looks dark green instead of blue during visual review.

### Pitfall 2: Image in ScrollView vs Fixed Header
**What goes wrong:** If the Image stays inside StepCard (which is in ScrollView), it scrolls away instead of staying fixed at top.
**Why it happens:** Current StepCard renders the image at line 79. Moving it to CookingMode's fixed area requires removing it from StepCard AND adding it above the ScrollView.
**How to avoid:** Remove the `<Image>` from StepCard entirely. Add it to CookingMode between the header and progress bar. Pass `recipeImageUrl` to CookingMode (it already has `recipe.image_url`).
**Warning signs:** Image disappears when scrolling step content.

### Pitfall 3: Ingredient Display Without Unit Conversion
**What goes wrong:** Per-step ingredients show raw `ing.amount` and `ing.unit` without applying the metric/imperial conversion.
**Why it happens:** Current StepCard renders `{ing.amount} {ing.unit} {ing.name}` directly without calling `convertIngredient()`. [VERIFIED: StepCard.tsx line 122]
**How to avoid:** Apply `convertIngredient(ing, unitSystem)` before rendering each ingredient chip. Pass `unitSystem` to StepCard (already a prop).
**Warning signs:** Switching unit toggle doesn't change per-step ingredient amounts.

### Pitfall 4: Progress Bar Segment Gap
**What goes wrong:** UI-SPEC specifies 4px (xs) segment gap, but current implementation uses `marginRight: 2`. [VERIFIED: CookingProgress.tsx line 78]
**How to avoid:** Update `segmentGap` marginRight from 2 to `spacing.xs` (4).
**Warning signs:** Progress bar segments look too tightly packed.

### Pitfall 5: Previous Button Text Mismatch
**What goes wrong:** Current "Previous" text doesn't match UI-SPEC's "Previous Step" copy.
**Why it happens:** Copy was shortened in original implementation. [VERIFIED: CookingMode.tsx line 159]
**How to avoid:** Update text to "Previous Step" per Copywriting Contract.

## Code Examples

### Expanded Category Badge Styles
```typescript
// Source: [VERIFIED: 50-UI-SPEC.md color table + colors.ts actual values]
const BADGE_STYLES: Record<StepType, { bg: string; text: string }> = {
  PREP: { bg: colors.secondaryFixed, text: colors.secondary },         // amber #ffdcc3 / #904d00
  GRILLING: { bg: colors.errorContainer, text: colors.error },         // red #ffdad6 / #ba1a1a
  SIMMERING: { bg: '#d0e4ff', text: '#00497e' },                      // blue (no theme token)
  BAKING: { bg: colors.secondaryFixed, text: colors.secondary },       // warm orange (same as PREP)
  MIXING: { bg: colors.primaryFixed, text: colors.primary },           // green #d3e8d5 / #334537
  MARINATING: { bg: colors.secondaryFixed, text: colors.secondary },   // amber (existing)
  COOK: { bg: colors.outlineVariant, text: colors.onSurfaceVariant },  // gray #c3c8c1 / #43493f
};
```

### Per-Step Ingredient with Unit Conversion
```typescript
// Source: [VERIFIED: unit-conversion.ts convertIngredient + StepCard.tsx ingredient rendering]
// In StepCard, apply conversion before rendering:
const displayIngredients = useMemo(() => {
  if (!ingredients || ingredients.length === 0) return [];
  return ingredients.map((ing) =>
    unitSystem !== 'imperial' ? convertIngredient(ing, unitSystem) : ing
  );
}, [ingredients, unitSystem]);

// Render:
{displayIngredients.length > 0 ? (
  <View style={s.ingredientList}>
    {displayIngredients.map((ing, i) => (
      <View key={`ing-${i}`} style={s.ingredientRow}>
        <View style={s.ingredientDot} />
        <Text style={s.ingredientText}>
          {ing.amount > 0 ? `${ing.amount} ` : ''}{ing.unit} {ing.name}
        </Text>
      </View>
    ))}
  </View>
) : (
  <Text style={s.emptyIngredients}>No ingredients for this step</Text>
)}
```

### Fixed Hero Image in CookingMode
```typescript
// Source: [VERIFIED: CookingMode.tsx existing layout + UI-SPEC layout contract]
// After header, before progress:
const imageUrl = recipe.image_url || getDefaultRecipeImage(recipe.id, recipe.category);

<Image
  source={{ uri: imageUrl }}
  style={{ width: '100%', height: 180 }}
  contentFit="cover"
  transition={200}
/>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + jest-expo [VERIFIED: jest.config.js] |
| Config file | jest.config.js |
| Quick run command | `npx jest --testPathPattern cooking --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COOK-R01 | Hero image renders at top of each step | unit (component) | `npx jest __tests__/components/CookingMode.test.tsx -x` | No - Wave 0 |
| COOK-R02 | Category tag derived from step text | unit (pure function) | `npx jest __tests__/lib/deriveStepType.test.ts -x` | No - Wave 0 |
| COOK-R03 | Per-step ingredients shown, empty state works | unit (component) | `npx jest __tests__/components/StepCard.test.tsx -x` | No - Wave 0 |
| COOK-R04 | Segmented progress bar with correct gap | unit (component) | `npx jest __tests__/components/CookingProgress.test.tsx -x` | No - Wave 0 |
| COOK-R05 | Bottom nav Previous/Ingredients/Next buttons | unit (component) | `npx jest __tests__/components/CookingMode.test.tsx -x` | No - Wave 0 |
| COOK-R06 | Unit toggle converts ingredient amounts | unit (integration) | `npx jest __tests__/lib/unit-conversion.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern cooking --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before /gsd-verify-work

### Wave 0 Gaps
- [ ] `__tests__/lib/deriveStepType.test.ts` -- covers COOK-R02 (pure function, easy to test)
- [ ] `__tests__/lib/unit-conversion.test.ts` -- covers COOK-R06 (pure function, existing utilities)
- [ ] `__tests__/components/StepCard.test.tsx` -- covers COOK-R01, COOK-R03 (render tests)
- [ ] `__tests__/components/CookingMode.test.tsx` -- covers COOK-R04, COOK-R05 (navigation tests)

## Security Domain

This phase involves no authentication, data storage, or network operations beyond loading a recipe image URL. No ASVS categories apply.

- V2 Authentication: No
- V3 Session Management: No
- V4 Access Control: No
- V5 Input Validation: No (step text is read-only display)
- V6 Cryptography: No

No security concerns for this UI-only phase. [VERIFIED: all changes are client-side rendering of data already loaded]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SIMMERING should use blue hardcoded hex values (#d0e4ff/#00497e) since theme has no blue tokens | Pitfall 1 / Code Examples | Badge color would look wrong; might need to add theme tokens instead |
| A2 | `deriveStepType` can use regex `.test()` for keyword matching without performance concern | Architecture Pattern 2 | Negligible -- function runs once per step change on short strings |

## Open Questions (RESOLVED)

1. **SIMMERING blue color: hardcode or add theme token?** RESOLVED: Hardcode hex values in BADGE_STYLES. Implemented in Plan 50-01 Task 1.
   - What we know: Theme has no blue tokens. UI-SPEC wants blue for SIMMERING. tertiaryContainer is actually dark green.
   - Decision: Hardcode in BADGE_STYLES for now (minimal blast radius). Adding theme tokens is a design system decision beyond this phase.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies -- pure UI component modifications using existing libraries).

## Sources

### Primary (HIGH confidence)
- CookingMode.tsx (281 lines) -- full component structure, navigation logic, ingredient matching
- StepCard.tsx (203 lines) -- current category derivation, badge rendering, ingredient display
- CookingProgress.tsx (82 lines) -- segmented progress bar implementation
- unit-conversion.ts (134 lines) -- convertUnit, convertIngredient, convertInstructionText
- colors.ts (57 lines) -- all theme color tokens, confirmed tertiaryContainer is NOT blue
- spacing.ts (22 lines) -- spacing scale and border radius tokens
- 50-CONTEXT.md -- locked decisions for all implementation choices
- 50-UI-SPEC.md -- full visual/interaction contract

### Secondary (MEDIUM confidence)
- database.ts -- InstructionStep and Ingredient type definitions (confirmed structure)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all libraries already in use
- Architecture: HIGH -- modifying 3 existing components with well-understood patterns
- Pitfalls: HIGH -- identified from direct code comparison against UI-SPEC

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable -- no external dependency changes expected)
