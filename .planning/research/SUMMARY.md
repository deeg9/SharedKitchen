# Project Research Summary

**Project:** SharedKitchen — AI Vision Features (v4.0)
**Domain:** AI-powered food/kitchen photo scanning in a React Native + Expo collaborative meal planning app
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

SharedKitchen v4.0 adds three AI vision features — fridge/pantry photo scanning to bulk-add On Hand inventory, food photo identification to discover recipes, and food photo identification to log meals to the plan. All three features share a single camera-capture-to-Gemini-to-store pipeline that closely mirrors the existing `parse-recipe-url` and `generate-meal` patterns already proven in the codebase. The stack is already in place: Gemini 2.5 Flash (same API key, same `fetch()`-based integration pattern), expo-image-picker (already installed), and Supabase Edge Functions (same auth, rate limiting, and `ai_usage_log` infrastructure). The only genuinely new external dependency is Serper.dev — a Google Search REST API for recipe discovery in Feature 2 ($0.001/query, 2,500 free queries).

The recommended approach is a single shared Edge Function (`analyze-food-photo`) with an `intent` parameter (`scan-pantry`, `identify-dish`, `log-meal`) rather than three separate functions — 90% of the code (auth, rate limiting, image handling, Gemini API call, `ai_usage_log` write) is identical across all three features. Client-side, a new transient `visionStore.ts` holds flow state and orchestrates hand-offs to the existing `pantryStore`, `recipeStore`, and `planStore`. The only database migration needed is adding a `metadata JSONB` column to `ai_usage_log` for intent tracking; all other tables (`pantry_items`, `meal_plans`, `recipes`) accommodate vision-sourced data without schema changes.

The primary risks are: (1) image size — iPhone cameras produce 8-15MB images that must be compressed to ~200KB before sending to the Edge Function, and this must be solved before any other vision code is written; (2) AI accuracy expectations — fridge scan accuracy is realistically 60-75% at the item level, making a mandatory user review screen the central UX contract of the feature rather than optional polish; and (3) cost controls — vision features are "point and shoot" and will be called far more frequently than text AI features, requiring aggressive free-tier rate limits (5 scans/month free, unlimited premium) enforced server-side from day one.

## Key Findings

### Recommended Stack

The entire vision feature set can be built without adding any new client-side npm packages. `expo-image-picker` is already installed and handles both camera capture and gallery selection. `expo-image-manipulator` (part of the Expo SDK already in the project) handles on-device compression. All AI calls route through a new Supabase Edge Function using the same `fetch()`-based Gemini REST pattern already in `parse-recipe-url`. One new API credential (Serper.dev) is needed only for recipe web search in Feature 2.

**Core technologies:**
- **Gemini 2.5 Flash** (`gemini-2.5-flash`): Vision AI for food/item identification and dish recognition — already integrated in the codebase, ~$0.001-0.003 per vision call, proven in production food apps (CalCam, Samsung Bespoke fridge); send image as `inline_data` in the same `fetch()` call pattern as existing Gemini usage
- **expo-image-picker** (`~55.0.13`) + **expo-image-manipulator**: Camera capture and on-device compression — both already in the project; compress to max 1024px / quality 0.75 before base64 encoding; target <300KB base64 payload per image
- **Serper.dev** (REST API): Google Search API for recipe discovery by dish name — 2,500 free queries, $50/50K paid, returns structured JSON in 1-2 seconds; needed only for Feature 2 (food photo to recipe)

**What not to use:** on-device ML (TFLite/CoreML — prohibitive model size and dev client requirements); OpenAI vision (8x more expensive; Gemini is already configured); barcode scanning (one-item-at-a-time, requires UPC database — different feature entirely); receipt OCR (different pipeline, out of scope).

### Expected Features

Feature research confirmed three distinct user flows with a shared infrastructure layer. The competitive landscape (Fridge Vision AI, Scan2Meal, Portions Master, DishDetect, Recipe Lens) validates all three features as desirable and identifies the mandatory review-before-save pattern as the dividing line between apps users trust and apps users abandon.

**Must have (table stakes):**
- Camera capture (and gallery fallback) with iOS permission handling and loading state during 3-8 second API call
- Gemini vision identification returning structured JSON: items with name/brand/quantity/category for pantry scan; dish name with confidence for food photo
- Editable review screen before any data is committed — all competitors that skip this step lose user trust; not optional
- Bulk-add to On Hand pantry with category auto-assignment matching existing `pantry_items` categories
- Dish identification with 2-3 recipe options from web search, imported via existing `parseRecipeUrl()` pipeline
- One-tap meal plan logging with day/slot picker after dish identification
- Rate limiting enforced server-side (free tier caps) before shipping — vision is a premium differentiator

**Should have (differentiators):**
- Multi-photo scan sessions (2-5 photos for different shelves) with result deduplication
- Smart deduplication against existing On Hand before bulk-add (fuzzy match)
- Dual action after dish identification ("Find Recipes" + "Log as Meal") — no competitor offers both in one flow
- Brand-level item identification for premium users (Gemini reads labels/logos via OCR)
- Household-shared inventory update via existing Realtime sync (already built; costs nothing extra)
- Meal photo thumbnail stored on plan day cards (requires `image_url` column on `meal_plans` + Supabase Storage bucket)

**Defer to v2+:**
- Brand-level identification accuracy refinement (ship best-effort, iterate based on user feedback data)
- Quantity estimation precision (approximate values acceptable for v4.0)
- Receipt OCR (entirely different pipeline — different milestone)
- Real-time camera overlay with AR item labels (prohibitive complexity; no food app does this well)

### Architecture Approach

All three vision features share a single pipeline: Camera Capture -> On-Device Compression -> `analyze-food-photo` Edge Function -> Gemini 2.5 Flash -> Structured JSON Response -> Intent-specific store update. The Edge Function uses an `intent` parameter to route to different Gemini prompts and JSON schemas while running identical auth/rate-limit/API-call/logging infrastructure for all three. Client-side, a new transient `visionStore.ts` holds flow state (captured image, results, selection state, loading/error) and hands off confirmed data to existing stores — none of which require structural changes except adding `bulkAddPantryItems()` to `pantryStore`.

**Major components:**
1. `analyze-food-photo` Edge Function (NEW) — auth, rate limiting, Gemini vision API call, intent routing; three intents: `scan-pantry` / `identify-dish` / `log-meal`
2. `src/lib/vision.ts` (NEW) — client helper: camera capture, `compressForVision()`, Edge Function invocation, typed response parsing; mirrors `src/lib/ai.ts`
3. `src/stores/visionStore.ts` (NEW) — transient UI state store for active vision flow; orchestrates capture → review → commit lifecycle; does not persist data
4. `src/components/vision/CameraSheet.tsx` (NEW) — shared bottom sheet for camera/gallery capture; entry point for all three features
5. Feature-specific review sheets (NEW): `ScanResultsSheet.tsx`, `DishResultSheet.tsx`, `MealLogSheet.tsx` — each follows the existing `BottomSheet` + multi-step pattern
6. `pantryStore.bulkAddPantryItems()` (MODIFIED) — batch insert action for scan results; replaces N individual `addPantryItem()` calls
7. UI entry points (MODIFIED): Kitchen tab On Hand segment (camera FAB), Recipes tab header (camera icon), Plan tab PlanEditSheet ("Snap a Meal" option)

**Key patterns to follow:** structured JSON output from Gemini via `responseMimeType: 'application/json'` + `responseSchema` (matches `generate-meal`); typed rate limit errors (`VisionRateLimitError` mirrors `VideoRateLimitError`); premium gating server-side in Edge Function (matches `generate-meal`); bottom sheets for multi-step flows (matches `AddPantryItemSheet`, `MealGeneratorSheet`).

**Anti-patterns to avoid explicitly:** storing photos in Supabase Storage before processing (adds latency and storage cost; images are transient); calling Gemini directly from the React Native client (exposes API key, no rate limiting); separate Edge Functions per intent (90% duplication); persisting scan results in a new database table (over-engineering; visionStore holds transient state).

### Critical Pitfalls

1. **Full-resolution images sent to Edge Function** — iPhone cameras produce 8-15MB images; base64-encoded this exceeds Gemini's 20MB inline limit and causes Edge Function memory errors on older iPhones. Prevent by building `compressForVision()` using `expo-image-manipulator` (resize to 1024px max, quality 0.75, target <300KB base64) as Phase 1 foundational work before any other vision code is written. Unit test that a 10MB+ input compresses to <300KB output.

2. **No user review before auto-adding pantry items** — fridge scan accuracy is realistically 60-75% at the item level; auto-add creates phantom/wrong inventory that erodes user trust and is extremely hard to recover from. The review/edit screen with item toggles, name editing, and explicit "Add X items to On Hand" confirmation button is not optional UI polish — it is the core UX contract of the fridge scan feature.

3. **Vision API cost explosion under freemium** — vision features are low-friction ("point and shoot") vs. text AI features, leading to 5-10x higher usage frequency. At 1,000 users doing 3 scans/day, that is 90,000 calls/month. Set aggressive free-tier limits (5 vision scans/month free, unlimited premium) enforced server-side via `ai_usage_log` before shipping. Use separate `function_name` values per intent (`vision-fridge-scan`, `vision-dish-identify`) for independent rate limiting and cost tracking.

4. **Item name normalization drift** — Gemini returns "Horizon Organic 2% Reduced Fat Milk 64oz" while existing pantry has "Milk"; scanning amplifies the duplicate problem 10-20x per session. Instruct Gemini in the prompt to return simplified generic names, and implement fuzzy-match deduplication against existing `pantry_items` in the scan review screen before Phase 2 ships. Consider a `normalized_name` generated column on `pantry_items` for efficient deduplication queries.

5. **Camera permission and multi-step flow interruption** — vision flows are multi-step async (capture → compress → upload → API → review → save); any step can fail. Pre-check permissions before showing scan entry points, cache the compressed image locally for retry without re-capture, and handle all Edge Function error codes (429, 504, 422, 502) with graceful user-facing recovery actions rather than unhandled promise rejections.

## Implications for Roadmap

Based on the combined research, all four researchers converge on a four-phase structure driven by shared infrastructure dependencies:

### Phase 1: Vision Foundation
**Rationale:** All three vision features share camera capture, image compression, the Edge Function, `visionStore`, auth/rate-limiting, and error handling. Building this shared layer first means each subsequent feature adds only its specific UI and store wiring. The two must-address-first pitfalls (image size and cost explosion) are both Phase 1 work — no feature phase should ship without these safeguards.
**Delivers:** `analyze-food-photo` Edge Function with all three intents (skeleton), `src/lib/vision.ts` with `compressForVision()`, `visionStore.ts`, `CameraSheet.tsx`, `ai_usage_log` metadata migration, separate rate limiting per intent, camera permission handling and denied-permission state, error recovery with cached compressed image for retry, input size validation (reject >4MB base64 at Edge Function)
**Addresses:** Shared infrastructure for all three features; pitfalls #1, #3, #5, #6
**Research flag:** Standard patterns — directly extends existing `parse-recipe-url` / `generate-meal` Edge Function pattern; no novel architecture

### Phase 2: Fridge/Pantry Photo Scan
**Rationale:** Highest standalone user value; directly populates existing On Hand inventory with no additional search step; exercises the full pipeline end-to-end; natural first consumer of the Phase 1 foundation. Validate Gemini pantry scan prompt quality in Google AI Studio against real fridge photos before coding.
**Delivers:** `ScanResultsSheet.tsx` with per-item toggle/edit/remove, `pantryStore.bulkAddPantryItems()`, camera FAB on Kitchen > On Hand segment, category mapping to canonical `pantry_items` categories, fuzzy deduplication against existing household pantry items with "Already in On Hand" badge, brand-level detail gated to premium users, multi-photo session support
**Uses:** `analyze-food-photo` with `scan-pantry` intent, Gemini 2.5 Flash, existing `pantry_items` table + `usePantrySync` Realtime
**Avoids:** Pitfalls #2 (mandatory review screen), #5 (name normalization + deduplication)
**Research flag:** Standard patterns; main risk is prompt engineering — validate in Google AI Studio before coding

### Phase 3: Food Photo to Recipe Discovery
**Rationale:** Builds on the `identify-dish` path from Phase 1; requires Serper.dev integration (the one genuinely new sub-feature); most complex feature because it chains dish ID + web search + existing `parseRecipeUrl()` pipeline. Natural to build before meal logging since it validates the dish identification UX.
**Delivers:** `DishResultSheet.tsx` with dish name + recipe option cards (title, source, thumbnail), `search-recipes` sub-flow using Serper.dev, camera icon on Recipes tab header, editable dish name for AI correction before search, confidence display with "Did you mean?" alternatives, connection from selected recipe URL into existing `parseRecipeUrl()` import
**Uses:** `analyze-food-photo` with `identify-dish` intent, Serper.dev REST API, existing `parseRecipeUrl()` + `recipeStore.createRecipe()`
**Avoids:** Pitfall #7 (dish identification expectation mismatch — editable name, "recipes like this" framing, 2-3 options presented)
**Research flag:** Needs a pre-planning spike on Serper.dev recipe search result quality — verify that AI-identified dish names produce useful recipe URLs that successfully feed through `parseRecipeUrl()` extraction

### Phase 4: Food Photo to Meal Plan Logging
**Rationale:** Shares the `identify-dish` pipeline with Phase 3; simplest integration (just calls existing `planStore.assignRecipe()` with `recipe_id: null`); naturally completes the dual-action UX alongside Phase 3. Build last because it has no dependencies beyond Phase 1 infrastructure and benefits from Phase 3's `DishResultSheet` for the dual-action flow.
**Delivers:** `MealLogSheet.tsx` with day/slot/meal-source picker, "Snap a Meal" option in `PlanEditSheet`, dual-action bottom sheet after dish identification ("Find Recipes" + "Log as Meal"), optional meal photo thumbnail on plan day cards (requires `image_url` on `meal_plans` + `meal-photos` Storage bucket — confirm scope during planning)
**Uses:** `analyze-food-photo` with `log-meal` intent, existing `planStore.assignRecipe()` (already supports `recipe_id: null` with `notes`), `MealType`/`MealSource` enums
**Implements:** `MealLogSheet`, `PlanEditSheet` modification
**Research flag:** Standard patterns — all integration points are existing, well-understood store actions; no novel architecture

### Phase Ordering Rationale

- **Foundation first** because 90% of code (auth, compression, Edge Function, visionStore, CameraSheet) is shared — building it once in Phase 1 means Phases 2-4 each add only feature-specific UI and store wiring, not infrastructure
- **Fridge scan second** because it is the highest standalone user value, exercises the full pipeline end-to-end, and validates Gemini vision prompt quality before the dish-identification features depend on it
- **Recipe discovery third** because it requires Serper.dev (one new external API) and chains more steps than meal logging — validating recipe search integration before adding meal logging is cleaner
- **Meal logging last** because it is the simplest integration (no new infrastructure beyond Phase 1), pairs with Phase 3's dual-action UX, and depends on dish identification being validated first
- **Pitfall alignment**: The two must-address-first pitfalls (image compression, cost controls) are both Phase 1 work, ensuring no feature phase ships without those safeguards

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Recipe Discovery):** A small spike should precede planning — validate that Gemini-generated dish names produce useful Serper.dev search results, and that returned recipe URLs reliably feed through the existing `parseRecipeUrl()` pipeline. 30-60 minute manual test with 10-20 real dish names before committing to the architecture.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Direct extension of existing `parse-recipe-url` and `generate-meal` Edge Function patterns; all libraries are well-documented and already in the project
- **Phase 2 (Fridge Scan):** Standard Gemini structured output + bottom sheet review pattern; prompt engineering validated in Google AI Studio before coding begins
- **Phase 4 (Meal Logging):** All integration points are existing store actions with no structural changes required

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies verified from official docs and confirmed in existing codebase; Gemini pricing verified; expo-image-picker already installed and working in production |
| Features | MEDIUM-HIGH | Competitive landscape well-documented across 6+ competitor apps; vision API capabilities verified; UX patterns consistent across multiple sources; actual AI accuracy in production will vary from benchmarks |
| Architecture | HIGH | Direct extension of proven existing patterns; no novel infrastructure required; all integration points confirmed in existing codebase without structural changes to core tables |
| Pitfalls | HIGH | Based on existing codebase constraint analysis, official API limit documentation, and production failure modes documented in competitor research and academic studies |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini vision prompt quality for pantry scan**: Actual accuracy on cluttered fridge photos with varied lighting depends heavily on prompt engineering. Validate prompts against real fridge photos in Google AI Studio before coding Phase 2. Research flags 60-75% item-level accuracy as a realistic baseline — calibrate user-facing messaging accordingly (frame as "AI-assisted" not "automatic").
- **Serper.dev recipe search pipeline quality**: Serper.dev returning structured JSON is confirmed; whether AI-identified dish names consistently produce URLs that `parseRecipeUrl()` can extract is unvalidated. A 10-20 dish name test before Phase 3 planning is strongly recommended.
- **`meal_plans` schema for photo thumbnails**: The meal photo thumbnail differentiator (Phase 4 "Should Have") requires an `image_url` column on `meal_plans` and a `meal-photos` Supabase Storage bucket. Confirm scope during Phase 4 planning — whether to include in v4.0 or defer.
- **`normalized_name` column on `pantry_items`**: Research recommends a generated column for efficient deduplication queries. Decide during Phase 2 planning whether to add this migration or rely on application-level fuzzy matching only.

## Sources

### Primary (HIGH confidence)
- [Gemini API Pricing (official)](https://ai.google.dev/gemini-api/docs/pricing) — image token counts, Flash pricing, free tier
- [Gemini Image Understanding Docs](https://ai.google.dev/gemini-api/docs/image-understanding) — `inline_data` format, base64 input, structured output
- [Gemini Structured Output](https://firebase.google.com/docs/ai-logic/generate-structured-output) — `responseSchema` with `responseMimeType`
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — camera API, base64 option, permissions
- [ImageManipulator - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) — on-device resize and compress
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) — 256MB memory, payload limits, timeouts
- [CalCam: Food Tracking with Gemini API (Google Developers Blog)](https://developers.googleblog.com/en/calcam-transforming-food-tracking-with-the-gemini-api/) — real-world Gemini food recognition production case study
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts`, `supabase/functions/generate-meal/index.ts`, `src/lib/ai.ts`, `supabase/migrations/00011_create_ai_usage_log.sql`, `supabase/migrations/00017_create_pantry_items.sql`

### Secondary (MEDIUM confidence)
- [Serper.dev](https://serper.dev/) — pricing, free tier, structured JSON from Google recipe search results
- [Samsung Bespoke Fridge with Gemini Vision AI (Techlicious)](https://www.techlicious.com/blog/samsung-bespoke-fridge-vision-ai-with-google-gemini/) — production fridge item identification with Gemini
- [Roboflow: Gemini 2.5 for Zero-Shot Object Detection](https://blog.roboflow.com/gemini-2-5-object-detection-segmentation/) — Gemini 2.5 structured JSON output for detected objects
- [Fridge Vision AI](https://fridgevisionai.com/) — competitor UX: multi-photo sessions, editable results, category handling
- [DishDetect](https://www.dishdetect.app/), [Recipe Lens](https://www.recipelens.com/), [Scan2Meal](https://scan2meal.app/), [Portions Master](https://portionsmaster.com/) — competitor feature baseline and UX patterns
- [SerpApi Google Recipes API](https://serpapi.com/recipes-results) — recipe search structured results format reference
- [DEV Community: Building Meal Tracker with GPT-4o Vision](https://dev.to/wellallytech/from-pixels-to-calories-building-a-high-precision-meal-tracker-with-gpt-4o-vision-5018) — architecture pattern, prompt strategy, cost analysis

### Tertiary (LOW confidence)
- [ScienceDirect: Diabot-GPT-4o Food Recognition](https://www.sciencedirect.com/science/article/abs/pii/S0002916525006173) — GPT-4o 59-74% food identification accuracy; used for baseline expectation calibration (Gemini Flash expected to be comparable)
- [Use of Different Food Image Recognition Platforms (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7752530/) — Google Cloud Vision 9% top-1 accuracy for food (older model; used for floor baseline only)
- [GPT-5 Image Mini pricing (third-party aggregator)](https://pricepertoken.com/pricing-page/model/openai-gpt-5-image-mini) — used for cost comparison to validate Gemini Flash as the correct choice

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
