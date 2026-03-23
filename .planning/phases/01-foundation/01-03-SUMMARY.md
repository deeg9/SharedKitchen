---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [design-system, md3, glassmorphism, expo-blur, bottom-sheet, skeleton, tab-bar, profile, react-native]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Expo project with auth, Supabase client, auth store, tab navigation, constants
provides:
  - Culinary Curator design system tokens (colors, typography, spacing, shadows)
  - 7 reusable UI components (Button, Card, Input, Avatar, BottomSheet, Skeleton, TabBar)
  - Custom glassmorphic 5-tab bottom navigation with active state gradient pill
  - Profile screen with user info, household display, member list, and sign-out
  - Edit profile screen with avatar picker and name editing
  - Skeleton loading states for future screens
  - BottomSheet wrapper for modals
affects: [02-01, 02-02, 02-03, 03-01, 03-02, 04-01]

# Tech tracking
tech-stack:
  added: [expo-blur, expo-image-picker]
  patterns: [Design token imports from src/theme/, no hardcoded hex values in components, tonal layering with surface container tiers, glassmorphic blur via BlurView, ambient shadows over drop shadows]

key-files:
  created: [src/theme/colors.ts, src/theme/typography.ts, src/theme/spacing.ts, src/theme/shadows.ts, src/theme/index.ts, src/components/ui/Button.tsx, src/components/ui/Card.tsx, src/components/ui/Input.tsx, src/components/ui/Avatar.tsx, src/components/ui/BottomSheet.tsx, src/components/ui/Skeleton.tsx, src/components/ui/TabBar.tsx, app/(app)/edit-profile.tsx, tests/theme.test.ts, tests/components/BottomSheet.test.tsx, tests/components/Skeleton.test.tsx, tests/components/TabBar.test.tsx, tests/screens/profile.test.tsx]
  modified: [app/(app)/(tabs)/_layout.tsx, app/(app)/(tabs)/profile.tsx, jest.config.js, tests/setup.tsx, package.json]

key-decisions:
  - "Renamed tests/setup.ts to tests/setup.tsx to support JSX in global mocks"
  - "Added moduleNameMapper for @expo/vector-icons (nested in expo node_modules)"
  - "Inline member list fallback in profile since Plan 02 MemberList component not yet available"
  - "Shimmer animation uses opacity-based approach with Reanimated useSharedValue for lightweight implementation"

patterns-established:
  - "All colors imported from src/theme/colors.ts - no hardcoded hex in components"
  - "UI components in src/components/ui/ with theme token imports"
  - "Skeleton loading states with Skeleton.Text, Skeleton.Circle, Skeleton.Card convenience variants"
  - "BottomSheet wrapper for all modal-like interactions"
  - "Custom TabBar with BlurView glassmorphic background"
  - "Profile screen pattern: avatar + name + email header, household card section, sign-out at bottom"

requirements-completed: [DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, PROF-01, PROF-06]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 1 Plan 03: Design System and UI Components Summary

**MD3 Culinary Curator design tokens with 7 reusable components, glassmorphic 5-tab navigation, and full profile screen with avatar edit and sign-out**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T16:34:54Z
- **Completed:** 2026-03-23T16:41:49Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Complete MD3 color token system (40+ tokens), typography presets (11), spacing scale, and ambient shadow presets centralized in src/theme/
- 7 reusable UI components: Button (4 variants), Card (3 variants), Input (focus/error states), Avatar (image/initials fallback), BottomSheet (gorhom wrapper with drag handle), Skeleton (shimmer with convenience variants), TabBar (glassmorphic blur with active gradient pill)
- Profile screen showing user avatar, display name, email, household info with member list, household switcher bottom sheet, and sign-out
- Edit profile screen with expo-image-picker avatar selection and Supabase Storage upload
- 28 new tests (49 total across all suites) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create design system tokens and reusable UI components** - `46085c8` (feat)
2. **Task 2: Build glassmorphic tab bar, update tab layout, create profile screen** - `9e0de12` (feat)

## Files Created/Modified
- `src/theme/colors.ts` - MD3 color token map (40+ tokens, primary #334537, secondary #904d00)
- `src/theme/typography.ts` - Font families (Plus Jakarta Sans + Inter) and 11 text style presets
- `src/theme/spacing.ts` - 8px grid spacing scale and border radius scale
- `src/theme/shadows.ts` - Ambient shadow presets (editorial, float, tabBar)
- `src/theme/index.ts` - Barrel export for all theme tokens
- `src/components/ui/Button.tsx` - Primary/secondary/tertiary/ghost button with loading state
- `src/components/ui/Card.tsx` - Elevated/filled/outlined card with tonal layering
- `src/components/ui/Input.tsx` - Ghost border input with focus/error states and label
- `src/components/ui/Avatar.tsx` - Circular avatar with image or initials fallback
- `src/components/ui/BottomSheet.tsx` - Gorhom bottom sheet wrapper with drag handle and backdrop
- `src/components/ui/Skeleton.tsx` - Shimmer loading placeholder with Text/Circle/Card variants
- `src/components/ui/TabBar.tsx` - Glassmorphic tab bar with BlurView, active gradient pill, 5 tabs
- `app/(app)/(tabs)/_layout.tsx` - Updated to use custom TabBar component
- `app/(app)/(tabs)/profile.tsx` - Full profile screen with household info and sign-out
- `app/(app)/edit-profile.tsx` - Edit profile with avatar picker and name editing
- `tests/theme.test.ts` - Design token verification tests
- `tests/components/BottomSheet.test.tsx` - BottomSheet render and drag handle tests
- `tests/components/Skeleton.test.tsx` - Skeleton dimension and variant tests
- `tests/components/TabBar.test.tsx` - Tab rendering, icons, navigation tests
- `tests/screens/profile.test.tsx` - Profile screen content and button tests
- `jest.config.js` - Added moduleNameMapper for @expo/vector-icons
- `tests/setup.tsx` - Renamed from .ts, added mocks for vector-icons, expo-blur, image-picker, safe-area

## Decisions Made
- Renamed tests/setup.ts to tests/setup.tsx: JSX syntax needed in global test mocks for @expo/vector-icons and expo-blur
- Added moduleNameMapper for @expo/vector-icons: module nested inside expo's node_modules, not at top level
- Inline member list in profile: MemberList component from Plan 02 not yet built (both plans in Wave 2), used inline fallback with TODO comment
- Opacity-based shimmer for Skeleton: lightweight Reanimated approach using useSharedValue instead of translating gradient overlay

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed expo-blur and expo-image-picker**
- **Found during:** Task 1
- **Issue:** expo-blur and expo-image-picker not in package.json but required by TabBar and edit-profile
- **Fix:** Ran `npx expo install expo-blur expo-image-picker`
- **Files modified:** package.json, package-lock.json
- **Verification:** Imports resolve, tests pass
- **Committed in:** 46085c8 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Skeleton test assertions for array styles**
- **Found during:** Task 1
- **Issue:** Skeleton component uses `[{...baseStyle}, style]` array pattern; tests used `toEqual(expect.objectContaining(...))` which doesn't work on arrays
- **Fix:** Added `flattenStyle` helper in tests to merge style arrays before assertions
- **Files modified:** tests/components/Skeleton.test.tsx
- **Verification:** All 4 Skeleton tests pass
- **Committed in:** 46085c8 (Task 1 commit)

**3. [Rule 3 - Blocking] Renamed setup.ts to setup.tsx and added global mocks**
- **Found during:** Task 2
- **Issue:** JSX in jest.mock callbacks inside setup.ts caused Babel parse error (`.ts` files don't support JSX)
- **Fix:** Renamed to setup.tsx, updated jest.config.js reference, added global mocks for @expo/vector-icons, expo-blur, expo-image-picker, react-native-safe-area-context
- **Files modified:** tests/setup.tsx, jest.config.js
- **Verification:** All 49 tests pass
- **Committed in:** 9e0de12 (Task 2 commit)

**4. [Rule 3 - Blocking] Added moduleNameMapper for @expo/vector-icons**
- **Found during:** Task 2
- **Issue:** @expo/vector-icons installed inside expo/node_modules (not at top level), Jest cannot resolve it
- **Fix:** Added moduleNameMapper in jest.config.js to map to correct nested path
- **Files modified:** jest.config.js
- **Verification:** TabBar tests resolve the module and pass
- **Committed in:** 9e0de12 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for correct test infrastructure and dependency resolution. No scope creep.

## Issues Encountered
- @expo/vector-icons installed as transitive dependency of expo, not at top-level node_modules -- required both moduleNameMapper and global mock

## Next Phase Readiness
- Design system tokens ready for all future screens
- 7 reusable UI components available for consistent styling
- TabBar navigation fully functional with 5 tabs
- Profile screen complete with sign-out flow
- Skeleton and BottomSheet patterns established for loading states and modals
- TODO: Integrate MemberList component from Plan 02 into profile screen when available

## Self-Check: PASSED

All 20 key files verified present. Both task commits (46085c8, 9e0de12) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-23*
