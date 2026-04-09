# Phase 37: Barcode Scanning - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can scan any packaged food barcode to instantly look up the product and add it to their pantry or grocery list. This phase delivers: a `food-barcode` Edge Function querying Open Food Facts + FatSecret by barcode, a fullscreen barcode scanner using expo-camera's onBarcodeScanned, a product result card with nutrition display, and one-tap add-to-pantry/add-to-grocery flows with duplicate detection.

</domain>

<decisions>
## Implementation Decisions

### Barcode Scanner UX
- "Scan Barcode" button on Kitchen tab's On Hand section next to "Search Foods" button
- Fullscreen camera view with overlay frame — matches existing v4.0 vision camera patterns
- Post-scan: show product card with nutrition + "Add to Pantry" / "Add to Grocery" dual action buttons
- Barcode not found: "Product not found" with "Search by name instead" → opens FoodSearchSheet

### Barcode Lookup Architecture
- New `food-barcode` Edge Function — separate from food-search (different input type and API endpoints)
- API lookup order: Open Food Facts first (free, no auth), FatSecret as fallback (uses existing OAuth from Phase 36)
- Reuse existing expo-camera with `onBarcodeScanned` — already installed from v4.0, no new native dependency
- Normalize UPC-A to EAN-13 (prepend "0") before API lookup — Open Food Facts uses EAN-13

### Add-to-Pantry/Grocery Flows
- One-tap "Add to Pantry" — creates pantry item with food_id FK, name, and nutrition data attached
- One-tap "Add to Grocery" — creates grocery item with product name and category auto-detected
- Duplicate detection: check existing pantry by name similarity — show "Already in pantry" badge if found, still allow re-add
- Success feedback: toast notification "Added to Pantry ✓" / "Added to Grocery ✓" with undo option

### Claude's Discretion
- Barcode scanning throttle (prevent rapid-fire scans)
- Camera permission handling (reuse existing permission hook from v4.0)
- Product card layout and styling details
- Error handling for network failures during lookup

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useCamera.ts` — camera permission hook from v4.0
- `src/components/camera/` — CameraView, CaptureButton components from v4.0
- `src/components/food/FoodSearchSheet.tsx` — Phase 36 search sheet (fallback target)
- `src/stores/foodStore.ts` — Phase 36 food store (can be extended with barcode methods)
- `src/stores/pantryStore.ts` — pantry CRUD operations
- `src/stores/groceryStore.ts` — grocery item CRUD operations
- `src/lib/food-api.ts` — Phase 36 API wrapper (can add barcode endpoint)
- `supabase/functions/food-search/index.ts` — Phase 36 Edge Function (FatSecret OAuth reusable)

### Established Patterns
- Camera flows: fullscreen camera with overlay (v4.0 scan/identify)
- Edge Functions: auth check, rate limiting, Supabase client pattern
- Toast notifications: existing toast pattern in the app
- Bottom sheets and modal screens

### Integration Points
- Kitchen tab: add "Scan Barcode" button alongside "Search Foods"
- foodStore: extend with barcode lookup state and methods
- food-api.ts: add lookupBarcode() method
- pantryStore: existing addPantryItem() for add-to-pantry
- groceryStore: existing addItem() for add-to-grocery
- food_items table: cache barcode lookup results

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the accepted grey area decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
