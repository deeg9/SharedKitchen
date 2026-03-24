# Design System Documentation: The Culinary Curator

## 1. Overview & Creative North Star
This design system is built on the philosophy of **"The Culinary Curator."** It moves away from the sterile, utilitarian feel of standard productivity apps and toward the tactile, intentional atmosphere of a high-end editorial cookbook. 

The goal is to balance the structured efficiency of a workspace (Notion) with the sensory warmth of a kitchen. We achieve this by rejecting rigid, boxed-in layouts in favor of **intentional asymmetry** and **tonal layering**. Elements should feel like they are laid out on a marble countertop—arranged with purpose, breathing with generous whitespace, and layered to create a sense of physical depth.

### The Creative North Star: "Tactile Sophistication"
*   **Intentional Asymmetry:** Avoid perfectly centered grids. Use off-center headings and overlapping images to create a "scrapbook" editorial feel.
*   **Breathing Room:** Use the upper limits of our spacing scale (Scale 16, 20, 24) to separate major sections.
*   **Materiality:** Interfaces should feel like layered cardstock or frosted glass, not flat pixels.

---

## 2. Colors
Our palette is rooted in the organic. We use deep botanicals, burnt earths, and creamy neutrals to evoke a sense of heritage and maturity.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or containment. Traditional lines create "visual noise" that cheapens the premium feel. 
*   Boundaries must be defined solely through **background color shifts** (e.g., a `surface-container-low` section sitting on a `surface` background) or through the use of negative space.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to define "importance" through depth rather than lines:
*   **Base:** `surface` (#fbf9f5) for the main canvas.
*   **Level 1:** `surface-container-low` (#f5f3ef) for secondary sidebars or groupings.
*   **Level 2:** `surface-container-lowest` (#ffffff) for high-focus cards or interactive elements.
*   **Level 3:** `surface-container-highest` (#e4e2de) for recessed elements like search bars or inactive areas.

### The "Glass & Gradient" Rule
To add soul to the interface, use **Glassmorphism** for floating elements (like a navigation bar or a "Quick Add" recipe button). Apply a semi-transparent `surface` color with a `backdrop-blur` effect. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#334537) to `primary_container` (#4a5d4e). This prevents the "flat-button" look and gives the component a weighted, premium feel.

---

## 3. Typography
The typography system is a dialogue between the playful (Plus Jakarta Sans) and the precise (Inter).

*   **Display & Headlines (Plus Jakarta Sans):** These are our "editorial" voices. Use `display-lg` and `headline-lg` with generous tracking adjustments to anchor a page. They should feel inviting and soft, like a hand-lettered menu.
*   **Title & Body (Inter):** These are our "functional" voices. Inter provides the modern, clean "Notion-like" clarity required for ingredient lists and cooking instructions.
*   **Label (Inter):** Used for metadata (e.g., "Prep Time"). These should always be in `label-md` or `label-sm` to maintain a clear distinction from actionable text.

---

## 4. Elevation & Depth
In this design system, hierarchy is achieved through **Tonal Layering** rather than structural scaffolding.

### The Layering Principle
Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a soft, natural "lift" that mimics paper on a table. The contrast is felt, not seen.

### Ambient Shadows
When an element must float (e.g., a Modal or a FAB), use "Ambient Shadows":
*   **Blur:** 24px–48px.
*   **Opacity:** 4%–8%.
*   **Color:** Tint the shadow with `on_surface` (#1b1c1a) rather than pure black to keep the warmth of the cream background.

### The "Ghost Border" Fallback
If a border is legally required for accessibility, use a **Ghost Border**: the `outline_variant` token at **15% opacity**. A 100% opaque border is a failure of the design system's philosophy.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped, using the `primary` to `primary_container` gradient. White text (`on_primary`).
*   **Secondary:** Pill-shaped, `secondary_fixed` background with `on_secondary_fixed` text (Burnt Orange palette). Use these for "Add to Meal Plan" or "Share."
*   **Tertiary:** No background. Text-only using `primary` color, with a subtle `surface_container_high` background on hover.

### Recipe Cards
*   **Style:** `1.5rem` (md) corner radius. 
*   **Structure:** No dividers. Use `spacing-4` (1rem) between title and metadata.
*   **Images:** Should have a subtle inner-glow or a `surface_variant` placeholder to maintain the warm tone while loading.

### Ingredient Chips
*   **Selection:** Use `primary_fixed` with `on_primary_fixed` text.
*   **Filter:** Pill-shaped, using `surface_container_highest` with no border.

### Collaborative Inputs (The "Notion" Element)
*   **Text Inputs:** Use a "Ghost Border" that becomes a 2px `primary` bottom-border only upon focus. This keeps the form feeling like a clean sheet of paper.
*   **Checkboxes:** Large `1.5rem` circular hit areas. When checked, use `primary` fill with a white checkmark.

### Lists & Dividers
*   **The Divider Ban:** Explicitly forbid horizontal line dividers. Separate list items using `spacing-2` of vertical whitespace or by alternating `surface` and `surface_container_low` backgrounds for a striped, "ledger" look.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins for "Hero" recipe titles.
*   **Do** allow images to "break the container" slightly to create depth.
*   **Do** use the `secondary` (Burnt Orange) sparingly—it is a garnish, not the main dish.
*   **Do** prioritize "Instructional Scans": use `body-lg` for recipe steps to ensure readability while cooking.

### Don’t
*   **Don't** use pure black (#000000) or pure white (#FFFFFF). Always use the provided tokens to maintain the "Warm Cream" DNA.
*   **Don't** use sharp corners. Everything must have a minimum radius of `sm` (0.5rem).
*   **Don't** use standard "Drop Shadows." Use Tonal Layering first; Ambient Shadows only when necessary.
*   **Don't** crowd the screen. If a layout feels busy, increase the spacing to the next tier in the scale.