# Architecture Patterns: Food Data Integration

**Domain:** Food database integration into existing meal planning app
**Researched:** 2026-04-07
**Confidence:** HIGH (existing architecture well-understood, APIs documented)

## System Overview

```
                          SharedKitchen v6.0 — Food Data Integration
                          ==========================================

  Mobile Client (React Native + Expo 55)
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
  │  │ foodStore    │  │ pantryStore  │  │ recipeStore              │  │
  │  │ (NEW)        │  │ (MODIFIED)   │  │ (MODIFIED: nutrition)    │  │
  │  │              │  │ + food_id FK │  │ + ingredient food_id FK  │  │
  │  │ - search()   │  │ + nutrition  │  │ + computeNutrition()     │  │
  │  │ - barcode()  │  │   display    │  │                          │  │
  │  │ - getFood()  │  │              │  │                          │  │
  │  └──────┬───────┘  └──────────────┘  └──────────────────────────┘  │
  │         │                                                           │
  │  ┌──────┴───────────────────────────────────────────────────────┐   │
  │  │  BarcodeScanner (NEW)  │  FoodSearch (NEW)  │ NutritionCard │   │
  │  │  expo-camera barcode   │  Autocomplete UI   │ (NEW)         │   │
  │  └────────────────────────┴────────────────────┴───────────────┘   │
  └────────────────────────────────┬────────────────────────────────────┘
                                   │ HTTPS
                                   ▼
  Supabase Edge Functions (Deno)
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  ┌───────────────────┐  ┌───────────────────┐                      │
  │  │ food-search (NEW) │  │ food-barcode(NEW) │                      │
  │  │                   │  │                   │                      │
  │  │ 1. Check cache    │  │ 1. Check OFF      │                      │
  │  │ 2. USDA search    │  │ 2. Check FatSecret│                      │
  │  │ 3. FatSecret srch │  │ 3. Cache result   │                      │
  │  │ 4. Merge+rank     │  │                   │                      │
  │  │ 5. Cache results  │  │                   │                      │
  │  └────────┬──────────┘  └────────┬──────────┘                      │
  │           │                      │                                  │
  │  ┌────────┴──────────────────────┴──────────┐                      │
  │  │ generate-meal (MODIFIED: nutrition ctx)   │                      │
  │  │ analyze-food-photo (MODIFIED: food match) │                      │
  │  └─────────────────────────────────────────  │                      │
  └────────────────────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  External APIs                                                      │
  │  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
  │  │ USDA FDC    │  │ Open Food Facts  │  │ FatSecret Premier Free │ │
  │  │             │  │                  │  │                        │ │
  │  │ /foods/     │  │ /api/v2/product/ │  │ foods.search           │ │
  │  │   search    │  │   {barcode}      │  │ food.get               │ │
  │  │ /food/      │  │                  │  │ food.find_id_for_      │ │
  │  │   {fdcId}   │  │ Free, no key     │  │   barcode              │ │
  │  │             │  │ User-Agent req'd │  │                        │ │
  │  │ 1000/hr     │  │ ~1 req/user/scan │  │ No call limits         │ │
  │  │ Free API key│  │                  │  │ OAuth2 client creds    │ │
  │  └─────────────┘  └──────────────────┘  └────────────────────────┘ │
  └─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
  Supabase Postgres (with RLS)
  ┌─────────────────────────────────────────────────────────────────────┐
  │  food_items (NEW cache table)      │  recipes.ingredients (MODIFIED)│
  │  ┌─────────────────────────────┐   │  ┌───────────────────────────┐│
  │  │ id UUID PK                  │   │  │ JSONB array, each item    ││
  │  │ fdc_id INT (USDA)           │   │  │ gets optional food_id     ││
  │  │ off_barcode TEXT (OFF)      │   │  │ linking to food_items     ││
  │  │ fatsecret_id BIGINT         │   │  └───────────────────────────┘│
  │  │ name TEXT (normalized)      │   │                               │
  │  │ brand TEXT                   │   │  pantry_items (MODIFIED)      │
  │  │ barcode TEXT (UPC/EAN)      │   │  ┌───────────────────────────┐│
  │  │ nutrition JSONB             │   │  │ + food_id UUID FK          ││
  │  │ serving_sizes JSONB         │   │  │ + nutrition_per_serving   ││
  │  │ source TEXT (usda|off|fs)   │   │  └───────────────────────────┘│
  │  │ category TEXT               │   │                               │
  │  │ image_url TEXT              │   │  food_search_cache (NEW)      │
  │  │ fetched_at TIMESTAMPTZ      │   │  ┌───────────────────────────┐│
  │  │ expires_at TIMESTAMPTZ      │   │  │ query_hash TEXT PK        ││
  │  └─────────────────────────────┘   │  │ results JSONB             ││
  │                                     │  │ created_at TIMESTAMPTZ    ││
  │  UNIQUE(fdc_id), UNIQUE(barcode)   │  │ expires_at TIMESTAMPTZ    ││
  │  idx on name (trigram for search)  │  └───────────────────────────┘│
  └─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### NEW Components

| Component | Type | Responsibility | Communicates With |
|-----------|------|---------------|-------------------|
| `food-search` Edge Function | Backend | Unified food search across USDA + FatSecret, with Postgres cache | USDA FDC API, FatSecret API, `food_items` table |
| `food-barcode` Edge Function | Backend | Barcode lookup via OFF then FatSecret fallback, caching | Open Food Facts API, FatSecret API, `food_items` table |
| `foodStore` (Zustand) | Client store | Client-side food search/barcode state, cached results | `food-search` EF, `food-barcode` EF, Supabase direct for `food_items` |
| `food_items` table | Database | Canonical food data cache, deduplicated across sources | Referenced by `pantry_items.food_id`, recipe `ingredients[].food_id` |
| `food_search_cache` table | Database | Short-lived cache of search query results (24h TTL) | `food-search` Edge Function reads/writes |
| `BarcodeScanner` component | UI | Camera-based UPC/EAN barcode scanning | expo-camera, `foodStore.lookupBarcode()` |
| `FoodSearchSheet` component | UI | Bottom sheet with autocomplete food search | `foodStore.searchFoods()` |
| `NutritionCard` component | UI | Displays nutrition facts (FDA-style label) | Recipe/food nutrition data from stores |
| `NutritionSummary` component | UI | Aggregated daily/weekly nutrition on Plan tab | `planStore` + `recipeStore` computed nutrition |

### MODIFIED Components

| Component | Modification | Why |
|-----------|-------------|-----|
| `pantryStore` | Add `food_id` linking, nutrition display per item | Pantry items can reference canonical food data |
| `recipeStore` | Add `computeRecipeNutrition()` that sums ingredient nutrition | Recipes get computed nutrition from linked food_items |
| `generate-meal` Edge Function | Include nutrition context in AI prompt (daily totals, goals) | AI can suggest meals that hit nutrition targets |
| `analyze-food-photo` Edge Function | After identifying food, attempt food_items match for nutrition | Photo scan results get nutrition data attached |
| `Ingredient` type | Add optional `food_id?: string` field | Link ingredients to canonical food database entries |
| `NutritionInfo` type | Expand from string-based to number-based with units | Current type uses strings ("200 kcal"); needs numeric for computation |
| `pantry_items` migration | Add `food_id` UUID column, nullable FK to `food_items` | Optional enrichment of pantry items with nutrition data |

## Data Flow

### Flow 1: Food Search (text query)

```
User types "chicken breast" in FoodSearchSheet
  -> foodStore.searchFoods("chicken breast")
    -> POST /food-search { query: "chicken breast" }
      -> Edge Function:
        1. Hash query, check food_search_cache (24h TTL)
        2. If miss: parallel fetch from USDA + FatSecret
           - USDA: GET /foods/search?query=chicken+breast&dataType=Foundation,SR+Legacy
           - FatSecret: POST foods.search (OAuth2 token)
        3. Deduplicate by name similarity
        4. Rank: USDA Foundation > USDA SR Legacy > FatSecret > USDA Branded
        5. Upsert top results into food_items (canonical cache)
        6. Store search results in food_search_cache
        7. Return ranked array of food_items
      <- Array of FoodItem objects
    <- foodStore sets searchResults
  -> User taps item -> foodStore.getFood(id) for full nutrition
  -> Used in: ingredient linking, pantry addition, food logging
```

### Flow 2: Barcode Scan

```
User opens BarcodeScanner, scans UPC/EAN barcode
  -> expo-camera onBarcodeScanned({ type: "ean13", data: "3017624010701" })
    -> foodStore.lookupBarcode("3017624010701")
      -> POST /food-barcode { barcode: "3017624010701" }
        -> Edge Function:
          1. Check food_items WHERE barcode = "3017624010701"
          2. If miss: GET Open Food Facts /api/v2/product/3017624010701
             - OFF returns: product_name, nutriments, nutri-score, image
          3. If OFF miss or incomplete: FatSecret food.find_id_for_barcode
             - Returns food_id -> food.get for full nutrition
          4. Upsert into food_items with source priority
          5. Return FoodItem
        <- FoodItem or null (not found)
      <- foodStore sets scannedFood
    -> Show food details bottom sheet
    -> User action: "Add to Pantry" or "Add to Grocery List"
```

### Flow 3: Recipe Nutrition Computation

```
Recipe has ingredients: [{ name: "chicken breast", amount: 2, unit: "lbs", food_id: "abc123" }, ...]
  -> recipeStore.computeRecipeNutrition(recipe)
    -> For each ingredient with food_id:
      1. Look up food_items by id (from local cache or Supabase)
      2. Find matching serving size or convert to grams
      3. Scale nutrition by ingredient amount
    -> Sum all ingredient nutrition values
    -> Return NutritionData { calories: 450, protein_g: 52, total_fat_g: 12, ... }
  -> Display in NutritionCard on RecipeDetail screen
  -> Store computed nutrition on recipe (recipes.nutrition_info) for fast access
```

### Flow 4: Enhanced AI Meal Generation

```
User requests "Surprise Me" meal suggestion
  -> generate-meal Edge Function (MODIFIED):
    1. Existing context gathering (dietary prefs, history, leftovers, budget)
    2. NEW: Fetch today's planned meals -> compute consumed nutrition
    3. NEW: Compare against recommended daily values
    4. NEW: Add nutrition gap context to AI prompt:
       "User has consumed 1200 cal, 30g protein so far today.
        Suggest a dinner with higher protein content."
    -> AI generates meal suggestion with nutrition awareness
```

## Integration Points with Existing Architecture

### 1. Edge Function Pattern (reuse existing conventions)

All existing Edge Functions follow the same pattern:
- CORS headers constant
- Auth via `supabase.auth.getUser()` from Authorization header
- Admin client with `SUPABASE_SERVICE_ROLE_KEY` for writes
- Premium check via `subscriptions` table
- Rate limiting via usage log tables

New `food-search` and `food-barcode` must follow this exact pattern. Rate limiting approach: log searches in `ai_usage_log` (reuse existing table with new `action_type`).

### 2. Supabase Secrets (new API keys needed)

| Secret | Value | Where Used |
|--------|-------|-----------|
| `USDA_API_KEY` | data.gov API key | `food-search` Edge Function |
| `FATSECRET_CLIENT_ID` | OAuth2 client ID | `food-search`, `food-barcode` Edge Functions |
| `FATSECRET_CLIENT_SECRET` | OAuth2 client secret | `food-search`, `food-barcode` Edge Functions |

Open Food Facts requires NO API key -- just a User-Agent header identifying the app.

### 3. Ingredient Type Evolution

Current `Ingredient` type:
```typescript
interface Ingredient {
  amount: number;
  unit: string;
  name: string;
  section?: string;
}
```

Extended for v6.0:
```typescript
interface Ingredient {
  amount: number;
  unit: string;
  name: string;
  section?: string;
  food_id?: string;          // NEW: FK to food_items.id
  nutrition_per_serving?: {   // NEW: denormalized for offline display
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  } | null;
}
```

This is backward-compatible -- existing recipes keep working since both fields are optional.

### 4. NutritionInfo Type Evolution

Current type (string-based, from recipe URL extraction):
```typescript
interface NutritionInfo {
  calories?: string;     // "450 kcal"
  protein?: string;      // "30g"
  fat?: string;          // "15g"
  carbohydrates?: string;// "40g"
  fiber?: string;
  sodium?: string;
  sugar?: string;
}
```

New canonical type (number-based, for computation):
```typescript
interface NutritionData {
  calories: number;          // kcal
  protein_g: number;
  total_fat_g: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  total_carbs_g: number;
  dietary_fiber_g?: number;
  total_sugars_g?: number;
  added_sugars_g?: number;
  vitamin_d_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
  serving_size?: string;     // "100g" or "1 cup (240ml)"
  serving_weight_g?: number; // grams for computation
}
```

Both old `NutritionInfo` (from recipe parsing) and new `NutritionData` (from food DB) coexist. Display logic prefers `NutritionData` when available, falls back to parsed strings.

### 5. Database Schema: `food_items` Table

```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- External source IDs (at least one must be non-null)
  fdc_id INTEGER UNIQUE,           -- USDA FoodData Central ID
  off_barcode TEXT,                 -- Open Food Facts barcode (may differ from UPC)
  fatsecret_id BIGINT UNIQUE,      -- FatSecret food_id

  -- Core fields
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,    -- lowercase, trimmed for search/dedup
  brand TEXT,                       -- null for generic/unbranded foods
  barcode TEXT UNIQUE,              -- UPC/EAN for barcode lookups
  category TEXT,                    -- e.g., "Poultry", "Dairy", "Snacks"

  -- Nutrition (per 100g canonical, plus serving info)
  nutrition JSONB NOT NULL,         -- NutritionData per 100g
  serving_sizes JSONB DEFAULT '[]', -- Array of { description, amount_g, nutrition }

  -- Metadata
  source TEXT NOT NULL CHECK (source IN ('usda', 'off', 'fatsecret')),
  image_url TEXT,
  data_quality SMALLINT DEFAULT 50, -- 0-100 quality score for ranking
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),

  CONSTRAINT at_least_one_source CHECK (
    fdc_id IS NOT NULL OR off_barcode IS NOT NULL OR fatsecret_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_food_items_name_trgm ON food_items USING gin (name_normalized gin_trgm_ops);
CREATE INDEX idx_food_items_barcode ON food_items (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_items_fdc_id ON food_items (fdc_id) WHERE fdc_id IS NOT NULL;
CREATE INDEX idx_food_items_expires ON food_items (expires_at);

-- No RLS needed: food_items is a shared read-only cache
-- Edge Functions write via service_role, clients read via anon key
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food items" ON food_items FOR SELECT USING (true);
```

Key design decisions:
- **Per-100g canonical storage**: All nutrition normalized to 100g for consistent computation. Serving sizes stored separately.
- **30-day TTL**: USDA data changes rarely, but OFF/FatSecret branded data updates. Edge Functions check `expires_at` before returning cached data.
- **Trigram index**: Enables fuzzy text search (`%chicken%`) at the Postgres level, reducing API calls for common foods.
- **No RLS write policy for clients**: Only Edge Functions (via `service_role`) write to this table. Prevents data pollution.

### 6. Database Schema: `food_search_cache` Table

```sql
CREATE TABLE food_search_cache (
  query_hash TEXT PRIMARY KEY,    -- SHA-256 of normalized query
  query_text TEXT NOT NULL,       -- original query for debugging
  results JSONB NOT NULL,         -- array of food_item IDs + relevance scores
  result_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX idx_search_cache_expires ON food_search_cache (expires_at);
```

### 7. Pantry Item Enhancement

```sql
ALTER TABLE pantry_items ADD COLUMN food_id UUID REFERENCES food_items(id);
CREATE INDEX idx_pantry_items_food_id ON pantry_items (food_id) WHERE food_id IS NOT NULL;
```

## Patterns to Follow

### Pattern 1: Waterfall API Lookup with Cache

For barcode scans, use a waterfall pattern that tries the cheapest/fastest source first:

```typescript
// In food-barcode Edge Function
async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  // 1. Check local cache (Postgres)
  const cached = await supabaseAdmin
    .from('food_items')
    .select('*')
    .eq('barcode', barcode)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached.data) return cached.data;

  // 2. Try Open Food Facts (free, no key, fastest)
  const offResult = await fetchOpenFoodFacts(barcode);
  if (offResult) {
    return await upsertFoodItem(offResult);
  }

  // 3. Fall back to FatSecret (needs OAuth, more reliable for US brands)
  const fsResult = await fetchFatSecretBarcode(barcode);
  if (fsResult) {
    return await upsertFoodItem(fsResult);
  }

  return null; // Not found in any source
}
```

### Pattern 2: Parallel Search with Merge

For text search, query USDA and FatSecret in parallel, then merge:

```typescript
// In food-search Edge Function
async function searchFoods(query: string): Promise<FoodItem[]> {
  const [usdaResults, fsResults] = await Promise.all([
    searchUSDA(query),
    searchFatSecret(query),
  ]);

  // Deduplicate by normalized name similarity
  const merged = deduplicateAndRank(usdaResults, fsResults);

  // Batch upsert into food_items cache
  await batchUpsertFoodItems(merged);

  return merged;
}
```

### Pattern 3: FatSecret OAuth2 Token Management

FatSecret uses OAuth2 Client Credentials. Token must be cached in Deno's runtime memory (not Postgres -- tokens are short-lived).

```typescript
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('FATSECRET_CLIENT_ID')!,
      client_secret: Deno.env.get('FATSECRET_CLIENT_SECRET')!,
      scope: 'premier',
    }),
  });

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}
```

**Important caveat**: Deno Deploy (which Supabase Edge Functions use) has ephemeral isolates. The in-memory token cache helps within a warm instance but will be lost on cold starts. This is fine -- the token fetch adds ~200ms on cold start, which is acceptable for the user flow.

### Pattern 4: Nutrition Normalization Layer

All three APIs return nutrition in different formats. Normalize to a canonical schema at the Edge Function level:

```typescript
interface CanonicalNutrition {
  calories: number;       // kcal per 100g
  protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  dietary_fiber_g: number;
  total_sugars_g: number;
  sodium_mg: number;
  // ... extended nutrients
}

function normalizeUSDA(nutrients: USDANutrient[]): CanonicalNutrition { ... }
function normalizeOFF(nutriments: OFFNutriments): CanonicalNutrition { ... }
function normalizeFatSecret(servings: FSServing[]): CanonicalNutrition { ... }
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side API Calls

**What:** Having the React Native app call USDA/OFF/FatSecret APIs directly.
**Why bad:** Exposes API keys in client bundle; CORS issues; cannot cache across users; cannot rate-limit; no deduplication.
**Instead:** All external API calls go through Edge Functions. Client only talks to Supabase.

### Anti-Pattern 2: Storing Nutrition on Recipes Only

**What:** Computing recipe nutrition once and storing it, never updating.
**Why bad:** When food data is corrected upstream, or user changes ingredients, stored nutrition becomes stale.
**Instead:** Store `food_id` references on ingredients. Compute nutrition on-demand (with caching). Re-compute when ingredients change.

### Anti-Pattern 3: Requiring Food Linking for All Ingredients

**What:** Forcing users to link every ingredient to a food database entry.
**Why bad:** Destroys the quick recipe creation UX. "2 pinches of love" does not need nutrition data.
**Instead:** Food linking is optional. AI can suggest links. Nutrition display shows "partial" indicator when some ingredients are unlinked.

### Anti-Pattern 4: Syncing Full USDA Database Locally

**What:** Downloading the 380K+ USDA foods into the app's local storage.
**Why bad:** Massive initial download (hundreds of MB), stale data, complex sync logic.
**Instead:** On-demand lookup via Edge Functions with 30-day Postgres cache. Most households use 200-500 unique foods; cache fills naturally.

## Recommended Project Structure Additions

```
src/
  stores/
    foodStore.ts                    # NEW: food search, barcode, cached results
  types/
    food.ts                         # NEW: FoodItem, NutritionData, ServingSize types
    database.ts                     # MODIFIED: add food_items table types, extend Ingredient
  components/
    food/
      FoodSearchSheet.tsx           # NEW: bottom sheet with autocomplete search
      BarcodeScanner.tsx            # NEW: camera-based barcode scanner
      NutritionCard.tsx             # NEW: FDA-style nutrition facts display
      NutritionSummary.tsx          # NEW: daily/weekly nutrition summary
      FoodItemRow.tsx               # NEW: search result row with nutrition preview
      IngredientFoodLinker.tsx      # NEW: link ingredient to food_item during recipe edit
    scan/
      ScanReviewScreen.tsx          # MODIFIED: add food_id linking for scanned items
  lib/
    nutrition-utils.ts              # NEW: nutrition computation, unit conversion, scaling
  hooks/
    useFoodSearch.ts                # NEW: debounced search hook
    useBarcodeScanner.ts            # NEW: barcode scan state management

supabase/
  functions/
    food-search/index.ts            # NEW: unified text search across USDA + FatSecret
    food-barcode/index.ts           # NEW: barcode lookup via OFF + FatSecret
    _shared/
      food-normalize.ts             # NEW: nutrition normalization across sources
      fatsecret-client.ts           # NEW: FatSecret OAuth2 client
  migrations/
    00017_create_food_items.sql     # NEW: food_items + food_search_cache tables
    00018_add_pantry_food_id.sql    # NEW: pantry_items.food_id column
```

## Build Order (considering existing dependencies)

### Phase 1: Data Foundation

1. **Migration: `food_items` + `food_search_cache` tables** -- No dependencies, pure additive
2. **`food-normalize.ts` shared module** -- Normalization functions for all three API response formats
3. **`FoodItem` / `NutritionData` TypeScript types** -- Needed by everything else
4. **`nutrition-utils.ts`** -- Pure functions for scaling, summing, unit conversion

**Rationale:** Everything else depends on the data model and types being stable first.

### Phase 2: Edge Functions (Backend)

5. **`food-search` Edge Function** -- USDA + FatSecret search with caching
6. **`food-barcode` Edge Function** -- OFF + FatSecret barcode lookup with caching
7. **FatSecret OAuth2 client** (`fatsecret-client.ts`) -- Shared by both Edge Functions

**Rationale:** Backend before frontend. Edge Functions can be tested with curl before building UI.

### Phase 3: Client Store + Basic UI

8. **`foodStore`** -- Search, barcode lookup, result caching
9. **`FoodSearchSheet`** -- Autocomplete UI for food search
10. **`NutritionCard`** -- Display component for nutrition facts

**Rationale:** Store connects to Edge Functions. UI components consume store.

### Phase 4: Barcode Scanner

11. **Install `expo-camera`** (requires `npx expo install expo-camera`)
12. **`BarcodeScanner` component** -- Camera view with barcode detection
13. **`useBarcodeScanner` hook** -- Permission flow, scan state

**Rationale:** Barcode scanning is a distinct UX flow. expo-camera may require native rebuild (EAS Build), so isolate this risk.

### Phase 5: Integration with Existing Features

14. **Extend `Ingredient` type** with optional `food_id`
15. **`IngredientFoodLinker` component** -- Link ingredients during recipe creation/edit
16. **`recipeStore.computeRecipeNutrition()`** -- Sum ingredient nutrition
17. **`pantry_items.food_id` migration + pantryStore updates**
18. **Nutrition display on RecipeDetail and Plan screens**

**Rationale:** Integration touches existing stable features. Build on solid foundation from phases 1-4.

### Phase 6: AI Enhancement

19. **Modify `generate-meal` to include nutrition context**
20. **Modify `analyze-food-photo` to match scanned food to food_items**
21. **`NutritionSummary` on Plan tab** (daily nutrition totals)

**Rationale:** AI enhancements are additive and depend on nutrition data being available. Ship last to avoid blocking core functionality.

## API Rate Limit Strategy

| API | Limit | Strategy |
|-----|-------|----------|
| USDA FDC | 1,000/hour per IP | Edge Function IP is Supabase's; cache aggressively in `food_items` (30-day TTL). Typical household searches ~10-20 foods/week. |
| Open Food Facts | 1 req per real user scan | Only called for barcode scans, which are user-initiated. Well within limits. |
| FatSecret Premier Free | No hard limit | OAuth2 token cached. Use as secondary source after USDA (search) and OFF (barcode). |

At SharedKitchen's scale (early-stage consumer app), none of these limits are a concern. The Postgres cache means repeated lookups for common foods (chicken breast, rice, eggs) hit the database, not the external API.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| food_items table size | ~2K rows | ~20K rows | ~100K rows (most foods are shared) |
| USDA rate limit | No issue | May need multiple API keys | Consider USDA bulk download to own DB |
| FatSecret OAuth tokens | Cold starts fine | Token reuse across warm isolates | May need dedicated token service |
| Search latency | ~500ms (API call) | ~100ms (mostly cached) | ~50ms (heavily cached, trigram local search) |
| Barcode scan latency | ~800ms (OFF API) | ~200ms (mostly cached) | ~100ms (heavily cached) |

## Sources

- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/) -- endpoints, rate limits, data types
- [USDA FDC OpenAPI Spec](https://fdc.nal.usda.gov/api-spec/fdc_api.html) -- response schemas
- [Open Food Facts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/) -- barcode lookup, nutriments fields
- [Open Food Facts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/) -- product fields, usage guidelines
- [FatSecret Platform API Documentation](https://platform.fatsecret.com/docs/guides) -- methods, OAuth2
- [FatSecret API Editions and Pricing](https://platform.fatsecret.com/api-editions) -- Premier Free tier details
- [FatSecret OAuth2 Documentation](https://platform.fatsecret.com/docs/guides/authentication/oauth2) -- client credentials flow
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/) -- barcode scanning in SDK 52+
