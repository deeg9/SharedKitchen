# Research Summary: SharedKitchen v3.0 Video Recipe Import

**Domain:** Video recipe import for collaborative dinner planning app
**Researched:** 2026-03-28
**Overall confidence:** HIGH

## Executive Summary

SharedKitchen v3.0 adds video recipe import from TikTok, Instagram, YouTube, and generic video URLs. The feature requires remarkably few new dependencies: one client-side package (`expo-share-intent` for iOS share sheet), one external API (Supadata for transcript extraction), and modifications to the existing `parse-recipe-url` Edge Function. Everything else -- Gemini Flash for parsing, `ai_usage_log` for rate limiting, the recipe creation form for previewing results -- already exists and needs only new code paths, not new infrastructure.

The core technical challenge is chaining two external API calls (Supadata + Gemini) within the 60-second Edge Function timeout, especially when Supadata returns async jobs for videos without native captions. The core UX challenge is preventing Gemini from hallucinating recipes when users share non-recipe videos. Both are solvable with proper timeout budgeting and response validation.

Supadata is the clear choice for transcript extraction: it covers all target platforms with a single REST endpoint, provides AI-generated transcript fallback for uncaptioned videos (critical for TikTok/Instagram), and costs $17/month for 3,000 credits at scale. The REST API is a simple GET request callable from Deno with `fetch()` -- no SDK needed. The alternative (SocialKit) is more expensive and lacks generic video URL support.

The recommended phase structure splits the work into two phases: (1) core video import pipeline via paste-URL, and (2) share sheet integration via expo-share-intent. This ordering means the entire import pipeline is testable end-to-end before dealing with native build changes required by the share extension.

## Key Findings

**Stack:** One new client package (`expo-share-intent ^6.0.0`), one new external API (Supadata REST v1), one new env var (`SUPADATA_API_KEY`). Everything else is existing infrastructure.

**Architecture:** Extend existing `parse-recipe-url` Edge Function with a video branch. Client detects video URLs and sends `{ url, type: 'video' }` directly to Edge Function, skipping HTML fetch and JSON-LD extraction. Same response shape, same caching, same auth.

**Critical pitfall:** Edge Function timeout from chaining Supadata (2-30s) + Gemini (3-8s). Mitigate with per-step timeouts and preferring native captions (`mode=auto`). Second critical pitfall: Gemini hallucinating recipes from non-recipe videos. Mitigate with transcript length validation and confidence-check prompt instructions.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Core Video Import Pipeline** - Edge Function video branch + client-side video URL detection
   - Addresses: Video URL detection, Supadata integration, Gemini transcript prompt, video rate limiting (3/month free), paste-URL support
   - Avoids: Edge Function timeout (per-step timeouts), hallucinated recipes (transcript validation + confidence check), cache conflicts (separate function_name)
   - Dependencies: `SUPADATA_API_KEY` env var must be set. No client package changes needed.
   - Build order: `videoUrl.ts` (pure function) -> Edge Function video branch -> `ai.ts` client routing -> rate limit UI

2. **Share Sheet Integration** - expo-share-intent setup + deep link routing
   - Addresses: iOS share sheet receives URLs from TikTok/Instagram/YouTube, `+native-intent.ts` handler routes to import flow
   - Avoids: Share extension requiring clean rebuild (prebuild --clean), share sheet not appearing (iosActivationRules config)
   - Dependencies: Phase 1 complete (import pipeline must work before wiring share sheet to it). Requires EAS build (already in use).
   - Build order: Install expo-share-intent -> app.json plugin config -> prebuild --clean -> +native-intent.ts handler -> real-device testing

**Phase ordering rationale:**
- Phase 1 before Phase 2 because the import pipeline must work before the share sheet has something to route to. Phase 1 is testable via paste-URL without native build changes.
- Share sheet (Phase 2) is a separate native module installation that requires `expo prebuild --clean` and real-device testing, making it a natural boundary.

**Research flags for phases:**
- Phase 1: Standard patterns. Supadata API is simple REST. Gemini prompt engineering is empirical but low-risk (reuses existing integration). The main unknown is transcript quality for TikTok/Instagram videos with no captions -- test early with real mobile share URLs.
- Phase 2: expo-share-intent has known sharp edges with iOS share extension lifecycle. Test on real devices early. The library is actively maintained and supports Expo SDK 55, but share extensions are inherently finicky on iOS.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Supadata API verified via official docs. expo-share-intent verified via GitHub + npm. Gemini Flash already integrated. |
| Features | HIGH | Feature scope matches competitors. Table stakes verified against CookingGuru, RecipeBro, Flavorish. |
| Architecture | HIGH | Extends existing Edge Function and client code. No new infrastructure. Integration points verified in codebase. |
| Pitfalls | HIGH | Timeout risk is calculable (Supadata + Gemini timing). Hallucination risk has known mitigations. Share extension gotchas documented by library author. |

## Gaps to Address

- **TikTok mobile short link resolution:** `vm.tiktok.com` short links may resolve differently server-side. Test with actual mobile share URLs during Phase 1 development, not just desktop URLs.
- **Supadata AI transcript quality:** When native captions are unavailable, Supadata generates transcripts via AI speech-to-text. Quality for heavily-accented or multi-language cooking videos is unknown. Test with diverse real-world content.
- **Gemini prompt tuning for informal speech:** The transcript-to-recipe prompt needs iteration. "A splash of olive oil" -> specific measurement is prompt engineering, not architecture. Plan for 1-2 prompt refinement cycles during Phase 1.
- **expo-share-intent with Expo Router:** The library supports Expo Router via `+native-intent.ts`, but exact routing behavior with the app in different states (foreground, background, killed) should be tested on a real device.

## Sources

- [Supadata Transcript API Docs](https://docs.supadata.ai/get-transcript)
- [Supadata Pricing](https://supadata.ai/pricing)
- [expo-share-intent GitHub](https://github.com/achorein/expo-share-intent)
- [expo-share-intent npm](https://www.npmjs.com/package/expo-share-intent)
- [SocialKit Pricing](https://www.socialkit.dev/pricing)
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts`, `src/lib/ai.ts`, `app.json`

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
