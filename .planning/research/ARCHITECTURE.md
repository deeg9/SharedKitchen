# Architecture Patterns

**Domain:** AI Vision features for SharedKitchen (v4.0)
**Researched:** 2026-03-30
**Focus:** Integration of 3 vision features into existing Supabase Edge Function + Zustand + expo-router architecture

## Recommended Architecture

### High-Level Overview

All three vision features share a single pipeline: **Camera Capture -> Image Upload -> Edge Function -> Gemini Vision -> Structured Response -> Store Update -> UI**. This mirrors the existing `parse-recipe-url` pattern (client captures input, Edge Function does AI processing, client writes to Supabase).

```
+-------------------+     +------------------+     +-------------------+
|   Camera/Gallery  | --> | Supabase Edge Fn | --> |  Gemini 2.5 Flash |
|  (expo-image-     |     | (analyze-food-   |     |  (Vision API)     |
|   picker)         |     |  photo)          |     |                   |
+-------------------+     +------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
  base64 image             auth + rate limit          structured JSON
  (compressed)             + premium check            (items/dish/recipes)
        |                         |                         |
        v                         v                         v
+-------------------+     +------------------+     +-------------------+
|  Client-side      | <-- | Response routing | <-- |  JSON schema      |
|  store updates    |     | (by intent)      |     |  (responseMimeType|
|  (pantry/recipe/  |     |                  |     |   application/json|
|   plan stores)    |     |                  |     |  )                |
+-------------------+     +------------------+     +-------------------+
```

### Key Architectural Decision: One Edge Function, Three Intents

Use a **single `analyze-food-photo` Edge Function** with an `intent` parameter rather than three separate functions. Rationale:

1. **Shared infrastructure** -- auth, rate limiting, Gemini API call, image handling, ai_usage_log writing are identical across all three features
2. **Mirrors existing pattern** -- `parse-recipe-url` already handles both URL and video intents via the `type` parameter
3. **Reduces deployment surface** -- one function to deploy, monitor, and maintain
4. **Different prompts, same pipeline** -- the only difference between the three features is the system prompt and JSON schema sent to Gemini

The three intents:

| Intent | Prompt Focus | Response Schema | Client Action |
|--------|-------------|-----------------|---------------|
| `scan-pantry` | "Identify all food items with brand, quantity, category" | `{ items: [{ name, brand, quantity, unit, category }] }` | Bulk-add to pantryStore |
| `identify-dish` | "Identify this dish, suggest 2-3 recipe names + search queries" | `{ dish_name, confidence, suggestions: [{ name, search_query }] }` | Show recipe picker, then web search |
| `log-meal` | "Identify this dish for meal logging" | `{ dish_name, estimated_cost, estimated_prep_time }` | Add to planStore via assignRecipe |

### Component Boundaries

| Component | Responsibility | Communicates With | New or Modified |
|-----------|---------------|-------------------|-----------------|
| `analyze-food-photo` Edge Function | Auth, rate limit, Gemini Vision API call, structured response | Gemini API, ai_usage_log, subscriptions table | **NEW** |
| `src/lib/vision.ts` | Client-side helper: camera capture, image compression, Edge Function invocation, response parsing | expo-image-picker, Edge Function, stores | **NEW** |
| `src/stores/visionStore.ts` | Transient state for vision flow: loading, results, selected items, error | vision.ts, pantryStore, recipeStore, planStore | **NEW** |
| `src/components/vision/CameraSheet.tsx` | Bottom sheet with camera preview trigger and gallery option | expo-image-picker, visionStore | **NEW** |
| `src/components/vision/ScanResultsSheet.tsx` | Shows identified pantry items with checkboxes for bulk-add | visionStore, pantryStore | **NEW** |
| `src/components/vision/DishResultSheet.tsx` | Shows identified dish + recipe suggestions to pick from | visionStore, recipeStore | **NEW** |
| `src/components/vision/MealLogSheet.tsx` | Shows identified dish + day picker for meal plan | visionStore, planStore | **NEW** |
| `src/stores/pantryStore.ts` | Add `bulkAddPantryItems()` action | Supabase pantry_items table | **MODIFIED** |
| `src/stores/recipeStore.ts` | No changes needed -- `createRecipe()` already handles inserts | -- | UNCHANGED |
| `src/stores/planStore.ts` | No changes needed -- `assignRecipe()` already supports `recipe_id: null` with notes | -- | UNCHANGED |
| `app/(app)/(tabs)/grocery.tsx` | Add camera FAB to On Hand segment | CameraSheet, visionStore | **MODIFIED** |
| `app/(app)/(tabs)/recipes.tsx` | Add camera icon to header for food photo -> recipe | CameraSheet, visionStore | **MODIFIED** |
| `app/(app)/(tabs)/plan.tsx` | Add camera option in PlanEditSheet for meal logging | CameraSheet, visionStore | **MODIFIED** |

### Data Flow: Feature 1 -- Fridge/Pantry Photo Scan

```
User taps camera FAB on Kitchen > On Hand
  -> CameraSheet opens (bottom sheet)
  -> User takes photo or picks from gallery
  -> expo-image-picker returns base64 (quality: 0.6, maxWidth: 1024)
  -> visionStore.scanPantry(base64) called
    -> POST to analyze-food-photo Edge Function with { intent: 'scan-pantry', image: base64 }
    -> Edge Function:
      1. Auth check (JWT from Authorization header)
      2. Rate limit check (ai_usage_log, 10/day free, 50/day premium)
      3. Premium check for brand-level detail
      4. Gemini 2.5 Flash generateContent with inline_data + structured JSON schema
      5. Log to ai_usage_log
      6. Return { items: [...] }
    -> visionStore sets scanResults
  -> ScanResultsSheet renders items with checkboxes (all pre-selected)
  -> User reviews, unchecks unwanted items, taps "Add to On Hand"
  -> pantryStore.bulkAddPantryItems(householdId, selectedItems)
    -> Batch insert to pantry_items table
    -> Realtime sync propagates to household members
```

### Data Flow: Feature 2 -- Food Photo -> Recipe Discovery

```
User taps camera icon on Recipes screen header
  -> CameraSheet opens
  -> User takes photo of food/screenshot
  -> expo-image-picker returns base64
  -> visionStore.identifyDish(base64) called
    -> POST to analyze-food-photo with { intent: 'identify-dish', image: base64 }
    -> Edge Function:
      1. Auth + rate limit (same as above)
      2. Gemini prompt: "Identify this dish. Return name + 3 recipe search queries"
      3. Return { dish_name, suggestions: [{ name, search_query }] }
    -> visionStore sets dishResult
  -> DishResultSheet shows dish name + 2-3 recipe options
  -> User taps a suggestion
  -> Web search for recipe URL (via Gemini or direct web search in Edge Function)
    -> Returns recipe URLs
  -> User picks a URL -> existing parseRecipeUrl() flow handles import
  -> Recipe lands in recipeStore via createRecipe()
```

**Important architectural note on recipe discovery:** The Edge Function identifies the dish and suggests search queries. The actual recipe import reuses the existing `parse-recipe-url` pipeline entirely. No new recipe parsing logic needed.

### Data Flow: Feature 3 -- Food Photo -> Meal Plan Logging

```
User opens PlanEditSheet for a day (existing flow)
  -> New "Snap a Meal" option alongside existing recipe picker
  -> CameraSheet opens
  -> User takes photo of their meal
  -> visionStore.logMeal(base64) called
    -> POST to analyze-food-photo with { intent: 'log-meal', image: base64 }
    -> Edge Function returns { dish_name, estimated_cost, category }
    -> visionStore sets mealLogResult
  -> MealLogSheet shows identified dish with meal type picker + date
  -> User confirms
  -> planStore.assignRecipe() called with:
    - recipe_id: null (no recipe, just a logged meal)
    - notes: dish_name (displayed on plan card)
    - meal_source: 'home-cooked' or user-selected
    - meal_cost: estimated_cost from AI
```

**Integration with existing planStore:** The `assignRecipe()` action already supports `recipe_id: null` with notes -- this is exactly the "quick log" pattern. The plan card already renders `notes` when `recipe_id` is null. No planStore changes needed.

## New Edge Function: `analyze-food-photo`

### Request Shape

```typescript
interface AnalyzeFoodPhotoRequest {
  intent: 'scan-pantry' | 'identify-dish' | 'log-meal';
  image: string; // base64-encoded JPEG
}
```

### Response Shapes (by intent)

```typescript
// scan-pantry
interface ScanPantryResponse {
  items: Array<{
    name: string;
    brand: string | null;     // premium only
    quantity: string | null;   // "2", "1 lb", etc.
    unit: string | null;
    category: 'Proteins' | 'Produce' | 'Dairy & Eggs' | 'Pantry' | 'Other';
  }>;
}

// identify-dish
interface IdentifyDishResponse {
  dish_name: string;
  confidence: number;  // 0-1
  suggestions: Array<{
    name: string;          // "Classic Pad Thai"
    search_query: string;  // "pad thai recipe" -- for recipe URL search
  }>;
}

// log-meal
interface LogMealResponse {
  dish_name: string;
  category: string | null;
  estimated_cost: number | null;
  estimated_prep_time: number | null;
}
```

### Edge Function Internal Structure

```
analyze-food-photo/index.ts
  |
  +-- CORS handling (same as parse-recipe-url)
  +-- Auth (same pattern as generate-meal)
  +-- Rate limit check against ai_usage_log
  |     function_name: 'analyze-food-photo'
  |     daily limit: 10 free / 50 premium
  +-- Premium check for brand-level detail (scan-pantry only)
  +-- Intent routing:
  |     scan-pantry  -> PANTRY_SYSTEM_PROMPT + PANTRY_SCHEMA
  |     identify-dish -> DISH_SYSTEM_PROMPT + DISH_SCHEMA
  |     log-meal     -> MEAL_SYSTEM_PROMPT + MEAL_SCHEMA
  +-- Gemini API call:
  |     model: gemini-2.5-flash
  |     contents: [{ role: 'user', parts: [
  |       { inline_data: { mime_type: 'image/jpeg', data: base64 } },
  |       { text: systemPrompt }
  |     ]}]
  |     generationConfig: {
  |       responseMimeType: 'application/json',
  |       responseSchema: intentSchema,
  |       temperature: 0.3  // low for identification accuracy
  |     }
  +-- Log to ai_usage_log (user_id, function_name, tokens_used, metadata)
  +-- Return structured response
```

### Image Size Strategy

Gemini API accepts base64 inline images up to 20MB total request. To keep Edge Function payloads manageable:

1. **Client-side compression:** expo-image-picker `quality: 0.6`, resize to `maxWidth: 1024` pixels
2. **Estimated payload:** A 1024px JPEG at quality 0.6 is ~150-300KB. Base64 encoding adds ~33%, so ~200-400KB
3. **No Supabase Storage needed for vision:** Images are transient -- sent to Edge Function, processed by Gemini, discarded. No need to store photos permanently
4. **If image is too large:** Client-side validation rejects images > 4MB before sending

## New Client-Side Module: `src/lib/vision.ts`

```typescript
// Mirrors the pattern in src/lib/ai.ts

export interface VisionScanResult {
  items: PantryItemCandidate[];
}

export interface VisionDishResult {
  dish_name: string;
  confidence: number;
  suggestions: DishSuggestion[];
}

export interface VisionMealResult {
  dish_name: string;
  category: string | null;
  estimated_cost: number | null;
}

export async function capturePhoto(): Promise<string | null> {
  // Wraps expo-image-picker with camera permissions
  // Returns base64 string or null if cancelled
  // quality: 0.6, maxWidth: 1024
}

export async function analyzePhoto(
  intent: 'scan-pantry' | 'identify-dish' | 'log-meal',
  base64Image: string
): Promise<VisionScanResult | VisionDishResult | VisionMealResult> {
  // POST to analyze-food-photo Edge Function
  // Handles rate limit errors (VisionRateLimitError)
  // Handles auth errors
}
```

## New Store: `src/stores/visionStore.ts`

This is a **transient UI store** -- it holds state for the active vision flow only. It does NOT persist data; it orchestrates the flow between capture and the target store (pantry/recipe/plan).

```typescript
interface VisionState {
  // Shared
  loading: boolean;
  error: string | null;
  capturedImage: string | null;  // base64 for preview

  // Scan pantry results
  scanResults: PantryItemCandidate[] | null;
  selectedScanItems: Set<number>;  // indices of checked items

  // Dish identification results
  dishResult: VisionDishResult | null;

  // Meal log results
  mealLogResult: VisionMealResult | null;

  // Actions
  scanPantry: (base64: string) => Promise<void>;
  identifyDish: (base64: string) => Promise<void>;
  logMeal: (base64: string) => Promise<void>;
  toggleScanItem: (index: number) => void;
  selectAllScanItems: () => void;
  deselectAllScanItems: () => void;
  commitScanToPantry: (householdId: string) => Promise<void>;
  reset: () => void;
}
```

## Modified Store: `pantryStore.ts`

Add one new action:

```typescript
bulkAddPantryItems: async (
  householdId: string,
  items: Array<{ name: string; quantity?: string; unit?: string; category?: string }>
) => Promise<void>
```

This does a single batch insert to `pantry_items`. The existing `addPantryItem` does one-at-a-time with optimistic UI; bulk-add skips optimistic (shows loading spinner instead) and does a single Supabase insert + full refetch. This avoids the complexity of managing N optimistic temp IDs.

## New Database Objects

### Migration: `00018_add_vision_usage_tracking.sql`

No new tables needed. The existing `ai_usage_log` table tracks all AI usage with a `function_name` column. Vision calls are logged as:
- `function_name: 'analyze-food-photo'`
- Plus the `intent` in a JSONB `metadata` column (if ai_usage_log has one) or appended to function_name

Check if ai_usage_log has a metadata/context column. If not:

```sql
-- Add metadata column to ai_usage_log for intent tracking
ALTER TABLE ai_usage_log ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
```

This avoids creating a separate vision_usage table and reuses the existing rate-limiting infrastructure.

### No New Tables for Vision Data

- **Pantry items** from scans go into existing `pantry_items` table
- **Recipes** from dish identification go through existing `recipes` table via `parse-recipe-url`
- **Meal logs** go into existing `meal_plans` table with `recipe_id: null`
- **Photos are transient** -- not stored in Supabase Storage

## Patterns to Follow

### Pattern 1: Edge Function with Structured Gemini Output
**What:** Send image + JSON schema to Gemini, get typed response back
**When:** All three vision intents
**Why:** Already proven in `generate-meal` (uses `responseMimeType: 'application/json'`). Eliminates parsing errors.
**Example from existing codebase:**
```typescript
// From generate-meal/index.ts -- already uses structured JSON output
generationConfig: {
  temperature: 0.8,
  maxOutputTokens: 1500,
  responseMimeType: 'application/json',
}
```
Vision calls add `responseSchema` for even stricter typing.

### Pattern 2: Client-Side Rate Limit Error Handling
**What:** Catch 429 from Edge Function, throw typed `VisionRateLimitError`
**When:** All vision calls
**Why:** Mirrors existing `RateLimitError` and `VideoRateLimitError` in `src/lib/ai.ts`
**Example from existing codebase:**
```typescript
// From src/lib/ai.ts lines 189-213
export class VideoRateLimitError extends Error {
  limit: number;
  used: number;
  remaining: number;
  // ...
}
```

### Pattern 3: Bottom Sheet for Multi-Step Flows
**What:** Use existing `BottomSheet` component for vision result UI
**When:** All three features show results before committing
**Why:** Consistent with `AddItemSheet`, `AddPantryItemSheet`, `PlanEditSheet`, `MealGeneratorSheet` patterns already in the app
**Key:** Vision sheets are controlled by `visionStore` state, not local component state, because the flow spans multiple user interactions.

### Pattern 4: Premium Gating at Edge Function Level
**What:** Check subscription status server-side, return different response quality
**When:** `scan-pantry` intent (brand-level detail is premium)
**Why:** Mirrors existing pattern in `generate-meal` where premium users get 20 generations vs 5
**Implementation:** Free users get generic item names ("milk", "cheese"). Premium users get brand-level detail ("Organic Valley 2% Milk", "Tillamook Sharp Cheddar").

## Anti-Patterns to Avoid

### Anti-Pattern 1: Uploading Images to Supabase Storage Before Processing
**What:** Storing the photo in a bucket, then passing the URL to the Edge Function
**Why bad:** Adds latency (upload + download), storage costs, cleanup complexity. Photos are transient input data, not content.
**Instead:** Pass base64 directly to the Edge Function. Gemini accepts inline_data. The photo is discarded after processing.

### Anti-Pattern 2: Client-Side Gemini API Calls
**What:** Calling Gemini directly from the React Native app
**Why bad:** Exposes API key in client bundle. No rate limiting. No usage tracking. No premium gating.
**Instead:** All AI calls go through Supabase Edge Functions (existing pattern for parse-recipe-url and generate-meal).

### Anti-Pattern 3: Separate Edge Functions Per Intent
**What:** Creating `scan-pantry-photo`, `identify-dish-photo`, `log-meal-photo` as three separate functions
**Why bad:** 90% code duplication (auth, rate limit, Gemini call, logging). Three deployments to maintain.
**Instead:** One `analyze-food-photo` function with intent routing. The only variable is the prompt and JSON schema.

### Anti-Pattern 4: Storing Scan Results in a New Database Table
**What:** Creating a `vision_scans` table to persist raw AI results
**Why bad:** Over-engineering. The scan results are reviewed and committed within seconds. No need for persistence.
**Instead:** Hold results in transient `visionStore`. Committed items go to `pantry_items` (existing table). Discard the rest.

### Anti-Pattern 5: Complex Image Processing on Client
**What:** Running ML models or heavy image processing on the device
**Why bad:** React Native performance constraints. Battery drain. Model size.
**Instead:** Simple compression on client (expo-image-picker quality setting), all intelligence on the server via Gemini.

## Integration Points with Existing Systems

### expo-image-picker (Already Installed)
- Already used in `RecipeForm.tsx` for recipe image uploads
- Reuse exact same pattern: `requestCameraPermissionsAsync()` + `launchCameraAsync()`
- Add `launchImageLibraryAsync()` as fallback for screenshots
- Configuration: `{ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true, allowsEditing: false }`
- `allowsEditing: false` because we want the full frame for pantry scanning

### Supabase Auth (Existing)
- Edge Function auth pattern from `parse-recipe-url` and `generate-meal` is reused exactly
- `Authorization: Bearer ${token}` header from `supabase.auth.getSession()`

### ai_usage_log (Existing Table)
- Rate limiting uses the same pattern as `parse-recipe-url`
- `function_name: 'analyze-food-photo'` with optional metadata for intent
- Daily limit: 10 free / 50 premium (aligned with existing limits pattern)

### Premium Gating (Existing)
- `subscriptions` table check in Edge Function (same as `generate-meal` lines 62-70)
- Brand-level detail in scan-pantry is premium
- Higher daily limits for premium users

### Pantry Store (Existing)
- New `bulkAddPantryItems()` action for batch insert
- Existing Realtime sync via `usePantrySync` hook propagates to household members automatically

### Recipe Import (Existing)
- Dish identification returns search queries, not full recipes
- User picks a recipe URL from suggestions
- Existing `parseRecipeUrl()` from `src/lib/ai.ts` handles the actual import
- No modifications to recipe import pipeline

### Plan Store (Existing)
- `assignRecipe()` already handles `recipe_id: null` meals with `notes` field
- Meal logging just needs to call this existing action with AI-identified dish name as notes
- No planStore modifications needed

### Kitchen Tab UI (Existing)
- Camera FAB added alongside existing "+" FAB on On Hand segment
- Or replace "+" FAB with a speed dial that offers "Manual Add" and "Scan Photo"

## UI Entry Points

| Feature | Entry Point | Trigger | Component |
|---------|-------------|---------|-----------|
| Pantry scan | Kitchen tab > On Hand segment | Camera FAB button | CameraSheet -> ScanResultsSheet |
| Dish identify | Recipes tab header | Camera icon button | CameraSheet -> DishResultSheet |
| Meal log | Plan tab > PlanEditSheet | "Snap a Meal" button | CameraSheet -> MealLogSheet |

## Scalability Considerations

| Concern | Current (v4.0) | At Scale |
|---------|---------------|----------|
| Image payload size | ~300KB base64 per request, within Gemini 20MB limit | Monitor Edge Function response times; add compression tiers if needed |
| Gemini API cost | ~$0.002-0.005 per vision call (Flash pricing) | Rate limits protect against abuse; premium users subsidize cost |
| Rate limiting | Per-user daily count in ai_usage_log | Could add per-household limits if needed |
| Response latency | ~2-4 seconds for Gemini vision response | Show skeleton/shimmer UI during processing; 25s timeout (existing pattern) |
| Concurrent scans | One scan at a time (visionStore.loading gate) | Sufficient for household use case |

## Suggested Build Order

Based on dependencies between the three features:

1. **Phase 1: Edge Function + Core Vision Pipeline** (foundation)
   - `analyze-food-photo` Edge Function with all three intents
   - `src/lib/vision.ts` client helper
   - `src/stores/visionStore.ts`
   - `src/components/vision/CameraSheet.tsx`
   - Database migration for ai_usage_log metadata column (if needed)
   - **Why first:** All three features depend on this shared infrastructure

2. **Phase 2: Fridge/Pantry Photo Scan** (highest user value)
   - `ScanResultsSheet.tsx` component
   - `pantryStore.bulkAddPantryItems()` action
   - Camera FAB on Kitchen > On Hand segment
   - Premium gating for brand-level detail
   - **Why second:** Directly populates existing pantry, most "magical" feature, exercises the full pipeline

3. **Phase 3: Food Photo -> Recipe Discovery** (builds on Phase 1)
   - `DishResultSheet.tsx` component
   - Recipe search integration (Gemini-generated search queries -> recipe URLs)
   - Camera icon on Recipes tab header
   - Connection to existing `parseRecipeUrl()` flow
   - **Why third:** Depends on Phase 1 pipeline + requires recipe search integration (new sub-feature)

4. **Phase 4: Food Photo -> Meal Logging** (simplest feature)
   - `MealLogSheet.tsx` component
   - "Snap a Meal" option in PlanEditSheet
   - Day/meal-type picker in MealLogSheet
   - **Why last:** Simplest integration (just calls existing `assignRecipe` with notes), lowest standalone complexity

## Sources

- [Gemini Image Understanding Docs](https://ai.google.dev/gemini-api/docs/image-understanding) -- inline_data format, base64 input, structured output
- [Gemini Structured Output](https://firebase.google.com/docs/ai-logic/generate-structured-output) -- responseSchema with responseMimeType
- [expo-image-picker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- launchCameraAsync, base64 option
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- timeout, memory constraints
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts`, `supabase/functions/generate-meal/index.ts`, `src/lib/ai.ts`, `src/stores/pantryStore.ts`, `src/stores/planStore.ts`

**Confidence: HIGH** -- Architecture is a direct extension of proven patterns already in the codebase (Edge Function + Gemini + Zustand store + bottom sheet UI). No new infrastructure or unfamiliar technology needed. expo-image-picker is already installed. Gemini 2.5 Flash vision capabilities are well-documented for food identification use cases.
