# Technology Stack: Video Recipe Import

**Project:** SharedKitchen v3.0
**Researched:** 2026-03-28
**Scope:** New additions only -- existing stack (Expo 55, Supabase, Gemini Flash, etc.) is validated and not re-evaluated.

## Recommended Stack Additions

### Transcript Extraction API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Supadata REST API** | v1 | Extract transcripts from YouTube, TikTok, Instagram, generic video URLs | Single API covers all target platforms. 1 credit per native transcript, 2 credits/min for AI-generated. Simple REST GET with `x-api-key` header -- no SDK needed in Deno Edge Function. |

**API Details:**
- Endpoint: `GET https://api.supadata.ai/v1/transcript?url={videoUrl}&text=true&mode=auto`
- Authentication: `x-api-key` header
- Response: `{ content: string, lang: string }` (with `text=true`)
- Async jobs: Videos >20min return HTTP 202 with `jobId`, poll at `/v1/transcript/{jobId}`
- Platforms: YouTube, TikTok, Instagram, X/Twitter, Facebook, direct video file URLs

**Why Supadata over alternatives:**

| Criterion | Supadata | SocialKit | Apify |
|-----------|----------|-----------|-------|
| YouTube | Yes | Yes | Yes |
| TikTok | Yes | Yes | Yes (actor-based) |
| Instagram | Yes | Yes | Yes (actor-based) |
| Generic video URLs | Yes (direct file upload) | No | No |
| AI fallback (no captions) | Yes (`mode: auto/generate`) | Unclear | No |
| Pricing (Pro) | $17/mo for 3,000 credits | $29/mo for 12,000 credits | $49/mo (complex actor pricing) |
| Integration complexity | Single REST endpoint | Single REST endpoint | Actor runs, webhook callbacks |
| Deno compatibility | Plain fetch -- no SDK needed | Plain fetch | Requires Apify client library |

**Decision: Supadata** because it covers all platforms including generic video URLs with a single endpoint, has AI-generated transcript fallback for videos without captions (critical for TikTok/Instagram which often lack captions), and the REST API is trivially callable from Deno with `fetch()`. The Pro tier at $17/month provides 3,000 transcript credits -- sufficient for early growth.

**Confidence: HIGH** -- verified via official docs at docs.supadata.ai.

### Share Sheet Integration (Client)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **expo-share-intent** | ^6.0.0 | Receive shared URLs from TikTok, Instagram, YouTube apps via iOS share sheet | Only maintained Expo native module for receiving share intents. v6.0+ supports Expo SDK 55. Already compatible with existing `expo-linking` dependency and `sharedkitchen` URL scheme. |

**Integration details:**
- Add plugin to `app.json`: `"expo-share-intent"` (with `iosActivationRules` for URLs)
- Hook: `useShareIntent()` returns `{ hasShareIntent, shareIntent, resetShareIntent, error }`
- `shareIntent.webUrl` contains the shared URL -- feed directly into existing `parseRecipeUrl()` flow
- Requires dev client (`expo prebuild`) -- already the case for this project (EAS Build)
- Peer dependency `expo-linking` already installed at `~55.0.8`

**Known limitation:** Cannot use with Expo Go -- requires `expo prebuild`. Non-issue since SharedKitchen already uses EAS Build.

**Confidence: HIGH** -- verified via GitHub repo (achorein/expo-share-intent) and npm package page.

### Video URL Detection (No new dependency)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Regex URL matching** | N/A (built-in) | Detect whether a URL is a video URL (TikTok, Instagram Reel, YouTube, etc.) | Zero dependencies. Simple regex patterns against known video URL formats. Runs in both client and Edge Function. |

**URL patterns to detect:**

```typescript
const VIDEO_URL_PATTERNS = [
  /(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i,        // YouTube
  /(?:tiktok\.com\/@[\w.-]+\/video|vm\.tiktok\.com)/i,      // TikTok
  /(?:instagram\.com\/(?:reel|p)\/)/i,                       // Instagram Reels/Posts
  /(?:facebook\.com\/.*\/videos\/|fb\.watch\/)/i,            // Facebook
  /(?:x\.com|twitter\.com)\/\w+\/status\/\d+/i,             // X/Twitter
];

function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some(pattern => pattern.test(url));
}
```

**Decision:** No library needed. URL patterns are stable and simple.

**Confidence: HIGH** -- these are well-known URL formats.

### Transcript-to-Recipe Parsing (Existing dependency)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Gemini Flash** (existing) | gemini-2.5-flash | Parse transcript text into structured recipe JSON | Already used for HTML-to-recipe fallback. Same model, different prompt. Transcript parsing is simpler than HTML parsing -- shorter context, less noise. |

**New prompt needed for transcript mode that:**
1. Handles conversational/informal language ("a splash of olive oil" -> `{ amount: 1, unit: "tbsp", name: "olive oil" }`)
2. Infers measurements when speakers are imprecise ("some garlic" -> `{ amount: 2, unit: "cloves", name: "garlic" }`)
3. Separates recipe content from non-recipe chatter (intros, sponsorships, outros)
4. Extracts timing from verbal cues ("let that simmer for about 20 minutes")

No new dependency -- just a new prompt template within the existing Gemini call.

**Confidence: HIGH** -- Gemini Flash is already integrated and working.

### Rate Limiting for Video Imports (Existing infrastructure)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Supabase `ai_usage_log` table** (existing) | N/A | Track video import count per user per month | Existing rate limiting infrastructure already tracks per-user, per-function usage. Add `function_name: 'parse-video-recipe'` entries. Query with monthly window instead of daily. |

**Implementation approach:**
- New `function_name` value: `'parse-video-recipe'` in `ai_usage_log`
- Monthly window: `gte(created_at, first_of_month)` instead of 24-hour window
- Free tier: 3 video imports/month
- Premium tier: unlimited (checked via existing `subscriptions` table query)
- Returns `429` with `{ error, limit, remaining }` -- same pattern as existing rate limiter

No new tables or infrastructure needed.

**Confidence: HIGH** -- existing pattern, just new function_name and window.

## What NOT to Add

| Rejected Addition | Why Not |
|-------------------|---------|
| **@supadata/js SDK** | Deno Edge Functions run on Deno runtime. A single `fetch()` call to the REST API is simpler, more reliable, and has zero dependency risk in Deno. |
| **Video download/processing (ffmpeg, yt-dlp)** | We extract transcripts, not video files. Supadata handles media processing server-side. Adding media processing to Edge Functions would hit Deno memory limits. |
| **OpenAI Whisper / speech-to-text** | Supadata's `mode: auto` already uses AI speech-to-text fallback when native captions are unavailable. Running our own Whisper adds massive complexity for zero benefit. |
| **react-native-share** | For SENDING shares, not receiving them. `expo-share-intent` is what we need. |
| **expo-share-extension (MaxAst)** | Creates a full custom share extension UI. Overkill -- we just need to receive a URL and redirect to the main app. |
| **New Edge Function** | Extend existing `parse-recipe-url` with a video branch, not a new function. Same auth, caching, rate limit infrastructure. One function, two code paths. |
| **Separate transcript caching table** | Reuse existing `ai_usage_log.cached_response` with `function_name: 'parse-video-recipe'`. |
| **SocialKit API** | More expensive at relevant tier. No generic video URL support. No confirmed AI transcript fallback for uncaptioned videos. |

## Integration Architecture

### Modified `parse-recipe-url` Edge Function Flow

```
Client sends: { url: string, html?: string, isVideo?: boolean }
                    |
                    v
         ┌─ isVideo or isVideoUrl(url)? ──┐
         │                                 │
    NO   │                                 │  YES
         v                                 v
  [Existing flow]                [New video branch]
  JSON-LD -> Gemini              Check video rate limit (3/mo free)
  (unchanged)                    -> Supadata transcript
                                 -> Gemini (transcript prompt)
                                        |
                                        v
                                 Same response shape:
                                 { name, ingredients,
                                   instructions, ... }
```

### Client-side Integration Points

1. **`src/lib/ai.ts` > `parseRecipeUrl()`** -- Add `isVideoUrl()` check. For video URLs, skip HTML fetch and JSON-LD extraction; send URL directly to Edge Function with `{ url, isVideo: true }`.

2. **Share sheet handler** -- New `+native-intent.ts` file in Expo Router. Uses `useShareIntent()` hook to capture shared URL, then routes to the import screen with the URL pre-filled.

3. **Import UI** -- Existing paste-URL field needs no change for the happy path. Add video-specific loading message ("Extracting recipe from video...") since transcript extraction takes longer (~5-15s vs ~2s for HTML).

4. **Rate limit UI** -- New message for video-specific rate limit: "3 free video imports per month. Upgrade for unlimited." Uses existing `RateLimitError` class.

## Environment Variables (New)

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPADATA_API_KEY` | Supabase Edge Function secrets | Supadata API authentication |

One new secret. Added via `supabase secrets set SUPADATA_API_KEY=sk_...`.

## Cost Projection

| Tier | Monthly Video Imports | Supadata Cost | Notes |
|------|----------------------|---------------|-------|
| Early (0-100 users) | ~50-200 | $0-$5 (Free/Basic) | Most videos have native transcripts (1 credit each) |
| Growth (100-1K users) | ~500-2000 | $17 (Pro) | ~3K credits covers 1.5K-3K native transcripts |
| Scale (1K+ users) | 2000-10K | $47 (Mega) | 30K credits, auto-recharge available |

Gemini Flash costs are negligible (~$0.001 per transcript parse) since transcripts are short text.

## Installation

```bash
# Client-side (one new package)
npx expo install expo-share-intent

# Edge Function (no new packages -- plain fetch to Supadata REST API)
# Just add the API key:
supabase secrets set SUPADATA_API_KEY=sk_your_key_here
```

## app.json Changes

```jsonc
{
  "plugins": [
    "expo-router",
    "expo-sharing",
    ["expo-share-intent", {
      "iosActivationRules": {
        "NSExtensionActivationSupportsWebURLWithMaxCount": 1
      }
    }],
    ["@stripe/stripe-react-native", { "..." : "..." }],
    ["expo-notifications", { "..." : "..." }]
  ]
}
```

The `iosActivationRules` restricts the share extension to URLs only (no images/files), keeping the share sheet clean.

## Sources

- [Supadata Transcript API Docs](https://docs.supadata.ai/get-transcript) -- endpoint, parameters, response format
- [Supadata Pricing](https://supadata.ai/pricing) -- credit tiers and costs
- [expo-share-intent GitHub](https://github.com/achorein/expo-share-intent) -- SDK compatibility, installation, hook API
- [expo-share-intent npm](https://www.npmjs.com/package/expo-share-intent) -- version info
- [SocialKit Pricing](https://www.socialkit.dev/pricing) -- comparison pricing
- [Supadata Blog: Best YouTube Transcript API 2026](https://supadata.ai/blog/best-youtube-transcript-api) -- competitive comparison
