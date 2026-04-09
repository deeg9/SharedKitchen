# Domain Pitfalls: Food Data Integration

**Domain:** Adding external food database APIs (USDA, Open Food Facts, FatSecret) and barcode scanning to an existing meal planning app
**Researched:** 2026-04-07
**Confidence:** HIGH (verified against official API docs and community reports)

---

## Critical Pitfalls

Mistakes that cause data corruption, rewrites, or major regressions in existing functionality.

### Pitfall 1: NutritionInfo Type Mismatch With Existing Schema

**What goes wrong:** SharedKitchen already stores nutrition data as a `NutritionInfo` JSONB column on `recipes` with string values (`calories?: string`, `protein?: string`, etc.) extracted from JSON-LD/schema.org. USDA, Open Food Facts, and FatSecret all return nutrition as **numeric values per 100g or per serving** with explicit units. Developers bolt the new API data directly onto the existing `NutritionInfo` interface, creating a system where some recipes have `"calories": "350 kcal"` (string from web scraping) and others have `"calories": 350` (number from USDA). Every downstream consumer (UI display, AI meal suggestions, daily totals) must handle both formats, leading to NaN errors, wrong totals, and silent data corruption.

**Why it happens:** The existing `NutritionInfo` interface in `src/types/database.ts` uses `string` types because schema.org nutrition values include units in the string (e.g., "350 calories", "25g protein"). USDA/OFF/FatSecret return structured numeric data with separate unit fields.

**Consequences:** Calorie totals show NaN. AI meal generator receives garbage nutrition context. Users see inconsistent formatting across recipes.

**Prevention:**
- Define a new canonical `NutritionData` interface with numeric fields, explicit units, and source attribution: `{ calories_kcal: number, protein_g: number, fat_g: number, ... source: 'usda' | 'off' | 'fatsecret' | 'scraped', per_serving: boolean }`.
- Write a migration function that parses existing string-based `NutritionInfo` into the new numeric format (extract numbers, normalize units).
- Add a DB migration to evolve the `nutrition_info` JSONB column or add a parallel `nutrition_data` column, backfill existing data, then deprecate the old format.
- Phase mapping: **Must be addressed in the first phase** (data layer/schema design) before any API integration.

**Detection:** Unit tests that assert nutrition values are always numeric. TypeScript strict typing on the new interface.

---

### Pitfall 2: Ingredient Name Mismatch Between Recipe Data and Food Database

**What goes wrong:** Existing recipes store ingredients as `{ amount: number, unit: string, name: string }` with freeform names like "chicken breast, boneless skinless", "2% milk", or "extra virgin olive oil". USDA Foundation Foods uses names like "Chicken, broilers or fryers, breast, skinless, boneless, meat only, raw". Open Food Facts uses product names like "Great Value 2% Reduced Fat Milk". FatSecret uses "Skinless Chicken Breast". Naive string matching (even fuzzy) between recipe ingredient names and food database entries produces wrong matches, leading to wildly inaccurate nutrition calculations (matching "chicken breast" to "chicken broth" or "chicken thigh with skin").

**Why it happens:** Food databases are designed for precise nutritional reference, not for matching against user-entered recipe ingredients. There is no universal food identifier shared across recipe websites and nutrition databases.

**Consequences:** Recipe nutrition totals are wrong by 50-300%. Users who care about nutrition lose trust. AI features make bad recommendations based on wrong data.

**Prevention:**
- Do NOT attempt real-time ingredient-to-food matching on the client. This is a server-side problem.
- Build an Edge Function that uses a combination of: (1) USDA search API with the ingredient name, (2) AI-assisted disambiguation using gpt-5-mini to select the best match from top-5 results, (3) a local mapping cache table (`ingredient_food_mappings`) that stores confirmed matches.
- Accept that automatic matching will have ~70-80% accuracy. Always show users which food database entry was matched and let them correct it.
- For common ingredients, pre-populate a curated mapping table (top 200 cooking ingredients to their USDA FDC IDs).
- Phase mapping: **Phase 2-3** (after data layer, as part of nutrition calculation engine).

**Detection:** Log match confidence scores. Alert when a recipe's total calories per serving exceeds 2000 or falls below 50 (likely bad matches).

---

### Pitfall 3: Serving Size and Unit Chaos Across Three APIs

**What goes wrong:** USDA reports nutrients per 100g. Open Food Facts reports per 100g AND per serving (but serving sizes vary wildly and are often missing). FatSecret reports per serving with serving descriptions like "1 cup" or "1 medium". Recipe ingredients use "2 tablespoons", "1/4 cup", "3 cloves". The app must convert between all these unit systems to calculate per-recipe and per-serving nutrition. Developers skip building a proper unit conversion layer and hardcode conversions, leading to off-by-10x errors (confusing grams with ounces, or per-100g with per-serving).

**Why it happens:** This is a documented issue in the FatSecret developer community -- recipe units and food database units frequently don't match. The USDA API returns "portion" descriptions that don't always parse cleanly. Open Food Facts serving sizes are user-contributed and inconsistent.

**Consequences:** A recipe shows 5,000 calories per serving because an ingredient was matched per-100g but the recipe uses 1 tablespoon. Users immediately lose trust in the nutrition feature.

**Prevention:**
- Build a dedicated unit conversion module that handles: weight (g, kg, oz, lb), volume (ml, L, tsp, tbsp, cup, fl oz), and count (each, clove, slice, medium, large).
- Always normalize to grams internally. Convert ingredient amounts to grams using density tables for common foods (1 cup flour = 120g, 1 cup sugar = 200g, 1 tbsp olive oil = 13.5g).
- Store the conversion factor alongside the match: `{ fdc_id: 12345, amount_grams: 13.5, original_amount: 1, original_unit: 'tbsp' }`.
- The app already has metric/imperial toggle (v2.0). This conversion layer must integrate with it, not duplicate it.
- Phase mapping: **Phase 1** (core data layer, must exist before any nutrition calculations).

**Detection:** Sanity bounds on all nutrition calculations: per-ingredient calorie check (flag if > 900 kcal per ingredient line), per-recipe check (flag if total < 100 or > 5000 kcal for a 4-serving recipe).

---

### Pitfall 4: USDA API Rate Limit Causing Cascading Failures

**What goes wrong:** USDA FoodData Central limits to 1,000 requests per hour per API key. When a user opens a recipe with 15 ingredients and the app fires 15 parallel food search requests, that is 15 of the 1,000 hourly budget. A household of 4 users browsing 10 recipes in an hour could burn through 600 requests. Add barcode lookups, pantry additions, and search-as-you-type, and the rate limit is exceeded within the first day of launch. Once exceeded, the API key is blocked for 1 hour, killing nutrition features for ALL users.

**Why it happens:** The USDA API key is shared across all Edge Function invocations. Unlike per-user rate limits (which SharedKitchen already implements for AI features), USDA limits are per-key globally.

**Consequences:** All nutrition lookups fail for all users for 1 hour. No graceful degradation -- features just break.

**Prevention:**
- **Cache aggressively in Postgres.** Create a `food_data_cache` table that stores USDA responses keyed by FDC ID. Most foods don't change. Set a 30-day TTL for cache entries.
- **Never call USDA for the same food twice.** Before any API call, check the cache.
- **Batch searches.** USDA's `/foods` endpoint accepts multiple FDC IDs in one call (up to 20). When calculating recipe nutrition, batch all ingredient lookups into 1-2 API calls instead of 15.
- **Implement a server-side request queue** in the Edge Function with rate tracking. If approaching the limit, serve from cache only and defer new lookups.
- **Register multiple API keys** for different functions (search vs. lookup vs. barcode) to multiply the effective limit.
- Consider downloading the USDA Foundation Foods dataset (~300MB CSV) and importing it into Postgres for zero-API-call lookups on common foods.
- Phase mapping: **Phase 1** (caching infrastructure must exist before any API calls go live).

**Detection:** Monitor API call counts per hour in Edge Function logs. Alert at 750/1000.

---

## Technical Debt Patterns

Issues that work initially but become expensive to fix as the feature matures.

### Debt 1: Storing Raw API Responses Instead of Normalized Data

**What goes wrong:** Developers store the raw JSON from USDA, OFF, and FatSecret in a single JSONB column. Each API has a completely different schema (USDA uses `foodNutrients[].nutrient.nutrientId`, OFF uses `nutriments.energy-kcal_100g`, FatSecret uses `calories`). Every UI component and calculation function must handle all three formats.

**Prevention:** Normalize all external data into a single canonical schema at ingestion time. Store the raw response separately (or not at all) for debugging. The canonical `foods` table should have consistent columns regardless of source.

### Debt 2: No Source Attribution on Nutrition Data

**What goes wrong:** Nutrition values are stored without recording where they came from. Six months later, when USDA updates their database or a user reports wrong data, there is no way to know which values came from USDA vs. Open Food Facts vs. web scraping vs. user edits.

**Prevention:** Every nutrition record must include: `source` (usda/off/fatsecret/scraped/user), `source_id` (FDC ID, OFF barcode, FatSecret food_id), `fetched_at` timestamp, and `confidence` (high/medium/low).

### Debt 3: Pantry Items Without Food Database Links

**What goes wrong:** The existing `pantry_items` table has freeform `name`, `quantity`, and `unit` fields with no foreign key to any food database. Barcode scanning creates new pantry items linked to food database entries, but existing pantry items (from grocery list auto-copy and AI fridge scanning) remain unlinked. The app ends up with two classes of pantry items: "smart" ones with nutrition data and "dumb" ones without, creating an inconsistent user experience.

**Prevention:** Add an optional `food_id` (nullable FK) and `food_source` column to `pantry_items`. When displaying nutrition, gracefully handle items without links (show "nutrition not available" rather than hiding the section). Build a background process or user flow to link existing pantry items to food database entries over time.

---

## Integration Gotchas

Specific to combining USDA + Open Food Facts + FatSecret.

### Gotcha 1: Same Food, Three Different Calorie Counts

**What goes wrong:** "Whole milk" in USDA Foundation Foods: 61 kcal/100g. In Open Food Facts (specific brand): 65 kcal/100g. In FatSecret: 60 kcal/100g. When the app shows nutrition for a recipe ingredient, which value wins? If different recipes use different sources, the daily total becomes meaningless.

**Prevention:** Establish a clear source priority hierarchy and document it:
1. **User override** (highest) -- if the user manually edited nutrition, preserve it.
2. **Barcode match** (Open Food Facts or FatSecret) -- if the user scanned a specific product, use that product's data.
3. **USDA Foundation Foods** -- gold standard for generic/unbranded ingredients.
4. **USDA Branded Foods** -- for branded items not found via barcode.
5. **FatSecret** -- fallback for items not in USDA.
6. **Web-scraped** (lowest) -- existing `NutritionInfo` from recipe import.

Always show the source to the user: "Nutrition from USDA" or "Nutrition from Kroger Whole Milk (scanned)".

### Gotcha 2: Open Food Facts Data Quality is Highly Variable

**What goes wrong:** Open Food Facts is crowd-sourced. Many products have incomplete nutrition (only calories, missing protein/fat/carbs). Some have clearly wrong data (e.g., 5000 calories per serving for a candy bar -- the contributor entered kJ instead of kcal). Some barcodes resolve to products from the wrong country.

**Prevention:**
- Validate OFF responses: check that calories, protein, fat, and carbs are all present and non-null. If any core field is missing, mark the entry as "partial" and fall back to USDA search.
- Sanity-check values: calories per 100g should be between 0 and 900. Protein + fat + carbs should roughly account for the calorie total (protein*4 + fat*9 + carbs*4 within 20% of calories).
- Use the `completeness` or `nutrition_grade_fr` (Nutri-Score) fields from OFF to gauge data quality.
- Always display a "Report incorrect data" option for crowd-sourced entries.

### Gotcha 3: FatSecret OAuth 2.0 Complexity

**What goes wrong:** FatSecret uses OAuth 2.0 for its API (client credentials flow for server-to-server). Developers familiar with simple API key auth (like USDA) forget that FatSecret tokens expire and must be refreshed. The Edge Function gets a 401, doesn't handle token refresh, and all FatSecret lookups fail silently.

**Prevention:**
- Implement token caching with TTL in the Edge Function. FatSecret access tokens are valid for a limited time.
- Build a helper function that checks token expiry before each request and refreshes if needed.
- Handle 401 responses by refreshing the token and retrying once before failing.

### Gotcha 4: Barcode Formats and Regional Differences

**What goes wrong:** UPC-A (US, 12 digits), EAN-13 (international, 13 digits), and UPC-E (compressed, 8 digits) all exist. A US product might have a UPC-A barcode but be stored in Open Food Facts as EAN-13 (with a leading zero). The scanner returns "012345678901" but OFF expects "0012345678901". Lookup fails, user thinks the feature is broken.

**Prevention:**
- Normalize all barcodes to EAN-13 format (13 digits, zero-padded on the left) before any API lookup.
- Try both the raw scanned code and the normalized version.
- Open Food Facts also supports searching by the barcode without leading zeros via their API.
- Implement fallback: if OFF returns no result, try FatSecret barcode search, then USDA branded foods search.

### Gotcha 5: expo-barcode-scanner is Deprecated

**What goes wrong:** Developers add `expo-barcode-scanner` (the standalone package) which was deprecated in Expo SDK 51. It may still install but will have bugs and eventually be removed entirely.

**Prevention:** Use `expo-camera` (CameraView component) with `onBarcodeScanned` callback. This is the officially supported approach as of Expo SDK 52+. SharedKitchen already uses `expo-camera` for the food photo features (v4.0), so barcode scanning should reuse the same camera infrastructure.

---

## Performance Traps

### Trap 1: Calculating Nutrition on Every Recipe View

**What goes wrong:** When a user opens a recipe detail, the app loops through all ingredients, looks up each in the food database, converts units, and calculates totals. This adds 2-5 seconds to every recipe view (even for previously viewed recipes) and makes the recipe detail screen feel sluggish compared to its current instant-load behavior.

**Prevention:**
- Calculate and cache recipe nutrition at write time (when recipe is created/edited or when ingredient-food mappings are confirmed). Store the computed totals on the recipe row itself.
- Only recalculate when ingredients change or when the user explicitly requests a nutrition refresh.
- Show cached nutrition immediately; if stale, refresh in background.

### Trap 2: Search-as-You-Type Against External APIs

**What goes wrong:** The food search feature fires an API request on every keystroke. User types "chick" -- 5 requests in 2 seconds. This burns through rate limits and creates a laggy experience.

**Prevention:**
- Debounce search input (300-500ms minimum).
- Use local Postgres full-text search against the cached food data as the primary search. Only hit external APIs when local search returns < 3 results.
- Pre-populate the local food cache with USDA Foundation Foods (~7,000 common foods) so most searches never need an external API call.

### Trap 3: Barcode Scanner Re-Renders Killing Performance

**What goes wrong:** The barcode scanner fires `onBarcodeScanned` continuously (every frame where a barcode is detected). Without throttling, this triggers dozens of API lookups and re-renders per second, freezing the UI.

**Prevention:**
- Set a flag after the first successful scan and ignore subsequent callbacks until the user explicitly triggers a new scan.
- Use `barcodeScannerSettings={{ isHighlightingEnabled: false }}` and process only the first detected barcode per scan session.
- Show a loading/result overlay immediately after first detection.

---

## UX Pitfalls

### UX 1: Nutrition Display Overwhelming the Recipe Experience

**What goes wrong:** The recipe detail screen is currently clean and cooking-focused. Adding a full nutrition facts panel (calories, 13 vitamins, 8 minerals from USDA) buries the cooking instructions and makes the screen feel like a medical document instead of a recipe card.

**Prevention:**
- Show only the "big 4" by default: calories, protein, fat, carbs (per serving).
- Offer expandable "Full nutrition" section for users who want detail.
- Match the existing Culinary Curator design language -- warm, inviting, not clinical.
- Keep nutrition secondary to the cooking experience.

### UX 2: Barcode Scanner With No Result is a Dead End

**What goes wrong:** User excitedly scans a product barcode. The product isn't in Open Food Facts or FatSecret. The app shows "Product not found" with no next step. User feels the feature is broken.

**Prevention:**
- On "not found": offer to (1) search by product name instead, (2) manually enter basic nutrition info, (3) take a photo of the nutrition label for AI extraction using the existing Gemini vision pipeline.
- Track "not found" barcodes to identify gaps and potentially contribute back to Open Food Facts.

### UX 3: Nutrition Data Conflicts Confuse Users

**What goes wrong:** A recipe imported from a website shows "350 calories" (from schema.org scraping). After food database integration, the calculated nutrition from USDA ingredient data shows "425 calories". The user sees both numbers and doesn't know which to trust.

**Prevention:**
- When calculated nutrition differs from scraped nutrition by more than 15%, show the calculated value with a note: "Calculated from ingredients (USDA data)".
- Provide a way to toggle between "Source website nutrition" and "Calculated nutrition".
- Default to calculated (more accurate) but be transparent about the source.

---

## "Looks Done But Isn't" Checklist

Items that pass a demo but fail in production.

- [ ] **Offline mode**: USDA/OFF/FatSecret all require network. Cached data must work offline. Currently, SharedKitchen works offline for most features. Food data features must not regress this.
- [ ] **Existing recipe backfill**: The 380K+ USDA foods are available, but existing user recipes need their ingredients mapped to food database entries. This is not automatic -- requires a migration strategy and user-facing "link your ingredients" flow.
- [ ] **Metric/imperial consistency**: The app has a metric/imperial toggle (v2.0). Nutrition is always in metric (kcal, g). The toggle must NOT convert nutrition units (nobody says "0.88 oz of protein"). But ingredient amounts in the nutrition calculation must respect the user's unit preference.
- [ ] **Premium gating**: Which food data features are free vs. premium? Barcode scanning? Detailed nutrition? Per-ingredient breakdown? This needs a clear decision before implementation, not after.
- [ ] **AI feature integration**: The existing AI meal generator and recipe parser should use food database data for better suggestions. This is not "add nutrition display" -- it requires updating AI prompts and context to include structured nutrition constraints.
- [ ] **Multi-household scope**: Food database cache should be global (not per-household). But recipe nutrition calculations are per-recipe (household-scoped). Pantry food links are per-household. RLS must reflect this.
- [ ] **Data freshness**: USDA Branded Foods updates monthly. Open Food Facts updates continuously. Cached data needs a TTL and refresh strategy, not just "cache forever".
- [ ] **Edge Function cold starts**: Adding USDA/OFF/FatSecret API calls to Edge Functions increases cold start time. Multiple sequential API calls (search, then fetch details) in a single function invocation can hit the Supabase Edge Function timeout (default 60s).

---

## Pitfall-to-Phase Mapping

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|---|---|---|---|
| Schema & data layer design | NutritionInfo type mismatch (Pitfall 1) | CRITICAL | Design canonical nutrition schema first, migrate existing data |
| Schema & data layer design | Serving size/unit chaos (Pitfall 3) | CRITICAL | Build unit conversion module with density tables |
| Schema & data layer design | No source attribution (Debt 2) | HIGH | Include source/confidence in schema from day one |
| Schema & data layer design | Pantry items without food links (Debt 3) | MEDIUM | Add nullable food_id FK to pantry_items |
| API integration (USDA) | Rate limit cascade (Pitfall 4) | CRITICAL | Cache-first architecture, batch API calls, consider local dataset import |
| API integration (USDA) | USDA data type confusion | MEDIUM | Use Foundation Foods for generics, Branded Foods for products |
| API integration (OFF) | Data quality variance (Gotcha 2) | HIGH | Validate completeness, sanity-check values, fallback chain |
| API integration (OFF) | Barcode format mismatch (Gotcha 4) | MEDIUM | Normalize to EAN-13, try multiple formats |
| API integration (FatSecret) | OAuth token management (Gotcha 3) | MEDIUM | Token caching with auto-refresh in Edge Function |
| API integration (all) | Conflicting nutrition values (Gotcha 1) | HIGH | Establish source priority hierarchy, show source to user |
| API integration (all) | Raw response storage (Debt 1) | HIGH | Normalize at ingestion, canonical schema |
| Ingredient matching | Name mismatch (Pitfall 2) | CRITICAL | AI-assisted matching, curated mapping table, user confirmation |
| Barcode scanning | expo-barcode-scanner deprecated (Gotcha 5) | MEDIUM | Use expo-camera CameraView, reuse existing camera infra |
| Barcode scanning | Scanner re-renders (Trap 3) | MEDIUM | Throttle to one scan per session |
| Barcode scanning | No-result dead end (UX 2) | MEDIUM | Fallback to name search, manual entry, or photo OCR |
| Nutrition display | Overwhelming recipe screen (UX 1) | MEDIUM | Big-4 default, expandable detail |
| Nutrition display | Scraped vs calculated conflict (UX 3) | MEDIUM | Show calculated with source attribution |
| Performance | Nutrition calc on every view (Trap 1) | HIGH | Calculate at write time, cache on recipe row |
| Performance | Search-as-you-type rate burn (Trap 2) | HIGH | Debounce + local-first search |
| Integration testing | Offline regression | HIGH | Ensure cached data works without network |
| Integration testing | Existing recipe backfill | HIGH | Migration strategy + user-facing linking flow |

---

## Sources

- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/) -- rate limits, data types, API structure
- [USDA FoodData Central FAQ](https://fdc.nal.usda.gov/faq/) -- data type differences, SR Legacy deprecation
- [USDA Data Documentation](https://fdc.nal.usda.gov/data-documentation/) -- Foundation vs Branded vs SR Legacy
- [Open Food Facts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/) -- usage policy, rate limits
- [Open Food Facts Data & API](https://world.openfoodfacts.org/data) -- barcode format, data fields
- [FatSecret Platform API Docs](https://platform.fatsecret.com/docs/guides) -- OAuth, rate limits
- [FatSecret Unit Mismatch Issue](https://groups.google.com/g/fatsecret-platform-api/c/UD-zRYNQFDE) -- recipe vs food unit discrepancy
- [Nutrition API Accuracy Testing](https://dev.to/raviteja_nekkalapu_/i-tested-8-nutrition-apis-with-the-same-query-only-2-returned-correct-data-4kfg) -- only 2/8 APIs returned correct data
- [expo-barcode-scanner to expo-camera Migration](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md) -- deprecated library migration
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/) -- CameraView barcode scanning API
- [Expo Camera Barcode iOS Issues](https://github.com/expo/expo/issues/26764) -- SDK 50 iOS barcode bugs
- SharedKitchen codebase: `src/types/database.ts` (existing NutritionInfo interface, pantry_items schema), `src/lib/jsonld.ts` (existing schema.org nutrition extraction), `supabase/migrations/00014_add_recipe_nutrition_and_timers.sql` (existing nutrition column)
