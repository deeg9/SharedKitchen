# Stack Research: AI Vision Features

**Domain:** AI-powered food/item identification from photos in a React Native + Expo mobile app
**Researched:** 2026-03-30
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Gemini 2.5 Flash | `gemini-2.5-flash` | Vision AI for food identification, fridge/pantry scanning, brand recognition | Already used in the codebase for recipe parsing (same API key). Best price-to-performance for multimodal: $0.30/M input tokens for images, native multimodal architecture (not bolted-on), proven in food recognition apps (CalCam, Samsung Vision AI). Each image ~258-1,610 tokens depending on resolution, making per-photo cost effectively $0.0001-$0.0005. Free tier available for development. |
| expo-image-picker | `~55.0.13` | Camera capture and photo library access | Already installed in the project. Supports `launchCameraAsync` with `base64: true` for direct image data. No new dependency needed. Uses native OS camera UI -- no custom camera screen to build or maintain. |
| Serper.dev | N/A (REST API) | Google Search API for recipe discovery by dish name | Returns structured JSON from Google search results in 1-2 seconds. 2,500 free queries (no credit card). Paid: $50/50K credits. Google's recipe carousel includes structured recipe data (title, image, source URL, rating). Simpler and cheaper than Spoonacular ($29+/mo) for our use case of "search by dish name, get 2-3 recipe links." |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| base64-arraybuffer | `^1.0.2` | Base64 encoding/decoding for image data | Already installed. Used to convert image picker base64 output for API transmission. |
| expo-haptics | `^55.0.9` | Tactile feedback on scan actions | Already installed. Use for camera shutter, item confirmation, bulk-add actions. |

### New Supabase Edge Functions

| Function | Purpose | AI Model | Notes |
|----------|---------|----------|-------|
| `identify-food-photo` | Accepts base64 image, returns dish identification or inventory items | Gemini 2.5 Flash | Single function handles both "what dish is this?" and "what items are in this fridge?" via a `mode` parameter (`dish` or `inventory`). Follows existing pattern from `parse-recipe-url`. |
| `search-recipes` | Accepts dish name, returns 2-3 recipe results from web | Serper.dev API | Searches Google for `"[dish name] recipe"`, returns title + URL + image + source. Reuses existing `parse-recipe-url` for actual import after user selects one. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Google AI Studio | Test and iterate on vision prompts | Free. Use to validate fridge scanning prompts before coding Edge Functions. Test with real fridge photos to calibrate brand recognition accuracy. |
| Maestro E2E | Test camera flows | Existing tool. Use `launchWith` to provide test images to the image picker for E2E flows. |

## Installation

```bash
# No new client-side packages needed.
# expo-image-picker is already installed.
# All AI calls go through Supabase Edge Functions.

# Edge Function environment variables to add:
# SERPER_API_KEY=<from serper.dev>
# GEMINI_API_KEY already exists
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Gemini 2.5 Flash (vision) | GPT-5-mini (vision) | If Gemini quality is insufficient for brand-level recognition. GPT-5-mini costs $2.50/M input (8x more for images) but may have better OCR on product labels. Test Gemini first -- it handles food recognition well per CalCam case study. |
| Gemini 2.5 Flash (vision) | Gemini 2.5 Flash-Lite | If cost becomes a concern at scale. Flash-Lite is $0.10/M input (3x cheaper) but may sacrifice accuracy on brand recognition. Good fallback for "quick scan" mode. |
| Serper.dev (recipe search) | Spoonacular API | If you need nutritional data alongside recipe search. Spoonacular has 365K+ recipes with nutrition, but costs $29/mo minimum and uses a points system (50 free/day is unusable). Serper is simpler: search Google, get recipe URLs, import via existing `parse-recipe-url`. |
| Serper.dev (recipe search) | Gemini web grounding | If Google adds Gemini Grounding to the free/Flash tier reliably. Currently available but adds latency and unpredictable result formatting. Serper returns deterministic structured JSON. |
| expo-image-picker | expo-camera | If you need a custom camera UI (overlay guides, real-time preview annotations). expo-image-picker is simpler and already installed. Only switch if user testing reveals the native camera UI is insufficient. |
| expo-image-picker | react-native-vision-camera | Never for this use case. Adds a native dependency, requires custom dev client, and is overkill when you just need to capture a photo and send it to an API. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| On-device ML (TFLite, CoreML) | Massive complexity for marginal latency improvement. Food/brand recognition models are huge (100MB+), require custom training for brand data, and would need a custom dev client breaking Expo Go compatibility. | Server-side Gemini via Edge Function. Network round-trip is 1-3 seconds, acceptable for this UX. |
| Clarifai / AWS Rekognition | Separate vendor, separate billing, separate SDK. Adds operational complexity for no clear advantage over Gemini which is already integrated. | Gemini 2.5 Flash handles food recognition natively. |
| TheMealDB | Only 283 meals in database. Unusable for real recipe discovery. | Serper.dev (searches all of Google's recipe index). |
| Google Custom Search API | Closed to new customers. Deprecated by Jan 2027. | Serper.dev |
| OpenAI gpt-5-mini for vision | 8x more expensive for image input ($2.50/M vs $0.30/M) and you already have Gemini set up. Only the text-only recipe extraction uses OpenAI. | Gemini 2.5 Flash for all vision tasks. |

## Integration Architecture

### How Vision Features Fit the Existing Stack

```
Mobile App (React Native + Expo)
  |
  | expo-image-picker (already installed)
  |   - launchCameraAsync({ base64: true, quality: 0.8 })
  |   - Returns base64 image string
  |
  v
Supabase Edge Function: identify-food-photo
  |
  | mode: "inventory" (fridge scan) or "dish" (food photo)
  |
  | Gemini 2.5 Flash API (already configured, same API key)
  |   - Sends base64 image as inline_data
  |   - Returns structured JSON via responseMimeType: 'application/json'
  |
  v
  +--> mode: "inventory"
  |     Returns: [{ name, brand?, category, quantity?, unit? }]
  |     Client bulk-adds to pantry_items table (existing)
  |
  +--> mode: "dish"
        Returns: { dish_name, cuisine?, confidence }
        Client calls search-recipes Edge Function
          |
          v
        Serper.dev API: Google search for "[dish_name] recipe"
          |
          Returns: [{ title, url, image_url, source, snippet }]
          |
          User picks one --> existing parse-recipe-url imports it
```

### Key Integration Points

1. **Auth and Rate Limiting**: Same pattern as `parse-recipe-url` -- JWT auth, `ai_usage_log` table, per-user rate limits.
2. **Caching**: Hash image (first 1KB + dimensions) for `ai_usage_log.input_hash`. Same 24-hour cache window.
3. **Premium Gating**: Vision features as premium-only or freemium with monthly limits (e.g., 10 scans/month free, unlimited premium). Follows existing `subscriptions` table check pattern.
4. **Storage**: Do NOT store photos in Supabase Storage unless needed for history. Send base64 directly to Edge Function, process, discard. Saves storage costs.
5. **Pantry Integration**: Inventory scan results map directly to existing `pantry_items` table schema. Bulk insert via Supabase client on the app side after user confirms items.
6. **Recipe Import**: Recipe search results provide URLs that feed into existing `parse-recipe-url` Edge Function. No new import pipeline needed.

## Gemini Vision API Call Pattern

The existing `parse-recipe-url` Edge Function uses Gemini via direct REST `fetch()`. The vision call follows the same pattern but sends image data:

```typescript
// Gemini multimodal request body structure
{
  contents: [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: base64ImageString } },
      { text: systemPrompt }
    ]
  }],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 4000,
    responseMimeType: 'application/json'
  }
}
```

No SDK needed. Same `fetch()` to `generativelanguage.googleapis.com` as existing code.

## Cost Analysis

### Per-Request Costs (Gemini 2.5 Flash)

| Action | Image Tokens | Text Tokens (prompt+response) | Total Tokens | Cost |
|--------|-------------|-------------------------------|--------------|------|
| Fridge scan (1 photo) | ~1,300 | ~500 prompt + ~800 response | ~2,600 | ~$0.003 |
| Food photo ID (1 photo) | ~1,300 | ~300 prompt + ~200 response | ~1,800 | ~$0.001 |
| Recipe search (Serper) | N/A | N/A | N/A | 1 credit (~$0.001) |

### Monthly Cost Projections

| Scenario | Scans/mo | Recipe searches/mo | Gemini Cost | Serper Cost | Total |
|----------|----------|-------------------|-------------|-------------|-------|
| 100 users, light use | 500 | 200 | $1.50 | $0.20 | ~$1.70 |
| 500 users, moderate | 3,000 | 1,200 | $9.00 | $1.20 | ~$10.20 |
| 2,000 users, heavy | 15,000 | 6,000 | $45.00 | $6.00 | ~$51.00 |

### Free Tier Runway

- **Gemini**: Free tier available with rate limits (sufficient for development and early launch)
- **Serper**: 2,500 free queries (covers ~2 months of 100-user light use)

## Gemini Vision Prompt Strategy

### Fridge/Pantry Scan Prompt (mode: "inventory")

The prompt should instruct Gemini to return structured JSON with:
- Item name (generic + brand if visible on labels)
- Category (produce, dairy, meat, condiment, beverage, grain, snack, frozen, canned, other)
- Estimated quantity and unit where determinable
- Confidence level per item

Key prompt engineering notes:
- Instruct to read labels/brands via OCR capabilities (Gemini 2.5 Flash has strong OCR per Google docs)
- Ask for both the brand name AND generic item name (e.g., "Heinz Tomato Ketchup" -> brand: "Heinz", name: "Tomato Ketchup")
- Categories should map to existing `pantry_items` categories in the app
- Use `responseMimeType: 'application/json'` for guaranteed structured output (same pattern as video parsing)
- Image quality matters: instruct users to take well-lit photos with items visible

### Food Photo ID Prompt (mode: "dish")

Simpler prompt: identify the dish, estimate cuisine, return high-confidence name suitable for recipe search. Also handles screenshots of food from social media.

### Meal Plan Logging Prompt (extension of "dish" mode)

When user wants to log a meal directly to the plan, the dish identification response includes enough info to create a minimal meal plan entry (dish name + estimated servings).

## Environment Variables (New)

| Variable | Where | Purpose |
|----------|-------|---------|
| `SERPER_API_KEY` | Supabase Edge Function secrets | Serper.dev API authentication |

One new secret. Added via `supabase secrets set SERPER_API_KEY=...`.

`GEMINI_API_KEY` already exists in Edge Function environment.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo-image-picker@~55.0.13 | Expo SDK 55 | Already in project, verified working |
| Gemini 2.5 Flash API | Supabase Edge Functions (Deno) | Same fetch-based pattern as existing `parse-recipe-url`. Image sent as base64 `inline_data` in request body. |
| Serper.dev API | Supabase Edge Functions (Deno) | Simple REST API, no SDK needed. Single `fetch()` call. |

## Sources

- [Gemini API Pricing (official)](https://ai.google.dev/gemini-api/docs/pricing) -- Verified: $0.30/M input, $2.50/M output for Flash. Image tokens confirmed at ~258-1,610 per image depending on resolution. HIGH confidence.
- [CalCam: Food Tracking with Gemini API (Google Developers Blog)](https://developers.googleblog.com/en/calcam-transforming-food-tracking-with-the-gemini-api/) -- Real-world food recognition app using Gemini Flash with structured JSON output. HIGH confidence.
- [Samsung Vision AI with Gemini (Techlicious)](https://www.techlicious.com/blog/samsung-bespoke-fridge-vision-ai-with-google-gemini/) -- Samsung fridge uses Gemini for food item identification in fridges specifically. MEDIUM confidence.
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- Verified `launchCameraAsync` with `base64: true`. HIGH confidence.
- [Serper.dev](https://serper.dev/) -- 2,500 free queries, structured JSON, 1-2 second response times. $50/50K credits paid tier. MEDIUM confidence (pricing verified from landing page).
- [Spoonacular Pricing](https://spoonacular.com/food-api/pricing) -- Free: 50 points/day. Cook: $29/mo for 1,500 points/day. Verified from official pricing page. HIGH confidence.
- [GPT-5 Image Mini pricing](https://pricepertoken.com/pricing-page/model/openai-gpt-5-image-mini) -- $2.50/M input, $2.00/M output. MEDIUM confidence (third-party aggregator).
- [Gemini 2.5 Flash vs GPT-5 Mini comparison](https://blog.galaxy.ai/compare/gemini-2-5-flash-vs-gpt-5-mini) -- Gemini 1M context vs GPT-5-mini 400K, both multimodal. MEDIUM confidence.
- [Roboflow: Gemini 2.5 for Zero-Shot Object Detection](https://blog.roboflow.com/gemini-2-5-object-detection-segmentation/) -- Confirms Gemini 2.5 can output bounding boxes and structured JSON for detected objects. MEDIUM confidence.
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts` -- Confirmed Gemini Flash integration pattern, auth, rate limiting, caching. HIGH confidence.

---
*Stack research for: AI Vision features in SharedKitchen v4.0*
*Researched: 2026-03-30*
