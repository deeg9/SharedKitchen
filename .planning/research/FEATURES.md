# Feature Landscape: Video Recipe Import

**Domain:** Video recipe import for collaborative dinner planning app
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH (competitive landscape well-documented; API capabilities verified via official docs)

## Table Stakes

Features users expect from video recipe import. Missing = feature feels incomplete or broken compared to CookingGuru, RecipeBro, Flavorish, and REX.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Paste URL import for video URLs | Every competitor supports this; users' primary interaction model | Low | Extend existing URL paste field to accept video URLs. Detect TikTok/Instagram/YouTube URL patterns in `parse-recipe-url` Edge Function. |
| Share sheet integration (receive URLs) | Flavorish, RecipeBro, REX all support "share to app" from TikTok/Instagram/YouTube | Medium | Use `expo-share-intent` library. iOS Share Extension receives URLs, redirects to main app. This is how most users actually trigger import (not manual paste). |
| TikTok URL support | TikTok is the #1 source of viral recipe content. CookingGuru, RecipeBro, Flavorish, REX all support it. | Medium | Supadata API handles TikTok transcript extraction. Only public videos accessible. |
| Instagram Reels URL support | Second most common video recipe source. All competitors support it. | Medium | Supadata API handles Instagram transcript extraction. Only public posts accessible. |
| YouTube URL support (Shorts + full videos) | Third major source. All competitors support it. YouTube has best transcript availability (native captions). | Low-Medium | Supadata API handles YouTube. Native captions usually available, reducing AI transcript cost. |
| Structured recipe output (ingredients + steps) | Core value prop -- users want a usable recipe, not a transcript. Every competitor produces structured recipes. | Medium | Gemini Flash parses transcript into structured recipe format. Reuse existing recipe schema (ingredients, instructions, timers, nutrition). |
| Progress/loading feedback during import | Video import takes 5-15 seconds (transcript extraction + LLM parsing). Users need feedback that something is happening. | Low | Loading spinner with status text ("Extracting transcript...", "Parsing recipe..."). |
| Free tier with limited imports | Flavorish: 5 free, RecipeBro: 10 free, Honeydew: 10 free/month. Users expect to try before paying. | Low | PROJECT.md specifies 3/month free, unlimited premium. Track via `ai_usage_log` with new function name. |
| Editable results before saving | RecipeBro and others let users fix extraction errors before committing. Transcript-based extraction is inherently imperfect. | Low | Already built -- existing recipe creation form can be pre-populated with imported data and edited before save. |
| Source URL preserved on recipe | RecipeBro keeps video link. Users want to rewatch the original video for visual reference. | Low | Already supported -- `source_url` field exists on recipes table. Store original video URL there. |

## Differentiators

Features that set SharedKitchen apart. Not expected by all users, but valued and not universally offered.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| LLM best-guess for ambiguous measurements | Video creators say "a handful of cheese" or "some oil" -- LLM should produce reasonable numeric amounts (e.g., 1 cup, 2 tbsp) rather than leaving blanks. Competitors often leave these vague. | Low | Handled in Gemini Flash prompt engineering. Add instruction: "When measurements are vague or missing, provide reasonable cooking estimates." Already specified in PROJECT.md. |
| Timer extraction from transcript | SharedKitchen already has embedded countdown timers in cooking mode. Extract "simmer for 20 minutes" from transcripts into timer metadata. No competitor integrates video import with cooking timers. | Low | Already built for web URL import. Gemini prompt already extracts timers. Transcript parsing inherits this. |
| Nutrition info estimation | CookingGuru provides this; most others don't. SharedKitchen already has nutrition_info field. | Low | Gemini Flash can estimate nutrition from ingredients list. Already in the prompt for web import. |
| Generic video URL support (any public video) | Supadata supports arbitrary public file URLs (MP4, WEBM, etc.). Most competitors only support TikTok/Instagram/YouTube. | Low | Supadata API accepts any public video URL. Fall through to generic handling if URL doesn't match known platforms. |
| Household-shared video imports | Imported recipe automatically available to all household members. Competitors are individual-only apps. | None (free) | Already built -- recipes belong to households via `household_id` FK. No additional work needed. |

## Anti-Features

Features to explicitly NOT build. Tempting but wrong for SharedKitchen's scope or technical reality.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Video content embedded in recipe | PROJECT.md explicitly excludes this ("text + photos only"). Video hosting is expensive, copyright-fraught, and unnecessary when `source_url` links back. | Store `source_url` pointing to original video. Users tap to watch in native app. |
| Visual/frame analysis of video content | CookingGuru claims "visual analysis" but transcript-based extraction is more reliable, cheaper, and faster. Computer vision for cooking videos is research-grade, not production-ready. | Use transcript-only extraction via Supadata. Gemini Flash parses text, not video frames. |
| In-app video playback | Building a video player adds complexity (codec support, streaming, caching) for marginal value. Users already have TikTok/Instagram/YouTube installed. | Deep-link or open `source_url` in system browser/native app. |
| Private/login-walled video access | TikTok and Instagram block automated access to private content. Attempting this creates legal risk, reliability problems, and user confusion. | Only support publicly accessible videos. Show clear error: "This video appears to be private. Please make sure the video is publicly accessible." |
| OCR/on-screen text extraction | Some recipes show ingredients as on-screen text overlays without saying them aloud. OCR adds a separate AI pipeline, increases cost, and is unreliable with stylized fonts. | Rely on audio transcript. If transcript is empty or too short, show user-friendly error suggesting they try a different video or enter manually. |
| Batch/bulk video import | Importing multiple videos at once adds queue management complexity and multiplies API costs. No competitor offers this as a primary feature. | Single URL import per action. Users can import multiple recipes sequentially. |
| Caption/description-only extraction (no transcript) | RecipeBro claims to extract from "captions and descriptions" -- this works poorly for most video recipes where ingredients are spoken, not typed. | Always extract transcript. If available, combine transcript + caption for better results. Captions alone are insufficient. |

## Feature Dependencies

```
Share Sheet Integration (expo-share-intent)
  --> URL Detection (is this a video URL?)
    --> Transcript Extraction (Supadata API call)
      --> LLM Recipe Parsing (Gemini Flash)
        --> Recipe Preview/Edit Form (existing)
          --> Recipe Save (existing recipeStore.addRecipe)

Paste URL Field (existing)
  --> URL Detection (is this a video URL?)
    --> [same pipeline as above]

Video Import Rate Limiting
  --> Premium Status Check (existing subscriptions table)
  --> Usage Tracking (existing ai_usage_log table)
```

### Integration Points with Existing Infrastructure

| Existing Component | How Video Import Uses It | Changes Needed |
|-------------------|-------------------------|----------------|
| `parse-recipe-url` Edge Function | Add video URL detection branch. If video URL detected, call Supadata for transcript, then Gemini for recipe parsing. | Add URL pattern matching, Supadata API call, new Gemini prompt for transcripts. |
| `parseRecipeUrl()` in `src/lib/ai.ts` | Client-side entry point. Detect video URL before fetching HTML (video pages don't have JSON-LD recipe data). Route to edge function directly. | Add video URL regex check, skip HTML fetch for video URLs, pass URL to edge function. |
| `ai_usage_log` table | Track video imports separately (`function_name: 'parse-video-recipe'`) for rate limiting (3/month free vs 10/day for web URLs). | New function_name constant. Rate limit query filters by this name. |
| `subscriptions` table | Check premium status for unlimited video imports. | No changes -- already queried in Edge Function. |
| Recipe creation form | Pre-populate with parsed video recipe data for user review/edit before save. | No changes -- already accepts `RecipeInsert` shape. |
| `source_url` field | Store original video URL. | No changes -- field already exists. |
| `expo-share-intent` (NEW) | Receive shared URLs from iOS share sheet. | New dependency. Config plugin in app.json, `+native-intent.ts` handler, route to import flow. |

## MVP Recommendation

### Must Have (Phase 1 -- Core Pipeline)

1. **Video URL detection** in Edge Function -- regex patterns for TikTok, Instagram, YouTube URLs
2. **Supadata transcript extraction** -- API integration in Edge Function
3. **Transcript-to-recipe Gemini prompt** -- new prompt optimized for conversational/spoken recipe content
4. **Video-specific rate limiting** -- 3/month free, unlimited premium, tracked in `ai_usage_log`
5. **Paste URL support** -- extend existing paste field to accept video URLs (minimal client changes)

### Must Have (Phase 2 -- Share Sheet)

6. **Share sheet integration** via `expo-share-intent` -- receive URLs from TikTok/Instagram/YouTube apps
7. **Deep link routing** -- shared URL routes to import flow with URL pre-filled

### Should Have (included in MVP but lower priority)

8. **Progress feedback** -- multi-step loading states during import
9. **Error handling for private videos** -- clear user-facing message
10. **Generic video URL support** -- any public video URL, not just TikTok/Instagram/YouTube

### Defer

- **Video thumbnail as recipe image**: Extract thumbnail from video metadata via Supadata or platform oEmbed endpoint. Nice-to-have but not critical for v3.0 launch.
- **Caption + transcript combining**: Merge video caption/description text with transcript for richer context. Marginal improvement, add complexity.

## Competitive Landscape Summary

| App | Video Sources | Extraction Method | Free Tier | Paid Price | Differentiator |
|-----|--------------|-------------------|-----------|------------|----------------|
| **CookingGuru** | TikTok, Instagram, YouTube Shorts | Visual analysis + AI (claims) | Free with limits | Freemium (unspecified) | Claims to work on silent videos |
| **RecipeBro** | TikTok, Instagram, YouTube, Pinterest, any website | Captions + descriptions + AI | 10 free imports | Subscription (unspecified) | 700+ food blog sites, manual support for failures |
| **Flavorish** | TikTok, Instagram, YouTube, Facebook | Share-to-app AI extraction | 5 free social imports | $4.99/month | Nutrition breakdown, meal planning |
| **REX** | YouTube, other platforms | AI extraction | Unknown | Unknown | Shopping list generator (coming soon) |
| **Recify** | TikTok, Instagram, Pinterest | AI from video/caption | Unknown | Unknown | Standardizes casual formats |
| **Honeydew** | TikTok, Instagram, Pinterest, YouTube | AI extraction | 10 AI imports/month | Subscription | Recipe organization + collections |
| **SharedKitchen** (planned) | TikTok, Instagram, YouTube, any video URL | Transcript (Supadata) + Gemini Flash | 3 video/month | $9.99/month (existing plan) | Household sharing, cooking mode timers, integrated meal planning |

### SharedKitchen's Position

SharedKitchen is entering a crowded space for video import but has unique advantages:
- **Household collaboration** -- no competitor shares imported recipes with household members automatically
- **Cooking mode integration** -- timer extraction from transcripts feeds directly into step-by-step cooking mode with countdown timers
- **Meal planning integration** -- imported recipes slot directly into weekly dinner calendar
- **Existing premium base** -- video import adds value to existing $9.99/month subscription rather than being the sole paid feature

The 3/month free tier is aggressive (lower than competitors' 5-10) but acceptable given SharedKitchen's broader feature set and higher subscription price point.

## Sources

- [CookingGuru](https://cooking.guru/) -- Competitor analysis (fetched 2026-03-28)
- [Flavorish](https://www.flavorish.ai/) -- Competitor analysis (fetched 2026-03-28)
- [RecipeBro Import](https://recipebro.com/import) -- Competitor analysis (fetched 2026-03-28)
- [RecipeBro TikTok Import](https://recipebro.com/import-recipes/tiktok) -- Competitor analysis (fetched 2026-03-28)
- [Supadata Transcript API](https://docs.supadata.ai/get-transcript) -- Official API docs (fetched 2026-03-28)
- [expo-share-intent GitHub](https://github.com/achorein/expo-share-intent) -- Share sheet library (WebSearch 2026-03-28)
- [Honeydew Blog - Recipe Apps for Social Media Imports](https://honeydewcook.com/blog/recipe-apps-social-media-imports) -- Market overview (WebSearch 2026-03-28)
- [Recipe Notes - TikTok Import Guide](https://recipenotes.app/how-to-import-recipes-from-tiktok) -- Competitor analysis (WebSearch 2026-03-28)
