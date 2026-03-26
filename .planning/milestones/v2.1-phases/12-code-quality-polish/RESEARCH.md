# Phase 12: Code Quality Polish - Research

**Researched:** 2026-03-25
**Domain:** TypeScript / React Native / Zustand error handling / React error boundaries
**Confidence:** HIGH

## Summary

This phase addresses five concrete code quality improvements: replacing `console.error` in stores, eliminating `as any` casts, removing unused imports, adding a React error boundary, and improving the grocery screen empty state. All five are well-scoped, low-risk changes.

The codebase already has a consistent error handling pattern in most stores (`set({ error: error.message })` in catch blocks). The 5 `console.error` calls in stores are outliers that silently swallow errors instead of surfacing them to the UI. The 6 `as any` casts are each fixable with proper types. The grocery screen already has an inline empty state for "no list yet" but QUAL-05 asks for a reusable empty state component.

**Primary recommendation:** Fix the 5 console.error calls to use the store's existing `error` state pattern, replace 6 `as any` casts with proper types, add a class-based ErrorBoundary component wrapping the root layout, and extract a reusable EmptyState component for the grocery screen.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | Console.error calls in stores replaced with proper error handling | 5 exact locations identified in 3 store files; existing `set({ error })` pattern documented |
| QUAL-02 | All `as any` casts replaced with proper types | 6 exact locations identified across 4 files; proper types determined for each |
| QUAL-03 | Unused imports removed across codebase | TypeScript compiler output shows module resolution errors (not unused imports); grep/manual scan needed |
| QUAL-04 | React error boundary wraps main app layout | No existing ErrorBoundary found; root layout at `app/_layout.tsx` identified as wrap point |
| QUAL-05 | Empty state component on grocery screen | Inline empty state exists at lines 151-176 and 227-233 of `grocery.tsx`; no reusable EmptyState component in design system |
</phase_requirements>

## Architecture Patterns

### QUAL-01: Console.error Replacement

**Existing pattern (good -- already used in most stores):**
```typescript
// In catch blocks, stores set error state instead of console.error
} catch (error: any) {
  set({ loading: false, error: error.message ?? 'Failed to do X' });
}
```

**5 locations to fix:**

| # | File | Line | Current Code | Fix |
|---|------|------|-------------|-----|
| 1 | `src/stores/householdStore.ts` | 59 | `console.error('Failed to initialize household store:', error)` | Add `set({ error: error instanceof Error ? error.message : 'Failed to initialize' })` |
| 2 | `src/stores/householdStore.ts` | 228 | `console.error('Failed to fetch members:', error)` | Add `set({ error: error instanceof Error ? error.message : 'Failed to fetch members' })` |
| 3 | `src/stores/subscriptionStore.ts` | 58 | `console.error('Error fetching subscription:', error)` | Already sets `status: 'free'`; add error state or keep silent (subscription failure is non-critical) |
| 4 | `src/stores/onboardingStore.ts` | 51 | `console.error('Failed to persist onboarding completion:', error)` | Non-critical (comment says "still mark as completed"); consider light logging service or just remove |
| 5 | `src/stores/onboardingStore.ts` | 62 | `console.error('Failed to check onboarding status:', error)` | Same as above -- non-critical init |

**Key insight:** The `onboardingStore` and `subscriptionStore` don't have an `error` field in their state (they're simpler stores). For these, the fix is either: (a) add an `error` field, or (b) simply remove the `console.error` since these are non-critical operations with graceful fallbacks already in place. Option (b) is recommended -- these stores already degrade gracefully.

For `householdStore`, it already has `error: string | null` in state, so the fix is to `set({ error: ... })` alongside the existing `console.error` removal.

### QUAL-02: `as any` Cast Replacements

**6 locations found:**

| # | File | Line | Cast | Proper Type |
|---|------|------|------|-------------|
| 1 | `src/lib/ai.ts` | 109 | `(error as any).context?.status === 429` | Type the error: `(error as { context?: { status?: number } }).context?.status` or extract a `SupabaseFunctionError` interface |
| 2 | `src/lib/ai.ts` | 171 | `(error as any).context?.status === 429` | Same as #1 -- define once, use twice |
| 3 | `src/hooks/useGrocerySync.ts` | 62 | `(payload.old as any).id` | `(payload.old as { id: string }).id` -- Supabase Realtime DELETE payload's `old` is `{ [key: string]: unknown }` |
| 4 | `src/hooks/usePresence.ts` | 48 | `(presences as any[])` | Type as the presence payload shape: `(presences as { user_id: string; display_name: string; avatar_url: string \| null }[])` |
| 5 | `src/components/ui/Skeleton.tsx` | 44 | `width: width as any` | Change View style type: `width` accepts `DimensionValue` (number \| string \| undefined) in React Native. Cast to `DimensionValue` or use a type assertion `width as DimensionValue` (import from react-native) |
| 6 | `src/components/plan/PlanEditSheet.tsx` | 145 | `name={config.icon as any}` | The `MEAL_TYPE_CONFIG` defines `icon: string` but `MaterialCommunityIcons` `name` prop expects its union type. Fix: change `MEAL_TYPE_CONFIG` icon type to `ComponentProps<typeof MaterialCommunityIcons>['name']` |

**Additionally:** 26 `catch (error: any)` blocks across all stores. These are the main source of `as any`. The fix is to type as `catch (error: unknown)` and use a helper function:

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
```

This helper replaces all `error.message` accesses in catch blocks. This is a large but mechanical change across 8 store files.

### QUAL-03: Unused Imports

The TypeScript compiler (`tsc --noEmit`) output shows mostly `@expo/vector-icons` module resolution errors (missing type declarations), not unused imports. Unused import detection requires either:
- ESLint with `no-unused-imports` rule
- TypeScript compiler with `noUnusedLocals: true` in tsconfig

**Recommended approach:** Run a targeted scan. The codebase is small enough that a store-by-store and component-by-component review during implementation is feasible. Focus on files being touched for QUAL-01 and QUAL-02 first.

### QUAL-04: Error Boundary

**No existing ErrorBoundary found.** The `react-error-boundary` package is NOT installed.

**Two options:**
1. **Class component (zero dependencies):** Write a simple React class component with `componentDidCatch`. ~40 lines.
2. **`react-error-boundary` package:** Community standard with `useErrorBoundary` hook, retry, reset.

**Recommendation:** Use a hand-written class component. This is a simple case (one boundary at root), and adding a dependency for 40 lines of code is unnecessary. Expo/React Native class error boundaries work fine.

**Wrap point:** `app/_layout.tsx` line 127-133. Wrap around `<Slot />` inside the providers:

```typescript
<StripeProvider ...>
  <ColorSchemeProvider>
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
    <PermissionPrompt ... />
  </ColorSchemeProvider>
</StripeProvider>
```

**Fallback UI should include:**
- App icon or branded header
- "Something went wrong" message
- "Try Again" button that calls `this.setState({ hasError: false })` to attempt recovery
- Styled using the existing theme tokens

### QUAL-05: Empty State Component

**Current state of grocery screen:**
- Lines 151-176: When `!activeListId && items.length === 0` -- shows icon + "No grocery list yet" + generate button. This is an inline implementation.
- Lines 227-233: When `items.length === 0` inside the scroll view -- shows "No items in your list. Tap + to add items manually."

**No reusable EmptyState component exists** in `src/components/ui/`.

**Recommendation:** Create `src/components/ui/EmptyState.tsx` with:
- Icon prop (MaterialCommunityIcons name)
- Title prop
- Subtitle prop
- Optional action button (label + onPress)
- Styled consistently with theme tokens

Then refactor the grocery screen's inline empty states to use this component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error message extraction from unknown | Custom logic in each catch | Shared `getErrorMessage(error: unknown)` utility | DRY; consistent behavior across 26+ catch blocks |
| Icon name typing for MaterialCommunityIcons | String literals everywhere | `ComponentProps<typeof MaterialCommunityIcons>['name']` | Type-safe icon names from the library |

## Common Pitfalls

### Pitfall 1: Breaking catch blocks with `error: unknown`
**What goes wrong:** Changing `catch (error: any)` to `catch (error: unknown)` breaks all `error.message` accesses.
**Why it happens:** `unknown` requires type narrowing before property access.
**How to avoid:** Create the `getErrorMessage` utility FIRST, then do the mechanical replacement. Test each store after changing.
**Warning signs:** TypeScript errors on `error.message` lines.

### Pitfall 2: Error boundary not catching async errors
**What goes wrong:** Error boundaries only catch errors during rendering, not in event handlers or async code.
**Why it happens:** React error boundaries use `componentDidCatch` which only fires for render-phase errors.
**How to avoid:** The boundary catches component crashes. Store errors are already handled by the `error` state field. Document this distinction.
**Warning signs:** Expecting the boundary to catch Supabase API failures.

### Pitfall 3: Supabase Realtime DELETE payload typing
**What goes wrong:** The `payload.old` on DELETE events from Supabase Realtime has type `{ [key: string]: unknown }` -- it only contains columns in the replica identity (usually just `id`).
**Why it happens:** PostgreSQL REPLICA IDENTITY default only sends the primary key on DELETE.
**How to avoid:** Type as `{ id: string }` which is accurate. Don't try to type it as the full row.

### Pitfall 4: DimensionValue import location
**What goes wrong:** `DimensionValue` type might not be available in older React Native types.
**How to avoid:** Import from `react-native`: `import { DimensionValue } from 'react-native'`. If not available, use `number | string` union directly.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 with jest-expo preset |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=<file> --no-coverage` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | Store error handling sets error state instead of console.error | unit | `npx jest tests/stores/ --no-coverage` | Partial (groceryStore.test.ts, household.test.ts exist) |
| QUAL-02 | No `as any` casts remain | static analysis | `grep -r "as any" src/ --include="*.ts" --include="*.tsx"` | N/A (grep check) |
| QUAL-03 | No unused imports | static analysis | `npx tsc --noEmit --noUnusedLocals 2>&1 \| grep "declared but"` | N/A (compiler check) |
| QUAL-04 | ErrorBoundary renders fallback on error | unit | `npx jest tests/components/ErrorBoundary.test.tsx --no-coverage` | No -- Wave 0 |
| QUAL-05 | EmptyState component renders correctly | unit | `npx jest tests/components/EmptyState.test.tsx --no-coverage` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=<changed-area> --no-coverage`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green + `grep -r "as any" src/` returns 0 results + `grep -r "console.error" src/stores/` returns 0 results

### Wave 0 Gaps
- [ ] `tests/components/ErrorBoundary.test.tsx` -- covers QUAL-04
- [ ] `tests/components/EmptyState.test.tsx` -- covers QUAL-05

## Code Examples

### Error message utility function
```typescript
// src/lib/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
```

### Class-based ErrorBoundary
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Could send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>The app encountered an unexpected error.</Text>
          <Pressable
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
```

### Reusable EmptyState component
```typescript
// src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, loading, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.outlineVariant} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} loading={loading} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
```

### SupabaseFunctionError type for ai.ts
```typescript
// Type for Supabase function invoke errors that include context
interface SupabaseFunctionError extends Error {
  context?: { status?: number };
}
```

## Inventory of All Changes

### Files to modify (complete list)

| File | Changes | Req |
|------|---------|-----|
| `src/stores/householdStore.ts` | Lines 59, 228: replace console.error with set({ error }); lines 109, 160, 211, 227: `catch (error: any)` -> `catch (error: unknown)` + getErrorMessage | QUAL-01, QUAL-02 |
| `src/stores/onboardingStore.ts` | Lines 51, 62: remove console.error (graceful fallback already exists) | QUAL-01 |
| `src/stores/subscriptionStore.ts` | Line 58: remove console.error (fallback to 'free' already exists) | QUAL-01 |
| `src/stores/planStore.ts` | Lines 77, 153, 195, 212: `catch (error: any)` -> `catch (error: unknown)` + getErrorMessage | QUAL-02 |
| `src/stores/recipeStore.ts` | Lines 116, 138, 164, 183, 222, 275, 308, 326, 342: same pattern | QUAL-02 |
| `src/stores/groceryStore.ts` | Lines 143, 180, 246: same pattern | QUAL-02 |
| `src/stores/leftoverStore.ts` | Lines 103, 141: same pattern | QUAL-02 |
| `src/stores/budgetStore.ts` | Lines 195, 230, 254, 277: same pattern | QUAL-02 |
| `src/lib/ai.ts` | Lines 109, 171: replace `(error as any).context?.status` with typed interface | QUAL-02 |
| `src/hooks/useGrocerySync.ts` | Line 62: `(payload.old as any).id` -> `(payload.old as { id: string }).id` | QUAL-02 |
| `src/hooks/usePresence.ts` | Line 48: `(presences as any[])` -> typed presence array | QUAL-02 |
| `src/components/ui/Skeleton.tsx` | Line 44: `width as any` -> `width as DimensionValue` | QUAL-02 |
| `src/components/plan/PlanEditSheet.tsx` | Line 145: `config.icon as any` -> fix MEAL_TYPE_CONFIG type or use typed cast | QUAL-02 |
| `src/types/database.ts` | Line 19: change MEAL_TYPE_CONFIG icon type from `string` to MaterialCommunityIcons name type | QUAL-02 |
| `app/_layout.tsx` | Wrap `<Slot />` with ErrorBoundary | QUAL-04 |
| `app/(app)/(tabs)/grocery.tsx` | Refactor inline empty states to use EmptyState component | QUAL-05 |

### Files to create

| File | Purpose | Req |
|------|---------|-----|
| `src/lib/errors.ts` | `getErrorMessage()` utility | QUAL-01, QUAL-02 |
| `src/components/ErrorBoundary.tsx` | Root error boundary component | QUAL-04 |
| `src/components/ui/EmptyState.tsx` | Reusable empty state component | QUAL-05 |

## Sources

### Primary (HIGH confidence)
- Direct codebase scan: grep for `console.error`, `as any`, ErrorBoundary, empty state patterns
- TypeScript compiler output (`tsc --noEmit`) for type error inventory
- React documentation on error boundaries (stable API since React 16)

### Secondary (MEDIUM confidence)
- Supabase Realtime payload types (DELETE `old` field shape) -- based on Supabase docs and codebase usage

## Metadata

**Confidence breakdown:**
- Console.error locations: HIGH -- exhaustive grep, all 5 found
- `as any` locations: HIGH -- exhaustive grep, all 6 found
- `catch (error: any)` locations: HIGH -- exhaustive grep, all 26 found
- Error boundary approach: HIGH -- standard React pattern
- Empty state component: HIGH -- straightforward UI component

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable patterns, no moving targets)
