# Phase 36: Food Search - Research

**Researched:** 2026-04-07
**Domain:** External food API integration (USDA + FatSecret), Edge Function proxy, search UI
**Confidence:** HIGH

## Summary

Phase 36 builds a unified food search system: a `food-search` Supabase Edge Function that queries the Postgres cache first, then USDA FoodData Central and FatSecret APIs in parallel on cache miss, normalizes results into the `FoodItem` type from Phase 35, and returns them to a new `FoodSearchSheet` bottom sheet UI. The types (`FoodItem`, `NutritionData`, `FoodSearchResult`), database tables (`food_items`, `food_search_cache`), and utility functions (`scaleNutrition`, `sumNutrition`) all exist from Phase 35 and are ready to consume.

The USDA and FatSecret APIs return nutrition in different structures. USDA returns a `foodNutrients` array with nutrient IDs (e.g., 1008 for calories), while FatSecret returns flat fields on serving objects (e.g., `calories`, `protein`, `fat`). The Edge Function must normalize both into the `NutritionData` per-100g format and upsert into `food_items`. FatSecret requires OAuth 2.0 client credentials (24-hour tokens). The existing Edge Function pattern (auth, rate limit via `ai_usage_log`, admin client writes) applies directly.

**Primary recommendation:** Build the `food-search` Edge Function first (testable with curl), then the `foodStore` Zustand store, then the `FoodSearchSheet` UI. Keep the Edge Function simple -- single file, no shared modules yet (those can be extracted in Phase 37 when `food-barcode` shares the FatSecret client).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Bottom sheet (FoodSearchSheet) for food search -- consistent with existing patterns
- "Search Foods" button on Kitchen tab's On Hand section as entry point
- 300ms debounce with minimum 2 characters before triggering search
- Single `food-search` Edge Function querying USDA + FatSecret + local Postgres cache
- API keys as Supabase secrets: USDA_API_KEY, FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET
- Cache-first strategy: check Postgres food_items table first, only hit external APIs on cache miss
- FatSecret OAuth 2.0 client credentials flow (server-to-server) in Edge Function
- Detailed nutrition expands inline within search results sheet
- Horizontal pill row for macro display: "180 cal . 12g protein . 8g carbs . 6g fat"
- Brand displayed as subtitle under food name
- Rate limiting: 20 searches/day free, unlimited premium -- reuse ai_usage_log pattern

### Claude's Discretion
- Result deduplication strategy when same food appears from both USDA and FatSecret
- Pagination/infinite scroll if many results
- Error handling UX for API failures
- foodStore structure and method naming

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | User can search foods by name across USDA, FatSecret, and cached data from a single search interface | Edge Function with cache-first + parallel API search; FoodSearchSheet bottom sheet UI; foodStore Zustand store |
| SRCH-02 | Search results show food name, brand (if applicable), and key nutrition facts (calories, protein, carbs, fat) | `FoodSearchResult` type already has these fields; horizontal pill row macro display; brand as subtitle |
| SRCH-03 | User can view detailed nutrition breakdown for any search result | Inline expand within results sheet; full `NutritionData` available from `food_items` table |
</phase_requirements>

## Standard Stack

### Core (all existing -- no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2 (existing) | Client calls to Edge Function via `supabase.functions.invoke` | Established pattern across all EF calls |
| @gorhom/bottom-sheet | ^5.2.8 (existing) | FoodSearchSheet UI | 16 existing bottom sheets use this exact component |
| zustand | existing | foodStore for search state management | All stores use this pattern |
| @shopify/flash-list | ^2.3.1 (existing) | Search results list rendering | Used in RecipeGrid, performant for dynamic lists |

### External APIs (server-side only, no npm packages)

| API | Auth | Purpose |
|-----|------|---------|
| USDA FoodData Central v1 | API key as query param | Authoritative nutrition data (Foundation, SR Legacy, Branded foods) |
| FatSecret Platform API v3 | OAuth 2.0 Bearer token | Branded food data, fills USDA gaps |

**Installation:** No new npm packages required. Edge Function uses Deno native `fetch()`. [VERIFIED: codebase inspection]

## Architecture Patterns

### Recommended Project Structure (new files only)
```
supabase/
  functions/
    food-search/
      index.ts              # Edge Function: cache check + USDA + FatSecret + normalize + cache write

src/
  stores/
    foodStore.ts            # Zustand store: search state, results, expanded item
  components/
    food/
      FoodSearchSheet.tsx   # Bottom sheet with search input + results list
      FoodResultRow.tsx     # Single search result with macro pills + inline expand
      NutritionDetail.tsx   # Expanded nutrition breakdown view
  lib/
    food-api.ts             # Client wrapper: supabase.functions.invoke('food-search', ...)
```

### Pattern 1: Cache-First Edge Function

**What:** Check Postgres `food_search_cache` and `food_items` before hitting external APIs.
**When to use:** Every food search request.
**Flow:**
```
1. Normalize query (lowercase, trim)
2. Hash query -> check food_search_cache (24h TTL)
3. If cache hit AND not expired -> return cached food_item IDs
4. If miss -> parallel fetch USDA + FatSecret
5. Normalize both API responses to FoodItem format
6. Deduplicate by name similarity
7. Upsert results into food_items table
8. Write to food_search_cache
9. Return FoodSearchResult[] array
```

### Pattern 2: USDA Nutrient ID Mapping

**What:** Map USDA nutrient IDs to `NutritionData` fields.
**Source:** [VERIFIED: USDA FDC OpenAPI spec + sample responses]

```typescript
// USDA nutrient number -> NutritionData field mapping
const USDA_NUTRIENT_MAP: Record<number, keyof NutritionData> = {
  208: 'calories',           // Energy (kcal) — nutrientNumber 208
  203: 'protein_g',          // Protein
  204: 'total_fat_g',        // Total lipid (fat)
  205: 'total_carbs_g',      // Carbohydrate
  291: 'dietary_fiber_g',    // Fiber, total dietary
  269: 'total_sugars_g',     // Sugars, total
  606: 'saturated_fat_g',    // Fatty acids, total saturated
  605: 'trans_fat_g',        // Fatty acids, total trans
  601: 'cholesterol_mg',     // Cholesterol
  307: 'sodium_mg',          // Sodium
  324: 'vitamin_d_mcg',      // Vitamin D (D2 + D3)
  301: 'calcium_mg',         // Calcium
  303: 'iron_mg',            // Iron
  306: 'potassium_mg',       // Potassium
};
```

### Pattern 3: FatSecret Serving Normalization

**What:** Convert FatSecret per-serving nutrition to per-100g canonical format.
**Challenge:** FatSecret returns nutrition per serving, not per 100g. Must find the "per 100g" serving if it exists, or calculate from `metric_serving_amount`.

```typescript
function normalizeFatSecretServing(servings: FSServing[]): {
  nutrition: NutritionData;
  serving_sizes: ServingSize[];
} {
  // FatSecret usually includes a "per 100g" serving
  const per100g = servings.find(s =>
    s.serving_description === '100 g' ||
    s.metric_serving_amount === '100.000'
  );

  if (per100g) {
    return {
      nutrition: mapFSToNutrition(per100g),
      serving_sizes: servings.map(mapFSToServingSize),
    };
  }

  // Fallback: scale from first serving using metric_serving_amount
  const first = servings[0];
  const grams = parseFloat(first.metric_serving_amount || '100');
  const factor = 100 / grams;
  return {
    nutrition: scaleFSNutrition(first, factor),
    serving_sizes: servings.map(mapFSToServingSize),
  };
}
```

### Pattern 4: FatSecret OAuth 2.0 Token (In-Memory Cache)

**What:** Cache the OAuth token in Deno isolate memory. 24-hour lifetime.
**Why:** Avoid token fetch on every request. Cold start adds ~200ms, acceptable. [VERIFIED: FatSecret docs confirm 86400s token lifetime]

```typescript
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const resp = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(
        Deno.env.get('FATSECRET_CLIENT_ID')! + ':' + Deno.env.get('FATSECRET_CLIENT_SECRET')!
      )}`,
    },
    body: 'grant_type=client_credentials&scope=premier',
  });

  const data = await resp.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 120) * 1000, // 2min buffer
  };
  return tokenCache.token;
}
```

### Pattern 5: Existing Edge Function Convention

**What:** Auth + premium check + rate limit + external call + usage log.
**Source:** [VERIFIED: search-recipes/index.ts and analyze-food-photo/index.ts]

The exact structure to follow:
1. CORS preflight handler
2. Auth via `supabaseClient.auth.getUser()` with Authorization header
3. Admin client with `SUPABASE_SERVICE_ROLE_KEY` for writes
4. Premium check via `subscriptions` table (with try/catch for table-not-exists)
5. Rate limit: count rows in `ai_usage_log` where `function_name = 'food-search'`
6. External API call with `AbortController` + 30s timeout
7. Non-blocking usage logging: `supabaseAdmin.from('ai_usage_log').insert({...}).then(() => {}).catch(() => {})`
8. JSON response with corsHeaders

**Key difference from existing:** Rate limit is daily (20/day), not monthly. Use `new Date().setHours(0,0,0,0)` for day start instead of `setDate(1)`.

### Pattern 6: Bottom Sheet with Search Input

**What:** Use the existing `BottomSheet` wrapper component with a `TextInput` inside.
**Source:** [VERIFIED: AddPantryItemSheet uses TextInput inside BottomSheet successfully]

The codebase uses standard React Native `TextInput` (not `BottomSheetTextInput`) inside `@gorhom/bottom-sheet`. This works because the `BottomSheet` component uses `BottomSheetView` which handles keyboard interactions.

### Pattern 7: Debounced Search (Existing Pattern)

**What:** 300ms debounce with `setTimeout`/`clearTimeout` via `useRef`.
**Source:** [VERIFIED: KitchenSearchBar.tsx lines 30-65]

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleChangeText = useCallback((text: string) => {
  setQuery(text);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (text.trim().length < 2) {
    clearResults();
    return;
  }
  debounceRef.current = setTimeout(() => {
    searchFoods(text.trim());
  }, 300);
}, [searchFoods, clearResults]);
```

### Anti-Patterns to Avoid

- **Client-side API calls:** Never call USDA/FatSecret from the React Native app. API keys would be in the bundle. All calls go through the Edge Function. [VERIFIED: established codebase pattern]
- **Separate get-nutrition Edge Function for detail view:** The full `NutritionData` is already stored in `food_items.nutrition` when the search result is cached. The detail view reads from Supabase directly (select from `food_items` by ID), no second Edge Function needed.
- **Using `BottomSheetTextInput` from @gorhom/bottom-sheet:** The codebase consistently uses standard RN `TextInput` inside the `BottomSheet` wrapper. Don't introduce a different pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Food nutrition data | Custom food database | USDA + FatSecret APIs cached in Postgres | 380K+ foods already normalized, maintained by government/industry |
| OAuth 2.0 client credentials | Custom auth library | Native `fetch()` to FatSecret token endpoint | Single POST request, no library needed |
| Fuzzy text search | Custom search algorithm | Postgres trigram index (`gin_trgm_ops`) on `name_normalized` | Already created in Phase 35 migration, handles typos/partial matches |
| Search result caching | Custom cache layer | `food_search_cache` table with TTL | Already created in Phase 35 migration |
| Rate limiting | Custom rate limiter | `ai_usage_log` table count queries | Established pattern in search-recipes and analyze-food-photo |
| Bottom sheet | Custom modal | `@gorhom/bottom-sheet` via `BottomSheet` wrapper | 16 existing sheets use this exact component |
| Debounce | lodash.debounce or custom hook | `setTimeout`/`clearTimeout` via useRef | Exact pattern in KitchenSearchBar.tsx, zero dependencies |

## Common Pitfalls

### Pitfall 1: USDA Search Returns Nutrients by Number, Not Name
**What goes wrong:** Mapping nutrients by `name` string (e.g., "Energy") is fragile -- USDA has multiple energy entries (kcal vs kJ).
**Why it happens:** The `foodNutrients` array in search results uses `number` (nutrient number) and `name` fields. Some nutrients appear twice with different units.
**How to avoid:** Map by `nutrientNumber` (integer), not `nutrientName` (string). Use the mapping table in Pattern 2 above.
**Warning signs:** Calorie values appearing doubled (kcal + kJ both present). [VERIFIED: USDA OpenAPI spec shows both nutrient 208 (kcal) and 268 (kJ)]

### Pitfall 2: FatSecret Returns Nutrition Per Serving, Not Per 100g
**What goes wrong:** Storing FatSecret nutrition directly in `food_items.nutrition` (which expects per-100g) gives wildly wrong values.
**Why it happens:** FatSecret servings are "1 cup", "1 tbsp", etc. The per-100g serving may or may not be included.
**How to avoid:** Always check for a "100 g" serving description first. If absent, use `metric_serving_amount` to calculate the scaling factor.
**Warning signs:** A food showing 30 calories per 100g when it should be 300 (because the serving was 10g). [VERIFIED: FatSecret docs show serving_description varies]

### Pitfall 3: FatSecret Single Food vs Array Response
**What goes wrong:** FatSecret returns `{ food: { ... } }` for a single result but `{ food: [{ ... }] }` for multiple results. Code expecting an array crashes on single results.
**Why it happens:** XML-to-JSON serialization quirk common in FatSecret's API.
**How to avoid:** Always normalize: `const foods = Array.isArray(data.foods_search?.results?.food) ? data.foods_search.results.food : data.foods_search?.results?.food ? [data.foods_search.results.food] : [];`
**Warning signs:** TypeError on `.map()` when only one food matches. [ASSUMED -- common pattern with XML-origin APIs]

### Pitfall 4: Daily Rate Limit vs Monthly in Existing Pattern
**What goes wrong:** Copying the monthly rate limit pattern from `search-recipes` but the decision says 20/day for food search.
**Why it happens:** Existing EFs use monthly (`setDate(1)`), but food search uses daily.
**How to avoid:** Use day start: `const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);` and filter `ai_usage_log` with `gte('created_at', dayStart.toISOString())`.
**Warning signs:** Users getting 20 searches total per month instead of per day.

### Pitfall 5: USDA Branded vs Foundation Data Quality
**What goes wrong:** Returning USDA Branded results first, which have inconsistent/incomplete nutrition data from manufacturer labels.
**Why it happens:** Branded foods outnumber Foundation foods 10:1, so they dominate search results.
**How to avoid:** Rank results: Foundation > SR Legacy > FatSecret > Branded. Set `data_quality` accordingly (Foundation: 90, SR Legacy: 80, FatSecret: 60, Branded: 40).
**Warning signs:** "Chicken Breast" returns a branded frozen chicken product instead of the USDA Foundation whole food entry. [VERIFIED: USDA docs describe Foundation as highest quality]

### Pitfall 6: Query Hash Collisions in Search Cache
**What goes wrong:** Different queries mapping to the same cache entry.
**Why it happens:** Using a simple hash without normalizing the query first.
**How to avoid:** Normalize before hashing: `query.toLowerCase().trim().replace(/\s+/g, ' ')`. Use SHA-256 (available in Deno via `crypto.subtle`).
**Warning signs:** "chicken breast" and "Chicken   Breast" returning different results.

## Code Examples

### USDA FoodData Central Search Request
```typescript
// Source: https://fdc.nal.usda.gov/api-spec/fdc_api.html [VERIFIED]
const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
url.searchParams.set('api_key', Deno.env.get('USDA_API_KEY')!);
url.searchParams.set('query', query);
url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');
url.searchParams.set('pageSize', '25');
url.searchParams.set('sortBy', 'dataType.keyword');  // Foundation first
url.searchParams.set('sortOrder', 'asc');

const resp = await fetch(url.toString());
const data = await resp.json();

// Response structure:
// {
//   totalHits: number,
//   currentPage: number,
//   totalPages: number,
//   foods: [{
//     fdcId: number,
//     description: string,
//     dataType: "Foundation" | "SR Legacy" | "Branded",
//     brandOwner?: string,
//     gtinUpc?: string,
//     foodNutrients: [{
//       nutrientNumber: number,   // e.g., 208 for calories
//       nutrientName: string,
//       value: number,
//       unitName: string          // "kcal", "g", "mg"
//     }]
//   }]
// }
```

### FatSecret Foods Search Request
```typescript
// Source: https://platform.fatsecret.com/docs/v3/foods.search [VERIFIED]
const token = await getFatSecretToken();
const url = new URL('https://platform.fatsecret.com/rest/foods/search/v3');
url.searchParams.set('search_expression', query);
url.searchParams.set('max_results', '15');
url.searchParams.set('format', 'json');
url.searchParams.set('flag_default_serving', 'true');

const resp = await fetch(url.toString(), {
  headers: { 'Authorization': `Bearer ${token}` },
});
const data = await resp.json();

// Response structure:
// {
//   foods_search: {
//     max_results: string,
//     total_results: string,
//     page_number: string,
//     results: {
//       food: [{                        // NOTE: may be object not array if 1 result!
//         food_id: string,
//         food_name: string,
//         food_type: "Brand" | "Generic",
//         brand_name?: string,
//         food_url: string,
//         servings: {
//           serving: [{                  // Same caveat: may be object if 1 serving
//             serving_id: string,
//             serving_description: string,
//             metric_serving_amount?: string,
//             metric_serving_unit?: string,
//             calories: string,          // All numeric values as strings!
//             protein: string,
//             fat: string,
//             carbohydrate: string,
//             saturated_fat?: string,
//             fiber?: string,
//             sodium?: string,
//             cholesterol?: string,
//             sugar?: string,
//             potassium?: string,
//           }]
//         }
//       }]
//     }
//   }
// }
```

### USDA Response Normalization
```typescript
// Source: Derived from USDA OpenAPI spec + NutritionData type [VERIFIED]
function normalizeUSDAFood(food: USDASearchFood): Partial<FoodItem> {
  const nutrition: Partial<NutritionData> = {};

  for (const n of food.foodNutrients) {
    const field = USDA_NUTRIENT_MAP[n.nutrientNumber];
    if (field) {
      (nutrition as any)[field] = n.value ?? 0;
    }
  }

  // USDA Foundation/SR Legacy data is already per 100g
  return {
    fdc_id: food.fdcId,
    name: food.description,
    name_normalized: food.description.toLowerCase().trim(),
    brand: food.brandOwner ?? null,
    barcode: food.gtinUpc ?? null,
    nutrition: {
      calories: 0, protein_g: 0, total_fat_g: 0,
      sodium_mg: 0, total_carbs_g: 0,
      ...nutrition,
    } as NutritionData,
    source: 'usda' as const,
    data_quality: food.dataType === 'Foundation' ? 90
      : food.dataType === 'SR Legacy' ? 80 : 40,
  };
}
```

### FatSecret Response Normalization
```typescript
// Source: Derived from FatSecret API docs + NutritionData type [VERIFIED]
function normalizeFatSecretFood(food: FSSearchFood): Partial<FoodItem> {
  const servingsRaw = food.servings?.serving;
  const servings = Array.isArray(servingsRaw) ? servingsRaw : servingsRaw ? [servingsRaw] : [];

  // Find per-100g serving or compute from first serving
  const per100g = servings.find(s => s.serving_description === '100 g');
  const baseServing = per100g || servings[0];

  if (!baseServing) return { name: food.food_name, source: 'fatsecret' } as any;

  const metricGrams = parseFloat(baseServing.metric_serving_amount || '100');
  const factor = per100g ? 1 : 100 / metricGrams;

  const nutrition: NutritionData = {
    calories: parseFloat(baseServing.calories || '0') * factor,
    protein_g: parseFloat(baseServing.protein || '0') * factor,
    total_fat_g: parseFloat(baseServing.fat || '0') * factor,
    total_carbs_g: parseFloat(baseServing.carbohydrate || '0') * factor,
    sodium_mg: parseFloat(baseServing.sodium || '0') * factor,
    saturated_fat_g: baseServing.saturated_fat ? parseFloat(baseServing.saturated_fat) * factor : undefined,
    dietary_fiber_g: baseServing.fiber ? parseFloat(baseServing.fiber) * factor : undefined,
    total_sugars_g: baseServing.sugar ? parseFloat(baseServing.sugar) * factor : undefined,
    cholesterol_mg: baseServing.cholesterol ? parseFloat(baseServing.cholesterol) * factor : undefined,
    potassium_mg: baseServing.potassium ? parseFloat(baseServing.potassium) * factor : undefined,
  };

  return {
    fatsecret_id: parseInt(food.food_id),
    name: food.food_name,
    name_normalized: food.food_name.toLowerCase().trim(),
    brand: food.brand_name ?? null,
    nutrition,
    source: 'fatsecret' as const,
    data_quality: food.food_type === 'Generic' ? 70 : 60,
    serving_sizes: servings.map(s => ({
      description: s.serving_description,
      amount_g: parseFloat(s.metric_serving_amount || '0'),
      nutrition: {
        calories: parseFloat(s.calories || '0'),
        protein_g: parseFloat(s.protein || '0'),
        total_fat_g: parseFloat(s.fat || '0'),
        total_carbs_g: parseFloat(s.carbohydrate || '0'),
        sodium_mg: parseFloat(s.sodium || '0'),
      } as NutritionData,
    })),
  };
}
```

### Client-Side Edge Function Call
```typescript
// Source: Derived from existing patterns in src/lib/vision.ts, src/lib/ai.ts [VERIFIED]
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('food-search', {
    body: { query },
  });

  if (error) {
    const ctx = (error as any).context;
    if (ctx && !ctx.bodyUsed) {
      const body = await ctx.json();
      if (body?.type === 'search_limit_exceeded') {
        throw new SearchLimitError(body.error, body.limit, body.used);
      }
      throw new Error(body?.error ?? 'Food search failed');
    }
    throw new Error(error.message);
  }

  return data?.results ?? [];
}
```

### Deduplication Strategy (Claude's Discretion)
```typescript
// Recommended approach: deduplicate by normalized name similarity
function deduplicateResults(
  usdaResults: Partial<FoodItem>[],
  fsResults: Partial<FoodItem>[]
): Partial<FoodItem>[] {
  const merged: Partial<FoodItem>[] = [...usdaResults];
  const usdaNames = new Set(usdaResults.map(r => r.name_normalized));

  for (const fs of fsResults) {
    // Skip if USDA already has a food with very similar name
    const isDuplicate = [...usdaNames].some(name =>
      name === fs.name_normalized ||
      name?.includes(fs.name_normalized!) ||
      fs.name_normalized?.includes(name)
    );
    if (!isDuplicate) {
      merged.push(fs);
    }
  }

  // Sort by data_quality descending
  return merged.sort((a, b) => (b.data_quality ?? 0) - (a.data_quality ?? 0));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FatSecret OAuth 1.0a | OAuth 2.0 Client Credentials | 2020+ | Simpler auth, no request signing |
| USDA Standard Reference (SR) | FoodData Central (FDC) | 2019 | SR data now in FDC as "SR Legacy" dataType |
| USDA NDB API | FDC API v1 | 2019 | Different endpoints, response format; NDB is deprecated |
| FatSecret food.search (v1) | foods.search (v3) | 2023+ | v3 includes serving nutrition inline, v1 required separate food.get |

**Deprecated/outdated:**
- USDA NDB API: Replaced by FDC API. Do not use `api.nal.usda.gov/ndb/` endpoints. [VERIFIED: USDA docs]
- FatSecret OAuth 1.0: Still supported but OAuth 2.0 is recommended and simpler. [VERIFIED: FatSecret docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FatSecret single-result returns object not array (XML-to-JSON quirk) | Pitfall 3 | Runtime crash on `.map()` -- easy to fix but must test with single-result queries |
| A2 | USDA search `sortBy: 'dataType.keyword'` puts Foundation results first | Code Examples | May need manual sort if API doesn't support this sort field -- fallback is client-side sort by `data_quality` |
| A3 | FatSecret "100 g" serving description is a reliable string match | Pattern 3 | If the exact string differs (e.g., "100g" without space), normalization will use fallback path |

## Open Questions

1. **FatSecret Premier Free tier approval status**
   - What we know: Tier exists, requires registration/approval for startups under $1M revenue
   - What's unclear: Whether the account has been registered and approved already
   - Recommendation: Code should work with `basic` scope as fallback; `premier` scope gives more data but basic covers search + nutrition

2. **USDA API key registration**
   - What we know: Free, instant registration at fdc.nal.usda.gov/api-key-signup
   - What's unclear: Whether the key has been obtained and set as Supabase secret
   - Recommendation: Edge Function should check for key presence and return clear error if missing (existing pattern from search-recipes)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Maestro E2E + manual curl testing for Edge Function |
| Config file | `.maestro/` directory (existing) |
| Quick run command | `supabase functions serve food-search --env-file supabase/.env.local` + `curl` |
| Full suite command | `maestro test .maestro/` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Search returns results from both USDA and FatSecret | manual curl | `curl -X POST http://localhost:54321/functions/v1/food-search -H "Authorization: Bearer ..." -d '{"query":"chicken breast"}'` | Wave 0 |
| SRCH-02 | Results include name, brand, macros | manual inspection | Verify response JSON has expected fields | Wave 0 |
| SRCH-03 | Tap result shows detailed nutrition | manual E2E | Tap food result, verify inline expand shows all NutritionData fields | Wave 0 |

### Wave 0 Gaps
- [ ] Edge Function can be tested via `supabase functions serve` + curl (no test file needed)
- [ ] UI testing via manual Expo Go walkthrough (search, scroll, tap expand)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Edge Function auth via `supabase.auth.getUser()` -- existing pattern |
| V3 Session Management | no | Handled by Supabase Auth globally |
| V4 Access Control | yes | Rate limiting (20/day free, unlimited premium); food_items is read-only for clients |
| V5 Input Validation | yes | Query string validation (min 2 chars, max length, sanitize before API call) |
| V6 Cryptography | no | No custom crypto; SHA-256 for cache key via Deno `crypto.subtle` |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure | Information Disclosure | Keys stored as Supabase secrets, never sent to client |
| Rate limit bypass | Denial of Service | Server-side enforcement via ai_usage_log count |
| Search injection to external APIs | Tampering | Validate/sanitize query before passing to USDA/FatSecret URLs |
| Cache poisoning | Tampering | Only service_role writes to food_items/food_search_cache (RLS enforced) |

## Sources

### Primary (HIGH confidence)
- [USDA FDC API Guide](https://fdc.nal.usda.gov/api-guide/) -- endpoints, rate limits, auth
- [USDA FDC OpenAPI Spec](https://fdc.nal.usda.gov/api-spec/fdc_api.html) -- SearchResultFood schema, nutrient fields
- [USDA FDC Sample Response](https://gist.github.com/magdiel01/3c82068d71a745788c04f49aa23d5244) -- foodNutrients array structure, nutrient IDs
- [FatSecret OAuth 2.0 Docs](https://platform.fatsecret.com/docs/guides/authentication/oauth2) -- token endpoint, 86400s lifetime, scopes
- [FatSecret foods.search v3](https://platform.fatsecret.com/docs/v3/foods.search) -- request params, response structure
- [FatSecret food.get v1](https://platform.fatsecret.com/docs/v1/food.get) -- serving nutrition fields
- Codebase: `supabase/functions/search-recipes/index.ts` -- Edge Function auth/rate-limit pattern
- Codebase: `supabase/functions/analyze-food-photo/index.ts` -- Edge Function premium check pattern
- Codebase: `src/components/ui/BottomSheet.tsx` -- @gorhom/bottom-sheet v5 wrapper
- Codebase: `src/components/social/KitchenSearchBar.tsx` -- debounce search pattern
- Codebase: `src/types/food.ts` -- FoodItem, NutritionData, FoodSearchResult types
- Codebase: `supabase/migrations/00022_create_food_tables.sql` -- food_items, food_search_cache tables
- Codebase: `src/lib/nutrition-utils.ts` -- scaleNutrition, sumNutrition utilities

### Secondary (MEDIUM confidence)
- [FatSecret API Editions](https://platform.fatsecret.com/api-editions) -- Premier Free tier details

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all APIs verified with official docs
- Architecture: HIGH -- all patterns verified against existing codebase + API documentation
- Pitfalls: HIGH (1-2, 4-6), MEDIUM (3 -- FatSecret array/object quirk is assumed based on common XML API pattern)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (APIs are stable; USDA FDC v1 and FatSecret v3 are current)
