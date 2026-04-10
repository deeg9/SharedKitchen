---
phase: quick-260410-k7a
plan: 01
subsystem: plan-ui
tags: [meal-card, rsvp, ui-redesign, supabase-migration]
dependency_graph:
  requires: [planStore, householdStore, authStore, Card, theme-tokens]
  provides: [meal_rsvps-table, rsvpStore, rich-DayViewMealSlot]
  affects: [plan-screen-day-view]
tech_stack:
  added: []
  patterns: [zustand-store, optimistic-update, supabase-rls, expo-image-hero]
key_files:
  created:
    - supabase/migrations/00024_create_meal_rsvps.sql
    - src/stores/rsvpStore.ts
  modified:
    - src/components/plan/DayViewMealSlot.tsx
    - app/(app)/(tabs)/plan.tsx
decisions:
  - Used `(supabase as any)` casts in rsvpStore because meal_rsvps table not yet in generated Database types
  - RSVP defaults use opt-out model (all members default to 'eating')
  - Avatar fallback uses deterministic color palette from user ID hash
  - Description from first instruction step text (existing pattern from HeroDinnerCard)
metrics:
  duration: 291s
  completed: "2026-04-10T21:44:54Z"
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 260410-k7a: Redesign DayViewMealSlot as Rich Meal Cards Summary

Rich full-width meal cards with 140px hero image, RSVP avatar toggling via new meal_rsvps Supabase table, meta pills, and View Recipe navigation for breakfast/lunch slots in plan day view.

## What Was Done

### Task 1: Create meal_rsvps migration and RSVP store (2926d9c)
- Created `meal_rsvps` table with id, meal_plan_id (FK to meal_plans), user_id (FK to auth.users), status CHECK ('eating'|'skipped'), created_at
- UNIQUE constraint on (meal_plan_id, user_id), index on meal_plan_id
- RLS policies: SELECT within household, INSERT/UPDATE own rows only (mitigates T-k7a-01, T-k7a-02, T-k7a-03)
- Zustand rsvpStore with fetchRsvps (batch), toggleRsvp (optimistic + revert), ensureDefaults (upsert with ignoreDuplicates)

### Task 2: Redesign DayViewMealSlot as rich meal card (ce999e4)
- Complete rewrite from compact 80px row to full-width card with 140px hero image
- Filled state: hero image, meal label + pencil edit icon, recipe name (titleLg), description (bodySm), meta pills (time/cost/servings), overlapping RSVP avatars with opacity toggle, ingredient count pill, centered "View Recipe" outlined pill button
- Empty state: surfaceContainerHigh placeholder with fork-knife icon, "Tap to add a recipe" italic prompt
- Notes-only state: placeholder hero + notes text as card content
- All interactions: card body -> onViewRecipe, pencil -> onEditPress (stopPropagation), avatar -> onToggleRsvp

### Task 3: Wire plan.tsx with RSVP store and new DayViewMealSlot props (ee014af)
- Import useRsvpStore and useAuthStore
- Derive householdMemberProps from householdStore members with correct shape
- Fetch RSVPs and call ensureDefaults after meal plans load
- handleViewRecipe navigates to /(app)/recipe/[id]
- Both breakfast and lunch DayViewMealSlot instances receive all new props

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript errors from missing meal_rsvps in generated types**
- **Found during:** Task 1
- **Issue:** Supabase generated Database type doesn't include meal_rsvps table yet (migration not applied to remote)
- **Fix:** Used `(supabase as any)` type casts in rsvpStore for .from('meal_rsvps') calls with explicit return type annotations
- **Files modified:** src/stores/rsvpStore.ts
- **Commit:** 2926d9c

**2. [Rule 3 - Blocking] Map iteration downlevelIteration error**
- **Found during:** Task 1
- **Issue:** `for...of` on Map requires downlevelIteration or es2015+ target
- **Fix:** Replaced with `Array.from(map.entries()).forEach()`
- **Files modified:** src/stores/rsvpStore.ts
- **Commit:** 2926d9c

## Verification

- `npx tsc --noEmit` passes (only pre-existing @expo/vector-icons declaration warning)
- All 4 files created/modified as planned
- RLS policies cover all 3 threat model mitigations (T-k7a-01, T-k7a-02, T-k7a-03)

## Known Stubs

None - all data flows are wired to real stores and Supabase queries.

## Self-Check: PASSED

All files exist. All commits verified (2926d9c, ce999e4, ee014af).
