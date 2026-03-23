# Phase 2: Core Features - Research

**Researched:** 2026-03-23
**Domain:** Recipe management, meal planning, grocery lists, Supabase Realtime, AI recipe parsing
**Confidence:** HIGH

## Summary

Phase 2 builds the three core feature pillars of Mise: recipes (browse, detail, create, import), meal planning (weekly calendar with day editing), and grocery lists (auto-generated, real-time synced). The existing Phase 1 foundation provides auth, households, design system tokens, UI components (Button, Card, Input, Avatar, BottomSheet, Skeleton, TabBar), Zustand stores (authStore, householdStore), and the Supabase client with typed database schema. The three tab screens (plan, recipes, grocery) are currently placeholder stubs.

The primary technical challenges are: (1) designing the Supabase schema for recipes, meal plans, and grocery items with proper RLS scoped to households, (2) implementing Supabase Realtime subscriptions for grocery list sync, (3) AI recipe URL parsing via an LLM API (Supabase Edge Function), and (4) translating the Stitch UI mockup designs into React Native components using the established Culinary Curator design system.

**Primary recommendation:** Build data layer first (Supabase migrations + RLS + TypeScript types), then recipe features, then meal planning, then grocery with Realtime -- each building on the prior.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RECP-01 | Searchable 2-column recipe grid with category filter chips | FlashList for performance, Zustand recipeStore with search/filter, existing Card component |
| RECP-02 | Recipe detail with hero image, metadata, ratings, ingredients, instructions, notes | ScrollView-based detail screen, expo-router dynamic route `recipe/[id]` |
| RECP-03 | Scale recipe portions (x1, x2, x3) with ingredient update | Pure computation on ingredient amounts, local state toggle |
| RECP-04 | Rate recipes 1-5 stars | recipe_ratings table, upsert per user per recipe |
| RECP-05 | Add notes to recipes | recipe_notes table scoped to household |
| RECP-06 | Create recipe manually (all fields) | Multi-step form, expo-image-picker for photo, Supabase Storage for images |
| RECP-07 | Import recipe from URL via AI parsing | Supabase Edge Function calling OpenAI/Claude API |
| RECP-08 | Favorite/heart recipes | favorites table or boolean in recipe_ratings, optimistic UI |
| RECP-09 | Add recipe to meal plan from detail page | Bottom sheet with day picker, inserts into meal_plans table |
| AI-01 | AI parses recipe URL into structured data | Edge Function with LLM, structured JSON output |
| PLAN-01 | Weekly dinner calendar with 7 day cards | FlatList/ScrollView of day cards, week date computation |
| PLAN-02 | Navigate between weeks + "Today" pill | Week offset state, date-fns for week boundaries |
| PLAN-03 | Tap day card to open edit bottom sheet | Existing BottomSheet component, recipe picker + cook assignment |
| PLAN-04 | Clear a day's meal plan | Delete from meal_plans table, optimistic removal |
| PLAN-05 | Empty day cards with dashed outline + "Add Dinner" | Dashed border style via borderStyle: 'dashed' |
| PLAN-06 | "Surprise Me" FAB for random dinner suggestion | Random query from recipes, modal overlay per mockup |
| PLAN-07 | Add random suggestion to plan | Insert into meal_plans from suggestion modal |
| GROC-01 | Generate grocery list from week's meal plan | Aggregate ingredients across planned recipes, deduplicate/merge quantities |
| GROC-02 | Items grouped by store section | Category enum on ingredients or grocery items |
| GROC-03 | Each item shows name, quantity/unit, estimated price | Stored per grocery_item row |
| GROC-04 | Check off items with circular checkbox + avatar | Optimistic UI, checked_by user_id, Realtime broadcast |
| GROC-05 | Checked items move to collapsed "Completed" section | FlatList section with collapsible SectionList or manual grouping |
| GROC-06 | Summary bar with count, total, checked, progress | Computed from grocery items state |
| GROC-07 | Manually add items to grocery list | Add item bottom sheet or inline input |
| GROC-08 | Real-time sync via Supabase Realtime | Postgres Changes subscription on grocery_items table |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.100.0 | Database, auth, Realtime, Storage | Already configured, typed client |
| zustand | ^5.0.12 | State management | Already used for authStore, householdStore |
| expo-router | ~55.0.7 | File-based routing | Already configured with tab layout |
| @gorhom/bottom-sheet | ^5.2.8 | Bottom sheets | Already wrapped in src/components/ui/BottomSheet.tsx |
| expo-image-picker | ~55.0.13 | Photo selection for recipes | Already installed and mocked in tests |
| react-native-reanimated | 4.2.1 | Animations | Already installed for BottomSheet |

### New Dependencies Needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Week calculation, date formatting for meal plan calendar | PLAN-01, PLAN-02 date arithmetic |
| @shopify/flash-list | ^1.7.3 | High-performance list rendering | Recipe grid (2-column), grocery list |
| expo-haptics | ~55.0.x | Haptic feedback on checkbox taps | GROC-04 checkbox interactions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns | dayjs | date-fns is tree-shakable, larger ecosystem; dayjs is smaller but less type-safe |
| @shopify/flash-list | FlatList | FlashList handles large recipe lists better; FlatList is fine for < 100 items |
| Supabase Edge Functions | Expo server route | Edge Functions keep API keys server-side and are already in the Supabase ecosystem |

**Installation:**
```bash
npm install date-fns @shopify/flash-list expo-haptics --legacy-peer-deps
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    recipes/          # RecipeCard, RecipeGrid, RecipeForm, IngredientRow, InstructionStep
    plan/             # DayCard, WeekHeader, SurpriseMe, PlanEditSheet
    grocery/          # GroceryItem, GrocerySection, GrocerySummary, AddItemSheet
  stores/
    recipeStore.ts    # Recipes CRUD, search, filter, favorites
    planStore.ts      # Meal plans CRUD, week navigation
    groceryStore.ts   # Grocery list CRUD, Realtime subscription, check-off
  hooks/
    useRecipes.ts     # Convenience hooks wrapping recipeStore
    useMealPlan.ts    # Week computation, plan data
    useGrocerySync.ts # Supabase Realtime subscription lifecycle
  lib/
    supabase.ts       # (existing) Supabase client
    ai.ts             # AI recipe import helper (calls Edge Function)
    dates.ts          # Week boundary helpers using date-fns
    grocery-utils.ts  # Ingredient aggregation, deduplication, section mapping
  types/
    database.ts       # (extend) Add recipes, meal_plans, grocery tables

app/
  (app)/
    (tabs)/
      plan.tsx        # Weekly calendar screen
      recipes.tsx     # Recipe library grid
      grocery.tsx     # Grocery list screen
    recipe/
      [id].tsx        # Recipe detail screen
      add.tsx         # Add/edit recipe form
    plan/
      surprise.tsx    # Random dinner generator modal (or bottom sheet)

supabase/
  migrations/
    00003_create_recipes.sql
    00004_create_meal_plans.sql
    00005_create_grocery_items.sql
  functions/
    parse-recipe-url/ # Edge Function for AI recipe parsing
```

### Pattern 1: Zustand Store with Supabase (established pattern)
**What:** Each feature domain gets a Zustand store that wraps Supabase queries, matching the authStore/householdStore pattern.
**When to use:** All new stores (recipeStore, planStore, groceryStore).
**Example:**
```typescript
// Follow householdStore.ts pattern exactly
interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  activeCategory: string | null;

  fetchRecipes: (householdId: string) => Promise<void>;
  createRecipe: (recipe: RecipeInsert) => Promise<Recipe | null>;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string | null) => void;
  filteredRecipes: () => Recipe[];
}
```

### Pattern 2: Supabase Realtime Subscription
**What:** Subscribe to Postgres Changes on the grocery_items table, scoped to the active household.
**When to use:** GROC-08 - grocery list real-time sync.
**Example:**
```typescript
// In groceryStore or useGrocerySync hook
const channel = supabase
  .channel(`grocery:${householdId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'grocery_items',
      filter: `household_id=eq.${householdId}`,
    },
    (payload) => {
      // Handle INSERT, UPDATE, DELETE
      if (payload.eventType === 'INSERT') {
        addItemToState(payload.new as GroceryItem);
      } else if (payload.eventType === 'UPDATE') {
        updateItemInState(payload.new as GroceryItem);
      } else if (payload.eventType === 'DELETE') {
        removeItemFromState(payload.old.id);
      }
    }
  )
  .subscribe();

// Cleanup on unmount or household switch
return () => { supabase.removeChannel(channel); };
```

### Pattern 3: Optimistic UI Updates
**What:** Update local state immediately, then sync with Supabase, reverting on failure.
**When to use:** Checkbox toggling (GROC-04), favoriting (RECP-08), rating (RECP-04).
**Example:**
```typescript
toggleItem: async (itemId: string, checked: boolean) => {
  const prev = get().items;
  // Optimistic update
  set({ items: prev.map(i => i.id === itemId ? { ...i, is_checked: checked, checked_by: userId } : i) });

  const { error } = await supabase
    .from('grocery_items')
    .update({ is_checked: checked, checked_by: userId, checked_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    set({ items: prev }); // Revert on failure
  }
}
```

### Pattern 4: Expo Router Dynamic Routes
**What:** File-based dynamic routes for recipe detail.
**When to use:** Recipe detail screen at `app/(app)/recipe/[id].tsx`.
**Example:**
```typescript
// app/(app)/recipe/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Fetch recipe by id from store
}
```

### Anti-Patterns to Avoid
- **Fetching in components directly:** Use Zustand stores to manage data fetching, not inline useEffect + supabase calls in screen components.
- **Multiple Realtime channels per table:** Create ONE channel per grocery list, not per item.
- **Unscoped queries:** Every query MUST filter by `household_id` from the householdStore's `activeHouseholdId`. Never show cross-household data.
- **Storing images as base64 in Postgres:** Use Supabase Storage buckets for recipe images, store only the URL path.

## Database Schema

### recipes table
```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- 'Mexican', 'Seafood', 'Chicken', 'Vegetarian', etc.
  image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 4,
  estimated_cost DECIMAL(6,2),
  ingredients JSONB NOT NULL DEFAULT '[]', -- [{amount, unit, name, section}]
  instructions JSONB NOT NULL DEFAULT '[]', -- [{step_number, text}]
  tags TEXT[] DEFAULT '{}', -- 'Spicy', 'Quick', 'Dairy-Free', etc.
  source_url TEXT, -- original URL if imported via AI
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Design decision: JSONB for ingredients and instructions.** Separate tables would add complexity for small recipe data. JSONB keeps queries simple, allows flexible schemas, and the data is always read/written as a whole document. The ingredient type:
```typescript
interface Ingredient {
  amount: number;
  unit: string; // 'lbs', 'cup', 'tbsp', 'qty', etc.
  name: string;
  section?: string; // 'Proteins', 'Produce', 'Dairy & Eggs', 'Pantry'
}
```

### recipe_ratings table
```sql
CREATE TABLE recipe_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);
```

### recipe_notes table
```sql
CREATE TABLE recipe_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### meal_plans table
```sql
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  plan_date DATE NOT NULL,
  assigned_cook UUID REFERENCES profiles(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, plan_date) -- one dinner per day per household
);
```

### grocery_lists table
```sql
CREATE TABLE grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL, -- Monday of the week
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, week_start)
);
```

### grocery_items table
```sql
CREATE TABLE grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grocery_list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT, -- '2 packs', '1.5 lbs', '4 qty'
  estimated_price DECIMAL(6,2),
  section TEXT CHECK (section IN ('Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other')),
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES profiles(id),
  checked_at TIMESTAMPTZ,
  is_manual BOOLEAN DEFAULT false, -- true for manually added items
  source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Supabase Realtime Configuration
Realtime must be enabled on the `grocery_items` table. In the Supabase dashboard: Database > Replication > Enable realtime for `grocery_items`. Alternatively via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
```

### RLS Pattern
All new tables follow the established `is_household_member()` SECURITY DEFINER pattern from Phase 1:
```sql
-- Example for recipes
CREATE POLICY "Household members can view recipes"
  ON recipes FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can update recipes"
  ON recipes FOR UPDATE
  USING (is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can delete recipes"
  ON recipes FOR DELETE
  USING (is_household_member(household_id, auth.uid()));
```

For `grocery_items`, RLS goes through `grocery_lists`:
```sql
CREATE POLICY "Household members can manage grocery items"
  ON grocery_items FOR ALL
  USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE is_household_member(household_id, auth.uid())
    )
  );
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date/week arithmetic | Custom date parsing | date-fns `startOfWeek`, `endOfWeek`, `addWeeks`, `format` | Timezone handling, locale support, edge cases at month/year boundaries |
| Recipe URL scraping | Custom HTML parser | LLM API via Supabase Edge Function | Recipes have wildly varying HTML structures; LLMs handle this much better than regex/DOM parsing |
| Image upload + CDN | Custom file upload pipeline | Supabase Storage with `createSignedUrl` | Already integrated, handles resize/CDN/auth |
| Realtime state sync | WebSocket from scratch | Supabase Realtime Postgres Changes | Built into the client, handles reconnection, auth-scoped |
| List virtualization | Custom windowing | @shopify/flash-list or FlatList | RecyclerListView under the hood, handles 2-column grids |

**Key insight:** The Supabase ecosystem provides Realtime, Storage, and Edge Functions out of the box. Leverage all three rather than building custom infrastructure.

## Common Pitfalls

### Pitfall 1: Realtime Subscription Leaks
**What goes wrong:** Realtime channels not cleaned up on unmount or household switch, leading to duplicate events and memory leaks.
**Why it happens:** React component unmount doesn't automatically clean up Supabase channels.
**How to avoid:** Use a cleanup function in useEffect that calls `supabase.removeChannel(channel)`. When switching households, unsubscribe from old channel before subscribing to new.
**Warning signs:** Grocery items appearing duplicated, stale data from previous household.

### Pitfall 2: RLS Blocking Realtime
**What goes wrong:** Supabase Realtime with Postgres Changes respects RLS. If RLS policies are not set up correctly, users won't receive change events.
**Why it happens:** The Realtime subscription uses the user's auth token, so RLS applies.
**How to avoid:** Verify RLS policies allow SELECT for household members on `grocery_items` (via the grocery_lists join). Test with two authenticated users in the same household.
**Warning signs:** One user checks off items but the other never sees updates.

### Pitfall 3: Ingredient Aggregation Complexity
**What goes wrong:** Generating a grocery list from multiple recipes requires merging "2 cups flour" + "1.5 cups flour" = "3.5 cups flour" across different recipes.
**Why it happens:** Ingredient quantities have different units, partial amounts, and name variations.
**How to avoid:** Normalize ingredient names to lowercase, match by name, only merge when units are identical. For differing units, list separately. Keep it simple for v1 -- exact unit conversion is a v2 feature.
**Warning signs:** Duplicate items in the grocery list with different quantity strings.

### Pitfall 4: Stale Week Data on Navigation
**What goes wrong:** User navigates to a different week, data doesn't refresh. Or navigating back shows old data.
**Why it happens:** Zustand store caches data for one week, doesn't refetch on week change.
**How to avoid:** Make `fetchMealPlan(householdId, weekStart)` the source of truth, called whenever week offset changes. Consider keying cache by week_start date string.
**Warning signs:** Seeing last week's meals when navigating to a new week.

### Pitfall 5: JSONB Ingredient Schema Drift
**What goes wrong:** Ingredients stored in JSONB with no validation, leading to inconsistent shapes (some have `amount` as string, others as number).
**Why it happens:** No Postgres CHECK constraint on JSONB shape, and TypeScript types don't enforce at the database level.
**How to avoid:** Validate ingredient shape in the Zustand store before insert/update. Use a Zod schema or simple TypeScript guard. Always coerce `amount` to number on save.
**Warning signs:** NaN when scaling recipe, missing quantity in grocery list.

### Pitfall 6: Edge Function Cold Starts
**What goes wrong:** AI recipe import feels slow (3-8 seconds) because the Edge Function has a cold start plus LLM API latency.
**Why it happens:** Supabase Edge Functions (Deno-based) have cold starts, and LLM API calls add 2-5 seconds.
**How to avoid:** Show a loading state with progress messaging ("Fetching recipe...", "Parsing ingredients...", "Almost done..."). Set a generous timeout (30s). Cache parsed results by URL.
**Warning signs:** Users tapping "Import" multiple times because nothing appears to happen.

## Code Examples

### Week Boundary Calculation
```typescript
// src/lib/dates.ts
import { startOfWeek, endOfWeek, addWeeks, format, eachDayOfInterval } from 'date-fns';

export function getWeekDays(weekOffset: number = 0): Date[] {
  const today = new Date();
  const targetWeek = addWeeks(today, weekOffset);
  const start = startOfWeek(targetWeek, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(targetWeek, { weekStartsOn: 1 }); // Sunday
  return eachDayOfInterval({ start, end });
}

export function formatDayLabel(date: Date): { month: string; day: string; weekday: string } {
  return {
    month: format(date, 'MMM').toUpperCase(),
    day: format(date, 'd'),
    weekday: format(date, 'EEE').toUpperCase(),
  };
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
```

### Supabase Edge Function for AI Recipe Parsing
```typescript
// supabase/functions/parse-recipe-url/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { url } = await req.json();

  // Fetch the recipe page HTML
  const response = await fetch(url);
  const html = await response.text();

  // Truncate HTML to keep within token limits
  const truncated = html.substring(0, 15000);

  // Call LLM API to extract structured recipe data
  const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract the recipe from this HTML into JSON with fields: name, category, prep_time_minutes, cook_time_minutes, servings, estimated_cost, ingredients (array of {amount, unit, name, section}), instructions (array of {step_number, text}), tags (array of strings). Return ONLY valid JSON.`
        },
        { role: 'user', content: truncated }
      ],
    }),
  });

  const data = await llmResponse.json();
  const recipe = JSON.parse(data.choices[0].message.content);

  return new Response(JSON.stringify(recipe), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Grocery List Generation from Meal Plan
```typescript
// src/lib/grocery-utils.ts
import { Ingredient, GroceryItemInsert } from '../types/database';

interface RecipeWithIngredients {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

const SECTION_MAP: Record<string, string> = {
  // Default section mappings for common ingredients
  chicken: 'Proteins', beef: 'Proteins', salmon: 'Proteins', pork: 'Proteins',
  spinach: 'Produce', onion: 'Produce', garlic: 'Produce', tomato: 'Produce',
  milk: 'Dairy & Eggs', cheese: 'Dairy & Eggs', eggs: 'Dairy & Eggs', yogurt: 'Dairy & Eggs',
  flour: 'Pantry', sugar: 'Pantry', oil: 'Pantry', salt: 'Pantry',
};

export function aggregateIngredients(recipes: RecipeWithIngredients[]): GroceryItemInsert[] {
  const merged = new Map<string, GroceryItemInsert>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit?.toLowerCase() ?? ''}`;
      const existing = merged.get(key);

      if (existing && existing.quantity) {
        // Merge quantities when units match
        const prevAmount = parseFloat(existing.quantity) || 0;
        const newAmount = (ing.amount || 0) + prevAmount;
        existing.quantity = `${newAmount} ${ing.unit || ''}`.trim();
      } else {
        merged.set(key, {
          name: ing.name,
          quantity: `${ing.amount || ''} ${ing.unit || ''}`.trim(),
          section: ing.section || inferSection(ing.name),
          estimated_price: null,
          is_manual: false,
          source_recipe_id: recipe.id,
        });
      }
    }
  }

  return Array.from(merged.values());
}

function inferSection(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, section] of Object.entries(SECTION_MAP)) {
    if (lower.includes(keyword)) return section;
  }
  return 'Other';
}
```

### Recipe Image Upload
```typescript
// Using Supabase Storage (already have expo-image-picker installed)
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer'; // already installed

export async function pickAndUploadRecipeImage(recipeId: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [16, 9],
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const fileExt = asset.uri.split('.').pop() || 'jpg';
  const filePath = `recipes/${recipeId}.${fileExt}`;

  // Read file as base64 and upload
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(filePath, blob, { contentType: `image/${fileExt}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
  return data.publicUrl;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlatList for large lists | @shopify/flash-list | 2023+ | Better perf for recipe grids, recycling-based |
| Manual websocket | Supabase Realtime v2 (Postgres Changes) | 2023 | Filter by column values, automatic RLS |
| Custom recipe scraping | LLM API parsing | 2024+ | Handles any website format reliably |
| Separate ingredient tables | JSONB columns | Current best practice for document-style data | Simpler queries, fewer joins |

**Deprecated/outdated:**
- Supabase Realtime v1 (channel-based without Postgres Changes filter): Use v2 with `filter` parameter
- `supabase.from().on()`: Use `supabase.channel().on('postgres_changes', ...)` syntax

## Open Questions

1. **LLM API Provider Selection**
   - What we know: Need an LLM to parse recipe URLs. OpenAI gpt-4o-mini and Claude 3.5 Haiku are both fast and cheap for structured extraction.
   - What's unclear: Which API key the project will use, whether there's already a Supabase project with Edge Functions enabled.
   - Recommendation: Use OpenAI gpt-4o-mini as default (widely available, JSON mode built-in). Store API key as Supabase Edge Function secret. Make the provider swappable.

2. **Supabase Storage Bucket Configuration**
   - What we know: Recipe images need a storage bucket. Supabase Storage is built-in.
   - What's unclear: Whether the Supabase project has storage enabled and a bucket created.
   - Recommendation: Create a `recipe-images` bucket with public access. Include bucket creation in the migration/setup docs.

3. **Recipe Estimated Cost**
   - What we know: Mockups show cost badges ($16, $22) on recipe cards and in meal plan day cards.
   - What's unclear: Whether costs are manually entered or computed.
   - Recommendation: Manual entry on recipe creation. No automatic pricing -- too complex and region-dependent for v1.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest 29 + jest-expo 55 + @testing-library/react-native 13 |
| Config file | jest.config.js (exists) |
| Quick run command | `npx jest --testPathPattern=tests/ --bail` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECP-01 | Recipe grid renders with search/filter | unit | `npx jest tests/screens/recipes.test.tsx -x` | No - Wave 0 |
| RECP-02 | Recipe detail renders all sections | unit | `npx jest tests/screens/recipeDetail.test.tsx -x` | No - Wave 0 |
| RECP-03 | Ingredient scaling computation | unit | `npx jest tests/lib/grocery-utils.test.ts -x` | No - Wave 0 |
| RECP-04 | Rating upsert works | unit | `npx jest tests/stores/recipeStore.test.ts -x` | No - Wave 0 |
| RECP-06 | Recipe form validates and submits | unit | `npx jest tests/screens/addRecipe.test.tsx -x` | No - Wave 0 |
| RECP-07 | AI import calls edge function | unit | `npx jest tests/lib/ai.test.ts -x` | No - Wave 0 |
| RECP-08 | Favorite toggle optimistic update | unit | `npx jest tests/stores/recipeStore.test.ts -x` | No - Wave 0 |
| PLAN-01 | Week calendar renders 7 days | unit | `npx jest tests/screens/plan.test.tsx -x` | No - Wave 0 |
| PLAN-02 | Week navigation changes dates | unit | `npx jest tests/lib/dates.test.ts -x` | No - Wave 0 |
| PLAN-06 | Surprise Me shows random recipe | unit | `npx jest tests/components/SurpriseMe.test.tsx -x` | No - Wave 0 |
| GROC-01 | Grocery generation aggregates ingredients | unit | `npx jest tests/lib/grocery-utils.test.ts -x` | No - Wave 0 |
| GROC-04 | Check-off optimistic update | unit | `npx jest tests/stores/groceryStore.test.ts -x` | No - Wave 0 |
| GROC-08 | Realtime subscription setup/cleanup | unit | `npx jest tests/hooks/useGrocerySync.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/stores/recipeStore.test.ts` -- covers RECP-01, RECP-04, RECP-08
- [ ] `tests/stores/planStore.test.ts` -- covers PLAN-01, PLAN-03, PLAN-04
- [ ] `tests/stores/groceryStore.test.ts` -- covers GROC-01, GROC-04, GROC-07
- [ ] `tests/lib/dates.test.ts` -- covers PLAN-02 week computation
- [ ] `tests/lib/grocery-utils.test.ts` -- covers GROC-01 ingredient aggregation, RECP-03 scaling
- [ ] `tests/lib/ai.test.ts` -- covers AI-01, RECP-07 mock edge function call
- [ ] `tests/hooks/useGrocerySync.test.ts` -- covers GROC-08 Realtime subscription lifecycle
- [ ] Update `tests/setup.tsx` -- add mocks for `date-fns`, `@shopify/flash-list`, Supabase Realtime channel methods

## Sources

### Primary (HIGH confidence)
- Supabase JS client v2.100.0 -- Realtime Postgres Changes API, Storage API
- Existing codebase -- householdStore pattern, RLS with SECURITY DEFINER, BottomSheet wrapper, design system tokens
- Stitch UI mockups -- All 6 Phase 2 screens visually inspected (recipes_library, recipe_detail, add_recipe_form, plan_home, grocery_list, random_dinner_generator)

### Secondary (MEDIUM confidence)
- @shopify/flash-list -- 2-column grid support, performance characteristics
- date-fns v4 -- Tree-shakable date arithmetic, startOfWeek with weekStartsOn config
- Supabase Edge Functions -- Deno-based, environment variable secrets

### Tertiary (LOW confidence)
- LLM recipe parsing accuracy -- Depends on specific website HTML structure; may need prompt tuning
- Ingredient aggregation unit merging -- Simple same-unit merge proposed; may need refinement based on real recipe data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already installed, new deps are well-established
- Architecture: HIGH - Follows established patterns from Phase 1, clear Stitch UI reference
- Database schema: HIGH - Follows existing RLS patterns, JSONB for document-style data is standard Postgres
- Realtime: MEDIUM - Supabase Realtime is well-documented but RLS interaction needs testing
- AI parsing: MEDIUM - Edge Function architecture is clear, but LLM prompt quality needs iteration
- Pitfalls: HIGH - Based on common Supabase Realtime and React Native patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable stack, no expected breaking changes)
