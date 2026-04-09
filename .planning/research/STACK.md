# Technology Stack: v6.0 Food Data Integration

**Project:** SharedKitchen
**Researched:** 2026-04-07
**Scope:** New additions only -- existing stack (Expo SDK 55, Supabase, Zustand, Gemini 2.5 Flash, Stripe) is validated and unchanged.

## Recommended Stack

### External Food APIs (called from Edge Functions, NOT client)

| Technology | Version/Tier | Purpose | Why |
|------------|-------------|---------|-----|
| USDA FoodData Central API | v1 | Nutrition data backbone (380K+ foods) | Free, authoritative US government data. Foundation Foods + SR Legacy cover whole foods; Branded Foods covers 350K+ packaged items. 1,000 req/hr rate limit is generous for Edge Function proxy. API key is free and instant. |
| Open Food Facts API | v2 | Barcode lookup for packaged foods | Free, no auth required, 2.8M+ products globally, no rate limit. Community-maintained with broad international coverage. Barcode endpoint returns nutriments per 100g directly. |
| FatSecret Platform API | Premier Free (OAuth 2.0) | Verified branded food data, fills gaps between USDA and OFF | 1.9M+ food items with daily updates. Premier Free tier available for startups (<$1M revenue). OAuth 2.0 client_credentials flow fits Edge Function pattern. Requires attribution in UI. |

**API call flow:** Client -> Supabase Edge Function -> External API -> Cache result in Postgres -> Return to client. API keys stored as Supabase secrets (same pattern as SERPER_API_KEY, GEMINI_API_KEY).

**Waterfall lookup strategy for barcode scans:**
1. Check `barcode_cache` table first (instant, free)
2. Open Food Facts barcode endpoint (free, no auth, broadest barcode coverage)
3. FatSecret food search as fallback (if OFF has no result)
4. Return "not found" with option to manually enter

**Waterfall lookup strategy for text search:**
1. Check local `foods` cache table via Postgres full-text search (instant)
2. USDA FoodData Central search endpoint (authoritative nutrition data)
3. FatSecret search for branded items USDA may lack
4. Merge and deduplicate results, cache in `foods` table

### Client Libraries (new npm packages)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| expo-camera | ~55.0.14 | Barcode scanning via CameraView | SDK 55 compatible. Built-in barcode scanning via `onBarcodeScanned` prop on `CameraView` component. Supports EAN-13, EAN-8, UPC-A, UPC-E, Code-128 -- all standard grocery barcodes. Replaces the deprecated (and removed) expo-barcode-scanner. No native rebuild needed in Expo managed workflow. |

**That is the only new npm package.** Everything else is backend (Edge Functions + Postgres). All external API calls happen server-side using Deno's native `fetch()`.

### Supabase Edge Functions (new)

| Function | Purpose | External API | Auth |
|----------|---------|-------------|------|
| search-foods | Searchable food/ingredient database | USDA FoodData Central + FatSecret | User auth required |
| lookup-barcode | Barcode -> product + nutrition data | Open Food Facts, FatSecret fallback | User auth required |
| get-food-nutrition | Detailed nutrition for a specific food by source ID | USDA or FatSecret (by cached food_id) | User auth required |

**Pattern:** Follow existing Edge Function conventions exactly:
- CORS headers object
- Supabase Auth check via `getUser()`
- Admin client with `SUPABASE_SERVICE_ROLE_KEY` for writes
- Rate limiting via `ai_usage_log` table (reuse for food API calls)
- `Deno.env.get()` for API keys
- Native `fetch()` for external calls

### Database (Postgres tables -- no new extensions needed)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `foods` | Cached food data from all three APIs | id (UUID), fdc_id (int, nullable), off_barcode (text, nullable), fatsecret_id (int, nullable), name (text), brand (text, nullable), source (enum: usda/off/fatsecret), category (text, nullable), serving_size (text), serving_unit (text), search_vector (tsvector, generated) |
| `food_nutrients` | Nutrition facts per food | food_id (FK foods), nutrient_name (text), amount (numeric), unit (text), per_serving (numeric, nullable), per_100g (numeric) |
| `recipe_nutrition` | Computed aggregate nutrition per recipe | recipe_id (FK recipes), calories (numeric), protein_g (numeric), carbs_g (numeric), fat_g (numeric), fiber_g (numeric), sodium_mg (numeric), computed_at (timestamptz) |
| `barcode_cache` | Barcode -> food_id for instant repeat lookups | barcode (text, primary key), food_id (FK foods), last_verified_at (timestamptz) |

**Full-text search:** Use Postgres `tsvector` generated column on `foods.name || ' ' || coalesce(foods.brand, '')` with a GIN index. Query via Supabase JS client `.textSearch('search_vector', query)`. No external search engine needed -- Postgres FTS handles hundreds of thousands of food records easily with GIN indexing. This is the same approach Supabase officially documents.

### Supporting Libraries (already installed, no changes)

| Library | Already Installed | Use For Food Data |
|---------|-------------------|-------------------|
| @supabase/supabase-js | Yes | Client calls to new Edge Functions, `.textSearch()` for food search, standard CRUD for recipe_nutrition |
| zustand | Yes | New `foodStore` for search results, barcode scan state, nutrition display cache |
| expo-image | Yes (~55.0.8) | Display product images from Open Food Facts CDN |
| @shopify/flash-list | Yes (^2.3.1) | Food search results list (performant for long result sets) |
| expo-haptics | Yes (if installed) | Haptic feedback on successful barcode scan |
| expo-image-manipulator | Yes (~55.0.11) | Not needed for this milestone (no image upload) |

## Installation

```bash
# Only ONE new client package
npx expo install expo-camera

# Edge Function secrets (via Supabase CLI)
supabase secrets set USDA_API_KEY=your_key_here
supabase secrets set FATSECRET_CLIENT_ID=your_client_id
supabase secrets set FATSECRET_CLIENT_SECRET=your_client_secret
# Open Food Facts needs NO API key
```

**No new Supabase extensions required.** Full-text search uses built-in `tsvector`/`to_tsvector()`/GIN available in every Postgres instance. No pgvector, no pg_trgm, nothing extra.

## API Authentication Details

### USDA FoodData Central
- **Auth:** API key as query parameter `?api_key=YOUR_KEY`
- **Signup:** https://fdc.nal.usda.gov/api-key-signup/ (instant, free, no approval)
- **Rate limit:** 1,000 requests/hour per IP address
- **Key endpoints:**
  - `GET https://api.nal.usda.gov/fdc/v1/foods/search?query={term}&dataType=Foundation,SR%20Legacy,Branded&pageSize=25&api_key={key}`
  - `GET https://api.nal.usda.gov/fdc/v1/food/{fdcId}?api_key={key}`
- **Data types to query:** Foundation Foods (whole ingredients, best quality), SR Legacy (comprehensive legacy data), Branded Foods (packaged items with labels)
- **Nutrient fields:** Response includes `foodNutrients` array with `nutrientName`, `value`, `unitName` per nutrient

### Open Food Facts
- **Auth:** None required (set `User-Agent: SharedKitchen/6.0` header per their guidelines)
- **Rate limit:** None enforced (be respectful, cache aggressively)
- **Key endpoint:**
  - `GET https://world.openfoodfacts.net/api/v2/product/{barcode}?fields=product_name,brands,nutriments,image_url,categories,serving_size`
- **Response structure:** `nutriments` object contains `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`, `sodium_100g`, `sugars_100g`
- **Status codes:** `status: 1` = found, `status: 0` = not found

### FatSecret
- **Auth:** OAuth 2.0 Client Credentials (server-to-server)
  1. POST `https://oauth.fatsecret.com/connect/token`
  2. Authorization header: `Basic base64(client_id:client_secret)`
  3. Body: `grant_type=client_credentials&scope=basic`
  4. Returns `{ access_token, expires_in, token_type: "Bearer" }`
  5. Cache token in Edge Function (or Postgres row with expiry) -- tokens last ~24h
- **Rate limit:** 5,000 requests/day (Basic free); higher on Premier Free
- **Key endpoints:**
  - `GET https://platform.fatsecret.com/rest/foods/search/v1?search_expression={term}&format=json` (Bearer token in header)
  - `GET https://platform.fatsecret.com/rest/food/v4?food_id={id}&format=json`
- **Attribution requirement:** Must display "Powered by FatSecret" where FatSecret-sourced data appears. Plan for a small attribution line on nutrition cards that show FatSecret data.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Barcode scanning | expo-camera (built-in) | react-native-vision-camera | Requires native rebuild / custom dev client, not in Expo managed SDK. expo-camera covers all grocery barcode types natively in managed workflow. |
| Barcode scanning | expo-camera (built-in) | Scanbot SDK | Commercial license ($500+/yr), overkill for simple product barcode lookup. |
| Food search | Postgres tsvector + GIN | Algolia / Typesense / Meilisearch | External service adds cost and complexity. Postgres FTS handles 100K-500K food records easily with GIN index. SharedKitchen's food cache will be well under 100K records. |
| Food search | Postgres tsvector + GIN | Supabase pgvector (semantic search) | Semantic search is overkill for food name lookup. Users search "chicken breast" not "lean poultry protein." Keyword matching via tsvector is simpler, faster, and requires no embedding model. |
| Nutrition API | USDA + OFF + FatSecret (free) | Nutritionix | $299/mo minimum for production. Three free APIs cover same data. |
| Nutrition API | USDA + OFF + FatSecret (free) | Spoonacular | $29-$299/mo. Bundles recipe features SharedKitchen already has. Paying for capabilities we don't need. |
| Nutrition API | USDA + OFF + FatSecret (free) | Edamam Nutrition API | Free tier limited to 100 calls/day. USDA alone provides 1,000/hr. |
| API proxy | Supabase Edge Functions | Direct client API calls | Exposes API keys to client bundle. Edge Functions keep keys server-side. This is the established codebase pattern. |
| Food data cache | Postgres tables | Redis | Postgres is already the primary data store. Caching food lookups in a `foods` table means subsequent searches hit the DB first (instant, free) before making external API calls. No need for a separate cache layer. |
| Food data cache | Postgres tables | AsyncStorage | Food data must be shared across household members, survive reinstalls, and be searchable. AsyncStorage is device-local and not queryable. |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| expo-barcode-scanner | **Removed** from Expo SDK 51+. Completely gone. Use expo-camera's built-in barcode scanning instead. |
| Any npm nutrition SDK (nutritionix, fatsecret-js, etc.) | No well-maintained RN-compatible SDKs exist for these APIs. Use native `fetch()` in Edge Functions. Keeps client dependency count minimal. |
| Spoonacular / Nutritionix / Edamam | Paid APIs that duplicate what USDA + OFF + FatSecret provide for free. Combined free tier coverage exceeds any single paid API. |
| react-native-vision-camera | Requires custom dev client / native rebuild. expo-camera barcode scanning is sufficient for product barcodes. |
| External search engine (Algolia, Meilisearch) | Unnecessary at this data volume. Postgres FTS with GIN index is more than adequate. |
| GraphQL layer | REST Edge Functions are the established pattern across 8 existing functions. Adding GraphQL for food queries would be architecturally inconsistent. |
| Calorie counting / macro tracking libraries | Build nutrition display from raw data in `food_nutrients` table. No SDK needed for simple arithmetic (sum ingredient nutrients for recipe totals). |
| react-native-reanimated for scanner overlay | Simple View + StyleSheet overlay is sufficient for barcode scanner UI. Don't over-animate the scanner frame. |

## Integration Points with Existing Stack

| Existing System | How Food Data Integrates |
|----------------|--------------------------|
| **Edge Functions** | New functions (`search-foods`, `lookup-barcode`, `get-food-nutrition`) follow identical pattern to `search-recipes` and `analyze-food-photo`: auth check, rate limit, external fetch, JSON response. |
| **Supabase Secrets** | `USDA_API_KEY`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` stored same way as `GEMINI_API_KEY`, `SERPER_API_KEY`. |
| **Supabase Postgres** | New tables (`foods`, `food_nutrients`, `recipe_nutrition`, `barcode_cache`) with RLS policies. `foods` table uses `tsvector` generated column for search. |
| **Zustand stores** | New `foodStore` for search state, barcode results, nutrition display. Same create/pattern as `recipeStore`, `pantryStore`. |
| **Gemini 2.5 Flash** | Enhanced AI: `generate-meal` Edge Function can query `recipe_nutrition` to suggest meals that hit calorie/macro targets. Prompts enriched with actual nutrition data instead of guessing. |
| **Existing recipes** | `recipe_nutrition` table links to `recipes` via `recipe_id`. Nutrition computed by summing constituent ingredient `food_nutrients`. |
| **Existing pantry** | Barcode scan adds items to `pantry_items` with `food_id` FK, enabling nutrition lookup for on-hand ingredients. |
| **Existing grocery list** | Grocery items can optionally link to `foods` table for nutrition-aware shopping. |
| **expo-image** | Display product images from Open Food Facts `image_url` field using existing cached image rendering. |
| **@shopify/flash-list** | Food search results displayed in FlashList for performant scrolling through long result lists. |

## Environment Variables (New Supabase Secrets)

| Variable | Where | How to Get |
|----------|-------|------------|
| `USDA_API_KEY` | Supabase Edge Function secrets | Sign up at https://fdc.nal.usda.gov/api-key-signup/ (instant, free) |
| `FATSECRET_CLIENT_ID` | Supabase Edge Function secrets | Register at https://platform.fatsecret.com/register (requires approval for Premier Free) |
| `FATSECRET_CLIENT_SECRET` | Supabase Edge Function secrets | Provided after FatSecret app registration |

Open Food Facts requires NO API key or secret. Just set a proper `User-Agent` header.

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|------------|-------|
| USDA FoodData Central as nutrition backbone | HIGH | Official government API, well-documented OpenAPI spec, free, widely used in nutrition apps |
| Open Food Facts for barcode lookup | HIGH | Official docs confirm free/no-auth v2 barcode endpoint, 2.8M+ products verified |
| FatSecret Premier Free eligibility | MEDIUM | Tier exists per pricing page, but approval process and exact Premier Free limits need verification during signup |
| expo-camera ~55.0.14 for barcode scanning | HIGH | Expo official docs confirm built-in barcode scanning since SDK 52; project is on SDK 55; supports all grocery barcode formats |
| Postgres tsvector for food search | HIGH | Supabase official documentation, proven pattern at this data volume, GIN index well-documented |
| Edge Function proxy pattern | HIGH | Matches existing codebase exactly (8 existing Edge Functions use identical auth/fetch/respond pattern) |
| Only 1 new npm package needed | HIGH | All API calls are server-side in Edge Functions using native Deno fetch(); no client SDKs exist or are needed |
| Waterfall lookup strategy | MEDIUM | Logical based on API coverage and cost, but exact hit rates (what % of barcodes OFF covers vs FatSecret) need real-world testing |

## Sources

- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/) -- endpoints, rate limits, auth (HIGH confidence)
- [USDA FDC OpenAPI Specification](https://fdc.nal.usda.gov/api-spec/fdc_api.html) -- complete endpoint spec (HIGH confidence)
- [USDA FDC Data Documentation](https://fdc.nal.usda.gov/data-documentation/) -- data types explained (HIGH confidence)
- [USDA FDC API Key Signup](https://fdc.nal.usda.gov/api-key-signup/) -- free instant registration (HIGH confidence)
- [Open Food Facts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/) -- v2 endpoints, field selection, barcode lookup (HIGH confidence)
- [Open Food Facts API Introduction](https://openfoodfacts.github.io/openfoodfacts-server/api/) -- no auth, no rate limit confirmed (HIGH confidence)
- [FatSecret API Editions & Pricing](https://platform.fatsecret.com/api-editions) -- Premier Free tier, attribution requirements (MEDIUM confidence)
- [FatSecret OAuth 2.0 Documentation](https://platform.fatsecret.com/docs/guides/authentication/oauth2) -- client credentials flow (HIGH confidence)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/) -- CameraView, onBarcodeScanned, supported barcode types (HIGH confidence)
- [Expo Barcode Scanner Migration Guide](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md) -- expo-barcode-scanner removed, use expo-camera (HIGH confidence)
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search) -- tsvector, GIN index, textSearch() client method (HIGH confidence)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) -- Deno fetch, secrets, architecture (HIGH confidence)

---
*Stack research for: SharedKitchen v6.0 Food Data Integration*
*Researched: 2026-04-07*
