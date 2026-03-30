# Feature Landscape: AI Vision -- Scan, Snap & Add

**Domain:** AI-powered food/kitchen photo scanning for collaborative dinner planning app
**Researched:** 2026-03-30
**Confidence:** MEDIUM-HIGH (competitive landscape well-documented; vision API capabilities verified; UX patterns consistent across competitors)

---

## Feature 1: Fridge/Pantry Photo Scan -> Bulk Add to On Hand

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single photo capture of fridge/pantry shelf | Every competitor (Fridge Vision AI, Scan2Meal, Portions Master) starts with "snap a photo." Users expect to open camera, take one photo, see results. | Low | `expo-camera` or `expo-image-picker` for capture. Send base64 to Edge Function for Gemini vision analysis. |
| Item list returned with names | Core value -- user photographs shelf, gets back a list of recognized items. Fridge Vision AI, Scan2Meal, Portions Master all do this. | Medium | Gemini Flash vision with structured output. Prompt requests JSON array of `{ name, category, quantity? }`. |
| Editable results before saving | Users need to fix AI mistakes before committing to inventory. Fridge Vision AI shows editable ingredient list. Portions Master allows corrections. | Low | Show checklist UI with item name, category, optional quantity. Users can deselect, edit names, or add missed items before bulk save. |
| Bulk add to On Hand inventory | One-tap to add all confirmed items. This is the payoff -- no manual entry per item. All competitors support batch add. | Low | Loop through confirmed items calling `pantryStore.addPantryItem()` for each, or batch insert via single Supabase `.insert([...])`. |
| Category auto-assignment | Items should land in correct On Hand categories (Produce, Dairy & Eggs, Proteins, Pantry, Other). Fridge Vision AI and Portions Master auto-categorize. | Low | Gemini prompt includes category classification. Map to existing `pantryStore` categories: Proteins, Produce, Dairy & Eggs, Pantry, Other. |
| Camera permission handling | iOS requires explicit permission. Users expect a clean prompt explaining why. | Low | `expo-camera` handles permission request. Add contextual pre-prompt matching existing notification permission pattern. |
| Loading/progress feedback | Vision API call takes 3-8 seconds. Users need visual feedback. Every competitor shows a processing state. | Low | Spinner + status text ("Analyzing your fridge..."). Same pattern as video recipe import. |
| Error state for poor/unusable photos | Dark, blurry, or non-food photos should get a helpful error, not garbage results. | Low | If Gemini returns 0 items or low confidence, show "Couldn't identify items. Try a brighter, closer photo." |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Brand-level identification | PROJECT.md specifies "brand-level detail" -- e.g., "Tillamook Sharp Cheddar" not just "cheese." No competitor consistently does this well. Fridge Vision AI identifies generic ingredients only. | Medium | Gemini vision can read package labels/logos. Prompt instructs: "For packaged items, identify the brand name and specific product. For loose produce, use common names." Accuracy varies -- packaged items with visible labels ~80%, loose produce ~90%, items behind other items ~50%. |
| Multi-photo scan session | Fridge Vision AI allows up to 5 photos per session (different shelves, door, crisper). Most competitors limit to 1. Comprehensive coverage requires multiple angles. | Medium | Allow users to take 2-5 photos before processing. Aggregate results across photos, deduplicate. Each photo is a separate Gemini call; merge results client-side. |
| Household-shared inventory update | Added items instantly visible to all household members via Supabase Realtime. No competitor in the fridge-scan space has multi-user households. | None (free) | Already built -- `pantryStore` uses Realtime sync via `usePantrySync`. Items added by one user appear for all household members. |
| Quantity estimation | "About half a gallon of milk" or "3 apples" rather than just item names. Portions Master claims this; most competitors skip it. | Low | Gemini prompt can estimate visible quantities. Accuracy is approximate but better than nothing. Map to `pantryStore.addPantryItem({ quantity })`. |
| Smart deduplication against existing On Hand | If user already has "Milk" in On Hand, scanning a milk carton should offer to update quantity rather than create a duplicate. | Medium | Before bulk add, check existing `pantryStore.items` for name matches (fuzzy). Show "Already in On Hand" badge with option to update or skip. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Barcode scanning for individual items | Requires a barcode database (UPC -> product name), adds a completely different scanning paradigm, and is slower than photo-based bulk scanning. NoWaste and CozZo focus on barcodes but it is one-item-at-a-time. | Photo-based bulk identification. Users wanting single-item precision can edit the results list or manually add items. |
| Expiration date detection from photos | Extremely unreliable -- dates are printed small, in varying formats, often obscured. Samsung's AI fridge only manages this for pre-registered items. | Let users manually set expiration dates on items they care about (field already exists in `pantry_items.expires_at`). |
| Automatic re-scanning on schedule | Push notification saying "Time to scan your fridge!" feels invasive and adds notification fatigue on top of existing cooking reminders and budget alerts. | On-demand scanning only. The camera button is always available on the Kitchen tab. |
| Receipt OCR scanning | Different feature entirely (ConsumeSmart, CozZo). Requires OCR pipeline, store-specific formatting handling, and a text-to-product mapping layer. Out of scope for camera vision milestone. | Photo-based scanning of actual food items. Receipt scanning could be a separate future milestone. |
| Real-time camera overlay with item labels | AR-style bounding boxes over items in live camera feed. Requires frame processing, adds massive complexity, drains battery. No food app does this well. | Static photo analysis. Take photo, process server-side, return results. |

### Dependencies on Existing Features

| Existing Component | How This Feature Uses It | Changes Needed |
|-------------------|-------------------------|----------------|
| `pantryStore.addPantryItem()` | Bulk add identified items to On Hand | None -- call in loop or refactor to accept array |
| `pantry_items` table | Store scanned items | None -- schema already has name, quantity, unit, category, expires_at |
| Kitchen tab (On Hand segment) | Entry point for scan -- camera button on On Hand view | Add camera FAB or header button |
| `usePantrySync` Realtime hook | Scanned items sync to household members | None -- already working |
| `ai_usage_log` table | Rate limit scans (premium feature) | Add `function_name: 'scan-pantry'` |
| `subscriptions` table | Gate unlimited scans for premium users | None -- already queried in Edge Functions |

---

## Feature 2: Food Photo -> Recipe Discovery

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Take/upload photo of a dish | Core interaction. DishDetect, Recipe Lens, Food Scanner, NomNomBear all start here. Camera or photo library picker. | Low | `expo-image-picker` for camera + gallery. Same capture flow as Feature 1. |
| AI dish identification with name | "This looks like Pad Thai" or "Chicken Parmesan." Every competitor does this. DishDetect claims 95%+ accuracy. | Medium | Gemini Flash vision identifies the dish. Prompt: "Identify this dish. Return the dish name, cuisine, and a brief description." GPT-4o achieves ~59-74% accuracy on food ID; Gemini Flash should be comparable. |
| 2-3 recipe options presented | PROJECT.md specifies "2-3 recipe options from web search." Users need choice because AI identification may be approximate ("is it Pad Thai or Drunken Noodles?"). | Medium | After dish identification, search for recipes using the identified dish name. Present 2-3 results with title, source, and thumbnail. |
| Recipe import from selected option | User picks one recipe, it imports into their recipe book. This is the payoff -- photo to saved recipe. | Low | Reuse existing `parseRecipeUrl()` pipeline. User selects a recipe URL, it flows through the existing JSON-LD -> Gemini extraction. |
| Loading/progress feedback | Two-step process (identify dish + search recipes) takes 5-10 seconds total. Users need feedback at each stage. | Low | "Identifying dish..." then "Finding recipes..." progress states. |
| Confidence indication | When AI is uncertain between "Chicken Alfredo" and "Chicken Carbonara," user should know. Recipe Lens and NomNomBear show primary guess with alternatives. | Low | Gemini returns top 1-3 dish name guesses. Show primary identification prominently, alternatives as "Did you mean?" chips. |
| Photo from gallery (not just camera) | Users often want to identify dishes from screenshots, photos taken earlier, or images shared by friends. Recipe Lens supports this. | Low | `expo-image-picker` supports both camera and gallery in one flow with `launchImageLibraryAsync()` and `launchCameraAsync()`. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Direct import into household recipe book | Competitor apps (DishDetect, Recipe Lens) are individual-only. SharedKitchen imports into the shared household recipe book, immediately available to all members. | None (free) | Existing `recipeStore.addRecipe()` already saves to household. |
| Recipe results with cooking mode compatibility | Imported recipes get timer extraction and step-by-step cooking mode. No photo-to-recipe competitor offers integrated cooking mode. | None (free) | Existing recipe import pipeline already extracts timers. |
| Meal plan integration | After importing a recipe from a food photo, offer "Add to this week's plan?" one-tap action. No photo-to-recipe competitor has meal planning. | Low | After recipe save, show bottom sheet with day picker using existing `planStore.assignRecipe()`. |
| Web search powered recipe discovery | Rather than generating a recipe from AI (unreliable, no source), find real recipes from real food blogs. More trustworthy and users can reference the original source. | Medium | Use Google Custom Search API or SerpApi to search "[dish name] recipe" and return top results with URLs. Each URL can then flow through existing recipe import. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI-generated recipes (no source URL) | PROJECT.md already excludes "AI-generated recipe images" and the app philosophy is extracting from real sources. AI-generated recipes have no provenance, may have errors, and cannot be verified. | Search for real recipes from real URLs. Import via existing pipeline. |
| Nutrition estimation from photo | Calorie tracking from food photos is a separate product (SnapCalorie, Cal AI). Accuracy is poor (10-20% error range per research). SharedKitchen is a meal planning app, not a calorie tracker. | Import the recipe, which already includes nutrition info extracted from the source page. |
| Ingredient-level identification from cooked dish | "What ingredients are in this?" from a photo of a finished dish is extremely unreliable. Hidden ingredients (spices, sauces) are undetectable. | Identify the dish name, then import a recipe that lists ingredients. The recipe is the source of truth for ingredients. |
| Reverse image search for recipes | Google Lens-style "find this exact image online" is technically complex, requires a different API, and returns visual matches rather than recipe matches. | Text-based recipe search using the AI-identified dish name. More reliable and cheaper. |

### Dependencies on Existing Features

| Existing Component | How This Feature Uses It | Changes Needed |
|-------------------|-------------------------|----------------|
| `parseRecipeUrl()` in `src/lib/ai.ts` | Import selected recipe URL through existing pipeline | None -- already handles URL -> structured recipe |
| `recipeStore.addRecipe()` | Save imported recipe to household | None |
| Recipe creation/edit form | Pre-populate with imported data for review | None -- already accepts `RecipeInsert` shape |
| `planStore.assignRecipe()` | Optional: add imported recipe to meal plan | None -- existing API |
| `ai_usage_log` table | Rate limit photo identification | Add `function_name: 'identify-dish'` |
| `parse-recipe-url` Edge Function | Could extend to handle dish identification, or create new `identify-dish` Edge Function | New code path or new function |

---

## Feature 3: Food Photo -> Meal Plan Logging

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Take photo of meal | Same capture mechanism as Feature 2. Users photograph what they are eating right now. | Low | Reuse the same `expo-image-picker` flow. |
| AI dish identification | Same as Feature 2 -- identify what the dish is. | Low (shared) | Same Gemini Flash vision call as Feature 2. Shared code path. |
| Day/slot selection | User picks which day and meal slot (breakfast/lunch/dinner) to log the meal to. | Low | Show bottom sheet with day picker (today pre-selected) and meal type selector. Reuse existing `MealType` enum: breakfast, lunch, dinner. |
| One-tap logging | After confirming dish name and selecting day/slot, single tap to add to plan. Minimal friction -- this is for quick "I just ate this" logging. | Low | Call `planStore.assignRecipe()` with `recipeId: null` (no recipe) or create a lightweight meal entry. Existing meal plan supports `notes` field for meal name. |
| Editable dish name before saving | AI might get the name wrong. User should be able to correct "Spaghetti Bolognese" to "Mom's Meat Sauce" before it hits the plan. | Low | Text input pre-filled with AI guess. User can accept or edit. |
| Meal source selection | Existing meal plan has `MealSource`: home-cooked, takeout, eating-out. Photographing a restaurant dish should default to "eating-out." | Low | Show meal source picker (already built in plan edit UI). Default based on context or let user choose. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dual-action after photo | After identifying a dish, offer BOTH "Log as meal" AND "Find recipe" as options. One photo, two paths. No competitor offers both in one flow. | Low | After dish identification, show two action buttons: "Add to Plan" (Feature 3 flow) and "Find Recipes" (Feature 2 flow). |
| Photo stored as meal thumbnail | The photo the user took becomes the visual for that meal on the weekly plan. Adds visual richness to the calendar view. | Medium | Upload photo to Supabase Storage. Store URL on `meal_plans` row. Display as thumbnail on plan day cards. Requires new `image_url` column on `meal_plans`. |
| Household activity feed integration | "Alex logged Pad Thai for Wednesday dinner" shows as activity toast for household members. | None (free) | Existing Supabase Realtime activity toasts already fire for meal plan changes. |
| Quick-log from Kitchen tab | Camera button accessible from On Hand tab -- same entry point for both pantry scanning and meal logging, with a choice after photo capture. | Low | Single camera FAB on Kitchen tab. After photo, ask: "Is this your fridge/pantry or a meal?" Route to Feature 1 or Feature 3 accordingly. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automatic calorie/macro logging | SharedKitchen is a meal planning app, not a nutrition tracker. Adding calorie tracking from photos creates scope creep into a different product category (competing with MyFitnessPal, SnapCalorie). | Log the meal name and source to the plan. If users want nutrition info, they can find and import the recipe (Feature 2). |
| Meal cost estimation from photo | Guessing cost from a photo is inaccurate. The existing budget feature requires explicit cost entry. | Keep existing manual cost entry via `meal_cost` field on meal plan edit. |
| Auto-detect meal type from time of day | "It's 7pm so this must be dinner" is wrong often enough to annoy users (late lunch, early dinner, breakfast for dinner). | Default to dinner (most common for SharedKitchen's use case) but let user change. |
| Photo required for meal logging | Some meals do not need a photo (quick "we had leftovers" entry). Do not make the camera the only way to log meals. | Camera is an additional input method. Existing manual meal assignment (recipe picker, text notes) remains primary. |

### Dependencies on Existing Features

| Existing Component | How This Feature Uses It | Changes Needed |
|-------------------|-------------------------|----------------|
| `planStore.assignRecipe()` | Log identified meal to a day/slot | May need to support `notes` field for dish name when no recipe is linked |
| `MealType` / `MealSource` enums | Day/slot and source selection | None |
| Meal plan day cards (Plan tab) | Display logged meal | May need to show photo thumbnail if stored |
| `meal_plans` table | Store the logged meal | Possibly add `image_url` column for meal photo |
| Supabase Storage | Store meal photos | New bucket: `meal-photos` |
| `ai_usage_log` table | Rate limit (shared with Feature 2) | Same `function_name: 'identify-dish'` |

---

## Cross-Feature Dependencies

```
expo-camera / expo-image-picker (shared)
  |
  +--> Photo capture
        |
        +--> "What is this?" intent router
              |
              +-- Fridge/Pantry scan (Feature 1)
              |     --> Gemini vision: identify items
              |     --> Review/edit item list
              |     --> Bulk add to pantryStore
              |
              +-- Food/Meal photo (Features 2 + 3)
                    --> Gemini vision: identify dish
                    --> Dual action:
                          |
                          +-- "Find Recipes" (Feature 2)
                          |     --> Web search by dish name
                          |     --> Recipe URL selection
                          |     --> Existing parseRecipeUrl() pipeline
                          |     --> recipeStore.addRecipe()
                          |
                          +-- "Log as Meal" (Feature 3)
                                --> Day/slot picker
                                --> planStore.assignRecipe()
```

### Shared Infrastructure

| Component | Used By | Notes |
|-----------|---------|-------|
| Camera/image picker | All 3 features | Single shared capture component |
| Gemini Flash vision API | All 3 features | Different prompts: item identification vs dish identification |
| Edge Function (new or extended) | All 3 features | Receives base64 image, routes to appropriate Gemini prompt |
| `ai_usage_log` rate limiting | All 3 features | Two function names: `scan-pantry` and `identify-dish` |
| Premium gating | All 3 features | Free tier gets limited scans/identifications per month |

---

## Feature Dependencies (Build Order)

```
Phase 1: Camera infrastructure + Gemini vision pipeline (shared)
  |
  +--> Phase 2a: Fridge/pantry scan (Feature 1)
  |      Depends on: camera, Gemini vision, pantryStore
  |
  +--> Phase 2b: Dish identification (shared by Features 2 + 3)
  |      Depends on: camera, Gemini vision
  |
  +--> Phase 3a: Recipe discovery (Feature 2)
  |      Depends on: dish identification, web search, parseRecipeUrl
  |
  +--> Phase 3b: Meal logging (Feature 3)
         Depends on: dish identification, planStore
```

Features 2 and 3 share the dish identification step, so they should be built together after the shared vision pipeline is established.

---

## MVP Recommendation

### Must Have (ship or feature feels broken)

1. **Camera capture component** -- shared by all features, build first
2. **Gemini vision Edge Function** -- receives image, returns structured identification
3. **Fridge/pantry scan with bulk add** (Feature 1) -- highest standalone value, populates On Hand inventory from photo
4. **Dish identification** (shared) -- identifies food photos, used by Features 2 and 3
5. **Recipe discovery with 2-3 options** (Feature 2) -- photo to recipe import pipeline
6. **Meal plan logging** (Feature 3) -- simplest of the three, quick-log identified dish

### Should Have (included in MVP but lower priority)

7. **Multi-photo scan sessions** -- 2-5 photos for comprehensive fridge coverage
8. **Smart deduplication** -- check existing On Hand before adding duplicates
9. **Dual-action after dish identification** -- "Find Recipes" + "Log as Meal" in one flow
10. **Meal photo thumbnail on plan** -- visual richness but requires Storage + schema change

### Defer

- **Brand-level identification refinement** -- Gemini will try, but accuracy on packaged goods varies. Do not over-promise; ship with best-effort brand detection and iterate.
- **Quantity estimation refinement** -- approximate quantities are fine for v4.0. Precision can improve with user feedback data.
- **Receipt OCR** -- entirely different feature, different milestone.

---

## Complexity Summary

| Feature | Overall Complexity | Biggest Risk |
|---------|-------------------|--------------|
| Fridge/pantry scan (Feature 1) | Medium | AI accuracy on cluttered fridges, items behind items, poor lighting. Mitigation: multi-photo support, editable results. |
| Recipe discovery (Feature 2) | Medium | Web search quality and recipe URL extraction reliability. Mitigation: reuse proven parseRecipeUrl pipeline, show multiple options. |
| Meal logging (Feature 3) | Low | Dish identification accuracy. Mitigation: editable dish name, low-friction correction. |
| Shared camera/vision infrastructure | Medium | First-time camera integration in the app, image upload to Edge Function, Gemini vision prompt engineering. |

**Total estimated effort:** Medium overall. The heaviest lift is the shared Gemini vision infrastructure (prompt engineering for food/item identification, image handling in Edge Functions). Individual features layer on top with relatively low marginal complexity because they integrate into existing stores and UI patterns.

---

## Sources

- [Fridge Vision AI](https://fridgevisionai.com/) -- Competitor analysis, UX flow, 95% accuracy claim, 5-photo sessions
- [Scan2Meal](https://scan2meal.app/) -- Competitor analysis, receipt + photo scanning
- [Recipe Lens](https://www.recipelens.com/) -- Photo-to-recipe identification flow
- [DishDetect](https://www.dishdetect.app/) -- 95%+ dish identification accuracy claim
- [Portions Master](https://portionsmaster.com/blog/best-pantry-inventory-app-and-fridge-management-tool/) -- Fridge scan, categorization, meal recommendations
- [DEV Community: Building Meal Tracker with GPT-4o Vision](https://dev.to/wellallytech/from-pixels-to-calories-building-a-high-precision-meal-tracker-with-gpt-4o-vision-5018) -- Architecture pattern, prompt strategy, cost analysis
- [Gemini API Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding) -- Official Gemini vision capabilities, structured output, object detection
- [SerpApi Google Recipes API](https://serpapi.com/recipes-results) -- Programmatic recipe search by dish name
- [Welling.ai: AI Food Tracker Accuracy 2026](https://www.welling.ai/articles/ai-food-tracker-photo-recognition-calories-2026) -- Industry accuracy benchmarks
- [Samsung Bespoke Fridge with Gemini](https://www.techlicious.com/blog/samsung-bespoke-fridge-vision-ai-with-google-gemini/) -- Gemini food recognition: 37 items, limitation on door bins/freezer
- [ScienceDirect: Diabot-GPT-4o Food Recognition](https://www.sciencedirect.com/science/article/abs/pii/S0002916525006173) -- GPT-4o: 59-74% food identification accuracy, 10-20% error on portions
