---
phase: quick
plan: 260330-liw
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/lib/vision.test.ts
  - tests/lib/dedup.test.ts
  - tests/lib/recipeSearch.test.ts
  - tests/components/ScanReviewScreen.test.tsx
  - tests/components/DishIdentifiedSheet.test.tsx
  - tests/components/MealSlotPickerSheet.test.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "All v4.0 lib functions have Jest unit tests with passing assertions"
    - "All v4.0 components render correctly and handle user interactions in tests"
    - "Mocks cover expo-image-manipulator, supabase, fetch, zustand stores, and BottomSheet"
  artifacts:
    - path: "tests/lib/vision.test.ts"
      provides: "Tests for compressForVision, analyzePhoto, VisionRateLimitError"
    - path: "tests/lib/dedup.test.ts"
      provides: "Tests for normalizeName and findDuplicates"
    - path: "tests/lib/recipeSearch.test.ts"
      provides: "Tests for searchRecipes"
    - path: "tests/components/ScanReviewScreen.test.tsx"
      provides: "Tests for ScanReviewScreen rendering and interactions"
    - path: "tests/components/DishIdentifiedSheet.test.tsx"
      provides: "Tests for DishIdentifiedSheet rendering and search flow"
    - path: "tests/components/MealSlotPickerSheet.test.tsx"
      provides: "Tests for MealSlotPickerSheet rendering and selection"
  key_links: []
---

<objective>
Write comprehensive Jest unit tests for all v4.0 AI Vision features: library functions (vision.ts, dedup.ts, recipeSearch.ts) and components (ScanReviewScreen, DishIdentifiedSheet, MealSlotPickerSheet).

Purpose: Establish test coverage for the v4.0 milestone features before moving to the next milestone.
Output: 6 test files — 3 lib tests, 3 component tests — all passing via `npx jest`.
</objective>

<execution_context>
@.planning/quick/260330-liw-write-jest-unit-tests-for-v4-0-ai-vision/260330-liw-PLAN.md
</execution_context>

<context>
@tests/setup.tsx (global mocks: supabase, expo-*, AsyncStorage, icons, haptics, safe-area)
@tests/lib/ai.test.ts (pattern: mock supabase + fetch, test edge function calls)
@tests/components/BottomSheet.test.tsx (pattern: mock @gorhom/bottom-sheet + reanimated, render with RNTL)
@jest.config.js (preset: jest-expo, setup file, transform ignores)

<interfaces>
From src/lib/vision.ts:
```typescript
export class VisionRateLimitError extends Error {
  limit: number; used: number; remaining: number;
  constructor(message: string, limit: number, used: number);
}
export async function compressForVision(uri: string): Promise<{ base64: string; width: number; height: number }>;
export async function analyzePhoto(imageUri: string, intent: 'scan' | 'identify'): Promise<VisionResult>;
```

From src/lib/dedup.ts:
```typescript
export function normalizeName(name: string): string;
export function findDuplicates(scannedItems: ScannedItem[], existingItems: PantryItem[]): ScannedItem[];
```

From src/lib/recipeSearch.ts:
```typescript
export async function searchRecipes(dishName: string): Promise<RecipeSearchResult[]>;
```

From src/types/scan.ts:
```typescript
export interface ScannedItem {
  id: string; name: string; quantity: string; category: string;
  brand: string | null; duplicateOfId: string | null; duplicateOfName: string | null;
}
```

From src/types/recipeSearch.ts:
```typescript
export interface DishIdentification { name: string; confidence: number; description?: string; }
export interface RecipeSearchResult { title: string; url: string; source: string; thumbnail?: string; cookTime?: string; }
```

From src/components/scan/ScanReviewScreen.tsx:
```typescript
interface ScanReviewScreenProps {
  initialItems: Array<{ name: string; category?: string; quantity?: string; brand?: string }>;
  onClose: () => void;
  onSaved: (count: number) => void;
}
```

From src/components/recipe-discovery/DishIdentifiedSheet.tsx:
```typescript
interface DishIdentifiedSheetProps {
  isOpen: boolean; dish: DishIdentification | null; onClose: () => void;
  onSearchResults: (results: RecipeSearchResult[]) => void; onLogMeal?: () => void;
}
```

From src/components/meal-logging/MealSlotPickerSheet.tsx:
```typescript
interface MealSlotPickerSheetProps {
  isOpen: boolean; dishName: string; onClose: () => void;
  onSelect: (date: string, mealType: MealType) => void;
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Library unit tests — vision.ts, dedup.ts, recipeSearch.ts</name>
  <files>tests/lib/vision.test.ts, tests/lib/dedup.test.ts, tests/lib/recipeSearch.test.ts</files>
  <behavior>
    vision.test.ts:
    - VisionRateLimitError: sets name, limit, used, remaining correctly
    - compressForVision: calls ImageManipulator.manipulateAsync with correct params (resize 1024, JPEG, compress 0.6, base64 true), returns { base64, width, height }
    - analyzePhoto('scan'): compresses image, calls fetch with correct URL/headers/body, returns VisionResult on success
    - analyzePhoto: throws VisionRateLimitError on 429 with vision_limit_exceeded type
    - analyzePhoto: throws generic Error on non-OK non-429 response
    - analyzePhoto: throws Error on non-JSON content-type

    dedup.test.ts:
    - normalizeName: lowercases, trims, strips punctuation, collapses whitespace
    - normalizeName: handles empty string, already normalized
    - findDuplicates: marks exact name match as duplicate (sets duplicateOfId, duplicateOfName)
    - findDuplicates: marks substring match (scanned name contained in existing)
    - findDuplicates: marks substring match (existing name contained in scanned)
    - findDuplicates: leaves non-matching items untouched (duplicateOfId remains null)

    recipeSearch.test.ts:
    - searchRecipes: calls fetch with correct URL, auth headers, body { query: dishName }
    - searchRecipes: returns results array on success
    - searchRecipes: throws RateLimitError on 429
    - searchRecipes: throws generic Error on other failure
    - searchRecipes: throws Error on non-JSON content-type
  </behavior>
  <action>
    Create 3 test files following the pattern in tests/lib/ai.test.ts:

    **tests/lib/vision.test.ts:**
    - Mock `expo-image-manipulator` at top of file: `jest.mock('expo-image-manipulator', () => ({ manipulateAsync: jest.fn(), SaveFormat: { JPEG: 'jpeg' } }))`.
    - Mock `../../src/lib/supabase` like ai.test.ts (auth.getSession returning mock session).
    - Mock global.fetch like ai.test.ts.
    - Set `process.env.EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in beforeEach.
    - Test VisionRateLimitError constructor directly (new VisionRateLimitError('msg', 5, 3) => remaining=2, name='VisionRateLimitError').
    - For compressForVision: mock manipulateAsync to return { base64: 'abc', width: 1024, height: 768 }, verify call args and return value.
    - For analyzePhoto success: mock manipulateAsync + fetch chain, verify fetch URL includes /functions/v1/analyze-food-photo, body has { image, intent }, returns VisionResult.
    - For analyzePhoto 429: mock fetch returning { ok: false, status: 429, headers with content-type json, json: { type: 'vision_limit_exceeded', error: 'limit', limit: 5, used: 5 } }. Assert throws VisionRateLimitError.
    - For analyzePhoto non-JSON: mock fetch returning { headers without json content-type }. Assert throws 'Server error'.

    **tests/lib/dedup.test.ts:**
    - Pure function tests, no mocks needed.
    - Import normalizeName, findDuplicates from '../../src/lib/dedup'.
    - Test normalizeName: ' Hello, World!! ' => 'hello world'; 'EGGS' => 'eggs'; '' => ''; 'milk  2%' => 'milk 2'.
    - Test findDuplicates with mock ScannedItem[] and PantryItem[] (use `as any` for PantryItem fields not relevant — only id and name matter).
    - Exact match: scanned 'Eggs', existing [{ id: 'p1', name: 'eggs' }] => duplicateOfId: 'p1'.
    - Substring: scanned 'Greek Yogurt', existing [{ id: 'p2', name: 'yogurt' }] => duplicateOfId: 'p2'.
    - No match: scanned 'Butter', existing [{ id: 'p1', name: 'Milk' }] => duplicateOfId: null.

    **tests/lib/recipeSearch.test.ts:**
    - Mock supabase and global.fetch like ai.test.ts.
    - Import searchRecipes and RateLimitError.
    - Success: fetch returns { ok: true, json: { results: [{ title: 'Pasta', url: '...', source: 'example.com' }] } }. Returns results.
    - 429: fetch returns { ok: false, status: 429, json: { limit: 20 } }. Throws RateLimitError.
    - Error: fetch returns { ok: false, status: 500, json: { error: 'fail' } }. Throws Error('fail').
    - Non-JSON: fetch returns headers without json. Throws 'Server error'.
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx jest tests/lib/vision.test.ts tests/lib/dedup.test.ts tests/lib/recipeSearch.test.ts --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>All 3 lib test files pass. vision.test.ts covers compressForVision, analyzePhoto success/429/error/non-JSON, VisionRateLimitError. dedup.test.ts covers normalizeName and findDuplicates exact/substring/no-match. recipeSearch.test.ts covers success/429/error/non-JSON.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Component tests — ScanReviewScreen, DishIdentifiedSheet, MealSlotPickerSheet</name>
  <files>tests/components/ScanReviewScreen.test.tsx, tests/components/DishIdentifiedSheet.test.tsx, tests/components/MealSlotPickerSheet.test.tsx</files>
  <behavior>
    ScanReviewScreen.test.tsx:
    - Renders "Review Items" header and item count badge
    - Renders each initial item name in the list
    - Shows duplicate badge for items matching pantry
    - Calls onClose when close button pressed
    - Save button text shows item count

    DishIdentifiedSheet.test.tsx:
    - Renders "Dish Identified" title when open with a dish
    - Shows confidence badge text (High/Medium/Low based on confidence value)
    - Shows dish name in text input
    - Shows "Find Recipes" button
    - Shows "Log as Meal" button when onLogMeal provided
    - Does NOT show "Log as Meal" button when onLogMeal omitted
    - Returns null when dish is null

    MealSlotPickerSheet.test.tsx:
    - Renders "Log {dishName}" title
    - Renders day chips for next 7 days
    - Shows "Today" label for current day chip
    - Renders meal type buttons (Breakfast, Lunch, Dinner, Snack)
    - Calls onSelect with date string and meal type when meal button pressed
  </behavior>
  <action>
    Create 3 component test files following tests/components/BottomSheet.test.tsx pattern.

    **All 3 files need at the top (before other imports):**
    - Mock `@gorhom/bottom-sheet` and `react-native-reanimated` exactly like BottomSheet.test.tsx.
    - Additional mocks per component below.

    **tests/components/ScanReviewScreen.test.tsx:**
    - Mock zustand stores: `jest.mock('../../src/stores/pantryStore', () => ({ usePantryStore: jest.fn() }))` — make usePantryStore return `{ items: [], bulkAddPantryItems: jest.fn() }` via selector.
    - Mock householdStore similarly: return `{ activeHouseholdId: 'h1' }`.
    - Mock `../../src/hooks/useCameraPermission` returning `{ showPrePrompt: false, checkAndPrompt: jest.fn(), requestAfterPrePrompt: jest.fn(), dismissPrePrompt: jest.fn() }`.
    - Mock child components that are hard to render: `jest.mock('../../src/components/camera/CameraSheet', () => ({ CameraSheet: () => null }))`, same for CameraPermissionPrompt, VisionLoadingOverlay.
    - Mock `../../src/lib/dedup` with `findDuplicates: jest.fn((items) => items)` so items pass through.
    - Mock `../../src/lib/vision` with `analyzePhoto: jest.fn(), VisionRateLimitError: class extends Error {}`.
    - Render with `initialItems: [{ name: 'Milk', category: 'Dairy & Eggs', quantity: '1' }, { name: 'Eggs', quantity: '12' }]`.
    - Assert: 'Review Items' text present, 'Milk' text present, 'Eggs' text present, 'Save 2 items' text present.
    - Test onClose: fireEvent.press on close button (accessibilityLabel or icon), verify onClose called.
    - For duplicate test: make findDuplicates mock return items with duplicateOfId set, verify "Already in pantry" text appears.

    **tests/components/DishIdentifiedSheet.test.tsx:**
    - Mock `../../src/lib/recipeSearch` with `searchRecipes: jest.fn(() => Promise.resolve([]))`.
    - Provide dish: `{ name: 'Pad Thai', confidence: 0.9, description: 'Thai noodle dish' }`.
    - Assert: 'Dish Identified' present, 'High confidence' present, TextInput value is 'Pad Thai', 'Thai noodle dish' text present, 'Find Recipes' button present.
    - Test medium confidence (0.6): renders 'Medium confidence' and 'Is this right?' subtitle.
    - Test low confidence (0.3): renders 'Low confidence'.
    - Test onLogMeal presence: when onLogMeal provided, 'Log as Meal' button visible. When omitted, not visible.
    - Test null dish: renders nothing (component returns null).

    **tests/components/MealSlotPickerSheet.test.tsx:**
    - Mock `../../src/lib/dates` with: `getWeekDays: jest.fn()` returning 7 date objects starting from today, `toDateString: jest.fn((d) => d.toISOString().slice(0,10))`, `formatDayLabel: jest.fn((d) => ({ weekday: 'Mon', day: '30' }))`.
    - Mock `../../src/types/database` partially — provide MEAL_TYPES: ['breakfast','lunch','dinner','snack'] and MEAL_TYPE_CONFIG with label and icon for each.
    - Render with dishName='Pad Thai', isOpen=true.
    - Assert: 'Log Pad Thai' title present, 'Today' chip present, all 4 meal type labels present.
    - Test selection: fireEvent.press on 'Dinner' button, verify onSelect called with (dateString, 'dinner').
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx jest tests/components/ScanReviewScreen.test.tsx tests/components/DishIdentifiedSheet.test.tsx tests/components/MealSlotPickerSheet.test.tsx --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>All 3 component test files pass. ScanReviewScreen tests verify rendering with items, item count, close callback, duplicate badges. DishIdentifiedSheet tests verify confidence levels, search button, optional Log as Meal, null dish handling. MealSlotPickerSheet tests verify day chips, meal type buttons, and onSelect callback.</done>
</task>

</tasks>

<verification>
Run the full test suite to ensure no regressions:
```bash
npx jest --no-coverage 2>&1 | tail -30
```
All existing + new tests should pass.
</verification>

<success_criteria>
- 6 new test files created and passing
- No existing tests broken
- Tests cover: vision compression/analysis/rate-limiting, dedup normalization/matching, recipe search success/error, component rendering/interactions
- All mocks follow established patterns from tests/setup.tsx and tests/lib/ai.test.ts
</success_criteria>

<output>
After completion, create `.planning/quick/260330-liw-write-jest-unit-tests-for-v4-0-ai-vision/260330-liw-SUMMARY.md`
</output>
