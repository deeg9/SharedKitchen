# Phase 39: Shared Components & Dependencies - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build 5 reusable UI components (DonutChart, ProgressBar, InsightCard, FilterChips, DateStrip) and install 2 new npm dependencies (react-native-svg, expo-linear-gradient). These components are shared primitives that unblock all subsequent phases (40-43). No screen-level changes — components only.

</domain>

<decisions>
## Implementation Decisions

### Component Architecture
- Components live in `src/components/ui/` alongside existing Card, Button, Avatar, Skeleton
- DonutChart animates on mount AND re-animates smoothly on value change using Reanimated `withTiming`
- ProgressBar uses animated View width (not SVG) — simpler and more performant for linear bars
- Components use theme tokens directly — no custom color/style override props (matches existing Card/Button pattern)

### DonutChart & DateStrip Design
- DonutChart: 160x160 size, 12px stroke width — matches Stitch budget ring proportions
- DonutChart label: center-aligned with large dollar amount, "of $X spent" subtitle, percentage badge
- DateStrip: 5 days visible (Mon-Fri), scrollable for weekends — matches Stitch design
- DateStrip today indicator: filled circle with primary color behind date number

### FilterChips & InsightCard Behavior
- FilterChips: single-select with "All" as default chip
- FilterChips selection: primary background + onPrimary text (matches segmented control active state)
- InsightCard icon: circular tinted background (primaryFixed) with MaterialCommunityIcons
- InsightCard badge: right side of card with secondary color text

### Claude's Discretion
- Animation duration/easing curves
- Exact component prop interfaces (within the patterns above)
- Internal implementation details (SVG path calculations, scroll behavior)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card.tsx` — pattern for variant-based components with StyleSheet + theme tokens
- `Button.tsx` — pattern for interactive components with press states
- `Skeleton.tsx` — pattern for loading placeholder components
- `react-native-reanimated 4.2.1` — already installed, used extensively for animations
- `@shopify/flash-list` — available for horizontal scrolling lists

### Established Patterns
- Functional components with TypeScript interfaces
- StyleSheet.create() for styles (never inline objects)
- Theme tokens imported from `src/theme/{colors,typography,spacing,shadows}.ts`
- No default exports — named exports only
- Props interfaces defined above component

### Integration Points
- New components imported from `src/components/ui/` by screen-level components
- DonutChart used by: Budget dashboard (Phase 43), Profile cooking insights (Phase 43)
- ProgressBar used by: Grocery shopping progress (Phase 42), Budget category bars (Phase 43)
- InsightCard used by: Budget insights (Phase 43), Profile insights (Phase 43)
- FilterChips used by: Recipe library (Phase 40)
- DateStrip used by: Plan tab (Phase 41)

</code_context>

<specifics>
## Specific Ideas

- Stitch reference designs at `/Users/deeg/Downloads/SharedKitchenStitchUIv2/` for visual reference
- Design constraints doc in memory: `project_stitch_design_constraints.md`
- DonutChart should accept generic props (value, max, label, sublabel) — not budget-specific
- ProgressBar should accept generic props (value, max) — not grocery-specific

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
