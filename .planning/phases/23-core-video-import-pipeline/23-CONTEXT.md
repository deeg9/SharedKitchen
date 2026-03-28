# Phase 23: Core Video Import Pipeline - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can paste a video URL from TikTok, Instagram, YouTube, or any video source and get a complete recipe extracted from the video's transcript. Includes video URL detection, Supadata transcript extraction, Gemini transcript-to-recipe parsing, recipe preview/edit, rate limiting (3/month free, unlimited premium), and source video linking.

</domain>

<decisions>
## Implementation Decisions

### Video URL Detection & Routing
- Client-side detection in ai.ts — detect video URLs before fetch, skip HTML download entirely
- Regex on known domains (tiktok.com, vm.tiktok.com, instagram.com/reel, instagram.com/p, youtube.com, youtu.be) — simple, fast, deterministic
- Unrecognized video URLs fall through to existing HTML pipeline — graceful degradation
- Separate utility file `src/lib/videoUrl.ts` — pure function, easy to test and extend

### Transcript-to-Recipe Pipeline
- Supadata async (HTTP 202): poll with 3 retries at 5s intervals — stays within 60s Edge Function budget
- Separate transcript-specific Gemini system prompt — transcripts are conversational speech, different from HTML extraction
- Non-recipe detection via Gemini confidence field: add `is_recipe: boolean` to structured output, reject if false
- Extend existing `parse-recipe-url` Edge Function with `type: 'video'` field — branch early, reuse auth/caching/logging

### Rate Limiting & Import UX
- Track monthly video imports via existing `ai_usage_log` table with `function_name: 'parse-video-recipe'` — calendar month window
- Usage counter shown in import flow above URL input: "2 of 3 video imports used this month"
- Reuse existing add-recipe form, pre-populated with extracted data — user can edit before saving, add "Imported from video" badge + source link
- Full-screen modal with progress steps during extraction: "Extracting transcript..." → "Parsing recipe..." → "Almost done!"

### Claude's Discretion
- Supadata API key name and env var configuration
- Exact Gemini prompt wording for transcript parsing
- Error message copy for non-recipe rejection
- Progress modal animation/styling details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai.ts`: `parseRecipeUrl()` function — extend with video URL branch
- `src/lib/ai.ts`: `RateLimitError` class — reuse for video rate limiting
- `supabase/functions/parse-recipe-url/index.ts`: Full Edge Function — extend with video branch
- `ai_usage_log` table: Existing rate limit + caching infrastructure
- Add-recipe form: Existing form component for recipe creation — pre-populate for preview/edit

### Established Patterns
- Client-side JSON-LD first, Edge Function fallback — same pattern for video (client detects URL type, routes accordingly)
- `supabase.auth.getSession()` for auth token, direct `fetch()` to Edge Function
- Edge Function uses `supabaseAdmin` (service_role) for writes, `supabaseClient` for auth
- Non-blocking logging: `supabaseAdmin.from('ai_usage_log').insert().then().catch()`
- AbortController with timeout for external API calls

### Integration Points
- `src/lib/ai.ts:parseRecipeUrl()` — add video URL detection at top, branch before HTML fetch
- `parse-recipe-url` Edge Function — add `type: 'video'` branch after auth/rate-limit checks
- Recipe import UI — add video URL detection feedback, progress modal, usage counter
- `subscriptions` table query — already exists in Edge Function for premium check

</code_context>

<specifics>
## Specific Ideas

- Supadata REST API: `GET https://api.supadata.ai/v1/transcript?url={videoUrl}&text=true`
- Use `function_name: 'parse-video-recipe'` to separate video counts from web recipe counts in ai_usage_log
- Calendar month rate limiting: `created_at >= first day of current month`
- Recipe `source_url` field already exists — populate with original video URL

</specifics>

<deferred>
## Deferred Ideas

- Gemini multimodal video analysis (analyzing actual video frames) — future enhancement if transcript quality is insufficient
- YouTube chapters/timestamps for recipe segmentation
- Batch video import

</deferred>
