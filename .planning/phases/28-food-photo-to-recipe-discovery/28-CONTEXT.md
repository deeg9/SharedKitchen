# Phase 28: Food Photo to Recipe Discovery - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Food photo → recipe discovery feature. Users photograph food (or screenshot), AI identifies the dish with confidence level, app searches the web for matching recipes via Serper.dev, and user selects one to import into their recipe book via the existing parseRecipeUrl pipeline. Builds on Phase 26's vision infrastructure (CameraSheet, analyzePhoto with 'identify' intent).

</domain>

<decisions>
## Implementation Decisions

### Recipe Discovery Flow
- Bottom sheet shows identified dish name + confidence badge (High/Medium/Low) with editable text field — user can correct name before searching
- Recipe search results displayed as list of 3 recipe cards in a bottom sheet — each shows title, source domain, thumbnail (from Serper), estimated time if available
- Tap recipe card → calls existing `parseRecipeUrl()` from `src/lib/ai.ts` with the recipe URL → same import flow as URL paste (no new import logic needed)
- New `search-recipes` Edge Function handles Serper.dev API call — keeps SERPER_API_KEY server-side, returns structured results to client

### Confidence & Error Handling
- High confidence → auto-trigger recipe search; Medium/Low → show dish name with "Is this right?" prompt before searching
- No recipes found → show "No recipes found for [dish name]" with option to edit name and retry, or dismiss
- Dish not recognized → show "Couldn't identify this dish" with option to type dish name manually and search

### Claude's Discretion
- Exact Gemini prompt for identify intent (dish name, confidence, cuisine type)
- Serper.dev query construction (how to format dish name into recipe search query)
- Recipe card visual design (spacing, thumbnail size, typography)
- Loading states between identify → search → results display
- Whether to show cuisine type alongside dish name

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/vision.ts` — `analyzePhoto('identify', base64)` returns `VisionResult` with items array (Phase 26)
- `src/lib/ai.ts` — `parseRecipeUrl(url)` for importing selected recipe (existing)
- `src/components/camera/CameraSheet.tsx` — camera capture (Phase 26)
- `supabase/functions/analyze-food-photo/index.ts` — identify intent already implemented (Phase 26)
- `@gorhom/bottom-sheet` — existing bottom sheet pattern used throughout app

### Established Patterns
- Edge Functions: Deno runtime, auth, admin client, CORS headers, structured JSON response
- Recipe import: parseRecipeUrl → JSON-LD extraction → LLM fallback → structured recipe
- Bottom sheet with action items (meal picker, recipe actions)
- Loading overlays during AI processing

### Integration Points
- `app/(app)/(tabs)/grocery.tsx` — Camera FAB already wired, `handleImageCaptured` currently routes to scan review — needs to also support 'identify' intent results
- New `supabase/functions/search-recipes/index.ts` — Serper.dev Edge Function
- New `src/components/recipe-discovery/DishIdentifiedSheet.tsx` — dish identification results
- New `src/components/recipe-discovery/RecipeResultsSheet.tsx` — search results display

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the grey area decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
