# Phase 26: Vision Foundation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared infrastructure for all AI vision features. Delivers: reusable CameraSheet component with permission handling, client-side image compression utility, `analyze-food-photo` Edge Function with Gemini 2.5 Flash vision integration, and vision-specific rate limiting. No user-facing scanning or identification features yet — those build on this foundation in Phases 27-29.

</domain>

<decisions>
## Implementation Decisions

### Camera UX
- FAB button on Kitchen tab as primary camera entry point — most discoverable for scan and meal photo workflows
- Camera opens first with gallery toggle — primary use case is live photos of fridge/food
- Bottom sheet pre-prompt explaining "SharedKitchen uses your camera to scan food" before system camera permission — matches existing notifications pre-prompt pattern
- When permission denied: inline card with "Camera access needed" + Settings button — non-blocking, user can still use other features

### Edge Function Design
- Single `analyze-food-photo` Edge Function with `intent` parameter (scan/identify) — 90% shared auth, rate limiting, and Gemini code
- Base64 image in JSON body — simplest approach, no Storage needed, images are transient and not persisted
- Use `gemini-2.5-flash` — already integrated via GEMINI_API_KEY, cheapest vision option, sufficient accuracy for food recognition
- Rate limit: 5 vision calls/month free, unlimited premium — tracked as `analyze-food-photo` in ai_usage_log (matches existing video pattern with monthly window)

### Image Compression
- Use `expo-image-manipulator` — part of Expo SDK, no native rebuild needed, resize + compress in one call
- Target: resize to 1024px max dimension, JPEG quality 0.6 → ~150-250KB — balances OCR/brand detail vs upload speed
- Client-side `compressForVision()` utility called before Edge Function invocation — keeps server payload small

### Claude's Discretion
- Exact Gemini system prompt structure for scan vs identify intents
- Error message copy and recovery UX details
- Whether to show a loading animation or skeleton during vision processing
- Exact FAB icon and positioning on Kitchen tab

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expo-image-picker` (~55.0.13) already installed — used in RecipeForm.tsx and edit-profile.tsx for gallery picking
- `parse-recipe-url` Edge Function — established pattern for Gemini API calls with auth, rate limiting, caching, error handling
- `ai_usage_log` table — schema: id, user_id, function_name, input_hash, cached_response (JSONB), tokens_used, created_at
- `RateLimitError` and `VideoRateLimitError` classes in `src/lib/ai.ts` — pattern for client-side rate limit handling
- Bottom sheet pattern used in 6+ places across the app (meal picker, recipe actions, etc.)

### Established Patterns
- Edge Functions: Deno runtime, createClient for auth + admin, corsHeaders, JSON response, non-blocking usage logging
- Gemini calls: REST API with `generationConfig.responseMimeType: 'application/json'`, AbortController timeout, markdown fence stripping
- Rate limiting: Count rows in ai_usage_log by user_id + function_name + time window, premium check via subscriptions table
- Client AI calls: `supabase.functions.invoke()` or raw fetch with auth token + apikey headers

### Integration Points
- Kitchen tab (`app/(app)/kitchen.tsx` or equivalent) — FAB button placement
- `src/lib/ai.ts` — new `analyzePhoto()` function and `VisionRateLimitError` class
- `supabase/functions/analyze-food-photo/index.ts` — new Edge Function
- `package.json` — add `expo-image-manipulator` dependency

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the grey area decisions — open to standard approaches for implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
