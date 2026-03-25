---
phase: 07-real-time-presence
plan: 01
subsystem: ui
tags: [supabase-realtime, presence, react-native, react-hooks, reanimated]

# Dependency graph
requires:
  - phase: 02-core-features
    provides: "Supabase Realtime channel pattern from useGrocerySync"
provides:
  - "usePresence hook for any-screen presence tracking"
  - "PresenceAvatarStack overlapping avatar component"
  - "ActivityToast animated notification component"
  - "useActivityToast hook with grocery/meal plan subscriptions"
affects: [07-02-screen-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Supabase Presence channel with debounced sync", "Toast queue with sequential display", "Self-filtering realtime events by currentUserId"]

key-files:
  created:
    - src/hooks/usePresence.ts
    - src/hooks/useActivityToast.ts
    - src/components/presence/PresenceAvatarStack.tsx
    - src/components/presence/ActivityToast.tsx
    - tests/hooks/usePresence.test.ts
    - tests/hooks/useActivityToast.test.ts
    - tests/components/PresenceAvatarStack.test.tsx
    - tests/components/ActivityToast.test.tsx
  modified: []

key-decisions:
  - "Timer-based dismiss for ActivityToast instead of Reanimated withDelay+runOnJS for simpler testability"
  - "Separate useEffect hooks for grocery and meal plan subscriptions in useActivityToast for independent lifecycle"

patterns-established:
  - "Presence pattern: supabase.channel('presence:KEY', { config: { presence: { key: userId } } }) with .on('presence', { event: 'sync' }, cb)"
  - "Toast queue: useRef queue + useState currentToast, enqueue shifts to current when null"
  - "Self-filtering: compare payload user ID against currentUserId before enqueue"

requirements-completed: [RT-01, RT-02, RT-03, RT-04]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 07 Plan 01: Core Presence Hooks & Components Summary

**Supabase Presence hooks with 300ms debounced sync, overlapping avatar stack, and animated activity toasts with self-filtering toast queue**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T22:22:43Z
- **Completed:** 2026-03-25T22:27:00Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments
- usePresence hook connects to Supabase Presence channels, debounces sync at 300ms, filters out current user, cleans up on unmount
- PresenceAvatarStack renders overlapping avatars with "+N" overflow badge when members exceed maxVisible
- ActivityToast slides in from top with animated translateY/opacity, auto-dismisses after configurable duration
- useActivityToast subscribes to grocery_items UPDATE and meal_plans INSERT/UPDATE/DELETE, filters self-actions, manages sequential toast queue

## Task Commits

Each task was committed atomically:

1. **Task 1: usePresence hook and PresenceAvatarStack (RED)** - `7617938` (test)
2. **Task 1: usePresence hook and PresenceAvatarStack (GREEN)** - `759ecec` (feat)
3. **Task 2: ActivityToast and useActivityToast (RED)** - `d0f80bd` (test)
4. **Task 2: ActivityToast and useActivityToast (GREEN)** - `8da60f4` (feat)

## Files Created/Modified
- `src/hooks/usePresence.ts` - Generic presence hook for any screen, returns PresenceMember[]
- `src/hooks/useActivityToast.ts` - Activity subscription hook with toast queue for grocery and meal plan changes
- `src/components/presence/PresenceAvatarStack.tsx` - Overlapping avatar stack with overflow badge
- `src/components/presence/ActivityToast.tsx` - Animated slide-down toast notification with Reanimated
- `tests/hooks/usePresence.test.ts` - 7 tests: channel creation, null guards, track, cleanup, self-filter, debounce
- `tests/hooks/useActivityToast.test.ts` - 6 tests: subscriptions, self-filter, enqueue, cleanup
- `tests/components/PresenceAvatarStack.test.tsx` - 5 tests: empty, single, multi, overflow badge, custom maxVisible
- `tests/components/ActivityToast.test.tsx` - 3 tests: renders name, message, auto-dismiss

## Decisions Made
- Used timer-based dismiss (setTimeout) for ActivityToast instead of Reanimated's withDelay+runOnJS pattern, for simpler testability with fake timers
- Split grocery and meal plan subscriptions into separate useEffect hooks in useActivityToast for independent lifecycle management (each has its own channel and cleanup)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed jest.clearAllMocks ordering in usePresence tests**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** jest.clearAllMocks() was placed after mock setup in beforeEach, clearing all implementations
- **Fix:** Moved jest.clearAllMocks() to the start of beforeEach
- **Files modified:** tests/hooks/usePresence.test.ts
- **Verification:** All 12 tests pass
- **Committed in:** 759ecec (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test fix necessary for correct test execution. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 hooks and components ready for Plan 02 screen integration
- usePresence can be called from any screen with a channelKey and currentUser
- PresenceAvatarStack accepts members array from usePresence return value
- useActivityToast + ActivityToast ready to wire into app layout
- 21 tests provide coverage for all core behaviors

---
*Phase: 07-real-time-presence*
*Completed: 2026-03-25*
