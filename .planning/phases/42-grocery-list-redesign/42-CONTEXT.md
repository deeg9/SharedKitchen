# Phase 42: Grocery List Redesign - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Redesign the grocery/kitchen screen with shopping progress tracking, plan sync action, and enhanced item details — WITHOUT any regression in real-time sync, presence, camera flows, or barcode scanning. This is the highest-risk screen at 684 LOC with 4 real-time hooks. Visual changes only — no store modifications.

</domain>

<decisions>
## Implementation Decisions

### Summary Card
- Card at top showing: item count, estimated cost (~$85), presence avatars (existing PresenceAvatarStack)
- Uses groceryStore.summary() for data (already computes totals)
- Card uses Card variant="elevated"

### Shopping Progress Bar
- ProgressBar component (from Phase 39) showing "X of Y items checked"
- Data: items.filter(checked).length / items.length
- Animated fill updates in real time as items are checked
- Placed inside or below the summary card

### Sync with Plan
- Button in header area: "Sync with Plan" with refresh icon
- Calls existing handleGenerate function (already in grocery.tsx)
- Shows loading state while generating

### Enhanced Item Rows
- Show quantity and estimated price on each item (from item.quantity and item.estimated_price fields if available)
- Show source/category tags (e.g., "Pantry" tag on items that exist in pantry)
- Modify existing GroceryItem component

### Segment Control Order
- Shopping List (left, default) / On Hand/Pantry (right)
- Currently: On Hand is left — SWAP the order
- Default segment stays 'shopping' (already correct in code)

### CRITICAL: Preserve Real-Time Hooks
- useGrocerySync — real-time item updates
- usePantrySync — real-time pantry updates
- usePresence — live avatar tracking
- useActivityToast — activity notifications
- Camera flow: CameraSheet, VisionLoadingOverlay, ScanReviewScreen, ListExtractReviewScreen
- Barcode scanner integration
- ALL of these must work identically after redesign

### Claude's Discretion
- Summary card layout proportions
- Progress bar label placement (inside vs outside bar)
- Item row metadata layout

</decisions>

<code_context>
## Existing Code Insights

### Files to Modify
- `app/(app)/(tabs)/grocery.tsx` — Main screen (684 lines, complex state)
- `src/components/grocery/GroceryItem.tsx` — Individual item rows
- `src/components/grocery/GrocerySection.tsx` — Category sections
- `src/components/grocery/GrocerySummary.tsx` — Existing summary (may replace)

### Real-Time Hooks (DO NOT BREAK)
- `useGrocerySync(activeHouseholdId, activeListId)` — Supabase realtime channel
- `usePantrySync(activeHouseholdId)` — Pantry realtime channel
- `usePresence(channelKey, currentPresenceUser)` — Avatar tracking
- `useActivityToast({groceryListId, householdId, currentUserId, memberLookup})` — Toast notifications

### Reusable Assets (from Phase 39)
- `src/components/ui/ProgressBar.tsx` — Animated horizontal fill bar

### Stores Used (read-only)
- groceryStore: items, activeListId, loading, summary(), groupedItems(), fetchGroceryList, generateGroceryList
- groceryCategoryStore: initialize
- pantryStore: fetchPantryItems
- householdStore: activeHouseholdId, members
- planStore: mealPlan (for generate)
- authStore: user

</code_context>

<specifics>
## Specific Ideas

- Stitch reference: /Users/deeg/Downloads/SharedKitchenStitchUIv2/refined_grocery_kitchen_list/screen.png
- The existing GrocerySummary component may be replaced by the new summary card + progress bar, or enhanced in place
- Segment control swap is a simple reorder of the two Pressable elements

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
