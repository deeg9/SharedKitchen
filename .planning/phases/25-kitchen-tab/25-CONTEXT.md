# Phase 25: Kitchen Tab - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename the middle Grocery tab to Kitchen. Add a segmented control at the top with "On Hand" and "Shopping List" sub-tabs. Shopping List is the existing grocery checklist (unchanged). On Hand is a new pantry/fridge inventory that tracks what you currently have. Checked-off grocery items auto-copy to On Hand. Manual add for On Hand items. Real-time sync via Supabase Realtime.

</domain>

<decisions>
## Implementation Decisions

### Data Model
- New `pantry_items` Supabase table: id, household_id, name, quantity, unit, category, added_at, expires_at (nullable)
- RLS policies matching grocery_items pattern (household-scoped)
- When grocery item is checked off: copy to pantry_items, keep in grocery as checked
- Real-time sync via Supabase Realtime (same pattern as grocery)

### UI
- Tab icon: `fridge-outline` (MaterialCommunityIcons), label: "Kitchen"
- Segmented control: two pill buttons "On Hand" | "Shopping List" at top
- Default sub-tab: Shopping List (existing behavior preserved)
- On Hand layout: simple list grouped by category, name + quantity, swipe to delete
- Optional expiry date with freshness badge (like leftovers)

### Claude's Discretion
- Exact segmented control styling/animation
- Pantry item add sheet design (reuse AddItemSheet pattern)
- Freshness badge colors/thresholds
- Category grouping order for pantry items

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(app)/(tabs)/grocery.tsx`: Existing grocery screen — becomes the Shopping List sub-tab
- `src/stores/groceryStore.ts`: Grocery store with toggle check-off — extend with auto-copy
- `src/components/grocery/GrocerySection.tsx`: Section component — reusable for On Hand
- `src/components/grocery/AddItemSheet.tsx`: Add item bottom sheet — adapt for pantry
- `src/hooks/useGrocerySync.ts`: Real-time sync hook — pattern for pantry sync
- `src/components/ui/TabBar.tsx`: Custom tab bar — update icon/label config

### Integration Points
- `app/(app)/(tabs)/_layout.tsx` line 17: Rename `grocery` tab to `kitchen`
- `src/components/ui/TabBar.tsx` line 17: Change icon from `cart` to `fridge-outline`, label from `Grocery` to `Kitchen`
- `src/stores/groceryStore.ts`: toggleItem function — add pantry auto-copy on check
- `app/(app)/(tabs)/grocery.tsx`: Wrap in Kitchen container with segmented control

</code_context>

<deferred>
## Deferred Ideas

- Recipe ingredient check-off populating pantry (use what you have)
- Smart grocery suggestions based on what's running low in pantry
- Barcode scanning for pantry items

</deferred>
