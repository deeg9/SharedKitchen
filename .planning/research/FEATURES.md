# Feature Landscape: Food Data Integration

**Domain:** Food database integration for collaborative cooking/meal planning app
**Researched:** 2026-04-07
**Overall confidence:** HIGH (based on official API docs, competitor analysis, existing codebase review)

## Context: What Already Exists

SharedKitchen already has:
- **Recipe ingredients** stored as JSONB array: `{ amount, unit, name, section }` -- free-text, no food DB linkage
- **Nutrition info** on recipes: `nutrition_info` JSONB column with `{ calories, protein, fat, carbohydrates, fiber, sodium, sugar }` -- extracted from source URLs during import, often missing or incomplete
- **Pantry items** with `{ name, quantity, unit, category, expires_at }` -- also free-text, no food DB linkage
- **Grocery items** with `{ name, quantity, estimated_price, section }` -- free-text, section constrained to 5 categories
- **AI fridge scanning** via Gemini 2.5 Flash -- identifies items by name, no nutritional enrichment
- **Food photo identification** -- identifies dishes, no nutrition data returned
- **Dietary preferences/restrictions** -- stored per user, used by AI meal generator

The core gap: **all food data is unstructured text**. There is no canonical food entity linking ingredients, pantry items, and grocery items to verified nutritional data. This milestone fills that gap.

---

## Table Stakes

Features users expect when a cooking app advertises "nutrition data." Missing any of these makes the feature feel incomplete.

| Feature | Why Expected | Complexity | Depends On (existing) | Notes |
|---------|-------------|------------|----------------------|-------|
| **Per-recipe nutrition summary** | Every competitor (MFP, Cronometer, Yazio, Samsung Food) shows calories + macros per recipe. SharedKitchen already has a `nutrition_info` column but it is only populated from scraped source URLs -- most manual recipes have no nutrition data. | Medium | Ingredient-to-food-DB matching, existing recipe detail screen | Must calculate from ingredient list, not just display scraped data. Show per-serving. Replace current incomplete scrape-only approach. |
| **Searchable food database** | Users expect to look up any food and see its nutrition. Standard in every nutrition-aware app. | Medium | USDA + FatSecret API integration | Unified search across multiple databases. Autocomplete is table stakes (FatSecret provides autocomplete endpoint). |
| **Barcode scanner for packaged foods** | MyFitnessPal, Yazio, Cronometer, and every nutrition app has this. Users scan groceries routinely. | Medium | Open Food Facts + FatSecret barcode APIs, expo-camera (already used for fridge scanning) | expo-camera already supports barcode detection via `onBarcodeScanned`. Extend existing camera infrastructure. |
| **Nutrition label display** | Standard visual format. Users recognize the FDA-style nutrition facts layout. At minimum: calories, fat, protein, carbs, fiber, sodium. | Low | Per-recipe nutrition calculation | Familiar nutrition card or simplified label. Not a raw data dump. Reusable component across recipe detail, meal plan, search results. |
| **Ingredient-to-food matching** | Core plumbing. Without this, nothing else works accurately. Every recipe nutrition calculator does this behind the scenes. | HIGH | USDA FoodData Central API, ingredient text parsing | Parse "2 cups diced chicken breast" into `{ fdc_id, amount_grams }`. This is the hardest part of the entire milestone. LLM-assisted matching is the right approach given existing Gemini integration. |
| **Daily/weekly nutrition totals from meal plan** | If you show nutrition per recipe, users expect their day/week totals. Cronometer, MFP, and Yazio all show daily summaries. | Medium | Per-recipe nutrition + existing meal_plans table | Sum across planned meals. Show macros + calories at minimum. Natural extension of existing weekly meal plan calendar. |

## Differentiators

Features that set SharedKitchen apart. Not expected in a meal planner, but create real value -- especially leveraging the household model.

| Feature | Value Proposition | Complexity | Depends On (existing) | Notes |
|---------|-------------------|------------|----------------------|-------|
| **Household nutrition dashboard** | "Our household ate X calories, Y protein this week." No competitor does shared/household nutrition -- they are all individual-user. This is unique to SharedKitchen's collaborative model. | Medium | Daily/weekly nutrition totals + existing household model | Leverage multi-user household architecture. Show per-member and aggregate household view. |
| **Smart grocery list with nutrition context** | Show nutrition info inline on grocery items ("chicken breast: 165cal / 31g protein per serving"). Helps budget-conscious families make informed shopping decisions. | Low | Ingredient-to-food matching + existing grocery_items table | Small UI addition but high perceived value. Link grocery items to food DB entries. |
| **AI-enhanced ingredient matching via Gemini** | Use existing Gemini integration to disambiguate fuzzy ingredient text ("a handful of spinach" -> ~30g baby spinach, "a splash of olive oil" -> ~15ml). Competitors use keyword matching; LLM handles colloquial measurements. | Medium | Existing Gemini 2.5 Flash integration + USDA data | Edge Function that takes ingredient text, returns structured food match. Cache results aggressively -- same ingredient text always maps to same food. |
| **Nutrition-aware meal suggestions** | "Your plan is low on protein today -- here are high-protein recipes from your library." Extends existing AI meal generator with nutritional intelligence. | Medium | Daily nutrition totals + existing AI meal generator + dietary preferences | Build on existing "Surprise Me" and AI suggestion cards. Add nutrition context to prompt. |
| **Barcode-to-pantry quick add** | Scan a grocery bag: barcode -> product name + nutrition -> straight to pantry inventory. Extends existing fridge scan flow (photo -> items -> pantry) with barcode path. | Low | Barcode scanner + existing pantryStore + bulkAddPantryItems | Natural UX parallel to existing multi-photo fridge scan. Different input (barcode vs photo), same destination (pantry). |
| **Recipe nutrition comparison** | Side-by-side nutrition comparison when choosing between recipes for a meal slot. "Chicken Alfredo vs Chicken Stir-Fry: which is lighter?" | Low | Per-recipe nutrition calculation | Useful during meal planning. Simple comparison card UI. |

## Anti-Features

Features to explicitly NOT build. These are traps that look appealing but are wrong for SharedKitchen.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full calorie counting / food diary** | SharedKitchen is a collaborative cooking planner, not a diet tracker. MFP/Cronometer own this space with 14M+ food items and decade-long user habits. Adding per-meal manual food logging turns the app into something it is not and competes where it cannot win. | Show nutrition as informational context on recipes and meal plans. Never require users to log every bite. Nutrition is a lens on existing data, not a new data entry workflow. |
| **Exercise/fitness tracking** | Scope creep into health/fitness. Completely different domain, different users, different competitors (Apple Health, Strava, MyFitnessPal). | Stay focused on cooking + food data. If users want fitness integration, they can use Apple Health which already aggregates across apps. |
| **User-contributed food database** | Crowdsourced nutrition data is notoriously inaccurate. MyFitnessPal's biggest user complaint is inconsistent data (200-400 calorie daily discrepancies from bad user entries). Moderation is expensive and never-ending. | Use verified sources only: USDA (government-validated), FatSecret (professionally verified 2.3M items), Open Food Facts (structured community validation with edit history). |
| **Micronutrient deep-dive (82 vitamins/minerals)** | Cronometer's niche. Most SharedKitchen users (families planning dinner) care about calories + macros. Displaying 82 nutrients overwhelms the UI and the target user. | Show the big 7: calories, protein, fat, carbs, fiber, sugar, sodium. Make extended data available on tap-to-expand for power users but do not clutter the default view. USDA data includes all micronutrients if needed later. |
| **Custom food creation with manual nutrition entry** | Invites garbage data. Users rarely know accurate per-100g nutrition info. Creates the same data quality problem as crowdsourced databases. | Always link to database entries. If a food is not found, use Gemini to estimate from the closest USDA match and flag as "estimated." |
| **Nutrition label generator for sharing/printing** | FDA compliance tool for food businesses, not a consumer feature. Requires regulatory expertise and creates liability. | Display nutrition info for personal use within the app only. No export/print/share of nutrition labels. |
| **Macro/calorie targets with enforcement** | Turns informational nutrition into prescriptive dieting. Creates anxiety around food for families. Eating disorder risk in a shared household context where one member might enforce calorie goals on others. | If dietary goals are added later, make them personal (not household-enforced), informational (not restrictive), and optional. Never lock features behind hitting targets. |

## Feature Dependencies

```
USDA FDC API integration ─────────┐
                                   ├──> Unified Food Search ──> Ingredient-to-Food Matching ──> Per-Recipe Nutrition
FatSecret API integration ────────┘       (autocomplete)          (Gemini-assisted)              (calculate from matched ingredients)
                                                                        │
Open Food Facts API ──> Barcode Scanner ──> Barcode-to-Pantry          │
                         (expo-camera)       (existing pantryStore)     ├──> Daily/Weekly Nutrition Totals
                                                                        │     (aggregate from meal_plans + recipes)
                                                                        │
                                                                        ├──> Nutrition Label UI Component
                                                                        │     (reusable across screens)
                                                                        │
                                                                        ├──> Household Nutrition Dashboard
                                                                        │     (existing household model)
                                                                        │
                                                                        ├──> Nutrition-Aware Meal Suggestions
                                                                        │     (existing AI meal generator)
                                                                        │
                                                                        └──> Smart Grocery List
                                                                              (existing grocery_items)

EXISTING FEATURES FEEDING IN:
  recipes.ingredients (JSONB) ────────> Ingredient-to-Food Matching (input text)
  recipes.nutrition_info (JSONB) ──────> Nutrition Label Component (display, replace with calculated data)
  meal_plans table ────────────────────> Daily/Weekly Nutrition Totals
  pantryStore + bulkAddPantryItems ────> Barcode-to-Pantry Quick Add
  AI meal generator (Gemini) ──────────> Nutrition-Aware Meal Suggestions
  expo-camera (fridge scan flow) ──────> Barcode Scanner (same camera, different detection mode)
  dietary_preferences ─────────────────> Nutrition-Aware Meal Suggestions
```

**Critical path:** API integrations -> Unified food search -> Ingredient matching -> Recipe nutrition -> Everything else.

**Parallel track:** Barcode scanning (Open Food Facts + FatSecret barcode) can be built independently once APIs are integrated.

## MVP Recommendation

### Phase 1-2: Core Nutrition Engine (must ship together)

1. **USDA FoodData Central + FatSecret API integration** -- Edge Functions wrapping both APIs behind unified interface. USDA for comprehensive nutrition data (380K+ foods, free, 1,000 req/hr). FatSecret for branded foods and autocomplete (Premier Free tier, no rate limits, US dataset).
2. **Unified food search with autocomplete** -- Single search endpoint federating both APIs. Deduplicate by matching food names. FatSecret autocomplete for real-time suggestions, USDA for detailed nutrition on selection.
3. **Ingredient-to-food matching engine** -- Gemini-powered Edge Function: takes ingredient text array from recipe, returns matched food_ids + gram amounts. Cache matches in Postgres mapping table (ingredient_text -> food_match). This is the highest-risk, highest-value feature.
4. **Per-recipe nutrition calculation** -- Server-side calculation from matched ingredients. Update `recipes.nutrition_info` with calculated values. Display nutrition card on recipe detail screen using new reusable component.

### Phase 3: Barcode + Aggregation

5. **Barcode scanner** -- expo-camera `onBarcodeScanned` + Open Food Facts barcode lookup (4M+ products, free) + FatSecret barcode fallback. Quick-add to pantry with nutrition data.
6. **Daily/weekly nutrition totals** -- Aggregate nutrition across meal plan entries for day/week view. Display on Plan tab.
7. **Nutrition label display component** -- Polished, reusable UI component following Culinary Curator design system.

### Defer to v6.x or v7.0

- **Household nutrition dashboard** -- needs usage data to inform design
- **Dietary goal tracking** -- needs user research on household vs individual goals
- **Nutrition-aware meal suggestions** -- needs stable nutrition data before building AI on top
- **Recipe nutrition comparison** -- nice-to-have, low urgency
- **Smart grocery list nutrition** -- low effort but depends on solid ingredient matching

## Competitor Feature Analysis

| Feature | MyFitnessPal | Cronometer | Yazio | Samsung Food | Whisk | **SharedKitchen v6** |
|---------|-------------|-----------|-------|-------------|-------|---------------------|
| Food database source | 14M+ crowdsourced (accuracy issues) | NCCDB + USDA (small, verified) | 2M+ curated | Unclear | Edamam | USDA 380K + FatSecret 2.3M (verified only) |
| Barcode scanner | Premium ($19.99/mo) | Free | Free | No | No | Free (Open Food Facts + FatSecret) |
| Per-recipe nutrition | Yes (manual entry) | Yes (ingredient matching) | Premium only | Yes (auto-calculated) | Yes (Edamam) | Yes (Gemini-assisted matching from USDA) |
| Meal plan nutrition totals | Yes (daily diary) | Yes (daily view) | Yes (daily) | No | No | Yes (daily + weekly on Plan tab) |
| Household/shared nutrition | No | No | No | No | No | **Yes -- unique differentiator** |
| Ingredient matching method | Keyword search | NLP + manual | Keyword | NLP (Samsung) | Edamam NLP | **LLM-powered (Gemini)** -- handles colloquial text |
| Nutrition display depth | Basic macros | 82 nutrients | Basic macros (premium: more) | Basic macros | Basic macros | Big 7 default + expandable detail |
| Food diary / calorie logging | Core feature | Core feature | Core feature | No | No | **Intentionally not built** |
| Custom food entry | Yes (quality problem) | Yes | Yes | No | No | **Intentionally not built** |
| Primary identity | Diet tracker | Nutrient tracker | Diet + fasting app | Recipe platform | Meal planner | **Household cooking planner** |

**Key insight:** Every competitor is either a diet tracker that bolted on recipes (MFP, Cronometer, Yazio) or a recipe app that bolted on basic nutrition (Samsung Food, Whisk). SharedKitchen is uniquely positioned as a **household cooking planner where nutrition is informational context, not a tracking obligation**. The household dimension and LLM-powered ingredient matching are genuine differentiators.

## Complexity Assessment

| Area | Complexity | Why | Risk |
|------|-----------|-----|------|
| API integrations (USDA, OFF, FatSecret) | **Medium** | Well-documented REST APIs. Edge Functions for auth/caching. USDA needs API key, FatSecret needs OAuth 2.0, OFF needs custom User-Agent. | Low -- standard REST integration |
| Unified food search | **Medium** | Federate 3 APIs behind one search. Need deduplication when same food appears in USDA and FatSecret. | Medium -- dedup logic needs thought |
| Ingredient parsing + matching | **HIGH** | The hardest part. "2 cups diced chicken breast, skin removed" must become `{ fdc_id: 171077, amount_grams: 280 }`. Unit conversion (cups->grams varies by food), modifier handling (diced, cooked, raw), compound ingredients (marinara sauce). | HIGH -- LLM helps but accuracy needs validation |
| Barcode scanning | **Medium** | expo-camera barcode detection works. Open Food Facts has 4M+ products. FatSecret barcode endpoint returns full nutrition. | Low -- well-trodden path |
| Nutrition calculation | **Low-Medium** | Arithmetic: `sum(ingredient_grams * nutrient_per_100g / 100) / servings`. Edge cases: missing data for some nutrients, variable serving sizes. | Low -- straightforward once matching works |
| Nutrition UI components | **Low** | Standard card components. Follow existing Culinary Curator design system (tonal layering, ghost borders, Plus Jakarta Sans). | Low -- UI pattern is well-established |
| Meal plan aggregation | **Low** | SQL join: `meal_plans JOIN recipes -> sum nutrition_info`. Group by day or week. | Low -- straightforward aggregation |
| Food data caching | **Medium** | Cache USDA/FatSecret responses in Postgres to reduce API calls and improve latency. Invalidation strategy for quarterly USDA updates. | Low-Medium -- standard caching pattern |

## Sources

- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/) -- rate limits (1,000/hr/IP), API key authentication
- [USDA FoodData Central OpenAPI Spec](https://fdc.nal.usda.gov/api-spec/fdc_api.html) -- endpoint documentation
- [Open Food Facts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/) -- rate limits (100 req/min product, 10 req/min search), barcode lookup
- [Open Food Facts Terms of Use](https://world.openfoodfacts.org/terms-of-use) -- ODbL license, attribution + share-alike requirements
- [FatSecret Platform API](https://platform.fatsecret.com/platform-api) -- 2.3M verified foods, 26 languages
- [FatSecret API Editions and Pricing](https://platform.fatsecret.com/api-editions) -- Premier Free: all capabilities, US dataset, attribution required, no rate limits
- [FatSecret AI Features (NLP + Image Recognition)](https://platform.fatsecret.com/features/image-recognition-and-nlp) -- optional paid add-ons
- [Top Nutrition APIs for Developers 2026](https://www.spikeapi.com/blog/top-nutrition-apis-for-developers-2026) -- ecosystem overview
- [Best Nutrition Tracking Apps 2026](https://rouvy.com/blog/best-apps-for-nutrition-tracking) -- competitor feature landscape
- [expo-camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/) -- barcode scanning via onBarcodeScanned
- [React Native Barcode Scanner Comparison](https://scanbot.io/blog/react-native-vision-camera-vs-expo-camera/) -- expo-camera vs react-native-vision-camera
- [expo-barcode-scanner to expo-camera Migration](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md) -- deprecated package migration guide
- [Best Recipe Apps for Calorie Counting 2026](https://www.nutrola.app/en/blog/best-recipe-apps-calorie-counting-macro-tracking-2026) -- competitor analysis

---
*Feature research for: Food Data Integration in SharedKitchen v6.0*
*Researched: 2026-04-07*
