---
phase: 17-data-scoping
plan: 01
subsystem: data-stores
tags: [zustand, kitchen-switch, data-scoping, multi-household]
dependency_graph:
  requires: [16-01]
  provides: [kitchen-data-sync, store-clear-methods]
  affects: [planStore, recipeStore, groceryStore, budgetStore, tab-layout]
tech_stack:
  added: []
  patterns: [zustand-getState-imperative, useRef-change-detection]
key_files:
  created:
    - src/hooks/useKitchenDataSync.ts
  modified:
    - src/stores/planStore.ts
    - src/stores/recipeStore.ts
    - src/stores/groceryStore.ts
    - src/stores/budgetStore.ts
    - app/(app)/(tabs)/_layout.tsx
decisions:
  - Used useRef to skip initial mount so tab-level useEffects handle first load
  - Used getState() for imperative store access to avoid subscribing to all stores in React
  - Fire all fetches in parallel since they are independent
metrics:
  duration: 82s
  completed: 2026-03-26
  tasks: 2
  files: 6
---

# Phase 17 Plan 01: Data Scoping Summary

Central kitchen-switch data sync hook that clears all Zustand stores and re-fetches in parallel when activeHouseholdId changes, preventing stale cross-kitchen data.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add clear() methods to all four data stores | 03e07f5 | Added `clear()` to planStore, recipeStore, groceryStore, budgetStore |
| 2 | Create useKitchenDataSync hook and wire into tab layout | 529133e | New hook + mounted in _layout.tsx |

## What Was Built

**Store clear() methods** -- Each of the 4 data stores (plan, recipe, grocery, budget) now has a `clear()` action that resets all data state to initial values without triggering fetches. This prevents stale data from the previous kitchen being visible during the re-fetch window.

**useKitchenDataSync hook** -- A central hook that:
1. Subscribes to `activeHouseholdId` from householdStore
2. Uses `useRef` to track the previous ID and skip the initial mount (each tab handles its own first load)
3. On change: clears all 4 stores immediately, then fires parallel re-fetches for plan, recipe, grocery, budget, and budget target data
4. Uses `getState()` for imperative store access so it doesn't subscribe to all store state in React

**Tab layout integration** -- The hook is invoked in `app/(app)/(tabs)/_layout.tsx`, which mounts once when entering the authenticated app and stays mounted for the entire session, ensuring the sync runs regardless of which tab is active.

## Decisions Made

1. **Skip initial mount with useRef** -- Individual tabs already handle their own initial data fetch via their own useEffects. The sync hook only fires on actual kitchen switches (ID changes after first render).
2. **Imperative getState() over React subscriptions** -- Using `usePlanStore.getState()` avoids unnecessary re-renders from subscribing to all 4 stores in the React tree. The hook only needs to read/call methods, not render based on store state.
3. **Parallel fetches** -- All 5 fetch calls fire simultaneously since they are independent. No await chaining needed.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all data flows are fully wired.

## Self-Check: PASSED

All 6 files found. Both commit hashes verified.
