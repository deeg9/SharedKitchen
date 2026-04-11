# Domain Pitfalls: Stitch UI Redesign

**Domain:** Comprehensive UI redesign of existing React Native + Expo app (14 screens)
**Project:** SharedKitchen v7.0
**Researched:** 2026-04-07
**Confidence:** HIGH (verified against codebase analysis, React Native docs, and community reports)

---

## Critical Pitfalls

Mistakes that cause regressions, rewrites, or ship-blocking issues.

### Pitfall 1: Real-Time Subscription Teardown During Component Restructuring

**What goes wrong:** Redesigning screen components (especially grocery.tsx at 684 LOC and plan.tsx at 408 LOC) often means extracting, splitting, or replacing components that host Supabase Realtime subscriptions and Presence channels. If the component tree changes, `useEffect` cleanup runs, tearing down subscriptions. The new component tree may not re-subscribe correctly, or subscriptions may briefly lapse -- causing missed real-time updates, ghost presence avatars, or stale grocery list state.

**Why it happens:** SharedKitchen has real-time sync hooks (`useGrocerySync`, `usePantrySync`, `usePresence`, `useActivityToast`) wired into tab screens. Redesigning these screens means the hooks' lifecycle changes. Developers focus on visual output and forget that these hooks silently manage WebSocket connections.

**Consequences:** Grocery items checked off by a household member stop syncing. Presence avatars disappear or show stale users. Activity toasts stop firing. All of these are invisible during solo testing -- they only manifest when two users are active simultaneously.

**Prevention:**
- Identify every screen that uses real-time hooks BEFORE redesigning it. The affected screens are: grocery (`useGrocerySync`, `usePantrySync`, `usePresence`, `useActivityToast`), plan (social feed subscriptions), and recipe detail (`usePresence`).
- Keep real-time hooks at the same component level or higher in the tree -- never push them deeper into a child that conditionally renders.
- After each screen redesign, run a two-device manual test: open the screen on two devices, perform actions on one, verify the other receives updates.
- Write a "real-time smoke test" checklist per screen before starting the redesign.

**Detection:** Presence avatars not appearing, grocery items not syncing across devices, activity toasts silent during collaborative use.

**Phase guidance:** Address in the earliest phase -- establish the "hooks stay at tab-screen level" rule before any component extraction begins.

---

### Pitfall 2: Maestro Test Fragility from Changed Element Hierarchy

**What goes wrong:** SharedKitchen has 25+ Maestro E2E flows that rely on `testID` attributes (e.g., `grocery-tab`, `grocery-summary`, `grocery-item-.*`) and visible text patterns. Redesigning screens changes element hierarchy, removes/renames components, and shifts layouts -- silently breaking Maestro selectors. Tests that passed before the redesign start failing with "element not found" errors, but the failures cascade: a broken navigation tap early in a flow causes every subsequent assertion to fail, making it impossible to tell what actually broke.

**Why it happens:** Maestro tests are outside the TypeScript codebase (YAML in `.maestro/`), so there is no compiler warning when a `testID` is removed or a text label changes. Developers restructuring components naturally clean up or rename IDs without checking Maestro flows.

**Consequences:** E2E test suite becomes red. Teams either (a) ignore the failing tests and lose the safety net, or (b) spend days fixing tests instead of shipping features. Worst case: tests are bulk-deleted "to fix later" and never restored.

**Prevention:**
- Before redesigning a screen, grep all Maestro YAML files for any `id:` or `text:` selectors that reference that screen's elements. Document them.
- Preserve all existing `testID` props on new components. Treat `testID` as a contract, not an implementation detail.
- Update Maestro flows incrementally -- fix flows for each screen immediately after redesigning it, not in a batch at the end.
- Use `extendedWaitUntil` with generous timeouts (already in use) rather than positional taps, which break when layouts shift.

**Detection:** Maestro CI pipeline goes red. Individual flow runs show "element not found" for previously stable selectors.

**Phase guidance:** Each phase that redesigns a screen MUST include a task to update the corresponding Maestro flows. Never defer test fixes to a later phase.

---

### Pitfall 3: Bottom Sheet State Conflicts with New UI Interactions

**What goes wrong:** SharedKitchen uses bottom sheets extensively (PlanEditSheet, AddItemSheet, EditCategoriesSheet, AddPantryItemSheet, CameraSheet, FoodSearchSheet, CommentSheet, AddActionSheet). Redesigning a screen often introduces new interactive overlays (expanded sections, view toggles, filter chips) that compete with bottom sheet open/close state. The result: tapping a new UI element opens a sheet AND triggers a state change, or closing a sheet resets new UI state, or gesture conflicts between bottom sheet drag and new horizontal swipe gestures.

**Why it happens:** Bottom sheets in React Native consume gestures (pan, swipe). New UI elements like horizontal date strips, swipeable cards, or collapsible sections also consume gestures. Without explicit gesture arbitration, both respond to the same touch, causing visual glitches or navigation to unintended states.

**Consequences:** User swipes horizontally on date strip but bottom sheet intercepts the gesture and opens/closes. Tapping a filter chip triggers the underlying list item. The app feels broken and unresponsive even though the visual redesign looks correct.

**Prevention:**
- Map all existing bottom sheets per screen before redesigning. The grocery screen alone has 7+ sheets/overlays.
- Test every gesture interaction between new UI elements and existing bottom sheets.
- Use `simultaneousHandlers` and `waitFor` from react-native-gesture-handler to explicitly define gesture priority.
- Do not add new bottom sheets without removing or consolidating existing ones -- screen-level sheet count should not increase.

**Detection:** Gesture conflicts during manual testing. Bottom sheets opening when they should not. UI state resetting unexpectedly when sheets close.

**Phase guidance:** Define gesture interaction rules in the first phase. Document which gestures each screen's bottom sheets consume.

---

### Pitfall 4: Nested ScrollView / FlatList Virtualization Breakage

**What goes wrong:** Stitch designs commonly produce layouts with a scrollable header area (date strip, filter chips, progress bar) above a scrollable list (meal cards, recipe grid, grocery items). Implementing this naively puts a FlatList inside a ScrollView, which disables FlatList's virtualization. All items render at once, causing memory spikes and janky scrolling -- especially on the grocery screen (potentially hundreds of items) and recipe library (large grid).

**Why it happens:** Design tools output full-page layouts where everything scrolls together. In web CSS, this is trivial (the whole page scrolls). In React Native, ScrollView and FlatList are fundamentally different scroll containers that cannot be trivially nested.

**Consequences:** On recipe library: all recipe cards render at once instead of being virtualized, causing 2-3 second mount delays with 50+ recipes. On grocery: checking items causes the entire list to re-render because virtualization is broken. Memory usage climbs, especially with recipe card images.

**Prevention:**
- NEVER nest a FlatList inside a ScrollView. Use FlatList's `ListHeaderComponent` for sticky headers, date strips, filter chips, and progress bars.
- For the recipe grid (2-column layout), use FlatList with `numColumns={2}` and `ListHeaderComponent` for filters -- not a ScrollView wrapping a FlatList.
- For grocery with section headers, use SectionList (already partially in use via `groupedItems`).
- Set `removeClippedSubviews={true}` and tune `windowSize` (default 21 is often too large; try 5-7).
- Memoize `renderItem` with `React.memo` and use `keyExtractor` with stable IDs.

**Detection:** Scroll jank visible at 30fps. Yellow box warning: "VirtualizedLists should never be nested inside plain ScrollViews." Memory usage climbing in Xcode Instruments when scrolling lists.

**Phase guidance:** Establish the "FlatList + ListHeaderComponent" pattern in the first screen redesigned, then replicate across all list screens.

---

## Moderate Pitfalls

### Pitfall 5: Zustand Store Bloat from UI-Only State

**What goes wrong:** When adding new UI state for the redesign (view toggles like day/week, expanded sections, animation progress, selected filter chips, scroll positions), developers add these to existing Zustand stores alongside business data. This causes unnecessary re-renders: toggling a view mode in `planStore` triggers re-renders in every component that subscribes to ANY `planStore` state, including components that only need meal plan data.

**Prevention:**
- Keep UI-only state as local `useState` in the screen component or in a dedicated `useScreenUIState` hook -- NOT in Zustand stores.
- The existing stores (planStore, groceryStore, budgetStore, etc.) should remain purely for server-synced business data.
- Use Zustand selectors (`useStore(store, selector)`) to subscribe to specific slices, not the whole store.
- Rule of thumb: if the state resets when you navigate away from the screen, it is local state, not store state.

**Detection:** Component profiler showing unnecessary re-renders when UI toggles change. Store files growing with `isExpanded`, `activeView`, `selectedChip` properties.

**Phase guidance:** Establish the "local UI state vs store state" boundary in the first phase. Code review should enforce this throughout.

---

### Pitfall 6: Design-to-Code Visual Gaps

**What goes wrong:** Stitch generates designs that use visual effects which are expensive or inconsistent in React Native:
- **Complex shadows:** Android's `elevation` property cannot match iOS's `shadowColor/shadowOffset/shadowBlur/shadowRadius` fidelity. Even on iOS-only, applying shadows to every card in a FlatList is expensive because each shadow is a separate bitmap render. Also: `shadowRadius` in React Native is half the "blur" value from design tools like Figma/Stitch (a documented discrepancy).
- **Blur effects:** `expo-blur` works on iOS but has performance costs. Backdrop blur behind bottom sheets or overlay cards causes frame drops during animations.
- **Gradient overlays:** Linear gradients on images (for text readability over hero photos) require `expo-linear-gradient` and add rendering overhead per card in a list.
- **SVG-heavy charts:** Donut rings, progress bars, and circular charts from Stitch may use complex SVG paths that are expensive to animate.

**Prevention:**
- Audit each Stitch design for these effects BEFORE implementation. Flag any design that uses: blur, gradient overlays on list items, colored/inset shadows, or complex SVG animations.
- For shadows on list items: use a single shadow style with `shadowOpacity: 0.08` -- subtle enough to look good, cheap enough to render per item. The existing `shadows` theme module should define the approved shadow styles.
- For the budget donut ring: use `react-native-svg` with Reanimated's `createAnimatedComponent` (proven pattern). Do NOT add a heavy charting library for a single donut.
- For gradient overlays on feed photos: apply the gradient at image load time (server-side or cached), not as a runtime overlay per card.
- Prefer `backgroundColor` tonal layering (the existing "Tactile Sophistication" approach) over blur effects.
- Remember: `shadowRadius` in RN = blur / 2 from Stitch/Figma designs.

**Detection:** Frame rate dropping below 50fps on screens with many cards. Visible shadow rendering lag when scrolling.

**Phase guidance:** Create a "visual effects budget" in the first phase: which effects are allowed per screen, and which are too expensive.

---

### Pitfall 7: Camera and Vision Flow Regression on Grocery Screen

**What goes wrong:** The grocery screen (684 LOC) has extensive camera integration: `CameraSheet`, `CameraPermissionPrompt`, `CameraPermissionCard`, `VisionLoadingOverlay`, `ScanReviewScreen`, `ListExtractReviewScreen`, `BarcodeScannerScreen`, `BarcodeResultCard`. Redesigning the grocery screen's layout can break the state machine that manages the camera flow: permission prompt -> camera sheet -> vision analysis -> scan review -> add to pantry/grocery.

**Why it happens:** The camera flow is a multi-step state machine managed by many `useState` booleans (`cameraSheetOpen`, `barcodeScannerOpen`, `foodSearchOpen`, etc.) in the grocery screen. Restructuring the JSX tree or extracting components can disconnect these state variables from their corresponding conditional renders.

**Prevention:**
- Extract the camera flow state machine into a custom hook (e.g., `useCameraFlow`) BEFORE redesigning the grocery screen. This decouples the flow logic from the visual layout.
- Test every camera flow path after redesigning: scan photo -> review -> add items, barcode scan -> result -> add, food search -> select -> add.
- Do not change the camera permission flow -- it is required by Apple App Store guidelines.

**Detection:** Camera sheet not opening, scan results not appearing, barcode scanner overlay misaligned after layout changes.

**Phase guidance:** The grocery screen redesign should be in a dedicated phase (not combined with other screens) due to its complexity. Extract camera flow hook first.

---

### Pitfall 8: Incremental Redesign Creates Temporary Visual Inconsistency

**What goes wrong:** Redesigning 14 screens incrementally (recommended over big-bang) means the app temporarily has two visual languages: old screens with the current Culinary Curator design and new screens with the Stitch-inspired design. Users navigating between tabs see jarring visual jumps. Shared components (headers, bottom sheets, FAB, tab bar) must work with BOTH old and new screens during the transition.

**Prevention:**
- Redesign shared/global components first (or confirm they don't need changes). The design constraints say tab bar, FAB, and branding stay as-is, which eliminates the biggest source of inconsistency.
- Group screen redesigns by user flow, not by screen: redesign Plan + Cooking Mode together (they are linked), Recipe Library + Recipe Detail together, Grocery + Pantry together.
- Use the existing design system tokens (colors, typography, spacing from `src/theme/`) for BOTH old and new screens. The Stitch designs must adapt to these tokens, not the other way around.
- Accept that temporary inconsistency is the price of reduced risk. A 2-week period of visual inconsistency is far better than a big-bang release that breaks 5 features.

**Detection:** User feedback about inconsistent appearance. Side-by-side comparison of adjacent screens showing different card styles, spacing, or typography.

**Phase guidance:** Phase 1 should redesign the highest-traffic screens (Plan, Recipes) to cover the most user time. Onboarding can be later since it is only seen once.

---

## Minor Pitfalls

### Pitfall 9: Over-Animating the Redesign

**What goes wrong:** Stitch designs often include entrance animations, micro-interactions, and transitions that look polished in a mockup but cause cumulative frame drops in a real app. Adding `react-native-reanimated` animations to every card, every toggle, and every transition creates a "death by a thousand cuts" performance issue.

**Prevention:**
- Limit entrance animations to ONE element per screen (e.g., the hero card). Everything else appears instantly.
- Use Reanimated's `useAnimatedStyle` and run animations on the UI thread -- never use `Animated` from React Native core for new animations.
- For the budget donut ring animation: animate ONCE on mount, do not re-animate on every data change.
- Profile with Xcode Instruments after adding any animation. Target 60fps minimum.

**Detection:** Frame rate drops during screen transitions. Animations feeling sluggish on older devices (iPhone 11 and earlier).

---

### Pitfall 10: Dark Mode Regression

**What goes wrong:** The app already supports dark mode via the theme system. New components added during redesign may hardcode colors (e.g., `backgroundColor: '#FFFFFF'` instead of `colors.surface`) or use Stitch's color values instead of the SharedKitchen theme tokens. Result: new components look wrong in dark mode.

**Prevention:**
- Every new component MUST use colors from `src/theme/colors.ts`, typography from `src/theme/typography.ts`, and spacing from `src/theme/spacing.ts`.
- Test every redesigned screen in BOTH light and dark mode before marking it complete.
- No hardcoded color values in any new component -- enforce via code review.

**Detection:** Visual inspection in dark mode. Grep for hex color literals in new component files.

---

### Pitfall 11: Missing Skeleton/Loading State Parity

**What goes wrong:** Current screens use `<Skeleton />` components for loading states. New designs may not specify loading states, so developers implement the "loaded" state and forget to maintain skeleton parity. Users see a blank screen or layout shift when data loads.

**Prevention:**
- For every redesigned screen, implement the loading state FIRST, then the loaded state.
- Reuse the existing `<Skeleton />` component from `src/components/ui/Skeleton`.
- Test with artificial delays (add 2-second sleep to fetch calls) to verify loading states look correct.

**Detection:** Flash of empty content on screen mount. Layout shift when data arrives.

---

### Pitfall 12: Import Path Breakage from Component Reorganization

**What goes wrong:** Moving, renaming, or splitting components during redesign breaks import paths across the codebase. With 255+ source files using relative imports (e.g., `../../../src/components/grocery/GrocerySection`), moving a component means updating every file that imports it.

**Prevention:**
- Use TypeScript's path aliases (already available via `tsconfig.json`) to avoid deep relative imports.
- If components must move, use IDE "rename symbol" / "move file" features that auto-update imports.
- Do not rename component files unless the component's responsibility fundamentally changes.

**Detection:** TypeScript compilation errors after file moves.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Plan screen redesign (date strip, hero card, day/week toggle) | Real-time social feed subscription teardown (#1); nested ScrollView with FlatList (#4) | Keep social hooks at screen level; use FlatList ListHeaderComponent for date strip |
| Recipe library redesign (filter chips, 2-column grid) | FlatList re-render from filter state changes (#4, #5) | Memoize renderItem; keep filter chip state local, not in recipeStore |
| Grocery screen redesign (progress bar, enhanced rows) | Camera flow regression (#7); presence/sync teardown (#1); bottom sheet conflicts (#3) | Extract useCameraFlow hook first; dedicated phase for grocery alone |
| Budget dashboard (donut ring, insights) | Over-animation (#9); SVG performance for donut (#6) | Use Reanimated + react-native-svg, animate once on mount only |
| Profile redesign (cooking insights, grouped settings) | Store bloat from dashboard state (#5); dark mode regression (#10) | All insight calculations derived, not stored; theme token enforcement |
| Onboarding redesign (6 screens) | Lowest risk -- isolated flow, no real-time features | Test with fresh account; verify navigation sequence |
| Cooking mode redesign (step photos, timers) | Timer state regression -- existing timers use countdown logic tied to component lifecycle | Do not restructure timer hook; redesign visual layer only |
| Social feed redesign (hero photos, avatar strip) | FlatList performance with large images (#4, #6); infinite scroll regression | Keep existing cursor pagination; use expo-image with caching |
| Premium upgrade screen | Lowest risk -- mostly static layout | Verify Stripe checkout link still works after redesign |
| Maestro test maintenance | Test breakage from changed IDs (#2) | Update tests per-screen, not in bulk; preserve all testID values |

---

## Risk Matrix: Incremental vs Big-Bang for SharedKitchen

**Recommendation: Incremental (screen-by-screen), grouped by user flow.**

| Factor | Incremental | Big-Bang |
|--------|-------------|----------|
| Regression risk | LOW -- one screen at a time, easy to isolate bugs | VERY HIGH -- 14 screens changed simultaneously, impossible to isolate |
| Maestro test maintenance | MEDIUM -- fix 2-3 flows per phase | VERY HIGH -- all 25+ flows break at once |
| Real-time feature safety | HIGH -- test sync per screen | LOW -- too many moving parts to verify |
| Visual consistency during transition | MEDIUM -- temporary inconsistency between old/new screens | HIGH -- everything updates at once |
| Time to first visible progress | FAST -- ship first redesigned screen in days | SLOW -- nothing ships until everything is done |
| Rollback capability | EASY -- revert one screen | IMPOSSIBLE -- all or nothing |

Big-bang is only justified when shared components change so fundamentally that old screens cannot function. The design constraints for v7.0 explicitly preserve the tab bar, FAB, and design system tokens -- which means incremental is both viable and strongly preferred.

---

## Sources

- [React Native FlatList vs ScrollView (2025)](https://bilalshafqat.com/react-native-flatlist-vs-scrollview/)
- [Nested ScrollViews in React Native](https://dev.to/swarnaliroy94/nested-scrollviews-can-be-tricky-in-react-native-how-to-solve-4f5a)
- [React Native Nested Virtualization Anti-pattern](https://medium.com/@anisurrahmanbup/react-native-nested-virtualization-anti-pattern-performance-optimization-958e98d4ea79)
- [Box Shadows in React Native - LogRocket](https://blog.logrocket.com/applying-box-shadows-in-react-native/)
- [Zustand State Management Guide](https://dev.to/james_mugambi_494c7da2b07/mastering-state-management-in-react-native-with-zustand-a-modern-guide-1bfd)
- [Supabase Realtime Reliability Discussion](https://github.com/orgs/supabase/discussions/5641)
- [Reanimated Arc for Donut Charts](https://github.com/jayu/reanimated-arc)
- [React Native Reanimated 3 Guide (2025)](https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4)
- [Maestro React Native Support](https://docs.maestro.dev/platform-support/react-native)
- [Maestro E2E Testing Experience with React Native](https://addjam.com/blog/2026-02-18/our-experience-adding-e2e-testing-react-native-maestro/)
- [Incremental vs Big-Bang Redesigns](https://expdyn.medium.com/incremental-vs-big-bang-redesigns-evaluating-design-changes-for-users-2cb15dea05a4)
- [Strangler Fig Pattern for Mobile Apps - Martin Fowler](https://martinfowler.com/articles/strangler-fig-mobile-apps.html)
- [7 Biggest React Native Mistakes in 2025](https://nameisjayant1.medium.com/the-7-biggest-mistakes-react-native-developers-still-make-in-2025-1bcf73e48a8b)
- SharedKitchen codebase analysis: `app/(app)/(tabs)/grocery.tsx` (684 LOC, 7+ bottom sheets, camera flow), `app/(app)/(tabs)/plan.tsx` (408 LOC, real-time hooks), `.maestro/*.yaml` (25+ E2E flows with testID selectors), `src/stores/*.ts` (13 Zustand stores), `src/theme/*.ts` (design system tokens)
