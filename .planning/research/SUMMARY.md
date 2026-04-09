# Project Research Summary

**Project:** SharedKitchen v6.0 — Food Data Integration
**Domain:** External food database APIs + barcode scanning in an existing meal planning app
**Researched:** 2026-04-07
**Confidence:** HIGH

## Executive Summary

SharedKitchen v6.0 introduces a structured food data layer on top of an existing collaborative cooking and meal planning app. The existing stack (Expo SDK 55, Supabase, Zustand, Gemini 2.5 Flash, Stripe) is validated and unchanged. The new work adds three free external food APIs (USDA FoodData Central, Open Food Facts, FatSecret Premier Free), one new npm package (expo-camera, already used for fridge scanning), three new Supabase Edge Functions, and four new Postgres tables. The approach is additive and follows established codebase patterns throughout — API keys stored as Supabase secrets, Edge Functions as the API proxy layer, Zustand for client state, and Postgres for caching.

The recommended approach treats nutrition as **informational context on existing data**, not a new tracking workflow. This is the key strategic distinction from competitors like MyFitnessPal and Cronometer, which are diet trackers that bolted on recipes. SharedKitchen remains a household cooking planner where nutrition enriches the existing recipe, pantry, and meal planning flows. The household dimension — shared nutrition views across multiple members — is a genuine differentiator no competitor currently offers. LLM-powered ingredient matching via Gemini 2.5 Flash (an existing integration) is the other differentiator: it handles colloquial recipe text ("a handful of spinach," "a splash of olive oil") where competitor keyword matching fails.

The highest technical risk in the entire milestone is ingredient-to-food matching accuracy. Mapping free-text recipe ingredients like "chicken breast, boneless skinless" to USDA FoodData Central entries is a hard NLP problem with ~70-80% auto-match accuracy. Gemini-assisted matching plus a curated pre-populated mapping table for the top 200 cooking ingredients will bring this to an acceptable level, but user-facing confirmation flows and nutrition "partial" states are required from the start. Three other critical risks — NutritionInfo type mismatch between the existing string-based schema and the new numeric API data, unit conversion chaos across three APIs with incompatible serving size formats, and USDA API rate limit cascading failures — must all be resolved in the data layer phase before any API integration work begins.

## Key Findings

### Recommended Stack

The new stack is minimal by design: one npm package, three Edge Functions, four Postgres tables, and three free external APIs. All external API calls are proxied through Edge Functions to protect API keys and enable shared caching. The `food_items` Postgres table is the canonical food data cache with a 30-day TTL, nutrition normalized to per-100g, and a trigram GIN index for local fuzzy search. A `food_search_cache` table with 24h TTL prevents redundant API calls for repeated queries.

USDA FoodData Central is the nutrition backbone (380K+ foods, free, 1,000 req/hr, government-validated). Open Food Facts handles barcode lookups (2.8M+ global products, no auth required). FatSecret Premier Free fills branded food gaps in USDA and provides fallback barcode resolution (OAuth 2.0 client credentials, attribution required). expo-camera's built-in `onBarcodeScanned` callback replaces the deprecated expo-barcode-scanner and supports all grocery barcode formats in Expo managed workflow with no native rebuild.

**Core technologies:**
- USDA FoodData Central API: nutrition data backbone — free, authoritative, 380K+ foods, 1,000 req/hr via Edge Function proxy
- Open Food Facts API v2: barcode lookup — free, no auth, 2.8M+ products, primary barcode source
- FatSecret Platform API (Premier Free): branded food data and fallback search — fills USDA gaps, OAuth 2.0 client credentials, attribution required
- expo-camera (~55.0.14): barcode scanning — only new npm package, SDK 55 compatible, supports UPC/EAN natively
- Postgres tsvector + GIN index: local food search — no external search service needed at this data volume
- Supabase Edge Functions (Deno): API proxy layer — follows existing 8-function pattern exactly

### Expected Features

The existing codebase stores all food data as unstructured text with no canonical food entity. This milestone creates that entity and links it across recipes, pantry, and grocery list. Every competitor nutrition app shows per-recipe calories and macros; not having this makes the feature feel incomplete. Ingredient-to-food matching is the hardest and most critical piece — without it, nothing else computes accurately.

**Must have (table stakes):**
- Per-recipe nutrition summary (calories + macros per serving) — every competitor has this; SharedKitchen's `nutrition_info` column is currently populated only from scraped source URLs
- Searchable food database with autocomplete — standard expectation in any nutrition-aware app
- Barcode scanner for packaged foods — expected by users who scan groceries; expo-camera already in use for fridge scanning
- Nutrition label display component — reusable across recipe detail, meal plan, and search results
- Ingredient-to-food matching engine — critical path; nothing else computes correctly without it
- Daily/weekly nutrition totals from meal plan — natural extension once per-recipe nutrition is established

**Should have (competitive differentiators):**
- Household nutrition dashboard — no competitor offers shared/household nutrition; unique to SharedKitchen's multi-user model
- AI-enhanced ingredient matching via Gemini — handles colloquial measurements competitors' keyword matching misses
- Nutrition-aware meal suggestions — extends existing AI meal generator with nutritional intelligence
- Barcode-to-pantry quick add — natural extension of existing fridge scan flow with different input
- Smart grocery list with nutrition context — low effort, high perceived value

**Defer (v2+):**
- Household nutrition dashboard (needs usage data to inform design)
- Dietary goal tracking (needs user research on household vs individual goals)
- Nutrition-aware meal suggestions (needs stable nutrition data before building AI on top)
- Recipe nutrition comparison
- Smart grocery list nutrition inline display

**Do not build (anti-features):**
- Full calorie diary / food logging — competes with MFP where SharedKitchen cannot win
- Exercise/fitness tracking — different domain entirely
- User-contributed food database — data quality risk; use verified sources only
- Micronutrient deep-dive (82 nutrients) — Cronometer's niche; show "big 7" by default
- Macro/calorie targets with enforcement — creates anxiety in shared household context

### Architecture Approach

The architecture is strictly layered: React Native client calls Supabase Edge Functions exclusively; Edge Functions proxy to external APIs and write to Postgres; client reads from Postgres directly for display. No client-to-external-API calls exist. New components (`food-search`, `food-barcode` Edge Functions; `foodStore` Zustand store; `BarcodeScanner`, `FoodSearchSheet`, `NutritionCard`, `NutritionSummary` UI components) are additive. Existing components (`pantryStore`, `recipeStore`, `generate-meal`, `analyze-food-photo`) receive backward-compatible modifications. The `Ingredient` type gets optional `food_id` and `nutrition_per_serving` fields; existing recipes continue working with null values for both.

**Major components:**
1. `food-search` Edge Function — unified text search across USDA + FatSecret; parallel fetch, merge, dedup, rank, cache in `food_items`
2. `food-barcode` Edge Function — waterfall barcode lookup: Postgres cache → Open Food Facts → FatSecret fallback
3. `food_items` Postgres table — canonical food data cache; nutrition normalized per 100g; shared across all households; 30-day TTL
4. `foodStore` (Zustand) — client-side search results, barcode scan state, nutrition display cache
5. `NutritionCard` / `NutritionSummary` — reusable display components; big-4 default with expandable detail
6. Nutrition normalization layer — canonical `NutritionData` interface; normalizers for USDA/OFF/FatSecret response formats
7. Unit conversion module — weight, volume, and count units; normalizes to grams for computation; density tables for common foods

### Critical Pitfalls

1. **NutritionInfo type mismatch** — existing schema stores nutrition as strings ("350 kcal"); new APIs return numbers. Define canonical `NutritionData` with numeric fields and migrate existing data in Phase 1, before any API integration.

2. **Serving size and unit chaos** — USDA reports per 100g, OFF per 100g + per serving (inconsistent), FatSecret per serving with variable descriptions. Build a dedicated unit conversion module in Phase 1. Store conversion factor alongside every ingredient match. Apply sanity bounds to all computed nutrition.

3. **USDA rate limit cascade** — 1,000 req/hr per key is shared across all users. Cache-first architecture is mandatory: check `food_items` before any external call; batch multi-ingredient lookups into single USDA `/foods` calls; never call USDA twice for the same food.

4. **Ingredient name mismatch** — "chicken breast, boneless skinless" vs USDA's formal naming. Gemini-assisted disambiguation is required. Accept ~70-80% auto-match accuracy. Pre-populate curated mapping for top 200 ingredients. Always show matched entry and allow user correction. Show "partial" indicator when some ingredients are unlinked.

5. **Open Food Facts data quality variance** — crowd-sourced; many products have incomplete or wrong nutrition. Validate completeness (all core macros present), sanity-check calorie math (protein×4 + fat×9 + carbs×4 ≈ total within 20%), fall back to USDA text search when OFF data is partial.

## Implications for Roadmap

Based on research, a 6-phase build order is well-justified by critical dependencies. Data model must precede APIs; APIs must precede client; integration with existing features must follow proven new stack; AI enhancements come last. Skipping or reordering phases creates blocking rework.

### Phase 1: Data Foundation
**Rationale:** Three critical pitfalls (NutritionInfo type mismatch, unit chaos, source attribution) create downstream data corruption if not resolved before API integration begins. This phase has zero external dependencies and can be fully validated with unit tests.
**Delivers:** `food_items` + `food_search_cache` Postgres migrations with RLS; canonical `FoodItem` and `NutritionData` TypeScript types; `nutrition-utils.ts` (unit conversion, scaling, computation with sanity bounds); `food-normalize.ts` shared module; `pantry_items` migration adding nullable `food_id` FK.
**Addresses:** Nutrition data foundation, ingredient matching foundation
**Avoids:** NutritionInfo type mismatch (Pitfall 1), unit chaos (Pitfall 3), source attribution technical debt

### Phase 2: Edge Functions (Backend)
**Rationale:** Backend before frontend. Edge Functions can be tested with curl. FatSecret OAuth2 complexity is isolated and resolved before any UI is built. USDA rate limit protection is built into the cache-first lookup pattern at this layer.
**Delivers:** `fatsecret-client.ts` with OAuth2 token caching + auto-refresh; `food-search` Edge Function (parallel USDA + FatSecret, dedup, rank, cache); `food-barcode` Edge Function (waterfall: Postgres → OFF → FatSecret); USDA rate limit protection.
**Uses:** USDA FDC API, Open Food Facts API, FatSecret API, Supabase Secrets pattern
**Avoids:** USDA rate limit cascade (Pitfall 4), FatSecret OAuth token failures (Gotcha 3), barcode format mismatch (normalize to EAN-13)

### Phase 3: Client Store and Core UI
**Rationale:** Store connects Edge Functions to UI. Build the reusable NutritionCard here so it can be dropped into any screen in later phases without redesign.
**Delivers:** `foodStore` Zustand store; `FoodSearchSheet` with autocomplete; `NutritionCard` (big-4 default, expandable detail); `FoodItemRow` search result component.
**Implements:** foodStore, FoodSearchSheet, NutritionCard architecture components
**Avoids:** Nutrition display overwhelming recipe screen (big-4 default, not 82 nutrients)

### Phase 4: Barcode Scanner
**Rationale:** Isolated to contain native build risk from expo-camera installation. Limits blast radius if EAS Build issues arise.
**Delivers:** expo-camera installed; `BarcodeScanner` component with throttled scan (one scan per session); `useBarcodeScanner` hook; barcode-to-pantry quick add flow; graceful "not found" UX (fallback to name search or Gemini photo OCR).
**Avoids:** Scanner re-render performance trap (Trap 3), expo-barcode-scanner deprecation (Gotcha 5), no-result dead end (UX 2)

### Phase 5: Integration with Existing Features
**Rationale:** Integration touches existing stable features. The ingredient matching engine — highest-risk piece — lands here after data layer and APIs are proven. Building on a solid foundation avoids regressions.
**Delivers:** Ingredient type extension (optional `food_id`, `nutrition_per_serving`); `IngredientFoodLinker` component; `recipeStore.computeRecipeNutrition()` (computes at write time, caches on recipe row); nutrition display on RecipeDetail and Plan screens; `NutritionSummary` daily/weekly totals; Gemini-assisted ingredient matching.
**Avoids:** Ingredient name mismatch (Pitfall 2 — Gemini + curated mapping + user confirmation), nutrition calculation on every recipe view (Trap 1 — compute at write time), offline regression

### Phase 6: AI Enhancement
**Rationale:** AI enhancements are additive and depend on accurate nutrition data from prior phases. Building AI on top of unresolved ingredient matching would compound errors.
**Delivers:** Modified `generate-meal` with nutrition context (daily consumed totals vs recommended values); modified `analyze-food-photo` to match identified foods to `food_items`; household nutrition dashboard view.
**Avoids:** AI receiving garbage nutrition context from unresolved type mismatches

### Phase Ordering Rationale

- Data foundation comes first because type mismatch and unit chaos create silent data corruption in every downstream consumer if not resolved before API integration.
- Backend before frontend because Edge Functions can be independently tested and OAuth/rate-limit complexity is best resolved in isolation before any UI depends on it.
- Barcode scanning is isolated in its own phase to contain native build risk from expo-camera installation.
- Integration with existing features comes after the new stack is proven to minimize regression risk in recipe/pantry/plan flows.
- AI enhancements come last because they depend on nutrition data being both present and accurate — the ingredient matching accuracy baseline must be validated before building AI reasoning on top of it.
- The waterfall API strategy and parallel search merge pattern established in Phase 2 are inherited by all later phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Ingredient Matching):** Gemini prompt engineering for ingredient-to-food disambiguation has no precedent in the codebase. Prompt design, confidence threshold decisions, and hit rate measurement need a dedicated planning session.
- **Phase 5 (Curated Mapping Table):** Pre-populating top 200 cooking ingredients with correct USDA FDC IDs is a data curation task that benefits from research before implementation.
- **Phase 6 (AI Enhancement):** Prompt engineering for nutrition-aware meal suggestions (daily gap analysis → recipe recommendation) is novel and may need iteration.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Foundation):** Postgres migrations, TypeScript interfaces, and unit conversion math are well-documented standard patterns.
- **Phase 2 (Edge Functions):** All three APIs have official documentation. OAuth2 client credentials and cache-first patterns are established. Follow existing Edge Function conventions exactly.
- **Phase 3 (Client Store + Core UI):** Zustand store creation and bottom sheet UI follow existing codebase patterns.
- **Phase 4 (Barcode Scanner):** expo-camera barcode scanning is officially documented; SharedKitchen already uses expo-camera for fridge scanning.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All APIs have official documentation verified. expo-camera barcode support confirmed for SDK 55. Postgres tsvector GIN is Supabase-documented. Only uncertainty: FatSecret Premier Free approval process timeline. |
| Features | HIGH | Based on official API docs, competitor feature analysis across 5 apps, and detailed existing codebase review. Anti-features are well-justified with competitive context. |
| Architecture | HIGH | Existing codebase architecture well-understood. New patterns (waterfall lookup, parallel merge, OAuth token caching in Deno) are straightforward extensions of established codebase patterns. |
| Pitfalls | HIGH | Critical pitfalls verified against official API docs, FatSecret developer community reports, and direct inspection of existing database schema types. |

**Overall confidence:** HIGH

### Gaps to Address

- **FatSecret Premier Free approval:** The tier exists per pricing page but requires registration and approval. Exact rate limits need confirmation. If denied or delayed, treat FatSecret as fallback-only with USDA as primary for both search and branded foods.
- **Ingredient matching accuracy baseline:** The ~70-80% estimate comes from general NLP matching research, not SharedKitchen-specific data. Real-world accuracy needs measurement in Phase 5 to determine if curated mapping needs more than 200 entries.
- **Gemini prompt for ingredient disambiguation:** No existing prompt in codebase. Prompt design and testing is required before Phase 5 can be accurately estimated.
- **Premium gating decision:** Which food data features are free vs. premium (barcode scanning? detailed nutrition? per-ingredient breakdown?) is a product decision that must be made before Phase 4-5 implementation begins.
- **USDA Foundation Foods pre-population:** Whether to seed `food_items` with USDA Foundation Foods (~7,000 common foods) at Phase 1 vs. letting the cache populate organically needs a planning decision. Pre-population would eliminate most API calls for common foods.

## Sources

### Primary (HIGH confidence)
- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/) — endpoints, rate limits, data types, API key auth
- [USDA FDC OpenAPI Specification](https://fdc.nal.usda.gov/api-spec/fdc_api.html) — complete response schemas
- [USDA FDC Data Documentation](https://fdc.nal.usda.gov/data-documentation/) — Foundation vs Branded vs SR Legacy data types
- [Open Food Facts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/) — no auth, rate limits, barcode lookup format
- [Open Food Facts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/) — product fields, field selection, usage guidelines
- [FatSecret OAuth 2.0 Documentation](https://platform.fatsecret.com/docs/guides/authentication/oauth2) — client credentials flow, token expiry
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/) — CameraView, onBarcodeScanned, supported barcode types in SDK 52+
- [Expo Barcode Scanner Migration Guide](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md) — expo-barcode-scanner removed in SDK 51+, use expo-camera
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search) — tsvector, GIN index, textSearch() client method
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) — Deno fetch, secrets, architecture

### Secondary (MEDIUM confidence)
- [FatSecret API Editions and Pricing](https://platform.fatsecret.com/api-editions) — Premier Free tier existence and attribution requirements (approval process not documented in detail)
- [FatSecret Unit Mismatch Issue](https://groups.google.com/g/fatsecret-platform-api/c/UD-zRYNQFDE) — recipe vs food unit discrepancy reported in developer community
- [Nutrition API Accuracy Testing (2026)](https://dev.to/raviteja_nekkalapu_/i-tested-8-nutrition-apis-with-the-same-query-only-2-returned-correct-data-4kfg) — only 2/8 APIs returned correct data; validates USDA + FatSecret selection
- [Top Nutrition APIs for Developers 2026](https://www.spikeapi.com/blog/top-nutrition-apis-for-developers-2026) — ecosystem context
- [Best Nutrition Tracking Apps 2026](https://rouvy.com/blog/best-apps-for-nutrition-tracking) — competitor feature landscape

### Tertiary (LOW confidence)
- Ingredient matching accuracy (~70-80%) — inferred from general NLP food entity extraction literature, not SharedKitchen-specific measurement; needs validation in Phase 5.

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
