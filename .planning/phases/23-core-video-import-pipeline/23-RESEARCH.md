# Phase 23: Core Video Import Pipeline - Research

**Researched:** 2026-03-28
**Domain:** Video URL transcript extraction integrated into existing recipe import pipeline
**Confidence:** HIGH

## Summary

Phase 23 adds video recipe import to SharedKitchen by extending the existing URL import pipeline. Users paste a video URL (TikTok, Instagram, YouTube) into the existing add-recipe screen, the client detects it as a video URL and sends it directly to the Edge Function (skipping HTML fetch), the Edge Function calls Supadata for transcript extraction then Gemini Flash for recipe parsing, and the structured recipe is returned for preview/edit before saving.

The implementation requires zero new database tables, zero new Edge Functions, and zero new client packages. It extends `src/lib/ai.ts` with video URL detection, extends `supabase/functions/parse-recipe-url/index.ts` with a video branch, adds a new pure-function utility file `src/lib/videoUrl.ts`, and modifies the add-recipe screen (`app/(app)/recipe/add.tsx`) for video-specific UX (progress messages, usage counter, upgrade prompt). The only new external dependency is the Supadata REST API, called via plain `fetch()` from Deno.

The main technical risks are: (1) Edge Function timeout from chaining Supadata (2-30s) + Gemini (3-8s) within the 60s budget, mitigated by per-step timeouts and preferring native captions; (2) Gemini hallucinating recipes from non-recipe videos, mitigated by an `is_recipe` confidence field in the structured output and minimum ingredient/step validation.

**Primary recommendation:** Extend the existing `parse-recipe-url` Edge Function with a `type: 'video'` branch. Use Supadata REST API for transcripts (no SDK). Use a separate Gemini system prompt for transcript parsing. Track video imports separately in `ai_usage_log` with `function_name: 'parse-video-recipe'`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Client-side detection in ai.ts -- detect video URLs before fetch, skip HTML download entirely
- Regex on known domains (tiktok.com, vm.tiktok.com, instagram.com/reel, instagram.com/p, youtube.com, youtu.be) -- simple, fast, deterministic
- Unrecognized video URLs fall through to existing HTML pipeline -- graceful degradation
- Separate utility file `src/lib/videoUrl.ts` -- pure function, easy to test and extend
- Supadata async (HTTP 202): poll with 3 retries at 5s intervals -- stays within 60s Edge Function budget
- Separate transcript-specific Gemini system prompt -- transcripts are conversational speech, different from HTML extraction
- Non-recipe detection via Gemini confidence field: add `is_recipe: boolean` to structured output, reject if false
- Extend existing `parse-recipe-url` Edge Function with `type: 'video'` field -- branch early, reuse auth/caching/logging
- Track monthly video imports via existing `ai_usage_log` table with `function_name: 'parse-video-recipe'` -- calendar month window
- Usage counter shown in import flow above URL input: "2 of 3 video imports used this month"
- Reuse existing add-recipe form, pre-populated with extracted data -- user can edit before saving, add "Imported from video" badge + source link
- Full-screen modal with progress steps during extraction: "Extracting transcript..." -> "Parsing recipe..." -> "Almost done!"

### Claude's Discretion
- Supadata API key name and env var configuration
- Exact Gemini prompt wording for transcript parsing
- Error message copy for non-recipe rejection
- Progress modal animation/styling details

### Deferred Ideas (OUT OF SCOPE)
- Gemini multimodal video analysis (analyzing actual video frames) -- future enhancement
- YouTube chapters/timestamps for recipe segmentation
- Batch video import
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VURL-01 | Detect TikTok URLs (tiktok.com, vm.tiktok.com) as video import targets | `isVideoUrl()` regex in `src/lib/videoUrl.ts` -- patterns verified |
| VURL-02 | Detect Instagram Reel URLs (instagram.com/reel/, instagram.com/p/) as video import targets | Same `isVideoUrl()` function -- Instagram patterns in regex set |
| VURL-03 | Detect YouTube URLs (youtube.com, youtu.be, YouTube Shorts) as video import targets | Same `isVideoUrl()` function -- YouTube patterns including /shorts/ |
| VURL-04 | Detect generic video URLs and route to video import pipeline | Fallback: unrecognized URLs go to existing HTML pipeline per decision |
| TRANS-01 | Edge Function extracts transcript from video URL via Supadata API | Supadata REST GET endpoint verified: `GET /v1/transcript?url={url}&text=true&mode=auto` |
| TRANS-02 | Edge Function handles Supadata async (HTTP 202) with polling | Supadata returns `{ jobId }` on 202, poll `GET /v1/transcript/{jobId}` at 5s intervals, max 3 retries |
| TRANS-03 | Edge Function completes transcript + recipe parse within 60s budget | Per-step timeouts: 40s Supadata, 15s Gemini. `mode=auto` prefers instant native captions |
| PARSE-01 | Gemini Flash converts transcript to structured recipe | Separate video system prompt. Same Gemini API call pattern, same response JSON shape |
| PARSE-02 | Gemini uses best-guess for ambiguous measurements | Prompt includes measurement mapping: "a splash" -> "1 tbsp", "some" -> "2 tbsp" etc. |
| PARSE-03 | Non-recipe videos detected with clear error | `is_recipe: boolean` in Gemini structured output + minimum 2 ingredients validation |
| IMPORT-01 | User pastes video URL in existing import field, triggers video import | `isVideoUrl()` check in `ai.ts:parseRecipeUrl()` branches before HTML fetch |
| IMPORT-02 | User sees preview of extracted recipe with edit option | Existing `RecipeForm` with `initialData` prop -- already works for URL imports |
| IMPORT-03 | Saved recipe includes link to original source video | `source_url` field already exists on Recipe type and is set by `parseRecipeUrl()` |
| IMPORT-04 | Import shows appropriate loading state | Video-specific progress messages + full-screen modal with step indicators |
| RATE-01 | Free users limited to 3 video imports per calendar month | Query `ai_usage_log` where `function_name='parse-video-recipe'` and `created_at >= first of month` |
| RATE-02 | Premium subscribers have unlimited video imports | Existing `subscriptions` table check in Edge Function (`isPremium` flag) |
| RATE-03 | Import flow shows usage counter | New UI element above URL input: query `ai_usage_log` count for current month |
| RATE-04 | User hitting free limit sees upgrade prompt | 429 response with `type: 'video_limit_exceeded'` triggers upgrade prompt in client |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supadata REST API | v1 | Video transcript extraction | Single endpoint covers YouTube, TikTok, Instagram. No SDK needed -- plain `fetch()` from Deno. 1 credit/native transcript, 2 credits/min for AI-generated |
| Gemini Flash | gemini-2.5-flash (existing) | Transcript-to-recipe parsing | Already integrated in Edge Function. Same API, new prompt |
| Supabase Edge Functions | Existing | Server-side video pipeline | Extends existing `parse-recipe-url` function |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ai_usage_log` table | Existing | Rate limiting + caching for video imports | New `function_name: 'parse-video-recipe'` value, monthly window query |

### What NOT to Add
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supadata JS SDK | Plain `fetch()` | SDK adds dependency risk in Deno. Single REST call is simpler |
| Whisper/speech-to-text | Supadata `mode=auto` | Supadata handles AI fallback server-side. Zero complexity for us |
| New Edge Function | Extend existing `parse-recipe-url` | One function, two code paths. Same auth, caching, rate limit infra |
| yt-dlp/ffmpeg | Supadata API | We extract transcripts, not video files. No media processing needed |

**Installation:**
```bash
# No client packages to install for Phase 23
# Edge Function: add API key
supabase secrets set SUPADATA_API_KEY=sk_your_key_here
```

## Architecture Patterns

### Modified File Structure
```
src/
  lib/
    videoUrl.ts          # NEW: isVideoUrl() pure function + patterns
    ai.ts                # MODIFIED: add video URL branch in parseRecipeUrl()
app/
  (app)/
    recipe/
      add.tsx            # MODIFIED: video progress modal, usage counter, upgrade prompt
supabase/
  functions/
    parse-recipe-url/
      index.ts           # MODIFIED: add type='video' branch with Supadata + video Gemini prompt
```

### Pattern 1: Video URL Detection (Client-Side)
**What:** Pure function that checks if a URL matches known video platform patterns
**When to use:** Before any network call in `parseRecipeUrl()`
**Example:**
```typescript
// src/lib/videoUrl.ts
const VIDEO_URL_PATTERNS = [
  /(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i,
  /(?:tiktok\.com\/@[\w.-]+\/video|vm\.tiktok\.com)/i,
  /(?:instagram\.com\/(?:reel|p)\/)/i,
];

export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some(pattern => pattern.test(url));
}
```

### Pattern 2: Edge Function Video Branch
**What:** Early branch in request handler based on `type` field
**When to use:** After auth + cache check, before any HTML fetching
**Example:**
```typescript
// In parse-recipe-url Edge Function
const { url, html: clientHtml, type } = await req.json();

// ... auth, cache check ...

if (type === 'video') {
  // Video-specific rate limit (monthly, separate function_name)
  // -> Supadata transcript fetch
  // -> Gemini with video prompt
  // -> Return same recipe shape
} else {
  // Existing HTML/JSON-LD/Gemini path (unchanged)
}
```

### Pattern 3: Supadata Async Polling
**What:** Handle HTTP 202 responses by polling the job status endpoint
**When to use:** When Supadata returns 202 (videos >20min or requiring AI generation)
**Example:**
```typescript
const resp = await fetch(transcriptUrl, { headers: { 'x-api-key': key }, signal });

if (resp.status === 202) {
  const { jobId } = await resp.json();
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const pollResp = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, {
      headers: { 'x-api-key': key }, signal
    });
    const job = await pollResp.json();
    if (job.status === 'completed') return job.content;
    if (job.status === 'failed') throw new Error('Transcript extraction failed');
  }
  throw new Error('Transcript processing timed out');
}

const { content: transcript } = await resp.json();
```

### Pattern 4: Video-Specific Rate Limiting
**What:** Monthly calendar window rate limit separate from article imports
**When to use:** In Edge Function before calling Supadata
**Example:**
```typescript
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

### Anti-Patterns to Avoid
- **Sending empty transcripts to Gemini:** If Supadata returns <50 characters, reject immediately. Gemini will hallucinate a recipe from nothing.
- **Using a single global timeout:** Chain two external calls (Supadata + Gemini). Each needs its own AbortController with per-step timeout (40s + 15s).
- **Reusing the article `function_name` for video imports:** Must use `'parse-video-recipe'` to separate rate limits, caching, and usage tracking.
- **Fetching HTML for video URLs:** Video platforms return login walls or player pages, not recipe content. Skip HTML fetch entirely for detected video URLs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video transcript extraction | Speech-to-text pipeline | Supadata REST API | Handles all platforms, AI fallback, polling -- single endpoint |
| Video URL pattern matching | Complex URL parser | Simple regex array | URL patterns are stable, well-known. A library adds unnecessary weight |
| Recipe parsing from text | Custom NLP pipeline | Gemini Flash with structured output | LLM handles informal speech, measurement inference, instruction ordering |
| Monthly rate limiting | Custom counter table | Existing `ai_usage_log` with date filter | Table and query patterns already exist. Just filter by month |

**Key insight:** This entire feature chains two existing external services (Supadata + Gemini) within existing infrastructure (Edge Function + ai_usage_log). There is nothing to build from scratch -- only integration code.

## Common Pitfalls

### Pitfall 1: Edge Function Timeout on Chained API Calls
**What goes wrong:** Supadata (2-30s) + Gemini (3-8s) can exceed the 60s Edge Function limit, especially when Supadata returns HTTP 202 and requires polling.
**Why it happens:** Developers set one global timeout without accounting for sequential external calls.
**How to avoid:** Per-step timeouts: 40s for Supadata (including polling), 15s for Gemini. Use `mode=auto` to prefer instant native captions. If Supadata 202 polling exhausts retries, return user-facing message: "This video is still processing. Try again in a minute."
**Warning signs:** 504 errors in Edge Function logs on video URLs. Users reporting "import failed" for longer TikTok/Instagram videos.

### Pitfall 2: TikTok/Instagram URLs Resolve to Login Walls
**What goes wrong:** Mobile share URLs (especially `vm.tiktok.com` short links) redirect to login pages server-side. Supadata returns empty or error transcripts.
**Why it happens:** Social platforms gate content behind login for server-side requests. Mobile share URLs != desktop URLs.
**How to avoid:** Validate transcript length -- if <50 characters, return error: "Could not extract audio from this video. The video may be private." Test with actual mobile share URLs during development.
**Warning signs:** Very short transcripts. Recipes with nonsensical content unrelated to the video.

### Pitfall 3: Gemini Hallucinates Recipes from Non-Recipe Videos
**What goes wrong:** User shares a comedy sketch. Gemini invents a recipe from any food mention. User gets confident-looking but completely wrong recipe.
**Why it happens:** LLMs produce output in the requested format regardless of input quality.
**How to avoid:** Add `is_recipe: boolean` to Gemini structured output. Validate minimum 2 ingredients and 1 instruction. Show preview before save. Consider binary pre-check prompt for borderline cases.
**Warning signs:** Recipes with generic names ("Delicious Dish"), instructions that don't reference listed ingredients.

### Pitfall 4: Video and Article Cache Collision
**What goes wrong:** Same URL cached as article result, then requested as video (or vice versa). Wrong result type returned.
**How to avoid:** Already handled by design -- video uses `function_name: 'parse-video-recipe'`, articles use `'parse-recipe-url'`. Cache lookup filters by `function_name`.

### Pitfall 5: Rate Limit Window Mismatch
**What goes wrong:** Video rate limit accidentally uses 24-hour rolling window (like articles) instead of calendar month.
**How to avoid:** Use `monthStart.setDate(1)` for the window start, not `Date.now() - 24h`. Verify the query uses `gte(created_at, monthStart)`.

### Pitfall 6: Supadata Credit Exhaustion
**What goes wrong:** Supadata credits run out mid-month. All video imports fail with opaque error.
**How to avoid:** Handle Supadata 402/403 responses specifically. Return "Video import is temporarily unavailable" to users. Set up auto-recharge on Supadata dashboard. Log Supadata errors distinctly from Gemini errors.

## Code Examples

### Client-Side: Video URL Detection + Routing in parseRecipeUrl
```typescript
// src/lib/ai.ts -- modified parseRecipeUrl
import { isVideoUrl } from './videoUrl';

export async function parseRecipeUrl(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>> {
  // Video URLs skip HTML fetch entirely
  if (isVideoUrl(url)) {
    return callEdgeFunctionForVideo(url);
  }

  // Existing path: fetch HTML, try JSON-LD, fall back to Edge Function
  // ... (unchanged) ...
}

async function callEdgeFunctionForVideo(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const fnResponse = await fetch(`${supabaseUrl}/functions/v1/parse-recipe-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ url, type: 'video' }),
  });

  // ... handle 429 (VideoRateLimitError), non-2xx, parse JSON ...
  // Same response shape as article import
}
```

### Edge Function: Supadata Transcript Fetch
```typescript
// Inside parse-recipe-url Edge Function, video branch
const supadataKey = Deno.env.get('SUPADATA_API_KEY');
if (!supadataKey) {
  return new Response(
    JSON.stringify({ error: 'Video import not configured' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supadataController = new AbortController();
const supadataTimeout = setTimeout(() => supadataController.abort(), 40000);

try {
  const transcriptUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}&text=true&mode=auto`;
  let transcriptResp = await fetch(transcriptUrl, {
    headers: { 'x-api-key': supadataKey },
    signal: supadataController.signal,
  });

  let transcript: string;

  if (transcriptResp.status === 202) {
    const { jobId } = await transcriptResp.json();
    transcript = '';
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollResp = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, {
        headers: { 'x-api-key': supadataKey },
        signal: supadataController.signal,
      });
      const job = await pollResp.json();
      if (job.status === 'completed') { transcript = job.content; break; }
      if (job.status === 'failed') throw new Error('Transcript extraction failed');
    }
    if (!transcript) throw new Error('Transcript processing timed out');
  } else if (transcriptResp.ok) {
    const data = await transcriptResp.json();
    transcript = data.content;
  } else {
    throw new Error(`Supadata error: ${transcriptResp.status}`);
  }

  // Validate transcript isn't empty/too short
  if (!transcript || transcript.length < 50) {
    return new Response(
      JSON.stringify({ error: 'Could not extract audio from this video. The video may be private or too short.' }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} finally {
  clearTimeout(supadataTimeout);
}
```

### Edge Function: Video-Specific Gemini Prompt
```typescript
const videoSystemPrompt = `You are a recipe extraction assistant. Given a transcript from a cooking video, extract the recipe into structured JSON. The transcript is conversational speech -- speakers may be informal, skip measurements, or describe steps out of order.

Your job:
- Determine if this transcript contains a cooking recipe. Set is_recipe to false if it does not.
- Infer precise measurements from casual language. Use these defaults for vague amounts: "a pinch" = 0.25 tsp, "a splash" = 1 tbsp, "some" = 2 tbsp, "a handful" = 0.5 cup, "a bit" = 1 tsp.
- Order instructions logically even if the speaker jumps around
- Estimate prep_time_minutes and cook_time_minutes from context
- Default servings to 4 unless stated otherwise
- Ignore non-recipe content (intros, sponsorships, outros, personal anecdotes)

Return a JSON object with these fields:
- is_recipe (boolean -- false if transcript does not contain a recipe)
- name (string -- infer a clear recipe name)
- category (string or null)
- prep_time_minutes (number or null)
- cook_time_minutes (number or null)
- servings (number, default 4)
- estimated_cost (number or null)
- source_image_url (null)
- nutrition_info (null)
- ingredients (array of {amount: number, unit: string, name: string, section: string|null})
- instructions (array of {step_number: number, text: string, timers: [{duration_seconds: number, label: string}]})
- tags (array of strings)

If is_recipe is false, set all other fields to null/empty.`;
```

### Client: Video Usage Counter Query
```typescript
// Query current month video import count for display
async function getVideoImportCount(userId: string): Promise<{ used: number; limit: number }> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', 'parse-video-recipe')
    .gte('created_at', monthStart.toISOString());

  return { used: count ?? 0, limit: 3 };
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with jest-expo 55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=videoUrl --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VURL-01 | TikTok URL detection | unit | `npx jest __tests__/lib/videoUrl.test.ts -x` | Wave 0 |
| VURL-02 | Instagram URL detection | unit | `npx jest __tests__/lib/videoUrl.test.ts -x` | Wave 0 |
| VURL-03 | YouTube URL detection | unit | `npx jest __tests__/lib/videoUrl.test.ts -x` | Wave 0 |
| VURL-04 | Generic URL fallthrough | unit | `npx jest __tests__/lib/videoUrl.test.ts -x` | Wave 0 |
| TRANS-01 | Supadata transcript call | manual-only | Manual: curl Edge Function with video URL | N/A -- external API |
| TRANS-02 | Supadata 202 polling | manual-only | Manual: test with long video URL | N/A -- external API |
| TRANS-03 | 60s timeout budget | manual-only | Manual: verify with slow video | N/A -- timing |
| PARSE-01 | Gemini transcript parsing | manual-only | Manual: test with real transcript | N/A -- external API |
| PARSE-02 | Ambiguous measurement handling | manual-only | Manual: review extracted recipe | N/A -- prompt quality |
| PARSE-03 | Non-recipe rejection | unit | `npx jest __tests__/lib/videoUrl.test.ts -x` (validation logic) | Wave 0 |
| IMPORT-01 | Video URL triggers video import | unit | `npx jest __tests__/lib/ai.test.ts -x` | Wave 0 |
| IMPORT-02 | Preview with edit | manual-only | Manual: paste video URL in app | N/A -- UI |
| IMPORT-03 | Source URL linked | unit | `npx jest __tests__/lib/ai.test.ts -x` (verify source_url set) | Wave 0 |
| IMPORT-04 | Loading state | manual-only | Manual: observe progress messages | N/A -- UI |
| RATE-01 | 3/month free limit | manual-only | Manual: exhaust limit in test env | N/A -- server-side |
| RATE-02 | Unlimited premium | manual-only | Manual: test with premium user | N/A -- server-side |
| RATE-03 | Usage counter display | manual-only | Manual: verify counter in UI | N/A -- UI |
| RATE-04 | Upgrade prompt at limit | manual-only | Manual: trigger 429 response | N/A -- UI |

### Sampling Rate
- **Per task commit:** `npx jest --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/videoUrl.test.ts` -- covers VURL-01 through VURL-04, PARSE-03 (validation)
- [ ] `__tests__/lib/ai.test.ts` -- extend existing test with video URL routing mock (IMPORT-01, IMPORT-03)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supadata API | Transcript extraction | Requires API key | v1 | None -- blocking if no key |
| Gemini API | Recipe parsing | Already configured | gemini-2.5-flash | None -- already in use |
| Supabase Edge Functions | Server pipeline | Already deployed | v2 | None -- already in use |

**Missing dependencies with no fallback:**
- `SUPADATA_API_KEY` must be provisioned in Supabase secrets before video import works

**Missing dependencies with fallback:**
- None

## Open Questions

1. **Supadata AI transcript quality for TikTok/Instagram without captions**
   - What we know: `mode=auto` tries native captions first, falls back to AI speech-to-text
   - What's unclear: Quality for heavily-accented or multi-language cooking videos
   - Recommendation: Test with diverse real-world content during development. Accept that quality varies -- the recipe preview screen lets users fix errors.

2. **TikTok mobile short link resolution**
   - What we know: `vm.tiktok.com` short links may resolve differently server-side
   - What's unclear: Whether Supadata handles short link resolution or needs the full URL
   - Recommendation: Test with actual mobile share URLs early. If short links fail, add client-side URL expansion before sending to Edge Function.

3. **Gemini prompt tuning iterations needed**
   - What we know: Prompt engineering for informal speech is empirical
   - What's unclear: How many refinement cycles needed for good measurement inference
   - Recommendation: Start with the measurement defaults in the prompt, plan for 1-2 prompt refinement passes based on real transcript testing.

## Sources

### Primary (HIGH confidence)
- [Supadata Transcript API Docs](https://docs.supadata.ai/get-transcript) -- endpoint, parameters, 200/202 response formats, polling, error codes
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts` -- full Edge Function source (519 lines)
- Existing codebase: `src/lib/ai.ts` -- client-side `parseRecipeUrl()` function (336 lines)
- Existing codebase: `app/(app)/recipe/add.tsx` -- add recipe screen with URL import (265 lines)
- Existing codebase: `supabase/migrations/00011_create_ai_usage_log.sql` -- table schema

### Secondary (MEDIUM confidence)
- [Supadata Pricing](https://supadata.ai/pricing) -- credit costs verified via web search
- [Supadata Blog: Best YouTube Transcript API 2026](https://supadata.ai/blog/best-youtube-transcript-api) -- competitive comparison

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Supadata API verified via official docs, all other components already in codebase
- Architecture: HIGH -- Extends existing patterns with minimal new code. All integration points examined in source
- Pitfalls: HIGH -- Timeout budgets calculable, hallucination mitigations documented, rate limit patterns proven

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain -- external API is simple REST, no fast-moving dependencies)
