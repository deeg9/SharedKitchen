# Pitfalls Research

**Domain:** AI Vision features for React Native food/kitchen app (SharedKitchen v4.0)
**Researched:** 2026-03-30
**Confidence:** HIGH (based on existing codebase analysis, official docs, and ecosystem research)

## Critical Pitfalls

### Pitfall 1: Sending Full-Resolution Camera Images to Vision API

**What goes wrong:**
iPhone cameras capture 12-48MP images (8-15MB each). Sending these as base64 to a Supabase Edge Function via JSON body means: (a) the base64 string is ~33% larger than the binary (~12-20MB), (b) the Edge Function must hold the entire image in its 256MB memory alongside the Gemini API request, (c) Gemini's inline image limit is 20MB total request size (prompt + image), and (d) the user waits 5-15 seconds just for upload over cellular. A single fridge photo at full resolution will regularly hit or exceed these limits.

**Why it happens:**
expo-image-picker returns full-resolution images by default. Developers grab the URI, convert to base64, and ship it without resizing. It works in development on fast WiFi with small test images, then breaks in production.

**How to avoid:**
Compress and resize on-device BEFORE base64 encoding. Use expo-image-manipulator to resize to max 1024x1024 (or 1536 longest edge) at quality 0.7-0.8. This produces ~100-300KB images that are perfectly adequate for food/item recognition. The existing codebase already uses expo-image-picker (in edit-profile.tsx and RecipeForm.tsx) -- add a shared `compressForVision()` utility that all vision flows call.

```typescript
// Target: ~200KB base64 payload per image
ImageManipulator.manipulateAsync(uri, [
  { resize: { width: 1024 } }  // maintain aspect ratio
], { compress: 0.75, format: SaveFormat.JPEG, base64: true });
```

**Warning signs:**
- Edge Function timeouts (504) on cellular connections
- "Request too large" errors from Gemini API
- Memory warnings or OOM crashes on older iPhones (iPhone 11/SE)

**Phase to address:**
Phase 1 (Foundation) -- image capture and compression utility must exist before any vision feature is built.

---

### Pitfall 2: Treating Vision API as Deterministic/Reliable for Inventory

**What goes wrong:**
AI vision identifies "milk" but the user has oat milk. It sees a bottle and guesses "soy sauce" when it is balsamic vinegar. It misses items behind other items. It hallucinates items not in the photo. A fridge photo with 15-20 items will realistically achieve 60-75% accuracy at the item level, and brand-level accuracy is significantly lower. If items are bulk-added to the pantry without user review, the On Hand inventory becomes unreliable, undermining the entire Kitchen tab experience.

**Why it happens:**
General-purpose vision models (Gemini, GPT) are not food-recognition specialists. Research shows Google Cloud Vision achieved only 9% top-1 accuracy for food items in comparative studies. Multi-model APIs are better but still struggle with: overlapping items, poor lighting, reflective packaging, similar-looking bottles, and items partially hidden. Developers demo with a neatly arranged fridge and assume production accuracy matches.

**How to avoid:**
NEVER auto-add items to pantry without user confirmation. The vision API output should populate an editable review screen where users can:
1. Remove incorrect items (swipe to delete)
2. Edit item names (tap to rename)
3. Add missed items manually
4. Confirm the batch

This matches how the best competing apps (Portions Master, Scan2Meal) handle it. The AI is an accelerator, not an oracle.

**Warning signs:**
- Users reporting phantom items in their On Hand list
- Users losing trust in the feature after 2-3 bad results and abandoning it
- Support tickets about "wrong items added to my pantry"

**Phase to address:**
Phase 2 (Fridge Scan feature) -- the review/edit screen is not optional, it is the core UX of the feature.

---

### Pitfall 3: Supabase Edge Function Payload and Memory Constraints for Images

**What goes wrong:**
The current Edge Functions (parse-recipe-url, generate-meal) send text payloads (HTML, prompts). Vision features need to send image data. Supabase Edge Functions have a 256MB memory limit shared between request parsing, image processing, and the outgoing Gemini API call. A single compressed image (~200KB base64 = ~270KB in JSON body) is fine. But a fridge scan flow that tries to send multiple images or a single high-res panorama will hit memory pressure. Additionally, the Edge Function CPU time limit is 2 seconds per request (excluding async I/O), which constrains any image preprocessing on the server.

**Why it happens:**
The existing architecture pipes everything through Edge Functions as JSON. This works for text but is inefficient for binary data. Developers extend the existing pattern without reconsidering the transport mechanism.

**How to avoid:**
Two viable approaches:
1. **Direct Gemini call from Edge Function with base64 inline** -- For single compressed images (<1MB base64), this works within Gemini's 20MB request limit and Edge Function memory. This is the simplest approach and matches the existing Edge Function pattern.
2. **Upload to Supabase Storage first, then pass Storage path** -- For multi-image flows or if images need persistence, upload to a `vision-uploads` bucket with short TTL, then pass the Storage URL to the Edge Function. Edge Function fetches from Storage (fast, same-region) and forwards to Gemini.

For v4.0, approach #1 is sufficient since each vision flow processes one photo at a time. Reserve approach #2 only if multi-photo fridge scanning is needed later.

**Warning signs:**
- Edge Function memory errors or 500s when processing images
- Timeouts on the POST request from client to Edge Function
- JSON.parse failures on large payloads

**Phase to address:**
Phase 1 (Foundation) -- decide the transport mechanism and implement it once for all vision flows.

---

### Pitfall 4: Vision API Cost Explosion Under Freemium Model

**What goes wrong:**
Each vision API call with an image costs significantly more than text-only calls. Gemini Flash image input costs ~1,120 tokens per image (~$0.00028/image at current pricing), plus output tokens for the structured response. While per-call costs seem tiny, vision features encourage frequent use: users might scan their fridge daily, photograph every meal, snap dishes at restaurants. At 100 active users doing 3 scans/day, that is 9,000 calls/month. At 1,000 users, 90,000 calls/month. Free-tier users generate cost with no revenue.

**Why it happens:**
Text-only AI features (recipe import, meal suggestions) are naturally rate-limited by user behavior -- you only import a recipe when you find one. Vision features are "point and shoot" -- much lower friction means much higher usage frequency. The existing rate limits (10/day for recipe import, 5/day for meal gen, 3/month for video) were calibrated for text costs.

**How to avoid:**
1. **Extend the existing ai_usage_log rate limiting** with new `function_name` values for vision calls (e.g., `vision-fridge-scan`, `vision-dish-identify`). The infrastructure already exists.
2. **Set aggressive free-tier limits**: 5 vision scans/month for free users, unlimited for premium. Vision is a premium differentiator.
3. **Cache aggressively**: Hash the image (or a perceptual hash) and cache results in ai_usage_log.cached_response, same pattern as parse-recipe-url. Identical or near-identical photos should return cached results.
4. **Use Gemini Flash** (not GPT-4o or gpt-5-mini) for vision -- it is 10-50x cheaper for image input and already used in the codebase for video parsing and meal generation.
5. **Track token usage per call** -- the existing `tokens_used` column in ai_usage_log supports this. Monitor actual costs weekly.

**Warning signs:**
- Gemini API bill exceeding $50/month with <500 users
- Free-tier users consuming >80% of AI budget
- Token usage per vision call exceeding 3,000 (indicates images are too large)

**Phase to address:**
Phase 1 (Foundation) -- rate limiting and cost controls must be in place before any vision feature ships.

---

### Pitfall 5: Item Name Normalization Drift Between Vision Output and Existing Pantry

**What goes wrong:**
The vision API returns "2% reduced fat milk" but the pantry has "Milk" (added manually or from a grocery item). Or it returns "Organic Baby Spinach 5oz" but the existing item is "spinach". The user now has duplicate items in their On Hand list. Over time, the pantry fills with near-duplicates: "chicken breast", "Chicken Breasts", "boneless skinless chicken breast", "Tyson Chicken Breast". The category assignments also drift -- the AI might label something "Dairy" while the existing pantry item has category "Other" (the default in pantry_items).

**Why it happens:**
The pantry_items table stores `name` as freeform `text` with no normalization. There is no uniqueness constraint. Manual additions, grocery-item auto-copies (via source_grocery_item_id), and vision-scan additions all write different name formats. The current grocery-to-pantry auto-copy (v3.0) already has this problem at small scale -- vision scanning will amplify it by an order of magnitude because each scan can add 10-20 items at once.

**How to avoid:**
1. **Normalize item names in the Edge Function response** -- instruct Gemini to return simplified, generic item names (e.g., "milk" not "Horizon Organic 2% Reduced Fat Milk 64oz"). Strip brand names, standardize pluralization, lowercase.
2. **Fuzzy match against existing pantry items** -- before inserting, query existing pantry_items by household_id and check for similar names. Present matches to the user in the review screen: "You already have 'Spinach' -- update this item or add new?"
3. **Consider a `normalized_name` column** on pantry_items for deduplication queries, keeping the display `name` user-friendly. This can be a generated column: `lower(regexp_replace(name, '^\d+\s*(oz|lb|g|kg|ml|l)\s+', '', 'i'))`.

**Warning signs:**
- Users with >50 pantry items when they realistically have ~20 unique items
- Multiple items with the same base ingredient at slightly different names
- Complaints about "messy" or "cluttered" pantry/On Hand view

**Phase to address:**
Phase 2 (Fridge Scan) -- normalization logic is part of the scan-to-pantry pipeline. Consider a migration to add `normalized_name` column early.

---

### Pitfall 6: Camera Permission and Multi-Step Flow Interruption

**What goes wrong:**
User opens the scan feature, iOS prompts for camera permission, user denies or dismisses. The app shows a blank screen or crashes. Or: user grants permission, takes a photo, switches to another app mid-processing, returns, and the vision API response is lost. Or: user takes a photo but the Edge Function returns a 429 (rate limit) -- the photo is lost and they have to retake it.

**Why it happens:**
The existing expo-image-picker usage (profile avatar, recipe photos) handles the simple case: pick image, use it locally or upload it. Vision features add a multi-step async flow: capture -> compress -> upload -> API call -> review -> confirm -> save. Any step can fail, and the photo (which took effort to capture) should not be lost.

**How to avoid:**
1. **Pre-check camera permission** before showing the scan button. Use `ImagePicker.getCameraPermissionsAsync()` and show a contextual pre-prompt (the app already does this pattern for push notifications in v2.0).
2. **Save the compressed image to a local temp path** before starting the API call. If the API call fails, the user can retry without retaking the photo.
3. **Handle all Edge Function error codes gracefully**: 429 (rate limit) shows the limit UI with retry option, 504 (timeout) offers retry, 422 (unrecognizable) lets user add items manually, 502 (API down) shows "try again later".
4. **Use AbortController** on the client side (the Edge Functions already use this pattern internally) so app backgrounding can cancel in-flight requests cleanly.

**Warning signs:**
- Crash reports on the camera permission screen
- Users retaking photos repeatedly (analytics funnel drop-off between capture and confirm)
- Unhandled promise rejections from backgrounded API calls

**Phase to address:**
Phase 1 (Foundation) -- permission handling and error recovery are part of the base vision infrastructure.

---

### Pitfall 7: Food Photo to Recipe -- Unrealistic Identification Expectations

**What goes wrong:**
User photographs a bowl of pasta. The AI identifies it as "pasta with tomato sauce." The app searches for recipes and returns generic "spaghetti marinara" recipes that look nothing like what the user photographed. Or worse: the AI confidently identifies "Thai Green Curry" when it is actually palak paneer. The user expected the AI to identify the exact dish and find the exact recipe -- the feature feels broken even when the AI is working correctly.

**Why it happens:**
Food dish identification from a single photo is genuinely ambiguous. Many dishes look similar (various stir-fries, various curries, various pasta dishes). The gap between user expectation ("find me THIS recipe") and technical capability ("here are recipes for dishes that look similar") is large. Framing the feature as "snap and get the recipe" sets the wrong expectation.

**How to avoid:**
1. **Frame the UX as "what dish is this?" not "find this exact recipe."** Show the AI's identification with a confidence indicator and let the user edit/correct it before searching.
2. **Present 2-3 recipe options** (already in the spec) with clear visual differences -- this sets the expectation that these are "recipes like this" not "the recipe for this exact dish."
3. **Let the user type/edit the dish name** if the AI gets it wrong, then re-search. The AI identification is a shortcut, not the only path.
4. **Add the identified dish as a meal plan entry even without a full recipe** -- sometimes users just want to log "I had Thai food" without importing a full recipe. This supports the "add as meal to specific day/slot" requirement.

**Warning signs:**
- Low conversion from "identify dish" to "import recipe" (<20%)
- Users repeatedly correcting the AI identification
- App store reviews mentioning "wrong recipe" or "doesn't recognize my food"

**Phase to address:**
Phase 3 (Food Photo features) -- UX framing and expectations management are critical to this feature's perceived quality.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Calling Gemini directly from client instead of Edge Function | Faster development, no Edge Function needed | API key exposed in app bundle, no rate limiting, no caching, no usage logging | Never -- all AI calls must go through Edge Functions for security and rate limiting |
| Skipping image compression on client | Simpler code, one fewer dependency (expo-image-manipulator) | 10x larger payloads, timeouts on cellular, memory issues on old devices, higher API costs | Never -- even a simple resize to 1024px is essential |
| Using the same rate limit bucket for vision and text AI calls | No schema changes needed, fewer function_name values | Vision calls and text calls have different cost profiles, impossible to tune limits independently | Only in initial prototype; split before shipping |
| Storing vision API responses without name normalization | Ship faster, defer cleanup | Pantry fills with duplicates, user trust erodes, harder to fix retroactively with existing data | MVP only -- add normalization before second iteration |
| Hardcoding vision prompts in Edge Functions | Works, matches existing pattern for generate-meal and parse-recipe-url | Cannot A/B test prompts, cannot improve without redeployment | Acceptable for v4.0; extract to config if iterating frequently post-launch |
| Persisting user food photos in Supabase Storage | Enables retry, visual history | Privacy liability, storage costs grow linearly, GDPR exposure | Never persist permanently; use ephemeral temp files with 1-hour auto-delete |

## Integration Gotchas

Common mistakes when connecting vision features to existing SharedKitchen systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vision scan -> pantry_items | Inserting items without checking for duplicates against existing household inventory | Query existing pantry_items by household_id, fuzzy-match against AI results, present merge options in review screen |
| Vision identify -> recipe search | Assuming the dish name from AI is a good web search query as-is | Strip qualifiers ("homemade", "mom's", "traditional"), use the core dish name, search with fallback variations |
| Vision -> meal_plans | Requiring a recipe_id for meal plan entries from photo-identified meals | Support meal plan entries with just a dish name (no recipe). The user may want to log "pad thai" without importing a full recipe |
| Vision -> ai_usage_log | Using a single function_name for all vision calls | Use distinct function_names: `vision-fridge-scan`, `vision-dish-identify`, `vision-meal-log` for independent rate limiting and cost tracking |
| Image data -> Edge Function | Sending raw base64 in JSON body without size validation | Compress to <300KB base64 on client, validate base64 length in Edge Function before forwarding to Gemini, return 413 for oversized payloads |
| Gemini API -> structured JSON for vision | Assuming Gemini always returns valid JSON for vision responses | Vision responses are less structured than text-only prompts. Always validate JSON schema. The codebase already strips markdown fences -- keep this pattern for vision Edge Functions |
| Vision results -> existing categories | Assuming AI-returned categories match the app's 14-category system | Map AI category output to the canonical category list (from FilterBar/category picker), or default to "Other" |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Base64 encoding full-res images on React Native JS thread | UI freezes for 1-3 seconds during encoding, app feels unresponsive | Use expo-image-manipulator which processes on native thread and returns base64 from the manipulation call directly | Every time on devices with <4GB RAM |
| Synchronous pantry duplicate check per item in Edge Function | Each scan adds 200-500ms per item checking for duplicates individually | Batch the duplicate check: one query with `name ILIKE ANY(array[...])` instead of N individual queries | >30 pantry items per household |
| Logging every vision call with full Gemini raw response in cached_response | ai_usage_log table grows rapidly with large JSONB entries (vision responses can be verbose) | For vision calls, cache only the structured item list, not the full Gemini response. Consider TTL-based cleanup job | >10,000 vision calls total in ai_usage_log |
| No client-side image cache for retry scenarios | User retakes photo on every retry after API failure -- slow and frustrating | Cache the compressed image URI in local state; clear after successful save or on unmount | Every retry scenario |
| Scanning full fridge in one API call with one photo | Single photo of full fridge has low per-item accuracy, items at edges are unrecognizable | Guide user to take per-shelf photos; merge results across multiple scans | Fridges with >15 visible items |

## Security Mistakes

Domain-specific security issues for vision features.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Gemini API key in client bundle for "faster" vision calls | Anyone can extract the key from the IPA and make unlimited API calls at your expense | Route ALL vision calls through Edge Functions (matching existing pattern for parse-recipe-url and generate-meal). Never call Gemini directly from React Native. |
| Storing user food photos permanently in Supabase Storage | Privacy liability -- food photos reveal dietary habits, health conditions, household composition, and potentially location metadata in EXIF | Do NOT persist photos. Process in memory only. If ephemeral caching is needed, use Supabase Storage with auto-delete lifecycle rules (1 hour TTL). Strip EXIF data on client before sending. |
| No input validation on image data in Edge Function | Malicious user sends a 50MB payload or non-image data to exhaust Edge Function memory or crash the function | Validate base64 length (<500KB) early in the Edge Function, before any processing. Check for JPEG/PNG header bytes in the decoded data. Reject immediately if invalid. |
| Rate limiting only on successful API calls | Attacker sends invalid images repeatedly to burn Gemini API quota before rate limit kicks in | Count ALL attempts (success + failure) against the rate limit, matching the existing pattern where ai_usage_log is written regardless of outcome |
| Logging full image base64 in Edge Function console.error | Images end up in Supabase function logs, accessible to anyone with dashboard access | Never log image data. Log only metadata: image size, dimensions, function_name, user_id, error message |

## UX Pitfalls

Common user experience mistakes in food vision apps.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring the whole fridge in one photo | Users contort themselves to fit everything in frame, photo quality suffers, items at edges are unrecognizable | Allow multiple photos ("top shelf", "bottom shelf", "door") and merge results. Or frame as "photograph one shelf at a time" with an "Add more" button after each scan. |
| No loading state during 3-8 second vision processing | User taps scan, nothing happens, taps again, gets duplicate results or confusion | Show an animated "Scanning..." overlay with the captured photo visible underneath. The app already has good loading patterns from recipe import. |
| Auto-dismissing the review screen or auto-adding items | Items are added before the user can verify, eroding trust in the inventory | Review screen must be user-dismissed with an explicit "Add X items to On Hand" button. All items should be pre-selected but individually toggleable. |
| Not showing confidence or uncertainty in scan results | User sees a flat list with no indication that "soy sauce" is a guess while "eggs" is obvious | Group or annotate items by confidence: "Clearly identified" vs "Best guess -- please check." Highlight uncertain items for easy correction. |
| Forcing recipe import as the only outcome of dish identification | User just wants to log what they ate, not find and import a full recipe | Offer two clear paths after dish identification: "Find Recipes" (search and import) and "Log This Meal" (add to meal plan with just the name). |
| Going too big on initial pantry scan | The thought of scanning every shelf, drawer, and cabinet is overwhelming -- user gives up before starting | Frame as incremental: "Start with what is in front of you." Make it easy to do partial scans. Do not require a complete inventory to see value. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Fridge scan:** Often missing handling for empty/unrecognizable photos -- verify the Edge Function returns a clear "No items found in this photo" message, not an error
- [ ] **Fridge scan:** Often missing duplicate detection against existing pantry -- verify scan results are cross-referenced with current household pantry_items before presenting review screen
- [ ] **Fridge scan:** Often missing category assignment -- verify scanned items get categories that match the existing pantry_items.category values, not arbitrary AI-generated ones
- [ ] **Dish identification:** Often missing fallback when web recipe search returns no results -- verify the user can still add the dish name as a meal plan entry
- [ ] **Dish identification:** Often missing the "edit dish name" step -- verify the user can correct the AI's identification before searching for recipes
- [ ] **Image compression:** Often missing validation that compressed image is under size threshold -- verify a >10MB camera image compresses to <300KB before sending
- [ ] **Rate limiting:** Often missing separate counters for different vision features -- verify `vision-fridge-scan` and `vision-dish-identify` have independent limits in ai_usage_log
- [ ] **Permission handling:** Often missing the "permission previously denied" state -- verify the app detects this and shows "Enable Camera in Settings" with a deep link to iOS Settings
- [ ] **Error recovery:** Often missing photo retention on API failure -- verify the compressed photo is cached locally so the user can retry without retaking
- [ ] **Offline handling:** Often missing graceful degradation when offline -- verify the camera/scan button is disabled or shows an offline message rather than failing silently after photo capture
- [ ] **Premium gating:** Often missing the subscription check before vision features -- verify free-tier limits are enforced server-side via the existing isPremium pattern in Edge Functions

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate pantry items from ungated vision scans | MEDIUM | Add a "merge duplicates" utility that groups by normalized name and lets user pick the canonical entry. Can be a one-time cleanup migration plus a new UI action. |
| Cost overrun from unmetered vision calls | LOW | Tighten rate limits server-side (Edge Function change only, no app update needed). The existing ai_usage_log provides a complete audit trail for cost analysis. |
| Users lost trust due to poor scan accuracy | HIGH | Cannot easily recover perception. Must improve prompts, add confidence indicators, add manual correction UX, and re-frame the feature as "AI-assisted" not "automatic." Requires app update. |
| Large images caused Edge Function OOMs | LOW | Deploy updated Edge Function with size validation (no app update needed for server-side check). Client-side compression fix requires EAS build + app update. |
| Photos stored in Storage without cleanup | MEDIUM | Run a Supabase Storage lifecycle policy or a pg_cron job to delete old vision uploads. Add TTL auto-delete going forward. |
| Vision categories do not match app categories | LOW | Update the Gemini prompt to constrain categories to the app's canonical list. Edge Function change only. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Full-resolution images (#1) | Phase 1: Foundation | Unit test: `compressForVision()` produces <300KB base64 output from a 10MB+ input image |
| No user review for scan results (#2) | Phase 2: Fridge Scan | Manual test: scan a messy fridge photo, verify editable review screen with toggle/remove/edit per item |
| Edge Function payload constraints (#3) | Phase 1: Foundation | Integration test: new vision Edge Function handles 300KB base64 image without timeout or memory error |
| Cost explosion (#4) | Phase 1: Foundation | Verify ai_usage_log entries for vision calls include tokens_used; verify 429 rate limit response at threshold |
| Item name normalization (#5) | Phase 2: Fridge Scan | Test: scan returns "2% Milk", pantry has "milk" -- verify merge/duplicate prompt appears in review screen |
| Camera permission flow (#6) | Phase 1: Foundation | Maestro E2E: deny camera permission, verify graceful fallback UI with Settings link |
| Dish identification expectations (#7) | Phase 3: Food Photo | User test: photograph ambiguous dish, verify editable identification with both "Find Recipes" and "Log Meal" paths |

## Sources

- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- 256MB memory, 2s CPU time, 150s/400s execution duration, 20MB function size
- [Gemini API Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding) -- 20MB inline image limit, base64 input method, image token counts
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) -- ~1,120 tokens per input image for Flash, $0.25/M input tokens
- [expo-image-picker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- camera API, base64 option, quality settings, permission methods
- [ImageManipulator - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) -- resize and compress utilities for on-device image processing
- [Use of Different Food Image Recognition Platforms - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7752530/) -- Google Cloud Vision 9% top-1 accuracy for food, comparative analysis of recognition platforms
- [Portions Master - Ingredient Scanner](https://portionsmaster.com/blog/the-best-ingredient-scanner-app-of-2025-how-portions-master-ai-helps-you-turn-your-cart-pantry-or-fridge-into-goalbased-meals/) -- competitor UX patterns for AI fridge scanning
- [Fridge Vision AI](https://fridgevisionai.com/) -- competitor reference for food photo to recipe flow
- [react-native-compressor](https://www.npmjs.com/package/react-native-compressor) -- alternative native image compression (50KB APK overhead)
- SharedKitchen codebase: `src/lib/ai.ts` (existing AI call patterns, rate limit errors, video import flow), `supabase/functions/parse-recipe-url/index.ts` (Edge Function pattern, caching, rate limiting, Gemini integration), `supabase/functions/generate-meal/index.ts` (Gemini Flash usage, AbortController timeout pattern), `supabase/migrations/00011_create_ai_usage_log.sql` (rate limit schema), `supabase/migrations/00017_create_pantry_items.sql` (pantry schema, no normalization column)

---
*Pitfalls research for: AI Vision features in SharedKitchen v4.0*
*Researched: 2026-03-30*
