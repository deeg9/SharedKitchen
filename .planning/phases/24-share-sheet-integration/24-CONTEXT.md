# Phase 24: Share Sheet Integration - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can share a video URL from TikTok, Instagram, or YouTube directly to SharedKitchen via the iOS share sheet, triggering video import automatically. Requires expo-share-intent installation, app.json plugin config, +native-intent.ts handler, and routing to the add-recipe screen with the URL pre-filled.

</domain>

<decisions>
## Implementation Decisions

### Share Extension Configuration
- Accept all URLs in share sheet — simpler iOS ActivationRules config, let isVideoUrl() filter client-side
- Share intent routes to recipe add screen with URL pre-filled — reuse existing import flow from Phase 23
- Use existing `sharedkitchen://` URL scheme from app.json — no new scheme needed

### App State Handling
- expo-share-intent handles cold start via `+native-intent.ts` — library's built-in mechanism
- Non-video shared URLs show in regular import field — falls through to HTML pipeline gracefully

### Claude's Discretion
- Exact expo-share-intent plugin configuration in app.json
- iOS ActivationRules specifics
- +native-intent.ts file structure and routing logic
- Whether to show a toast/feedback when share intent is received

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/videoUrl.ts`: isVideoUrl() — detect video URLs client-side
- `src/lib/ai.ts`: parseRecipeUrl() — already handles video URL routing
- `app/(app)/recipe/add.tsx`: Import flow with video progress modal, usage counter
- `app.json`: Existing Expo config with scheme: "sharedkitchen"

### Established Patterns
- Expo Router file-based routing
- app.json plugins array for native module configuration
- Expo Router's +native-intent.ts for handling deep links

### Integration Points
- `app.json`: Add expo-share-intent plugin config
- `app/+native-intent.ts`: New file for handling share intent
- `app/(app)/recipe/add.tsx`: Accept URL param from share intent routing

</code_context>

<specifics>
## Specific Ideas

- expo-share-intent ^6.0.0 — use useShareIntent hook
- +native-intent.ts redirects shared URLs to /(app)/recipe/add?url={shared_url}
- add.tsx reads ?url param and auto-triggers import flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
