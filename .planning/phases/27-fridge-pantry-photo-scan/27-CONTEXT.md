# Phase 27: Fridge/Pantry Photo Scan - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

User-facing fridge/pantry scanning feature. Users photograph shelves, AI identifies items with brand-level detail, users review/edit on a confirmation screen, then bulk-add to On Hand inventory. Includes multi-photo support (scan multiple shelves) and duplicate detection against existing pantry items. Builds on Phase 26's CameraSheet, compressForVision, analyzePhoto, and analyze-food-photo Edge Function.

</domain>

<decisions>
## Implementation Decisions

### Scan Review Screen UX
- Full-screen modal with FlatList of editable items — each row shows name, quantity, category with inline editing
- Tap row → inline text inputs expand (name, quantity, category dropdown) for fast editing without navigation
- "Add item" row at bottom of list for manually adding items the AI missed — same inline form as editing
- Swipe-to-delete with undo toast for removing wrong items — matches existing grocery list pattern

### Multi-Photo & Dedup
- "Scan Another" button on review screen appends new items to existing list before saving — single review for multiple scans
- Normalize names (lowercase, trim, remove brands) and fuzzy match against existing pantry items — highlight matches in yellow with "Already in pantry" label
- Duplicate rows show existing item info — user can tap to merge (update quantity) or keep both

### Bulk Add & Categories
- AI assigns categories from existing set (Proteins, Produce, Dairy & Eggs, Pantry, Other) in the Gemini response — user can change via dropdown on review screen
- New `bulkAddPantryItems()` in pantryStore — single batch insert to Supabase, then optimistic update — avoids N individual calls
- Success feedback: toast "Added X items to On Hand" + navigate to On Hand segment showing new items at top

### Claude's Discretion
- Exact Gemini prompt for scan intent (item identification with brands, quantities, categories)
- Review screen visual design details (spacing, typography, animations)
- Fuzzy matching algorithm specifics (Levenshtein distance vs simple normalization)
- Whether to show a photo thumbnail on the review screen
- Loading/processing indicator during multi-photo merge

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/vision.ts` — `compressForVision()`, `analyzePhoto('scan', base64)`, `VisionRateLimitError` (from Phase 26)
- `src/components/camera/CameraSheet.tsx` — camera capture bottom sheet (Phase 26)
- `src/stores/pantryStore.ts` — `addPantryItem()`, `_addItem()`, `mapSectionToCategory()`, existing categories: Proteins, Produce, Dairy & Eggs, Pantry, Other
- `src/components/pantry/OnHandList.tsx` — existing pantry item display
- `supabase/functions/analyze-food-photo/index.ts` — Edge Function with scan intent (Phase 26)
- Swipeable pattern from grocery list for swipe-to-delete

### Established Patterns
- Zustand stores with optimistic updates + revert on error
- Bottom sheet components via @gorhom/bottom-sheet
- FlatList with section headers for categorized lists
- Toast notifications for success feedback
- Real-time sync via usePantrySync hook

### Integration Points
- `app/(app)/(tabs)/grocery.tsx` — Camera FAB already wired, `handleImageCaptured` needs to route scan results to new review screen
- `src/stores/pantryStore.ts` — needs new `bulkAddPantryItems()` method
- `supabase/functions/analyze-food-photo/index.ts` — scan intent prompt refinement for brand-level identification

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the grey area decisions — open to standard approaches for implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
