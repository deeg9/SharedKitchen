# Phase 36: Food Search - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can search for any food by name and see nutrition information from a unified database. This phase delivers: a `food-search` Edge Function querying USDA FoodData Central + FatSecret with cache-first lookup, a Zustand foodStore, a FoodSearchSheet bottom sheet UI accessible from the Kitchen tab, and inline nutrition detail expansion for search results.

</domain>

<decisions>
## Implementation Decisions

### Search Interface Design
- Bottom sheet (FoodSearchSheet) for food search — consistent with existing search patterns (recipe search, kitchen search overlay)
- "Search Foods" button on Kitchen tab's On Hand section as entry point
- 300ms debounce with minimum 2 characters before triggering search
- "Search any food for nutrition info" placeholder in empty state

### API Integration Architecture
- Single `food-search` Edge Function querying USDA + FatSecret + local Postgres cache — matches single-function pattern (analyze-food-photo handles both scan/identify)
- API keys as Supabase secrets: USDA_API_KEY, FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET
- Cache-first strategy: check Postgres food_items table first, only hit external APIs on cache miss (mandatory — USDA 1K/hr global rate limit)
- FatSecret OAuth 2.0 client credentials flow (server-to-server) in Edge Function

### Nutrition Display
- Detailed nutrition expands inline within search results sheet — keeps context, no navigation away
- Horizontal pill row for macro display: "180 cal · 12g protein · 8g carbs · 6g fat" — compact, scannable
- Brand displayed as subtitle under food name: "Chicken Breast" / "Tyson® Grilled Chicken"
- Rate limiting: 20 searches/day free, unlimited premium — reuse existing ai_usage_log pattern

### Claude's Discretion
- Result deduplication strategy when same food appears from both USDA and FatSecret
- Pagination/infinite scroll if many results
- Error handling UX for API failures
- foodStore structure and method naming

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/scan/` — bottom sheet patterns for camera/scan flows
- `src/components/kitchen/` — Kitchen tab components, On Hand section
- `src/stores/pantryStore.ts` — pantry data management, can be extended
- `supabase/functions/analyze-food-photo/` — Edge Function pattern with auth, rate limiting, Gemini
- `supabase/functions/search-recipes/` — Serper.dev search pattern
- `src/types/food.ts` — FoodItem, NutritionData, FoodSource types (Phase 35)
- `src/lib/nutrition-utils.ts` — volumeToGrams, scaleNutrition, formatNutrition (Phase 35)
- `supabase/migrations/00022_create_food_tables.sql` — food_items, food_search_cache tables (Phase 35)

### Established Patterns
- Zustand stores for client state (recipeStore, pantryStore, socialStore)
- Edge Functions: Deno, auth check via supabase client, rate limiting via ai_usage_log
- Bottom sheets: React Native Modal or @gorhom/bottom-sheet
- Debounced search: existing pattern in kitchen search overlay

### Integration Points
- Kitchen tab: add "Search Foods" entry point alongside existing camera/scan buttons
- foodStore: new Zustand store for food search state and results
- food-search Edge Function: new function in supabase/functions/
- food_items table: write cache entries on API responses
- food_search_cache table: cache search query results

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the accepted grey area decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
