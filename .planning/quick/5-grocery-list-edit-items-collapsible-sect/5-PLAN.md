---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
---

<objective>
Add edit item capability, make all sections collapsible, support editing categories.
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Add updateItem to grocery store</name>
  <files>src/stores/groceryStore.ts</files>
  <done>Store has public updateItem action</done>
</task>

<task type="auto">
  <name>Task 2: Create EditItemSheet + make sections collapsible + edit on tap</name>
  <files>src/components/grocery/GroceryItem.tsx, src/components/grocery/AddItemSheet.tsx, app/(app)/(tabs)/grocery.tsx</files>
  <done>Tapping item opens edit sheet, all sections collapsible</done>
</task>
</tasks>
