# Phase 8: Enhanced AI & Cooking Mode - Research

**Researched:** 2026-03-25
**Domain:** AI recipe extraction (JSON-LD, OpenAI), AI meal generation, fullscreen cooking mode UI with timers
**Confidence:** HIGH

## Summary

Phase 8 has two distinct halves: (1) making the existing `parse-recipe-url` Edge Function smarter and cheaper by extracting JSON-LD/schema.org structured data before falling back to the LLM, plus a new `generate-meal` Edge Function for context-aware meal suggestions; and (2) a new fullscreen cooking mode UI with step-by-step navigation and embedded countdown timers. Both halves build on solid existing infrastructure -- the Edge Function already uses gpt-5-mini with structured outputs, rate limiting, and caching (Phase 5), and the recipe detail screen already renders instructions step-by-step.

The JSON-LD extraction is the highest-value, lowest-risk change: approximately 80% of recipe websites embed `<script type="application/ld+json">` blocks containing the full recipe in schema.org format. Parsing this first eliminates LLM costs for the majority of imports. The schema.org `Recipe` type includes `image`, `nutrition` (NutritionInformation), `recipeIngredient`, `recipeInstructions` (as HowToStep objects), `cookTime`/`prepTime` as ISO 8601 durations, and `suitableForDiet`. This is also where timer durations come from -- the AI should parse natural language time references in instruction text and annotate each step with timer data during extraction.

The cooking mode is a new fullscreen screen (not a modal) accessible from the recipe detail page. It shows one instruction step at a time with horizontal pagination, a progress bar, and embedded tappable countdown timers for steps that mention time durations. Unit conversion (metric/imperial) applies to both the ingredient sidebar and inline measurements in instruction text. No new npm packages are needed -- `useRef` + `setInterval` for countdown timers, `react-native-reanimated` (already installed) for step transition animations, and the existing design system tokens for all styling.

**Primary recommendation:** Split into two plans -- Plan 1 handles all AI/Edge Function work (JSON-LD extraction, nutrition/image fields, generate-meal function, timer duration parsing), Plan 2 handles the cooking mode UI (fullscreen screen, step navigation, timers, unit conversion). This decouples backend from frontend and allows Plan 1 to ship value independently.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-04 | Recipe extraction tries JSON-LD/schema.org structured data first, falls back to LLM only when missing | JSON-LD parsing from `<script type="application/ld+json">` tags; schema.org Recipe type maps directly to existing data model |
| AI-05 | AI extracts recipe images and nutrition info from source URLs when available | schema.org Recipe has `image` (URL/ImageObject) and `nutrition` (NutritionInformation with calories, fat, protein, etc.) |
| AI-06 | AI-powered meal generator suggests recipes based on dietary prefs, cooking history, leftovers, and budget | New `generate-meal` Edge Function; dietary prefs from AsyncStorage `dietary_preferences`; history from `meal_plans` + `recipes` tables; leftovers from `leftovers` table; budget from `expenses` + `budget_settings` tables |
| COOK-01 | User can enter fullscreen step-by-step cooking mode from recipe detail showing one instruction per screen | New `app/(app)/recipe/cook/[id].tsx` route; launched from recipe detail bottom bar; fullscreen with status bar hidden |
| COOK-02 | Cooking mode has step pagination, step indicator, and progress bar | Horizontal swipe or prev/next arrows; "Step X of Y" text; linear progress bar at top |
| COOK-03 | Steps with time references show embedded tappable countdown timers (start/pause/reset) | Timer data parsed during AI extraction (COOK-05); `useRef` + `setInterval` countdown; haptic feedback on timer events |
| COOK-04 | User can toggle between metric and imperial units for ingredients and instruction text | Pure utility functions for unit conversion; toggle persisted to AsyncStorage; applies to both ingredients panel and inline text |
| COOK-05 | AI extraction parses time durations from instruction text to auto-generate timer data for cooking mode | Extend structured output schema to include `timers` array per instruction step; AI parses "simmer for 20 minutes" into `{ duration_seconds: 1200, label: "Simmer" }` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenAI API (gpt-5-mini) | current | Recipe extraction + meal generation | Already in use via Edge Functions; structured outputs for guaranteed schema compliance |
| Supabase Edge Functions (Deno) | current | Server-side AI orchestration | Existing pattern; all AI calls route through Edge Functions |
| react-native-reanimated | 4.2.1 | Step transition animations | Already installed; used throughout app for animations |
| expo-haptics | 55.0.9 | Timer feedback (completion, start) | Already installed; used in recipe detail for interactions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting in meal history | Already installed; used throughout app |
| AsyncStorage | 2.2.0 | Persist unit preference (metric/imperial) | Already installed; used for dietary prefs and settings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom ISO 8601 parser | iso8601-duration npm | Overkill -- schema.org durations are simple PT##H##M##S; a 10-line regex suffices for Deno Edge Function |
| react-native-timer-picker | Custom useCountdown hook | No new dependency needed; countdown is 15 lines with useRef + setInterval |
| FlatList horizontal for steps | ScrollView with paging | FlatList is better for large step counts (lazy rendering); use FlatList with `pagingEnabled` |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  parse-recipe-url/
    index.ts              # Modified: JSON-LD extraction before LLM, extended schema with timers + nutrition + image
  generate-meal/
    index.ts              # NEW: context-aware meal suggestion Edge Function

supabase/migrations/
  00014_add_recipe_nutrition.sql   # NEW: Add nutrition_info, timer_data columns to recipes table

src/
  lib/
    jsonld.ts             # NEW: JSON-LD parsing utilities (shared between Edge Function server-side, but types shared)
    unit-conversion.ts    # NEW: Metric/imperial conversion utilities
    timer.ts              # NEW: Countdown timer hook and duration parsing
  components/
    cooking/
      CookingMode.tsx     # NEW: Main fullscreen cooking mode container
      StepCard.tsx         # NEW: Single instruction step display
      CookingTimer.tsx     # NEW: Countdown timer component (start/pause/reset)
      CookingProgress.tsx  # NEW: Progress bar + step indicator
      IngredientSidebar.tsx # NEW: Collapsible ingredient reference panel
  types/
    database.ts           # MODIFIED: Add nutrition_info, timer_data to Recipe type

app/(app)/
  recipe/
    cook/
      [id].tsx            # NEW: Cooking mode screen route
```

### Pattern 1: JSON-LD Extraction Before LLM Fallback
**What:** Parse `<script type="application/ld+json">` tags from fetched HTML, look for `@type: "Recipe"`, map schema.org fields to app schema. Only call OpenAI if JSON-LD is missing or incomplete.
**When to use:** Every recipe URL import.
**Example:**
```typescript
// In parse-recipe-url Edge Function
function extractJsonLd(html: string): SchemaOrgRecipe | null {
  // Match all JSON-LD script blocks
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Handle both single object and @graph array
      const recipes = findRecipeObjects(data);
      if (recipes.length > 0) return recipes[0];
    } catch { continue; }
  }
  return null;
}

function findRecipeObjects(data: any): SchemaOrgRecipe[] {
  if (Array.isArray(data)) return data.flatMap(findRecipeObjects);
  if (data?.['@graph']) return findRecipeObjects(data['@graph']);
  if (data?.['@type'] === 'Recipe' ||
      (Array.isArray(data?.['@type']) && data['@type'].includes('Recipe'))) {
    return [data as SchemaOrgRecipe];
  }
  return [];
}
```

### Pattern 2: Timer Duration Parsing from Instruction Text
**What:** During AI extraction (both JSON-LD and LLM paths), parse time references from instruction text and attach timer metadata to each step.
**When to use:** Every recipe extraction, as part of the structured output schema.
**Example:**
```typescript
// Extended instruction step type
interface InstructionStepWithTimers {
  step_number: number;
  text: string;
  timers: Array<{
    duration_seconds: number;
    label: string;   // e.g., "Simmer", "Rest", "Bake"
  }>;
}

// For JSON-LD path: parse ISO 8601 durations from HowToStep
function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         (parseInt(match[3] || '0'));
}

// For LLM path: extend the structured output schema to include timers
// The AI will parse "simmer for 20 minutes" => { duration_seconds: 1200, label: "Simmer" }
```

### Pattern 3: Fullscreen Cooking Mode with Horizontal Pagination
**What:** FlatList with `pagingEnabled` and `horizontal` for step-by-step navigation. One step per screen width. Progress bar updates via `onViewableItemsChanged`.
**When to use:** Cooking mode screen.
**Example:**
```typescript
// Cooking mode uses FlatList horizontal paging
<FlatList
  ref={flatListRef}
  data={recipe.instructions}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onViewableItemsChanged={({ viewableItems }) => {
    if (viewableItems[0]) setCurrentStep(viewableItems[0].index ?? 0);
  }}
  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
  renderItem={({ item }) => (
    <StepCard
      step={item}
      width={screenWidth}
      unitSystem={unitSystem}
    />
  )}
/>
```

### Pattern 4: Unit Conversion Utility
**What:** Pure functions to convert between metric and imperial units for common cooking measurements. Applied to both ingredient amounts and inline text in instructions.
**When to use:** Cooking mode and optionally recipe detail.
**Example:**
```typescript
const CONVERSIONS: Record<string, { metric: string; imperial: string; factor: number }> = {
  'cup': { metric: 'ml', imperial: 'cup', factor: 236.588 },
  'tbsp': { metric: 'ml', imperial: 'tbsp', factor: 14.787 },
  'tsp': { metric: 'ml', imperial: 'tsp', factor: 4.929 },
  'oz': { metric: 'g', imperial: 'oz', factor: 28.3495 },
  'lb': { metric: 'kg', imperial: 'lb', factor: 0.453592 },
  'ml': { metric: 'ml', imperial: 'fl oz', factor: 1 / 29.5735 },
  'g': { metric: 'g', imperial: 'oz', factor: 1 / 28.3495 },
  'kg': { metric: 'kg', imperial: 'lb', factor: 2.20462 },
};

type UnitSystem = 'metric' | 'imperial';

function convertUnit(amount: number, unit: string, to: UnitSystem): { amount: number; unit: string } {
  // ... round to sensible precision
}
```

### Anti-Patterns to Avoid
- **Calling OpenAI when JSON-LD has complete data:** Always check JSON-LD first. If it has name, ingredients, and instructions, skip LLM entirely. Only fall back for incomplete or missing structured data.
- **Running timers in background with setInterval only:** iOS will suspend timers when the app backgrounds. Store timer start time + duration, and on foreground, compute remaining time from `Date.now() - startTime`. Use `AppState` listener.
- **Parsing timers client-side from instruction text:** Timer data should be parsed during extraction (server-side) and stored with the recipe, not re-parsed on every render.
- **Blocking recipe import on nutrition data:** Nutrition info is a bonus, not a requirement. If JSON-LD has it, include it; if not, leave null. Never fail an import because nutrition is missing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD parsing | Full RDF/linked-data parser | Simple regex + JSON.parse for `<script>` tags | Recipe JSON-LD is always in `<script>` tags; no need for full RDF parsing |
| ISO 8601 duration parsing | Full ISO 8601 library | 3-line regex for PT##H##M##S format | Schema.org recipe durations are always simple PT format |
| Recipe structured data format | Custom schema | schema.org Recipe type mapping | Industry standard; all recipe sites use it |
| Countdown timer state | Custom timer state machine | useRef + setInterval with AppState awareness | Standard React Native pattern; 20 lines total |

**Key insight:** The schema.org Recipe type maps almost 1:1 to the existing `Recipe` database type. The JSON-LD extraction is primarily a field-mapping exercise, not a parsing challenge. The only fields that require real transformation are ISO 8601 durations (PT30M -> 30 minutes) and `recipeInstructions` (HowToStep objects -> InstructionStep array).

## Common Pitfalls

### Pitfall 1: JSON-LD Nested in @graph Arrays
**What goes wrong:** Many recipe sites wrap their JSON-LD in a `@graph` array alongside other schema.org objects (Organization, WebPage, etc.). Naive parsing looks for `@type: "Recipe"` at the top level and misses the actual recipe.
**Why it happens:** WordPress SEO plugins (Yoast, Rank Math) generate `@graph`-wrapped JSON-LD.
**How to avoid:** Recursively search for Recipe objects within `@graph` arrays and plain arrays. The `findRecipeObjects` function above handles this.
**Warning signs:** JSON-LD script tag found but no recipe extracted; test with WordPress recipe sites.

### Pitfall 2: Timer State Lost on App Background
**What goes wrong:** `setInterval` timers pause when iOS suspends the app. User returns and timer shows stale remaining time.
**Why it happens:** iOS JavaScript timer suspension for battery optimization.
**How to avoid:** Store `{ startedAt: Date.now(), durationMs: number, pausedAt: number | null }` in state. On AppState 'active' event, recalculate remaining time from wall clock. Play a local notification when timer would expire (even if app is backgrounded).
**Warning signs:** Timer displays wrong time after switching to another app.

### Pitfall 3: Instruction Text Unit Conversion Breaks Formatting
**What goes wrong:** Regex-based unit replacement in instruction text creates awkward phrases like "add 236.588ml of flour" instead of "add 1 cup of flour".
**Why it happens:** Naive search-and-replace without rounding or context awareness.
**How to avoid:** Apply smart rounding (e.g., 236.588ml -> 240ml or "1 cup"), and only convert amounts that appear with recognized units. Leave ambiguous text alone.
**Warning signs:** Nonsensical measurements in converted instruction text.

### Pitfall 4: Generate-Meal Function Cold Start Timeout
**What goes wrong:** The `generate-meal` Edge Function gathers data from 4+ tables (meal_plans, recipes, leftovers, expenses, budget_settings, dietary prefs) plus calls OpenAI. Total latency can exceed Supabase Edge Function timeout.
**Why it happens:** Sequential database queries + OpenAI API latency.
**How to avoid:** Run all Supabase queries in `Promise.all()` before calling OpenAI. Keep the prompt concise -- send summaries, not full records. Set a 25-second timeout on the OpenAI call.
**Warning signs:** 504 Gateway Timeout errors from Edge Function.

### Pitfall 5: Schema.org recipeInstructions Format Variations
**What goes wrong:** `recipeInstructions` can be a plain string, an array of strings, an array of HowToStep objects, or an array of HowToSection objects containing HowToStep arrays.
**Why it happens:** schema.org allows multiple formats; different recipe plugins generate different structures.
**How to avoid:** Handle all four variations in the extraction code. Normalize to the app's `InstructionStep[]` format regardless of input shape.
**Warning signs:** Instructions missing or all collapsed into a single step.

## Code Examples

### JSON-LD to App Recipe Mapping
```typescript
// Source: schema.org Recipe type + existing app schema
interface SchemaOrgRecipe {
  '@type': 'Recipe' | string[];
  name: string;
  image?: string | string[] | { '@type': 'ImageObject'; url: string }[];
  recipeIngredient?: string[];
  recipeInstructions?: string | string[] | HowToStep[] | HowToSection[];
  cookTime?: string;    // ISO 8601: "PT30M"
  prepTime?: string;    // ISO 8601: "PT15M"
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  nutrition?: {
    '@type': 'NutritionInformation';
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
    sugarContent?: string;
  };
}

function mapSchemaOrgToRecipe(schema: SchemaOrgRecipe): Partial<RecipeInsert> {
  return {
    name: schema.name,
    image_url: extractImageUrl(schema.image),
    prep_time_minutes: schema.prepTime ? Math.round(parseIsoDuration(schema.prepTime) / 60) : null,
    cook_time_minutes: schema.cookTime ? Math.round(parseIsoDuration(schema.cookTime) / 60) : null,
    servings: parseServings(schema.recipeYield) ?? 4,
    category: Array.isArray(schema.recipeCategory) ? schema.recipeCategory[0] : schema.recipeCategory ?? null,
    ingredients: parseSchemaIngredients(schema.recipeIngredient ?? []),
    instructions: parseSchemaInstructions(schema.recipeInstructions),
    nutrition_info: schema.nutrition ? mapNutrition(schema.nutrition) : null,
  };
}
```

### Countdown Timer Hook
```typescript
// Source: standard React Native timer pattern
function useCountdown(durationSeconds: number) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setRemaining(durationSeconds);
    startTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning || !startTimeRef.current) return;
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);
      if (left === 0) {
        clearInterval(intervalRef.current!);
        setIsRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 250); // Update 4x/sec for smooth display
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, durationSeconds]);

  // Handle app foregrounding -- recalculate from wall clock
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isRunning && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const left = Math.max(0, durationSeconds - elapsed);
        setRemaining(left);
        if (left === 0) { setIsRunning(false); }
      }
    });
    return () => sub.remove();
  }, [isRunning, durationSeconds]);

  return { remaining, isRunning, start, pause, reset };
}
```

### Generate-Meal Edge Function Context Gathering
```typescript
// Source: existing Edge Function patterns from parse-recipe-url
// Gather all context in parallel, then send to OpenAI
const [
  { data: recentMeals },
  { data: recipes },
  { data: leftovers },
  { data: expenses },
  { data: budgetSettings },
] = await Promise.all([
  supabaseAdmin.from('meal_plans')
    .select('recipe_id, plan_date, recipes(name, category, tags)')
    .eq('household_id', householdId)
    .gte('plan_date', thirtyDaysAgo)
    .order('plan_date', { ascending: false })
    .limit(30),
  supabaseAdmin.from('recipes')
    .select('id, name, category, tags, estimated_cost, servings')
    .eq('household_id', householdId),
  supabaseAdmin.from('leftovers')
    .select('name, portions, use_by_date, status')
    .eq('household_id', householdId)
    .gt('portions', 0),
  supabaseAdmin.from('expenses')
    .select('amount')
    .eq('household_id', householdId)
    .gte('expense_date', monthStart),
  supabaseAdmin.from('budget_settings')
    .select('monthly_target')
    .eq('household_id', householdId)
    .maybeSingle(),
]);

const monthlySpent = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
const monthlyBudget = budgetSettings?.monthly_target ?? 0;
const remainingBudget = Math.max(0, monthlyBudget - monthlySpent);
```

## Database Changes

### New Columns on `recipes` Table
```sql
-- Migration: 00014_add_recipe_nutrition_and_timers.sql
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS nutrition_info jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_image_url text DEFAULT NULL;

-- Update instructions column documentation: each instruction step may now include
-- a "timers" array: [{ duration_seconds: number, label: string }]
-- This is stored within the existing JSONB instructions column, no schema change needed
-- for timers since instructions is already JSONB.

COMMENT ON COLUMN recipes.nutrition_info IS 'Nutrition data extracted from source URL (calories, protein, fat, carbs, etc.)';
COMMENT ON COLUMN recipes.source_image_url IS 'Original image URL from source recipe page';
```

### New Table: `meal_generation_log`
```sql
-- Migration: 00015_create_meal_generation_log.sql
CREATE TABLE IF NOT EXISTS meal_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  prompt_context jsonb NOT NULL,
  suggestions jsonb NOT NULL,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generation log"
  ON meal_generation_log FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role can insert (Edge Function)
CREATE POLICY "Service role can insert generation log"
  ON meal_generation_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_meal_gen_log_user ON meal_generation_log(user_id, created_at DESC);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Always send HTML to LLM | Extract JSON-LD first, LLM fallback | Standard practice | ~80% of recipe sites have JSON-LD; eliminates LLM cost for majority |
| response_format: json_object | response_format: json_schema (strict) | Phase 5 (already done) | Guaranteed schema compliance |
| gpt-4o-mini | gpt-5-mini | Phase 5 (already done) | 400K context, structured outputs, comparable pricing |
| Store timers in client state | Parse during extraction, store with recipe | This phase | Timer data persists; no re-parsing on every view |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo 55.0.11 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=tests/ --passWithNoTests` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-04 | JSON-LD extraction before LLM fallback | unit | `npx jest tests/lib/jsonld.test.ts -x` | Wave 0 |
| AI-05 | Extract images and nutrition from source URLs | unit | `npx jest tests/lib/jsonld.test.ts -x` | Wave 0 |
| AI-06 | Meal generator context gathering + prompt | unit | `npx jest tests/lib/meal-generator.test.ts -x` | Wave 0 |
| COOK-01 | Cooking mode renders from recipe data | component | `npx jest tests/components/CookingMode.test.tsx -x` | Wave 0 |
| COOK-02 | Step pagination and progress indicator | component | `npx jest tests/components/CookingMode.test.tsx -x` | Wave 0 |
| COOK-03 | Countdown timer start/pause/reset | unit | `npx jest tests/lib/timer.test.ts -x` | Wave 0 |
| COOK-04 | Unit conversion metric/imperial | unit | `npx jest tests/lib/unit-conversion.test.ts -x` | Wave 0 |
| COOK-05 | Timer duration parsing from instruction text | unit | `npx jest tests/lib/jsonld.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=tests/ --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/jsonld.test.ts` -- covers AI-04, AI-05, COOK-05 (JSON-LD parsing, nutrition extraction, timer parsing)
- [ ] `tests/lib/unit-conversion.test.ts` -- covers COOK-04 (metric/imperial conversion)
- [ ] `tests/lib/timer.test.ts` -- covers COOK-03 (countdown hook logic)
- [ ] `tests/lib/meal-generator.test.ts` -- covers AI-06 (context building, prompt construction)
- [ ] `tests/components/CookingMode.test.tsx` -- covers COOK-01, COOK-02 (cooking mode UI rendering)

## Open Questions

1. **Dietary preferences storage location**
   - What we know: Dietary preferences are stored in AsyncStorage under `dietary_preferences` key (confirmed in profile.tsx, line 69). Available options: Vegetarian, Gluten-Free, Dairy-Free, Keto, Nut-Free, Vegan.
   - What's unclear: The `generate-meal` Edge Function runs server-side and cannot access AsyncStorage. The dietary preferences must be sent as a parameter in the request body from the client.
   - Recommendation: Client reads AsyncStorage and includes dietary prefs in the generate-meal API call body. No database migration needed -- keep preferences client-side for simplicity.

2. **Timer completion notification when app is backgrounded**
   - What we know: expo-notifications is already installed. Local notifications can be scheduled for timer completion.
   - What's unclear: Whether to schedule a local notification at timer start (so user gets alerted even if app is suspended).
   - Recommendation: Schedule a local notification when a cooking timer starts, cancel it if timer is manually stopped. This is a 3-line addition using the existing notification infrastructure.

3. **How many meal suggestions per generation**
   - What we know: The existing "Surprise Me" feature returns 1 random recipe + 3 alternatives.
   - Recommendation: Generate-meal returns 3 suggestions, each with name, description, estimated cost, estimated time, and a flag for whether it uses existing leftovers. User can pick one to add to their plan or request more.

## Sources

### Primary (HIGH confidence)
- [schema.org/Recipe](https://schema.org/Recipe) -- Recipe type properties: image, nutrition, cookTime, prepTime, recipeInstructions, recipeIngredient
- [Google Recipe Schema Markup](https://developers.google.com/search/docs/appearance/structured-data/recipe) -- Expected JSON-LD structure for recipes
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts` -- Current Edge Function architecture, structured outputs, caching
- Existing codebase: `app/(app)/recipe/[id].tsx` -- Recipe detail screen (560 lines), instructions rendering, bottom bar actions
- Existing codebase: `app/(app)/(tabs)/profile.tsx` -- Dietary preferences (AsyncStorage `dietary_preferences`)
- Existing codebase: `src/types/database.ts` -- Recipe type, InstructionStep type, Ingredient type

### Secondary (MEDIUM confidence)
- [ISO 8601 Duration parsing](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/parse-iso8601-duration-javascript) -- PT##H##M##S regex parsing pattern
- [JSON-LD Recipe examples](https://jsonld.com/recipe/) -- Common JSON-LD recipe format examples

### Tertiary (LOW confidence)
- "~80% of recipe sites have JSON-LD" -- frequently cited statistic in SEO/recipe communities; exact percentage varies by sample

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new packages; all existing infrastructure
- Architecture: HIGH -- JSON-LD extraction is well-understood; cooking mode is straightforward FlatList pagination
- Pitfalls: HIGH -- JSON-LD format variations documented from schema.org spec; timer backgrounding is well-known iOS behavior

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain; schema.org Recipe hasn't changed in years)
