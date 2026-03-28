# Domain Pitfalls: Video Recipe Import

**Domain:** Adding video recipe import (TikTok, Instagram, YouTube) to an existing recipe import pipeline
**Researched:** 2026-03-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Edge Function Timeout on Chained External API Calls

**What goes wrong:** Video import chains two external calls: Supadata transcript extraction (2-30s) + Gemini Flash recipe parsing (3-8s). Supabase Edge Functions have a 60-second wall clock limit. If Supadata returns HTTP 202 (async job for videos >20min or without native captions) and requires polling, the total time can exceed 60 seconds, causing a hard timeout with no response to the client.

**Why it happens:** Article imports make one external call (Gemini). Video imports make two. Developers set a single global timeout (currently 55s for Gemini) without accounting for the cumulative time of sequential calls.

**Consequences:** Users see a generic network error. No recipe saved. The Supadata credit is consumed but the result is lost. The user retries, consuming another credit.

**Prevention:**
1. Set per-step timeouts: 40s max for Supadata, 15s max for Gemini. Total never exceeds 55s.
2. For Supadata 202 (async) responses: poll with 3s intervals, max 10 polls (30s). If still not ready, return a user-facing message: "This video is still processing. Try again in a minute."
3. Use `mode=auto` (not `mode=generate`) to prefer native captions which return instantly (HTTP 200).
4. Cache partial results: if Supadata succeeds but Gemini times out, cache the transcript in `ai_usage_log` so a retry can skip Supadata.

**Detection:** Edge Function logs showing 504 or timeout errors on video URLs. Users reporting "import failed" for longer videos.

### Pitfall 2: TikTok and Instagram URLs Redirect to Login Walls

**What goes wrong:** When Supadata (or any server-side service) fetches a TikTok or Instagram URL, the platform may redirect to a login page instead of serving the video content. This happens with mobile-format URLs (like `vm.tiktok.com/ZMxxxxxxx/` short links) and URLs that require authentication. Supadata returns an error or empty transcript, and the Edge Function passes this to Gemini which hallucinates a recipe from nothing.

**Why it happens:** Social media platforms aggressively gate content behind login walls for server-side requests. Mobile share URLs are often short links that resolve differently server-side vs in-app. Developers test with full desktop URLs that work, but users share mobile short links that fail.

**Consequences:** Either an error (good) or a hallucinated recipe from an empty/login-page transcript (bad -- user sees a recipe that has nothing to do with the video).

**Prevention:**
1. Validate transcript length before sending to Gemini. If transcript is under ~50 characters, return error: "Could not extract audio from this video. The video may be private or require login."
2. Test with actual mobile share URLs, not desktop URLs. Use `vm.tiktok.com` short links and Instagram `instagram.com/reel/xxx` URLs shared from the mobile apps.
3. Document that only public videos are supported. Show clear error messaging.
4. Never send an empty or near-empty transcript to Gemini -- it will hallucinate.

**Detection:** Recipes with nonsensical names or ingredients. Supadata returning very short (<50 char) transcripts. Users reporting "the recipe doesn't match the video."

### Pitfall 3: Gemini Hallucinates Recipes from Non-Recipe Video Transcripts

**What goes wrong:** Users share any video URL, not just cooking videos. A comedy sketch, a vlog, or a "what I eat in a day" video gets transcribed and Gemini dutifully invents a recipe from whatever food is mentioned. The user gets a confident-looking but completely wrong recipe.

**Why it happens:** Gemini follows the system prompt instruction to "extract a recipe" even when there is no recipe in the transcript. LLMs are completion machines -- they will produce output in the requested format regardless of input quality.

**Consequences:** User saves a hallucinated recipe. They buy groceries for it. They try to cook it. It is wrong. Trust in the app is destroyed.

**Prevention:**
1. Add a confidence check to the Gemini prompt: "If the transcript does not contain a recipe (no ingredients or cooking instructions mentioned), return `{ error: 'no_recipe_found' }` instead of inventing one."
2. Validate the response: if fewer than 2 ingredients or 0 instructions, treat as extraction failure.
3. Show extracted recipe as "preview" before save, with clear messaging: "Extracted from video -- please review before saving."
4. Consider a pre-check: send transcript to Gemini with a short binary prompt "Does this transcript contain a cooking recipe? YES or NO" before the full extraction. This costs ~100 tokens but prevents hallucinated recipes.

**Detection:** Recipes with generic names like "Delicious Recipe" or "Cooking Video Recipe." Recipes where instructions don't reference the listed ingredients.

## Moderate Pitfalls

### Pitfall 4: expo-share-intent Requires Rebuild and App Group Configuration

**What goes wrong:** Installing `expo-share-intent` requires `expo prebuild --clean` and potentially configuring App Groups for data sharing between the share extension and the main app. If the developer runs `expo prebuild` without `--clean`, stale native files may conflict. If App Groups are not configured, the share extension cannot pass the URL to the main app on some iOS versions.

**Prevention:**
1. Always run `expo prebuild --no-install --clean` after adding expo-share-intent.
2. Test the share sheet on a real device (not simulator) -- share extensions behave differently.
3. Follow the exact patch-package setup from expo-share-intent docs (xcode patch file required).
4. Test sharing from all three apps (TikTok, Instagram, YouTube) -- each generates different URL formats.

### Pitfall 5: Video Rate Limiting Using Wrong Time Window

**What goes wrong:** The existing article import rate limit uses a 24-hour rolling window. If video imports accidentally reuse the same window, a user could import 3 videos on March 31 and then 3 more on April 1, effectively getting 6 imports in 2 days. Alternatively, if using calendar month start, a user importing 3 videos on March 31 gets 3 more on April 1.

**Prevention:**
1. Use first-of-current-month as the window start: `new Date(year, month, 1).toISOString()`.
2. Accept that users get a reset on the 1st of each month -- this is expected and aligns with subscription billing.
3. Use a separate `function_name` (`'parse-video-recipe'`) so video limits do not interfere with article import limits.
4. Display remaining count to users: "2 of 3 free video imports remaining this month."

### Pitfall 6: Supadata Credit Exhaustion Without Alerting

**What goes wrong:** Supadata credits reset monthly. If credits run out mid-month, all video imports fail with a 402/403 error. The Edge Function does not handle this gracefully and may return a confusing error to users.

**Prevention:**
1. Handle Supadata 402/403 responses specifically: return "Video import is temporarily unavailable. Please try again later." to users.
2. Set up Supadata auto-recharge on paid plans.
3. Log Supadata errors distinctly from Gemini errors for monitoring.
4. Start with the Free tier (100 credits) for development, upgrade to Basic ($5/300) or Pro ($17/3000) before launch.

### Pitfall 7: Video URLs in Cache Conflicting with Article URL Cache

**What goes wrong:** The existing cache uses `url_hash + function_name` as the cache key. If the same URL is first imported as an article (getting HTML content) and then as a video (getting transcript content), the cache returns the wrong result type.

**Prevention:**
1. Use different `function_name` values: `'parse-recipe-url'` for articles, `'parse-video-recipe'` for videos. The cache lookup already filters by `function_name`, so this naturally partitions the cache.
2. This is already the planned approach -- just ensure the `function_name` is always set correctly in the video path.

## Minor Pitfalls

### Pitfall 8: Informal Measurements Create Inconsistent Ingredient Amounts

**What goes wrong:** Gemini interprets "a bit of salt" as 0.25 tsp in one recipe and 1 tsp in another. Users comparing recipes see inconsistent amounts for similar phrases. This is cosmetic but erodes trust.

**Prevention:**
1. Add measurement guidelines to the Gemini prompt: "For vague amounts, use these defaults: 'a pinch' = 0.25 tsp, 'a splash' = 1 tbsp, 'some' = 2 tbsp, 'a handful' = 0.5 cup."
2. Accept that some inconsistency is inherent -- the recipe preview screen lets users edit before saving.

### Pitfall 9: Share Sheet Not Appearing for SharedKitchen in Other Apps

**What goes wrong:** After installing expo-share-intent, the SharedKitchen share target does not appear in the iOS share sheet when sharing from TikTok/Instagram/YouTube. Users cannot find the app in the share sheet at all.

**Prevention:**
1. The share extension only appears after the app has been built with the plugin and installed on the device (not just updated via OTA).
2. iOS caches the share sheet menu. Users may need to restart their device or wait for iOS to refresh the extension list.
3. Verify `iosActivationRules` in app.json includes URL support: `NSExtensionActivationSupportsWebURLWithMaxCount: 1`.
4. The share extension uses the app icon -- ensure the icon asset is correctly configured.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Edge Function video branch | Timeout from chained API calls (Pitfall 1) | Per-step timeouts, prefer native captions |
| Supadata integration | Login wall redirects for mobile URLs (Pitfall 2) | Validate transcript length, test with mobile share URLs |
| Gemini transcript prompt | Hallucinated recipes from non-recipe content (Pitfall 3) | Confidence check in prompt, validate min ingredients/steps |
| expo-share-intent setup | Requires clean rebuild, real device testing (Pitfall 4) | `prebuild --clean`, test on physical device |
| Rate limiting | Wrong time window or function_name collision (Pitfall 5, 7) | Use calendar month, separate function_name |
| Production launch | Supadata credit exhaustion (Pitfall 6) | Auto-recharge, graceful error handling |

## Sources

- [Supadata API docs](https://docs.supadata.ai/get-transcript) -- async job handling, error codes, mode behavior
- [Supadata Pricing](https://supadata.ai/pricing) -- credit structure, auto-recharge
- [expo-share-intent GitHub](https://github.com/achorein/expo-share-intent) -- installation requirements, known limitations
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts` -- timeout handling, cache pattern, rate limit pattern
- Existing codebase: `src/lib/ai.ts` -- client-side URL handling, error types
