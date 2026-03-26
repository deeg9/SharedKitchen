---
phase: 16-kitchen-switcher-management
plan: 01
subsystem: profile-ui
tags: [kitchen-switcher, household, profile, navigation]
dependency_graph:
  requires: []
  provides: [kitchen-switcher-ui, create-join-buttons]
  affects: [profile-page]
tech_stack:
  added: []
  patterns: [inline-list-switcher, action-row-pattern]
key_files:
  created: []
  modified:
    - app/(app)/(tabs)/profile.tsx
decisions:
  - Replaced BottomSheet household picker with always-visible inline kitchen list for better discoverability
  - Used actionRow pattern (icon + text + chevron) for Create/Join buttons consistent with existing inviteRow
metrics:
  duration: 172s
  completed: "2026-03-26T22:11:43Z"
---

# Phase 16 Plan 01: Kitchen Switcher & Action Buttons Summary

Always-visible kitchen list with active highlight replacing hidden BottomSheet picker, plus Create/Join Kitchen action buttons on profile page.

## What Was Done

### Task 1: Build kitchen switcher dropdown with active highlight and switch persistence (e72c94b)

Replaced the entire Household section with a "Your Kitchens" section containing:

- **Kitchen list**: All households rendered as Pressable rows inside a Card. Active kitchen gets `primaryFixed` background and a `check-circle` icon. Tapping a non-active kitchen calls `setActiveHousehold` which persists to AsyncStorage.
- **Active kitchen details**: Household name, member count, edit icon, members list, and invite action row displayed below the kitchen list.
- **Removed BottomSheet**: Eliminated `showHouseholdPicker` state, the `BottomSheet` component import, all BottomSheet JSX, and related styles (`sheetContent`, `sheetTitle`, `householdOption`, `activeHouseholdOption`, `householdOptionText`, `activeHouseholdOptionText`).
- **Removed swap icon**: No longer needed since kitchen list is always visible.

### Task 2: Add Create Kitchen and Join Kitchen action buttons (1be29cf)

Added two action buttons below the kitchen details section:

- **Create Kitchen**: `plus-circle-outline` icon, navigates to `/(app)/household/create`, testID `kitchen-create-button`
- **Join Kitchen**: `account-group-outline` icon, navigates to `/(app)/household/join`, testID `kitchen-join-button`
- **Empty state updated**: When no households exist, both Create and Join buttons are shown (previously only Create was available).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Verification

- TypeScript compilation: No new errors introduced (3 pre-existing errors in profile.tsx unrelated to changes: `@expo/vector-icons` module resolution, `subscription.initialize()` argument count, Supabase `.update()` type inference)
- Kitchen list renders all households with active one highlighted
- Switching kitchens calls existing `setActiveHousehold` which persists via AsyncStorage
- Create/Join buttons navigate to existing screens
- Empty state offers both Create and Join options

## Self-Check: PASSED
