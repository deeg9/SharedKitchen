---
phase: 23-core-video-import-pipeline
verified: 2026-03-28T23:30:00Z
status: gaps_found
score: 3/5 success criteria verified
re_verification: false
gaps:
  - truth: "Saved video-imported recipes include a link back to the original source video"
    status: failed
    reason: "RecipeForm.handleSubmit builds the recipe object from form state fields without including source_url. The source_url from callEdgeFunctionForVideo is stored in importedData and passed as initialData to RecipeForm, but RecipeForm never reads initialData.source_url into state nor includes it in its onSubmit callback output."
    artifacts:
      - path: "src/components/recipes/RecipeForm.tsx"
        issue: "handleSubmit at line 150 builds recipe object with explicit fields (name, category, prep_time_minutes, etc.) but omits source_url — it does not spread or pass through initialData.source_url"
      - path: "app/(app)/recipe/add.tsx"
        issue: "handleSubmit at line 149 does ...recipeData spread, so it would pass source_url IF RecipeForm included it — but RecipeForm does not"
    missing:
      - "RecipeForm must read initialData.source_url into a ref or state and include it in the recipe object passed to onSubmit"
      - "Alternatively, add.tsx handleSubmit can merge source_url from importedData back onto recipeData before saving: { ...recipeData, source_url: importedData?.source_url ?? null }"
  - truth: "User can paste a TikTok, Instagram Reel, YouTube, or generic video URL and the app routes it to the video import pipeline"
    status: partial
    reason: "REQUIREMENTS.md VURL-04 states 'App detects generic video URLs and routes them to the video import pipeline' but the implementation only detects TikTok, Instagram, and YouTube. Unrecognized video URLs (e.g., Vimeo, direct .mp4 links) return false from isVideoUrl() and fall through to the HTML pipeline. The locked decision in 23-CONTEXT.md says this graceful degradation is intentional, but the requirement description was marked complete without the generic detection being implemented."
    artifacts:
      - path: "src/lib/videoUrl.ts"
        issue: "VIDEO_URL_PATTERNS only contains 3 patterns (TikTok, Instagram, YouTube) — no generic video URL detection"
    missing:
      - "Either update REQUIREMENTS.md VURL-04 description to match implemented behavior ('App falls back gracefully for unrecognized URLs') or implement generic video URL detection (e.g., URL path ends in .mp4/.webm/.mov, or Vimeo pattern)"
human_verification:
  - test: "Paste a TikTok cooking video URL into Add Recipe and complete the full import"
    expected: "Progress shows 'Extracting transcript...' then 'Parsing recipe...' then 'Almost done!'. Recipe preview appears with title, ingredients, and steps. After saving, the recipe's source_url field in the database links to the original TikTok URL."
    why_human: "Requires SUPADATA_API_KEY to be provisioned in Supabase secrets and the app running on a device/simulator. Cannot verify end-to-end transcript extraction or database persistence programmatically."
  - test: "Paste a non-recipe video URL (music video, news clip)"
    expected: "Import fails with 'This video doesn't appear to contain a recipe. Try a cooking video instead.' No recipe is created."
    why_human: "Requires real Supadata + Gemini API call to test non-recipe rejection."
  - test: "Import 3 video recipes as a free user, then attempt a 4th"
    expected: "4th import shows the upgrade prompt card linking to subscription settings. Usage counter shows '3 of 3 video imports used this month'."
    why_human: "Requires real ai_usage_log entries and authenticated free-tier user."
  - test: "Paste a regular recipe blog URL (allrecipes.com) after the video pipeline is live"
    expected: "Article import still works normally via the HTML/JSON-LD pipeline — no video branch triggered."
    why_human: "Regression check to confirm article import path is unchanged. Requires real network fetch."
---

# Phase 23: Core Video Import Pipeline Verification Report

**Phase Goal:** Users can paste a video URL from TikTok, Instagram, YouTube, or any video source and get a complete recipe extracted from the video's transcript
**Verified:** 2026-03-28T23:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can paste TikTok/Instagram/YouTube/generic video URL and app routes it to video pipeline | PARTIAL | TikTok/Instagram/YouTube routing verified via isVideoUrl() and ai.ts branch. "Generic video URL" routing is NOT implemented — unrecognized URLs fall through to HTML pipeline. REQUIREMENTS.md VURL-04 description conflicts with implementation. |
| 2 | User sees loading state then recipe preview with edit option | VERIFIED | VIDEO_PROGRESS_MESSAGES in add.tsx: "Extracting transcript..." -> "Parsing recipe..." -> "Almost done!". RecipeForm pre-populated via initialData={importedData}. |
| 3 | Non-recipe videos show clear error instead of hallucinated recipe | VERIFIED | Edge Function returns 422 with `type: 'not_a_recipe'` when is_recipe===false or <2 ingredients or 0 instructions. |
| 4 | Free users see usage counter and are blocked after 3 imports; premium unlimited | VERIFIED | getVideoImportCount query in ai.ts, usage counter UI in add.tsx ("X of 3 video imports used this month"), VideoRateLimitError shown as upgrade prompt card, monthly rate limit enforced in Edge Function. |
| 5 | Saved video-imported recipes include link back to original source video | FAILED | source_url is set in callEdgeFunctionForVideo (ai.ts:270) and stored in importedData, but RecipeForm.handleSubmit builds submit object without source_url — it is dropped before DB insert. |

**Score:** 3/5 truths verified (1 partial, 1 failed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/videoUrl.ts` | isVideoUrl() pure function with TikTok/Instagram/YouTube regex | VERIFIED | 22 lines, exports isVideoUrl and VIDEO_URL_PATTERNS, 3 patterns cover all required platforms |
| `__tests__/lib/videoUrl.test.ts` | Unit tests for video URL detection | VERIFIED | 71 lines, 13 test cases — all 13 pass |
| `supabase/functions/parse-recipe-url/index.ts` | Extended Edge Function with video branch | VERIFIED | 779 lines, video branch at line 305, Supadata + Gemini + rate limiting + non-recipe rejection all present |
| `src/lib/ai.ts` | Video URL routing + VideoRateLimitError + getVideoImportCount | VERIFIED | VideoRateLimitError at line 201, callEdgeFunctionForVideo at line 217, getVideoImportCount at line 277, isVideoUrl branch at line 300 |
| `app/(app)/recipe/add.tsx` | Video progress modal, usage counter, upgrade prompt | VERIFIED | VIDEO_PROGRESS_MESSAGES, videoUsage state, showUpgradePrompt state, upgradeCard JSX all present |
| `src/components/recipes/RecipeForm.tsx` | source_url pass-through on submit | STUB | handleSubmit at line 150-163 builds recipe from explicit fields only — source_url is not included in submitted recipe object |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/videoUrl.ts` | `src/lib/ai.ts` | `import { isVideoUrl }` | WIRED | Line 3: `import { isVideoUrl } from './videoUrl'`; used at line 300 |
| `src/lib/ai.ts` | `supabase/functions/parse-recipe-url` | `fetch with type: 'video'` | WIRED | Line 232: `body: JSON.stringify({ url, type: 'video' })` |
| `app/(app)/recipe/add.tsx` | `src/lib/ai.ts` | `import { VideoRateLimitError, getVideoImportCount }` | WIRED | Line 11 import; VideoRateLimitError used at line 94, getVideoImportCount at lines 49 and 89 |
| `app/(app)/recipe/add.tsx` | `src/lib/videoUrl.ts` | `import { isVideoUrl }` | WIRED | Line 12 import; isVideoUrl used at line 79 |
| `supabase/functions/parse-recipe-url/index.ts` | Supadata API | `fetch to api.supadata.ai` | WIRED | Line 368: `https://api.supadata.ai/v1/transcript` |
| `supabase/functions/parse-recipe-url/index.ts` | Gemini API | `fetch to generativelanguage.googleapis.com` | WIRED | Lines 465-482: Gemini API call with video system prompt |
| `importedData.source_url` | `RecipeInsert.source_url` (DB) | `RecipeForm onSubmit -> add.tsx handleSubmit -> createRecipe` | NOT_WIRED | RecipeForm.handleSubmit does not include source_url in submitted recipe — it is dropped before createRecipe is called |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/(app)/recipe/add.tsx` | `videoUsage` | `getVideoImportCount(user.id)` queries `ai_usage_log` | Yes — real DB query on `ai_usage_log` filtered by `function_name='parse-video-recipe'` and calendar month | FLOWING |
| `app/(app)/recipe/add.tsx` | `importedData` | `parseRecipeUrl(url)` -> `callEdgeFunctionForVideo` -> Edge Function | Yes — real Supadata + Gemini pipeline | FLOWING |
| `app/(app)/recipe/add.tsx` | `importedData.source_url` flow to DB | `RecipeForm.handleSubmit` -> `add.tsx handleSubmit` -> `createRecipe` | No — source_url dropped at RecipeForm boundary | DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| isVideoUrl() TikTok detection | `npx jest __tests__/lib/videoUrl.test.ts --no-coverage` | 13/13 tests pass | PASS |
| Edge Function has video branch | `grep "type === 'video'" supabase/functions/parse-recipe-url/index.ts` | Line 305 match | PASS |
| Edge Function uses Supadata | `grep "api.supadata.ai" supabase/functions/parse-recipe-url/index.ts` | 2 matches (initial + poll) | PASS |
| Edge Function enforces monthly limit | `grep "parse-video-recipe" supabase/functions/parse-recipe-url/index.ts` | 4 matches (cache, rate limit query, rate limit insert, usage log) | PASS |
| Edge Function within 60s timeout budget | Supadata: 40s + Gemini: 15s = 55s total | 55s < 60s Edge Function limit | PASS |
| source_url saved to DB on import | Trace: `callEdgeFunctionForVideo.source_url` -> `importedData` -> `RecipeForm.onSubmit` -> `createRecipe` | RecipeForm.handleSubmit omits source_url from submit object | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VURL-01 | 23-01 | TikTok URLs detected | SATISFIED | VIDEO_URL_PATTERNS[0] matches tiktok.com/@.../video and vm.tiktok.com; 3 test cases pass |
| VURL-02 | 23-01 | Instagram Reel URLs detected | SATISFIED | VIDEO_URL_PATTERNS[1] matches instagram.com/reel/ and instagram.com/p/; 2 test cases pass |
| VURL-03 | 23-01 | YouTube URLs detected | SATISFIED | VIDEO_URL_PATTERNS[2] matches youtube.com/watch, youtube.com/shorts, youtu.be; 3 test cases pass |
| VURL-04 | 23-01 | Generic/unrecognized video URLs | PARTIAL | REQUIREMENTS.md says "routes to video pipeline" but implementation falls through to HTML pipeline for unrecognized URLs. Locked decision in 23-CONTEXT.md says graceful degradation is correct. Requirement description marked complete in REQUIREMENTS.md without matching the actual behavior. |
| TRANS-01 | 23-01 | Supadata transcript extraction | SATISFIED | Edge Function line 368: `https://api.supadata.ai/v1/transcript?url=...&text=true&mode=auto` |
| TRANS-02 | 23-01 | Supadata 202 async polling | SATISFIED | Edge Function lines 374-388: 3-retry polling loop at 5s intervals for 202 responses |
| TRANS-03 | 23-01 | 60-second timeout budget | SATISFIED | Supadata AbortController at 40s (line 364), Gemini AbortController at 15s (line 461); 55s total within 60s budget |
| PARSE-01 | 23-01 | Gemini transcript-to-recipe | SATISFIED | videoSystemPrompt at line 434 instructs Gemini to extract structured recipe from transcript |
| PARSE-02 | 23-01 | Measurement inference | SATISFIED | Prompt includes defaults: "a pinch" = 0.25 tsp, "a splash" = 1 tbsp, "some" = 2 tbsp, "a handful" = 0.5 cup, "a bit" = 1 tsp |
| PARSE-03 | 23-01 | Non-recipe rejection | SATISFIED | Lines 530-539: rejects if is_recipe===false OR <2 ingredients OR 0 instructions; returns 422 with type='not_a_recipe' |
| IMPORT-01 | 23-02 | Video URL triggers video import in existing field | SATISFIED | ai.ts line 300: `if (isVideoUrl(url)) return callEdgeFunctionForVideo(url)` before any HTML fetch |
| IMPORT-02 | 23-02 | Recipe preview with edit before save | SATISFIED | RecipeForm initialData={importedData} pre-populates all editable fields |
| IMPORT-03 | 23-02 | Saved recipe links to source video | BLOCKED | source_url set in callEdgeFunctionForVideo (line 270) and importedData, but RecipeForm.handleSubmit does not include it in submitted recipe object — source_url is dropped before DB save |
| IMPORT-04 | 23-02 | Loading state during transcript + parse | SATISFIED | VIDEO_PROGRESS_MESSAGES: "Extracting transcript..." -> "Parsing recipe..." -> "Almost done!" at 3s intervals |
| RATE-01 | 23-01 | Free users: 3 video imports/month | SATISFIED | Edge Function lines 335-352: calendar month window query + limit enforcement |
| RATE-02 | 23-01 | Premium: unlimited video imports | SATISFIED | `const videoLimit = isPremium ? Infinity : 3` at line 346 |
| RATE-03 | 23-02 | Usage counter displayed | SATISFIED | add.tsx line 220: "{videoUsage.used} of {videoUsage.limit} video imports used this month" |
| RATE-04 | 23-02 | Rate limit shows upgrade prompt | SATISFIED | VideoRateLimitError instanceof check at line 94, showUpgradePrompt state shown as upgradeCard with subscription link |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/recipes/RecipeForm.tsx` | 150-163 | `handleSubmit` builds recipe object with explicit fields, omitting `source_url` from `initialData` | Blocker | Breaks IMPORT-03 — source_url from video import is never persisted to the database |

### Human Verification Required

#### 1. End-to-End Video Import with Source URL Persistence

**Test:** Provisioning SUPADATA_API_KEY in Supabase secrets, then pasting a TikTok or YouTube cooking video URL in Add Recipe, completing the import, and checking the saved recipe row in the database.
**Expected:** Recipe saved to `recipes` table with `source_url` field set to the original video URL.
**Why human:** Requires real SUPADATA_API_KEY, live Supabase Edge Function deployment, and device/simulator running the app. Also validates the IMPORT-03 fix (once applied) persists correctly.

#### 2. Non-Recipe Video Rejection

**Test:** Paste a URL to a non-cooking video (music video, sports highlight, news clip).
**Expected:** App shows error "This video doesn't appear to contain a recipe. Try a cooking video instead." No recipe is created.
**Why human:** Requires real Supadata transcript extraction and Gemini classification against live API.

#### 3. Rate Limit Upgrade Prompt Flow

**Test:** As a free user, successfully import 3 video recipes, then attempt a 4th import.
**Expected:** 4th import shows upgrade prompt card with "Free accounts can import 3 video recipes per month. Upgrade to Premium for unlimited video imports." and an Upgrade button linking to subscription settings.
**Why human:** Requires multiple authentic API calls and real ai_usage_log entries.

#### 4. Existing Article Import Regression

**Test:** After video pipeline is live, paste a standard recipe blog URL (e.g., allrecipes.com/recipe).
**Expected:** Article imports normally via HTML/JSON-LD path; no video branch triggered; recipe fills the form.
**Why human:** Confirms the existing article import path is unaffected by the new video branch.

### Gaps Summary

**2 gaps block full goal achievement:**

**Gap 1 — IMPORT-03 (Blocker): source_url not persisted on save**

The `source_url` is correctly set at every layer of the video pipeline — `callEdgeFunctionForVideo` returns it (ai.ts line 270), the Edge Function includes it in the response (index.ts line 545), and `add.tsx` stores it in `importedData`. However, `RecipeForm.handleSubmit` (RecipeForm.tsx lines 150-163) constructs the submit object with hard-coded fields and does not include `source_url`. As a result, when `add.tsx handleSubmit` receives `recipeData` from RecipeForm and spreads it into the DB insert, `source_url` is absent.

**Simplest fix:** In `add.tsx handleSubmit`, merge `source_url` from `importedData` back onto `recipeData`:
```typescript
const recipe: RecipeInsert = {
  ...recipeData,
  source_url: importedData?.source_url ?? null,  // add this line
  household_id: activeHouseholdId,
  created_by: user.id,
  image_url: imageUrl,
};
```

**Gap 2 — VURL-04 (Warning): Requirement description conflicts with implementation**

REQUIREMENTS.md VURL-04 states "App detects generic video URLs and routes them to the video import pipeline." The implementation detects only TikTok, Instagram, and YouTube. Unrecognized URLs (Vimeo, direct .mp4 links, etc.) return false from `isVideoUrl()` and fall through to the HTML pipeline. The locked decision in 23-CONTEXT.md says this graceful degradation is correct ("unrecognized video URLs fall through to existing HTML pipeline"). The requirement was marked `[x] Complete` in REQUIREMENTS.md without the generic detection being implemented. Either the requirement description needs to be corrected to reflect the actual behavior, or generic video URL patterns need to be added to `videoUrl.ts`.

**Plan 23-03 (Human Verification Checkpoint): NOT COMPLETED**

The end-to-end human verification checkpoint (Plan 23-03) has no SUMMARY.md, indicating it was not executed. The phase is not fully verified until a human tests the live video import flow with real API keys.

---

_Verified: 2026-03-28T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
