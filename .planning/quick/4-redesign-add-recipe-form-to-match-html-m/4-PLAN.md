---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
---

<objective>
Redesign the Add Recipe form (RecipeForm.tsx) to match the HTML mockup design with polished sections, better layout, and improved UX.
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Redesign RecipeForm.tsx to match mockup</name>
  <files>src/components/recipes/RecipeForm.tsx</files>
  <action>
Rewrite RecipeForm with the mockup's section-based layout:
1. Import from URL section (already in add.tsx, integrate into form)
2. Recipe Name as large headline input
3. Category as horizontal chip picker
4. Cover Photo with camera/gallery buttons
5. Metadata grid (prep/cook/servings/cost) in 2x2 layout
6. Ingredients section with amount/unit/name grid + Add button
7. Instructions section with numbered steps + Add button
8. Tags section with toggle chips
9. Save Recipe button
  </action>
  <done>RecipeForm matches the HTML mockup design</done>
</task>

<task type="auto">
  <name>Task 2: Update add.tsx to integrate with redesigned form</name>
  <files>app/(app)/recipe/add.tsx</files>
  <action>
Move the import URL section into RecipeForm or keep it separate but ensure the overall page layout matches the mockup (back button header, scrollable content).
  </action>
  <done>Add recipe page renders the redesigned form correctly</done>
</task>
</tasks>
