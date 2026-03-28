# Architecture: Video Recipe Import Integration

**Domain:** Video URL transcript extraction integrated into existing recipe import pipeline
**Researched:** 2026-03-28
**Confidence:** HIGH (existing codebase examined, Supadata API docs verified, expo-share-intent docs verified)

## Existing Architecture (What We're Extending)

```
Client (ai.ts)                          Edge Function (parse-recipe-url)
===============                         ================================
1. Receive URL from user
2. Fetch HTML client-side
3. Try JSON-LD extraction
4. If JSON-LD works -> done (free)
5. If not -> call Edge Function ------> 6. Auth user, check cache
                                        7. Check rate limit + premium status
   (sends URL + cleaned HTML)           8. Try JSON-LD server-side
                                        9. If not -> Gemini Flash on HTML
                                        10. Cache result, log usage
                                        11. Return structured recipe
```

Key insight: The client (`ai.ts`) does its own HTML fetch + JSON-LD extraction before ever calling the Edge Function. The Edge Function is the Gemini fallback path.

## Video Import Data Flow

Video URLs bypass the entire HTML/JSON-LD pipeline. There is no HTML to parse -- the recipe lives in spoken audio. The flow diverges at URL detection:

```
Client (ai.ts)                          Edge Function (parse-recipe-url)
===============                         ================================
1. Receive URL (paste or share sheet)
2. Detect: is this a video URL?

   [ARTICLE URL - existing path]
   3a. Fetch HTML, try JSON-LD...
   (unchanged)

   [VIDEO URL - new path]
   3b. Skip HTML fetch entirely
   3c. Call Edge Function with -------> 4. Auth user, check cache (by URL hash)
       { url, type: 'video' }          5. Check video-specific rate limit:
                                            - Free: 3/month, Premium: unlimited
                                        6. Call Supadata transcript API
                                            GET https://api.supadata.ai/v1/transcript
                                            ?url={url}&text=true&mode=auto
                                        7. If 202 (async): poll jobId until done
                                        8. Send transcript to Gemini Flash with
                                           video-specific system prompt
                                        9. Cache result, log usage
                                        10. Return structured recipe
```

## Component-Level Changes

### Modified Components (3)

**1. `src/lib/ai.ts` -- `parseRecipeUrl()` function**
- Add `isVideoUrl(url)` detection before HTML fetch
- For video URLs: skip HTML fetch + JSON-LD, call Edge Function directly with `{ url, type: 'video' }`
- Handle new `video_limit_exceeded` error type (separate from existing rate limit)
- No other changes to meal suggestion or other AI functions

**2. `supabase/functions/parse-recipe-url/index.ts` -- Edge Function**
- Read `type` field from request body (`type: 'video' | undefined`)
- When `type === 'video'`:
  - Use separate rate limit check: `parse-video-recipe` function_name in ai_usage_log
  - Call Supadata API for transcript (new code block, ~40 lines)
  - Use video-specific Gemini prompt (transcript -> recipe, not HTML -> recipe)
  - Handle Supadata async (202 + polling) and error responses
- When `type` is absent: existing HTML/JSON-LD/Gemini path (unchanged)
- Add `SUPADATA_API_KEY` env var read

**3. `src/types/database.ts` or equivalent types**
- No schema changes needed. `ai_usage_log` table already has `function_name` column -- we use `'parse-video-recipe'` as a new function_name value to track video imports separately from URL imports

### New Components (3)

**4. `src/lib/videoUrl.ts` -- Video URL detection (new file)**
Pure function, no dependencies. Detects whether a URL is a video platform URL:

```typescript
const VIDEO_URL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i,
  /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[^/]+\/video|vm\.tiktok\.com)/i,
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]+/i,
  /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:reel|watch|.*\/videos)/i,
];

export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some(pattern => pattern.test(url));
}
```

**5. Share sheet integration (new: expo-share-intent wiring)**
- Install `expo-share-intent`
- Add `ShareIntentProvider` to root layout
- Add `useShareIntent` hook in recipe import flow
- When share intent contains a URL, route to `parseRecipeUrl()` (same function, video detection is automatic)
- This is a UI/routing concern, not an architecture change to the import pipeline

**6. Video import usage tracking UI (new)**
- Query `ai_usage_log` where `function_name = 'parse-video-recipe'` for current month count
- Display "X of 3 free video imports used" for free users
- Premium users see no limit. Existing subscription check pattern applies.

### Unchanged Components

- `supabase/functions/generate-meal/index.ts` -- no changes
- `supabase/functions/create-checkout-session/index.ts` -- no changes
- `supabase/functions/stripe-webhooks/index.ts` -- no changes
- Database schema (recipes table, ai_usage_log table) -- no migrations needed
- Recipe detail screen, cooking mode, grocery list generation -- all downstream of recipe creation, unaffected

## Supadata API Integration Details

The Supadata transcript API is a simple REST GET endpoint -- no SDK needed in Deno. Use raw `fetch`:

```typescript
// Inside parse-recipe-url Edge Function
const supadataKey = Deno.env.get('SUPADATA_API_KEY');
const transcriptUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true&mode=auto`;

const transcriptResp = await fetch(transcriptUrl, {
  headers: { 'x-api-key': supadataKey! },
});

if (transcriptResp.status === 202) {
  // Async processing -- poll for result
  const { jobId } = await transcriptResp.json();
  // Poll GET /v1/transcript/{jobId} until completed or failed
  // Max ~50s (Edge Function timeout is 60s, Supadata processes quickly)
}

const { content: transcript } = await transcriptResp.json();
```

Supadata pricing: 1 credit for native captions, 2 credits/minute for AI-generated. At $5/month for 300 credits, this supports ~150-300 video imports/month at the Basic tier. Scale to Pro ($17/3000 credits) as usage grows.

## Gemini Prompt: Transcript vs HTML

The existing Gemini prompt expects HTML input. Video transcripts need a different prompt because:
- No structured markup to reference
- Measurements are spoken ("about two cups") not formatted ("2 cups")
- Instructions are conversational, not numbered steps
- Missing metadata (prep time, servings) must be inferred

```typescript
const videoSystemPrompt = `You are a recipe extraction assistant. Given a transcript from a cooking video, extract the recipe into structured JSON. The transcript is conversational -- speakers may be informal, skip measurements, or describe steps out of order.

Your job:
- Infer precise measurements from casual language ("a good handful" -> "1 cup", "some oil" -> "2 tbsp")
- Order instructions logically even if the speaker jumps around
- Estimate prep_time_minutes and cook_time_minutes from context
- Default servings to 4 unless stated otherwise

Return a JSON object with these fields:
- name (string -- infer a clear recipe name from the video content)
- category (string or null)
- prep_time_minutes (number or null)
- cook_time_minutes (number or null)
- servings (number, default 4)
- estimated_cost (number or null)
- source_image_url (null -- no image available from transcript)
- nutrition_info (null -- cannot reliably estimate from transcript)
- ingredients (array of {amount: number, unit: string, name: string, section: string|null})
- instructions (array of {step_number: number, text: string, timers: [{duration_seconds: number, label: string}]})
- tags (array of strings)

Parse time references in instructions into timers. Use your best judgment for ambiguous measurements -- pick the most common/reasonable amount. Never leave ingredients without amounts.`;
```

## Rate Limiting: Video vs Article

Video imports use a monthly limit (not daily like article imports) because:
- Video transcription has real cost (Supadata credits + Gemini tokens)
- 3/month free is generous enough to hook users, low enough to drive upgrades
- Monthly aligns with subscription billing cycle

Implementation: Query `ai_usage_log` where `function_name = 'parse-video-recipe'` and `created_at >= first of current month`. The existing `ai_usage_log` table and query patterns handle this without schema changes.

```typescript
// Monthly video limit check (in Edge Function)
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);

const { count: videoCount } = await supabaseAdmin
  .from('ai_usage_log')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('function_name', 'parse-video-recipe')
  .gte('created_at', monthStart.toISOString());

const videoLimit = isPremium ? Infinity : 3;
if ((videoCount ?? 0) >= videoLimit) {
  return new Response(
    JSON.stringify({ error: 'Monthly video import limit reached', limit: videoLimit, remaining: 0, type: 'video_limit_exceeded' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## Edge Function Timeout Consideration

The existing Edge Function has a 55-second abort timeout for Gemini calls. Video imports chain two external calls:
1. Supadata transcript fetch (typically 2-10s for native captions, up to 30s for AI-generated)
2. Gemini Flash recipe extraction from transcript (~3-8s)

Total: 5-38 seconds. Within the 60-second Supabase Edge Function limit, but tight for AI-generated transcripts. Mitigation:
- Use `mode=auto` in Supadata (tries native first -- most TikTok/YouTube videos have captions)
- Set per-step timeouts: 40s for Supadata, 15s for Gemini
- If Supadata returns 202 (async), poll with 3-second intervals, max 12 polls (36s)
- Return clear error if timeout: "This video is taking longer to process. Try a YouTube video with captions enabled."

## Caching Strategy

Cache by URL hash, same as existing articles. Video transcripts are deterministic for the same URL, so the 24-hour cache TTL works. The `input_hash` + `cached_response` columns in `ai_usage_log` already support this.

One difference: cache the final recipe (not the transcript). This means a cached video import returns instantly on second request, identical to cached article imports.

## Architecture Diagram: Final State

```
                     SharedKitchen App
                     =================

  [Share Sheet] -----> [URL Input]
  (expo-share-intent)     |
                          v
                    isVideoUrl(url)?
                    /            \
                  NO              YES
                  |                |
            [Fetch HTML]     [Skip HTML fetch]
                  |                |
          [JSON-LD extract]       |
            /        \            |
         Found    Not found       |
          |          \            |
       [Return]   [Edge Function call]
                  { url, html }   { url, type: 'video' }
                       \            /
                        v          v
                  parse-recipe-url Edge Function
                  ================================
                  Auth -> Cache check -> Rate limit
                        /              \
                   [article path]   [video path]
                   JSON-LD retry     Supadata API
                   Gemini on HTML    Gemini on transcript
                        \              /
                         v            v
                   Structured Recipe JSON
                   (same shape either way)
                         |
                   Cache + Log -> Return to client
                         |
                   [Recipe Create/Edit Screen]
                   (identical for both paths)
```

## Build Order (Dependency-Aware)

The following order respects dependencies and allows incremental testing:

1. **`src/lib/videoUrl.ts`** -- Pure function, zero dependencies, can be unit tested immediately
2. **Edge Function video path** -- Supadata integration + video Gemini prompt inside `parse-recipe-url/index.ts`. Depends on `SUPADATA_API_KEY` env var. Can be tested with `curl` independently.
3. **`src/lib/ai.ts` changes** -- Wire video URL detection into `parseRecipeUrl()`. Depends on (1) and (2). End-to-end testable after this step.
4. **Video rate limit UI** -- Usage counter display. Depends on (2) being deployed (needs log entries to query).
5. **Share sheet integration** -- `expo-share-intent` setup. Independent of 1-4 technically, but should be wired after the import pipeline works to avoid debugging two things at once.

## Sources

- Supadata transcript API docs: https://docs.supadata.ai/get-transcript
- Supadata pricing: https://supadata.ai/ (Basic $5/300 credits, Pro $17/3000 credits)
- expo-share-intent: https://github.com/achorein/expo-share-intent
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts`, `src/lib/ai.ts`
