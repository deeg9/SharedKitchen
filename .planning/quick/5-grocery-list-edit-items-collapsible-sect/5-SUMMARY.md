---
phase: quick-5
plan: 01
status: complete
duration: 10min
---

# Quick Task 5: Grocery List — Edit Items, Collapsible Sections

## What Changed

### 1. Edit Items
- Added `updateItem` action to `groceryStore.ts` with optimistic UI updates
- Pencil edit icon on every grocery item — tapping it opens the AddItemSheet in edit mode
- Edit mode pre-fills name, quantity, unit, section, and price from the existing item
- Sheet header changes to "Edit Item" and button says "Save Changes"
- After saving, sheet closes and list updates immediately

### 2. Collapsible Sections
- All grocery sections (Produce, Dairy & Eggs, Pantry, etc.) are now collapsible by default
- Tap the section header to expand/collapse
- Chevron icon (↑/↓) indicates state
- Completed section remains collapsed by default

### 3. AddItemSheet Dual Mode
- `AddItemSheet` now accepts optional `editItem` prop
- When `editItem` is provided, sheet enters edit mode
- Parses existing quantity string back into number + unit
- Maps DB section value back to UI label

## Files Modified
- `src/stores/groceryStore.ts` — added `updateItem` action
- `src/components/grocery/AddItemSheet.tsx` — edit mode support
- `src/components/grocery/GroceryItem.tsx` — pencil edit button, `onEdit` callback
- `src/components/grocery/GrocerySection.tsx` — all sections collapsible, `onEditItem` passthrough
- `app/(app)/(tabs)/grocery.tsx` — wired up edit state, passed callbacks
