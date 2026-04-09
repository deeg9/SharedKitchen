# Project Research Summary

**Project:** SharedKitchen v7.0 — Stitch UI Redesign
**Domain:** UI/UX redesign of a React Native meal planning app (14 screens)
**Researched:** 2026-04-07
**Confidence:** HIGH

## Executive Summary

The v7.0 Stitch UI Redesign is a comprehensive visual overhaul of 14 SharedKitchen screens against the "Culinary Curator" design language — not a rewrite. The existing technical stack (Expo SDK 55, React Native 0.83.2, Reanimated 4.2.1, Zustand, FlashList, etc.) is sound and requires only two new dependencies: `react-native-svg` for animated donut/ring charts and `expo-linear-gradient` for hero card overlays. The existing Zustand stores, Supabase data layer, and component architecture need only surgical additions: two stores gain three new methods, and 17 new components are built alongside 14 modified ones. The redesign is overwhelmingly a component-layer effort — not a data or infrastructure change.

The recommended approach is incremental, screen-by-screen delivery grouped by user flow dependency. Building 5 shared reusable components first (DonutChart, ProgressBar, InsightCard, FilterChips, DateStrip/ViewToggle) unblocks all dependent screens and avoids duplication. The Plan and Budget/Profile screens have the most complexity (new store methods + multiple new components); Onboarding, Recipes, Grocery, Cooking Mode, and Premium can be redesigned independently in parallel. Two features require new Supabase queries against existing tables: cooking stats (streak, completion %, most-cooked recipe) and household distribution — both are additive and non-breaking.

The primary risks are operational, not architectural. SharedKitchen's real-time sync hooks (grocery, pantry, presence) must stay at the tab-screen level during restructuring; Maestro's 25+ E2E flows must be updated per screen (not batched at the end); and the grocery screen's camera flow state machine should be extracted into a `useCameraFlow` hook before that screen is redesigned. Performance discipline — no nested FlatLists, no UI state in Zustand stores, one entrance animation per screen, all theme tokens used — prevents the most common RN redesign regressions.

---

## Key Findings

### Recommended Stack

The existing stack handles all redesign patterns without addition. Only two packages are needed: `react-native-svg` (~15.11 via `npx expo install`) for SVG ring/donut/bar charts, and `expo-linear-gradient` (~55.0.12) for hero card text-over-image overlays. Both are first-party Expo SDK packages requiring no native rebuild. Eight of ten new UI patterns need zero new dependencies — plain View with Reanimated handles progress bars, horizontal ScrollView handles date strips and avatar strips, and existing theme primitives handle callout cards, settings rows, and feature comparison tables.

Explicitly rejected: `@shopify/react-native-skia` (adds 41MB to Android APK for charts that don't need GPU rendering), `victory-native-xl` (requires Skia), `react-native-chart-kit` (unmaintained since 2021), and `react-native-circular-progress` (thin wrapper over the same SVG Circle pattern, adds a dependency for ~30 lines of code).

**Core technologies:**
- `react-native-svg ~15.11`: Animated donut ring charts, stacked bar charts — Expo SDK package, pairs with existing Reanimated 4 via `createAnimatedComponent`
- `expo-linear-gradient ~55.0.12`: Hero card gradient overlays — first-party Expo SDK, production-stable
- Existing `Reanimated 4.2.1`: All chart animations, progress bar animations, UI-thread safe
- Existing `expo-image`: Hero card backgrounds, recipe photos, avatar strips — already in use with caching

### Expected Features

The research identified 18 numbered features across 14 screens.

**Must have (table stakes) — users expect these:**
- Day/Week toggle + horizontal date strip — every major planner offers both views; week-only feels outdated
- Hero dinner card with large photo and "Start Cooking" CTA — flagship visual upgrade; core value prop
- Shopping progress bar ("12 of 18 items checked") — standard in every grocery app
- Donut ring chart for budget with month picker — visual budget tracking is a polished-app signal
- Rich recipe cards (description, difficulty badge, rating) — industry standard; current cards feel like plain lists
- Filter chips replacing dropdown FilterBar — simpler, more discoverable, standard mobile pattern
- Grouped settings with navigation rows — iOS standard; current settings feel scattered

**Should have (differentiators) — elevate the experience:**
- Soft empty states with illustrated icons — emotional design; empty slots feel inviting, not broken
- Cross-feature grocery shortcut card on Plan tab — reduces tab-switching friction; uncommon in competitors
- Budget insights cards ("You spent 15% less") — proactive intelligence; most meal planners never touch this
- Cooking insights (streak, plan completion %, most-cooked recipe) — gamification that builds habit
- Household distribution chart — social accountability for collaborative households
- Step photos + Chef's Tips in cooking mode — elevates to visual guidance
- Following avatar strip in feed — Instagram Stories-style social presence indicator
- Feature comparison table for premium upgrade — clear free-vs-premium conversion driver

**Defer (not in v7.0 scope):**
- Yearly pricing tier backend — requires new Stripe product/price creation; UI can show placeholder
- Animated page transitions between Day/Week views — over-engineering a view toggle
- Interactive donut chart with tap-to-expand segments — minimal value; category list already shows breakdown
- Per-step cooking photos for URL-imported recipes — source data rarely has per-step images

### Architecture Approach

The redesign maps onto the existing architecture as visual replacements within the existing component tree. No new routes or tabs are created. The 5 tab screens stay in place; their child components are swapped or augmented. The only store-level changes are: `planStore` gains `fetchCookingStats(householdId)` (batches 3-4 Supabase queries for cooking streak, plan completion, most-cooked recipe, and household distribution), and `budgetStore` gains `insights()` and `categoryBudgets()`. Day/Week toggle is explicitly local `useState` in plan.tsx — not store state.

**Major new shared components (build first, unblock everything else):**
1. `DonutChart` (`src/components/ui/`) — animated SVG ring; used by Budget and Profile
2. `ProgressBar` (`src/components/ui/`) — reusable animated bar; used by Budget and Grocery
3. `InsightCard` (`src/components/ui/`) — stat/insight display card; used by Budget and Profile
4. `FilterChips` (`src/components/ui/`) — horizontal scrollable pill chips; used by Recipes
5. `DateStrip` + `ViewToggle` (`src/components/plan/`) — date picker and day/week toggle; used by Plan

**Screens with zero store changes (build in parallel):**
- Recipes, Grocery, Cooking Mode, Premium Upgrade, Onboarding (all 6 steps)

**Screens requiring store additions (sequential after store work):**
- Budget (needs `budgetStore.insights()` + `categoryBudgets()`)
- Profile (needs `planStore.fetchCookingStats()`)

### Critical Pitfalls

1. **Real-time subscription teardown during restructuring** — Grocery and Plan screens host `useGrocerySync`, `usePantrySync`, `usePresence`, and `useActivityToast`. Moving hooks deeper into child components severs WebSocket connections silently. Fix: establish "hooks stay at tab-screen level" before any component extraction; validate with two-device manual test after each screen.

2. **Maestro E2E test fragility from changed element hierarchy** — 25+ Maestro YAML flows reference `testID` attributes that vanish when components are restructured. Failures cascade. Fix: grep Maestro flows for each screen's testID values before redesigning; preserve all existing `testID` props; update flows per-screen, never in a batch.

3. **Nested FlatList / ScrollView virtualization breakage** — Stitch layouts naively implemented as FlatList-inside-ScrollView disable virtualization, causing 2-3 second mount delays with 50+ recipes. Fix: always use FlatList `ListHeaderComponent` for headers, date strips, and filter chips; never nest FlatList inside ScrollView.

4. **Camera flow regression on grocery screen** — The grocery screen has a multi-step camera state machine spread across 684 LOC. Restructuring JSX disconnects state variables from conditional renders. Fix: extract `useCameraFlow` hook before redesigning grocery.

5. **Zustand store bloat from UI-only state** — View toggles and selected chips in Zustand stores cause unnecessary re-renders in every subscribing component. Fix: UI state that resets on navigation belongs in `useState`. The Day/Week toggle is the canonical example.

---

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and the complexity analysis from FEATURES.md, the natural structure is 4 phases:

### Phase 1: Foundation — Shared Components + Independent Screen Redesigns

**Rationale:** Five reusable components appear in 2+ screens each. Building them first eliminates duplication. Pairing with low-risk independent screens (Onboarding, Recipes, Grocery, Cooking Mode, Premium) delivers visible shipped screens early while harder screens are still being set up.

**Delivers:** DonutChart, ProgressBar, InsightCard, FilterChips, DateStrip/ViewToggle — plus fully redesigned Onboarding (6 screens), Recipes library, Grocery list, Cooking Mode, and Premium Upgrade screen.

**Addresses:** Features 6, 7, 8, 9, 14 (partial), 16, 17, 18

**Avoids:** Pitfall 4 (establish ListHeaderComponent pattern on Recipes + Grocery first), Pitfall 7 (extract useCameraFlow hook before Grocery redesign), Pitfall 8 (get highest-traffic independent screens shipped early)

**Research flag:** Standard patterns — skip phase research. All patterns thoroughly documented.

---

### Phase 2: Plan Tab Redesign

**Rationale:** The Plan tab is the highest-traffic screen and the redesign's flagship. It benefits from DateStrip and ViewToggle being built in Phase 1. Despite having no store changes, it has the most new sub-components of any single screen and needs its own dedicated phase.

**Delivers:** Fully redesigned Plan tab with Day/Week toggle, horizontal date strip, hero dinner card with Start Cooking CTA, illustrated empty states, and cross-feature grocery shortcut card.

**Addresses:** Features 1, 2, 3, 4, 4a, 5

**Avoids:** Pitfall 1 (social feed subscriptions in plan.tsx stay at screen level), Pitfall 3 (hero card interactions vs existing PlanEditSheet gesture conflicts), Pitfall 4 (date strip in ListHeaderComponent)

**Research flag:** Standard patterns — skip phase research.

---

### Phase 3: Budget + Profile (Store-Enhanced Screens)

**Rationale:** Both screens require new Supabase queries and store methods. Budget needs `budgetStore.insights()` and `categoryBudgets()`; Profile needs `planStore.fetchCookingStats()`. These are the only phases with new backend-touching code. Both share DonutChart and InsightCard from Phase 1.

**Delivers:** Budget dashboard with donut ring hero, budget insights cards, monthly navigation, and category progress bars. Profile with cooking streak, plan completion ring, most-cooked recipe, household distribution chart, and grouped settings.

**Addresses:** Features 10, 11, 12, 13, 14, 15

**Avoids:** Pitfall 5 (all insight computation derived/cached, not per-render), Pitfall 9 (donut ring animates once on mount only), Pitfall 10 (all colors from theme tokens)

**Research flag:** Needs research on Supabase query patterns for consecutive-day streak computation and whether batched queries vs RPC functions are preferable. Flag for `/gsd-research-phase` on Phase 3.

---

### Phase 4: Social Feed + Cross-App Polish

**Rationale:** Social Feed is lower-traffic and depends only on FollowingStrip plus existing socialStore data. This phase also serves as a cross-app polish pass: dark mode validation, skeleton loading state parity, Maestro test audit, and visual effects review.

**Delivers:** Social Feed with following avatar strip, hero-sized photos, and "Try this recipe" CTAs. Plus cross-app polish: dark mode audit, skeleton states, comprehensive Maestro test update, shadow/gradient effects review.

**Addresses:** Feature 17; cross-cutting quality concerns from all prior phases

**Avoids:** Pitfall 2 (comprehensive Maestro flow update pass), Pitfall 6 (audit all shadow/gradient/blur usage), Pitfall 11 (verify skeleton state parity across redesigned screens)

**Research flag:** Standard patterns — skip phase research.

---

### Phase Ordering Rationale

- Shared components before screens — DonutChart and ProgressBar appear in Budget, Grocery, and Profile; building once beats building three times
- Independent screens in Phase 1 (not last) — delivers visible progress early; validates design system approach before high-stakes Plan screen
- Plan before Budget/Profile — Plan has no store dependencies and ships sooner
- Budget and Profile together — both need store additions and share Phase 1 components
- Social last — lowest architectural risk; natural place for polish pass
- Never big-bang — incremental approach strongly supported by pitfalls research; real-time sync, Maestro tests, and camera flows are all easier to validate one screen at a time

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Budget + Profile):** `planStore.fetchCookingStats()` consecutive-day streak logic; Supabase batch query vs RPC function tradeoffs for multiple aggregation queries in one call.

Phases with standard patterns (skip `/gsd-research-phase`):
- **Phase 1:** Shared component patterns (DonutChart, ProgressBar, FilterChips) are thoroughly documented with working code examples
- **Phase 2:** Plan tab redesign uses only FlatList, ScrollView, and Reanimated patterns already in the codebase
- **Phase 4:** Social feed hero photos and avatar strip follow existing expo-image and FlatList patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Both new packages are Expo SDK first-party. Integration patterns verified against SDK 55 docs and Reanimated 4 documentation. Rejections backed by bundle size data. |
| Features | HIGH | Sourced from direct inspection of 14 Stitch design screenshots + existing codebase component and store analysis. |
| Architecture | HIGH | Based on direct codebase analysis of all 13 Zustand stores, 5 tab screens, and 22 component directories. File paths and method names are accurate. |
| Pitfalls | HIGH | Critical pitfalls verified against specific SharedKitchen files (grocery.tsx 684 LOC, plan.tsx 408 LOC, .maestro/ YAML). Not generic advice. |

**Overall confidence:** HIGH

### Gaps to Address

- **Yearly pricing tier:** Premium Upgrade UI can show monthly/yearly tiers, but the Stripe `price_id` for yearly doesn't exist yet. Needs backend coordination flagged in Phase 1 planning.
- **Chef's Tips data source:** Whether Gemini extraction can reliably populate per-step `tip` fields for AI-imported recipes is unvalidated. Build with graceful degradation (tip only shown when data present).
- **Budget category allocation strategy:** `categoryBudgets()` requires a product decision on whether to use a fixed split (e.g., 60/25/15) or make it user-configurable. Resolve in Phase 3 planning.
- **Cooking streak baseline date:** The streak computation needs a defined start date (app install, first meal planned, account creation). Clarify before implementing `fetchCookingStats`.

---

## Sources

### Primary (HIGH confidence)
- SharedKitchen codebase — direct analysis of all stores, tab screens, component directories, Maestro flows, and theme files
- Stitch UI design screenshots — `/Users/deeg/Downloads/SharedKitchenStitchUIv2/` (14 screens)
- [Expo SDK SVG docs](https://docs.expo.dev/versions/latest/sdk/svg/) — react-native-svg ~15.11 for SDK 55
- [Expo LinearGradient docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) — expo-linear-gradient ~55.0.12 for SDK 55

### Secondary (MEDIUM confidence)
- [Animated donut chart with SVG + Reanimated](https://dev.to/dimaportenko/react-native-animated-donut-pie-chart-reanimated-svg-32od) — Circle + strokeDashoffset pattern
- [React Native FlatList vs ScrollView (2025)](https://bilalshafqat.com/react-native-flatlist-vs-scrollview/) — nested virtualization pitfall documentation
- [Maestro E2E Testing with React Native](https://addjam.com/blog/2026-02-18/our-experience-adding-e2e-testing-react-native-maestro/) — testID fragility patterns
- [React Native Skia bundle size](https://shopify.github.io/react-native-skia/docs/getting-started/bundle-size/) — 6MB iOS / 41MB Android rejection data
- [Best Meal Planning Apps 2026](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/) — feature benchmark

### Tertiary (LOW confidence)
- [Incremental vs Big-Bang Redesigns](https://expdyn.medium.com/incremental-vs-big-bang-redesigns-evaluating-design-changes-for-users-2cb15dea05a4) — supports incremental approach
- [Supabase Realtime Reliability Discussion](https://github.com/orgs/supabase/discussions/5641) — real-time teardown risk context

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
