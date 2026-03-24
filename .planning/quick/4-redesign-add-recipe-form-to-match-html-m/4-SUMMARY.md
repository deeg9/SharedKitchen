---
phase: quick-4
plan: 01
status: complete
duration: 8min
---

# Quick Task 4: Redesign Add Recipe Form

## What Changed

Completely rewrote `src/components/recipes/RecipeForm.tsx` to match the HTML mockup design.

### New Design Sections:
1. **Recipe Name** — Large headline-style input with bottom border
2. **Category** — Horizontal scrollable chip picker (Mexican, Seafood, etc.)
3. **Cover Photo** — Dashed placeholder with camera + gallery icon buttons
4. **Metadata Grid** — 2x2 layout: Prep Time, Cook Time, Servings (stepper), Est. Cost
5. **Ingredients** — Amount/Unit/Name grid rows with remove buttons + "Add Ingredient" dashed button
6. **Instructions** — Numbered step badges (primary-colored circles) with multiline text + "Add Step" button
7. **Tags & Preferences** — Toggle chip buttons (Spicy, Quick, Dairy-Free, etc.) with add/remove icons
8. **Save Recipe** — Full-width primary button with check-circle icon

### Key Improvements:
- Servings uses +/- stepper instead of text input
- Tags use visual toggle chips instead of comma-separated text
- All field labels use small uppercase tracking style
- Section headers have title + subtitle with bottom border
- Add buttons use dashed borders matching the mockup
- Step badges use primary color filled circles
- Photo picker shows camera + gallery side by side
