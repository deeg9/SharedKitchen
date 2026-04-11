# Phase 44: Handle System & Identity Foundation - Research

**Researched:** 2026-04-10
**Domain:** React Native (Expo) + Supabase identity, form validation, navigation gating
**Confidence:** HIGH

## Summary

Phase 44 adds a unique @handle to every user's profile. Plan 44-01 (DB migration, handle-utils, authStore) is already complete with 29 passing tests, a NULLABLE handle column with case-insensitive unique index, and validation utilities. The remaining work is Plans 44-02 (HandleInput component, onboarding step, blocking interstitial) and 44-03 (display @handle across feed, comments, profiles).

The codebase is a React Native Expo Router app using Zustand stores, Supabase as the backend, and a Material Design 3 theme system. The existing onboarding flow is step-based (0-5) and needs extending to 7 steps (0-6) with handle setup at step 1. The blocking interstitial for existing users requires a navigation gate in the root `_layout.tsx` that checks `authStore.handleChecked` and `authStore.handle` after session initialization. The feed card component (`FeedCard.tsx`) accepts a `kitchenProfile` prop with `display_name` and `avatar_url` -- this interface needs extending to include `handle`.

**Primary recommendation:** Build HandleInput as a reusable controlled component that wraps validation + debounced availability checking, then compose it into both the onboarding step and the interstitial. For Plan 44-03, modify the `kitchenProfile` prop interface on FeedCard and the member display on the profile screen to include handle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Lowercase alphanumeric + underscores only, 3-20 characters
- "@" prefix is display-only -- stored without it in `profiles.handle`
- Auto-suggest from display_name: lowercase, strip spaces/special chars, append random digits if taken
- Block reserved words (admin, support, sharedkitchen, help, etc.) via app-side blocklist array
- Blocking interstitial -- user can't use app until handle is set
- Simple modal with auto-suggested handle + edit field, one tap to accept
- If suggested handle is taken, show alternatives with random 2-digit suffix
- Handles can be changed once per 30 days from profile settings
- Column added as NULLABLE, app enforces completeness -- never NOT NULL at DB level
- Show @handle on: recipe detail (attribution), feed posts (author), cook logs (who cooked), comments (author), profile screen
- @handle is primary identity, display_name as secondary subtitle where space allows
- Existing feed posts backfilled via JOIN to kitchen_profiles -> profiles at render time (no data migration)
- Profiles RLS broadened: any authenticated user can read handle + avatar_url + display_name

### Claude's Discretion
- Onboarding flow integration: where exactly in the signup flow the handle step appears
- Handle uniqueness check debounce timing
- Visual design of the handle setup modal (follows existing design system)

### Deferred Ideas (OUT OF SCOPE)
- Handle search/discovery (Phase 45)
- @mentions in comments (future)
- Handle verification badges (future)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IDEN-01 | User can set a unique @handle during signup that is validated for uniqueness and format | HandleSetupStep in onboarding flow (step 1), uses HandleInput + authStore.updateHandle(), validateHandle() from handle-utils |
| IDEN-02 | Existing users are prompted with a blocking interstitial to set their @handle on first launch after v8.0 update | HandleSetupInterstitial rendered in root _layout.tsx when session exists but handle is null, gated by authStore.handleChecked |
| IDEN-04 | @handle is displayed on all user-generated content (recipes, comments, cook logs, feed posts) | FeedCard kitchenProfile prop extended with handle, profile screen shows @handle below display_name, member rows include handle |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.12 | State management for handle state | Project standard, authStore already extended [VERIFIED: package.json] |
| @supabase/supabase-js | 2.100.0 | DB queries for handle CRUD | Project standard [VERIFIED: package.json] |
| expo-router | 55.0.11 | Navigation gating for interstitial | Project standard [VERIFIED: package.json] |
| react-native-reanimated | 4.2.1 | Animations for validation state transitions | Project standard per UI spec [VERIFIED: package.json] |
| expo-haptics | installed | Success feedback on handle claim | Already mocked in test setup [VERIFIED: tests/setup.tsx] |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react-native | 13.3.3 | Component testing for HandleInput | All component tests [VERIFIED: package.json] |
| jest-expo | 55.0.15 | Test runner preset | All tests [VERIFIED: jest.config.js] |

No new dependencies required for this phase.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    handle/
      HandleInput.tsx          # Reusable input with validation + availability check
      HandleSuggestions.tsx     # Chip row of suggested handles
      HandleSetupInterstitial.tsx  # Blocking full-screen for existing users
    onboarding/
      HandleSetupStep.tsx      # Onboarding step wrapper
  lib/
    handle-utils.ts            # Already exists (Plan 44-01)
  stores/
    authStore.ts               # Already extended with handle state (Plan 44-01)
    onboardingStore.ts         # Needs OnboardingStep enum extended to 7 steps
```
[VERIFIED: codebase grep, existing file structure]

### Pattern 1: Navigation Gating for Blocking Interstitial
**What:** Check handle existence in root `_layout.tsx` after auth + onboarding checks, render interstitial overlay when handle is null.
**When to use:** When existing users must set a handle before accessing the app.
**Example:**
```typescript
// In app/_layout.tsx, after session is established:
// 1. Call authStore.checkHandle() alongside checkOnboardingStatus()
// 2. In the navigation effect, if session exists + handleChecked + handle is null:
//    Show HandleSetupInterstitial as a full-screen overlay
// 3. Interstitial calls authStore.updateHandle(), on success it clears itself
```
**Critical detail:** The current `_layout.tsx` already has a pattern for blocking navigation: it checks `onboardingCompleted` and `households.length === 0` to redirect to onboarding. The handle interstitial should follow the same pattern but render as an overlay rather than a route redirect, because existing users already have households. [VERIFIED: app/_layout.tsx lines 101-122]

### Pattern 2: Debounced Availability Check
**What:** HandleInput debounces the uniqueness check to avoid hammering Supabase on every keystroke.
**When to use:** Real-time handle availability feedback.
**Example:**
```typescript
// Inside HandleInput component:
const [checking, setChecking] = useState(false);
const debounceRef = useRef<NodeJS.Timeout>();

const onChangeText = (text: string) => {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
  setValue(cleaned);
  
  clearTimeout(debounceRef.current);
  const validation = validateHandle(cleaned);
  if (!validation.valid) {
    setStatus({ state: 'error', message: validation.error! });
    return;
  }
  
  setStatus({ state: 'checking', message: 'Checking availability...' });
  debounceRef.current = setTimeout(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', cleaned)
      .maybeSingle();
    
    setStatus(data 
      ? { state: 'taken', message: 'This handle is taken' }
      : { state: 'available', message: 'This handle is available' }
    );
  }, 400);
};
```
[ASSUMED: 400ms debounce per UI spec recommendation]

### Pattern 3: Onboarding Step Extension
**What:** Extend `OnboardingStep` type from `0|1|2|3|4|5` to `0|1|2|3|4|5|6`, insert HandleSetupStep at position 1.
**When to use:** Adding the handle step to onboarding.
**Critical detail:** The current onboarding maps step numbers to components:
```typescript
// Current: 0=Welcome, 1=CreateHousehold, 2=InviteMembers, 3=AddRecipes, 4=PlanWeek, 5=AllSet
// New:     0=Welcome, 1=HandleSetup, 2=CreateHousehold, 3=InviteMembers, 4=AddRecipes, 5=PlanWeek, 6=AllSet
```
`TOTAL_STEPS` changes from 6 to 7. `HIDE_PROGRESS_STEPS` changes from `[0, 5]` to `[0, 6]`. [VERIFIED: app/(app)/onboarding.tsx, src/stores/onboardingStore.ts]

### Anti-Patterns to Avoid
- **Separate route for interstitial:** Don't create a new route like `/(app)/set-handle` -- it creates back-navigation escape routes. Use a full-screen overlay component rendered conditionally in `_layout.tsx`. [VERIFIED: existing pattern uses conditional rendering for onboarding gate]
- **Denormalizing handle into feed_posts table:** The decision is to JOIN at render time. Don't copy handle values into other tables. [VERIFIED: CONTEXT.md locked decision]
- **NOT NULL constraint on handle column:** The decision is to keep it NULLABLE at DB level. App enforces completeness via the interstitial. [VERIFIED: CONTEXT.md locked decision]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input debouncing | Custom debounce logic from scratch | `useRef` + `setTimeout` pattern (simple enough) | No need for lodash.debounce -- the pattern is 5 lines [ASSUMED] |
| Handle validation | Inline regex in components | `validateHandle()` from `handle-utils.ts` | Already built and tested with 16 unit tests [VERIFIED: tests/lib/handle-utils.test.ts] |
| Handle suggestions | Custom generation logic | `suggestHandle()` + `suggestAlternatives()` from `handle-utils.ts` | Already built and tested [VERIFIED: src/lib/handle-utils.ts] |
| Profile data fetching | Direct Supabase calls in components | `authStore.checkHandle()` and `authStore.updateHandle()` | Already built with error handling for 23505 uniqueness violations [VERIFIED: src/stores/authStore.ts] |

## Common Pitfalls

### Pitfall 1: Race Condition on Handle Claim
**What goes wrong:** User types handle, sees "available", but another user claims it between the check and the submit.
**Why it happens:** Availability check and claim are separate operations.
**How to avoid:** The DB has a UNIQUE index -- `authStore.updateHandle()` already catches Postgres error code 23505 and returns a user-friendly error. The UI must handle this error gracefully by showing "This handle was just taken" and allowing retry. [VERIFIED: src/stores/authStore.ts line 72]
**Warning signs:** Not testing the 23505 error path in component tests.

### Pitfall 2: Interstitial Escape Routes
**What goes wrong:** User navigates away from the interstitial via back button, deep links, or tab navigation.
**Why it happens:** If the interstitial is implemented as a separate route instead of a blocking overlay.
**How to avoid:** Render the interstitial as a full-screen `View` with `position: absolute` and `zIndex` above everything else. Set `accessibilityViewIsModal={true}`. Don't use `router.push()` to show it. [VERIFIED: UI spec specifies no dismiss gesture, no back button]
**Warning signs:** User can reach tabs while handle is null.

### Pitfall 3: Onboarding Step Index Shift
**What goes wrong:** Inserting handle step at position 1 shifts all subsequent step indices, breaking existing step components that reference hardcoded step numbers.
**Why it happens:** Current step components (CreateHouseholdStep, etc.) don't reference their own index, but the onboarding store's `nextStep`/`prevStep` uses numeric arithmetic.
**How to avoid:** Update `OnboardingStep` type, `STEP_COMPONENTS` map, `TOTAL_STEPS`, and `HIDE_PROGRESS_STEPS` together in a single change. The existing step components don't need modification since they're mapped by their position in the object. [VERIFIED: app/(app)/onboarding.tsx -- components are mapped by step number, not by name]
**Warning signs:** Progress bar showing wrong step count, "All Set" step unreachable.

### Pitfall 4: Handle Check Timing
**What goes wrong:** App briefly shows main content before the handle check completes, then flashes the interstitial.
**Why it happens:** `checkHandle()` is async and the navigation effect runs before it resolves.
**How to avoid:** Add `handleChecked` to the navigation guard conditions. Don't navigate to main content until `handleChecked === true`. Show a loading state (or keep splash screen) until both `onboardingChecked` and `handleChecked` are true. [VERIFIED: authStore has `handleChecked` boolean, _layout.tsx has pattern for waiting on async checks]
**Warning signs:** Brief flash of tab content before interstitial appears.

### Pitfall 5: FeedCard kitchenProfile Prop Breaking Change
**What goes wrong:** Adding `handle` to the `kitchenProfile` prop type causes TypeScript errors across all FeedCard usages.
**Why it happens:** The prop is currently typed as `{ display_name: string; avatar_url: string | null }` and making handle required would break existing callers.
**How to avoid:** Make `handle` optional in the prop type: `handle?: string | null`. Display `@handle` when available, fall back to display_name only when handle is null. [VERIFIED: src/components/social/FeedCard.tsx line 13]
**Warning signs:** TypeScript errors in FeedList or other components that construct the kitchenProfile prop.

## Code Examples

### HandleInput Component Pattern
```typescript
// src/components/handle/HandleInput.tsx
// Source: project patterns from Input.tsx + handle-utils.ts

interface HandleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  status: { state: 'idle' | 'checking' | 'available' | 'taken' | 'error'; message: string };
}

// - Wraps existing Input component pattern (from src/components/ui/Input.tsx)
// - Adds "@" prefix label (bodyLg SemiBold, onSurfaceVariant)
// - Shows status icon (ActivityIndicator for checking, checkmark/x for result)
// - Auto-lowercases and strips invalid chars on input
// - Keyboard props: autoCapitalize="none", autoCorrect={false}, autoComplete="username-new"
```
[VERIFIED: Input.tsx pattern, UI spec for HandleInput]

### Navigation Gate Pattern
```typescript
// In app/_layout.tsx, modify the existing auth/onboarding effect:

// Add to state:
const { handle, handleChecked, checkHandle } = useAuthStore();

// Add to the session effect (alongside checkOnboardingStatus):
await checkHandle();

// Add to navigation guard:
if (session && handleChecked && handle === null && !inOnboarding) {
  // Render HandleSetupInterstitial overlay
}
```
[VERIFIED: app/_layout.tsx existing patterns at lines 82-122]

### Profile Screen Handle Display
```typescript
// In app/(app)/(tabs)/profile.tsx, add below displayName:
// Current line 103: const displayName = user?.user_metadata?.full_name ?? ...
// Add:
const { handle } = useAuthStore();

// In JSX, after displayName Text:
{handle && (
  <Text style={styles.handle}>@{handle}</Text>
)}
// styles.handle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs }
```
[VERIFIED: profile.tsx line 103, 256-258]

### Feed Card Handle Integration
```typescript
// Extend FeedCardProps interface:
kitchenProfile?: { display_name: string; avatar_url: string | null; handle?: string | null };

// In render, replace displayName usage:
const handleText = kitchenProfile?.handle ? `@${kitchenProfile.handle}` : null;
// Show handleText as primary, display_name as secondary when handle exists
```
[VERIFIED: FeedCard.tsx line 13]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo 55.0.15 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern="handle" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IDEN-01 | HandleInput validates format and checks availability | unit | `npx jest tests/components/HandleInput.test.tsx -x` | Wave 0 |
| IDEN-01 | HandleSetupStep renders in onboarding, calls updateHandle | unit | `npx jest tests/components/HandleSetupStep.test.tsx -x` | Wave 0 |
| IDEN-02 | HandleSetupInterstitial blocks app when handle is null | unit | `npx jest tests/components/HandleSetupInterstitial.test.tsx -x` | Wave 0 |
| IDEN-02 | Root layout renders interstitial when handleChecked=true, handle=null | unit | `npx jest tests/screens/root-layout-handle.test.tsx -x` | Wave 0 |
| IDEN-04 | FeedCard displays @handle when available | unit | `npx jest tests/components/FeedCard.test.tsx -x` | Wave 0 |
| IDEN-04 | Profile screen shows @handle below display name | unit | `npx jest tests/screens/profile.test.tsx -x` | Exists (needs update) |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="handle" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/components/HandleInput.test.tsx` -- covers IDEN-01 validation UX
- [ ] `tests/components/HandleSetupStep.test.tsx` -- covers IDEN-01 onboarding integration
- [ ] `tests/components/HandleSetupInterstitial.test.tsx` -- covers IDEN-02 blocking behavior
- [ ] `tests/components/FeedCard.test.tsx` -- covers IDEN-04 feed display (new file or extend existing)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a (handle is not auth credential) |
| V3 Session Management | no | n/a |
| V4 Access Control | yes | RLS policy already broadened in migration 00025 -- any authenticated user can read profiles [VERIFIED: 00025_add_handle_column.sql] |
| V5 Input Validation | yes | `validateHandle()` client-side + DB CHECK constraint `chk_handle_format` [VERIFIED: handle-utils.ts, migration] |
| V6 Cryptography | no | n/a |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Handle enumeration (check if handle exists) | Information Disclosure | Acceptable trade-off -- availability check is core UX, rate-limited by Supabase |
| SQL injection via handle input | Tampering | Supabase parameterized queries, DB CHECK constraint, client regex [VERIFIED: authStore uses .eq() not raw SQL] |
| Reserved word bypass | Tampering | Client-side blocklist + DB unique constraint prevents impersonation of system accounts [VERIFIED: handle-utils.ts RESERVED_WORDS] |
| Handle squatting | Denial of Service | 30-day change cooldown limits griefing, reserved words block system handles [VERIFIED: CONTEXT.md decision] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 400ms debounce is appropriate for availability check | Architecture Patterns | Minor UX issue -- too fast = too many queries, too slow = laggy feedback. Easy to tune. |
| A2 | lodash.debounce is unnecessary, useRef+setTimeout suffices | Don't Hand-Roll | Low risk -- simple pattern, no complex cancel/flush semantics needed |

## Open Questions (RESOLVED)

1. **How does the interstitial interact with deep links?** (RESOLVED)
   - What we know: Root layout gates navigation, interstitial is a blocking overlay
   - Resolution: The interstitial blocks all deep links. User must set handle first. Plan 44-02 renders the interstitial as a full-screen overlay with zIndex 9999 in root _layout.tsx, which prevents any navigation until handle is set. Deep link intent is preserved by expo-router's default behavior.

2. **Where does the handle availability check query go?** (RESOLVED)
   - What we know: `authStore.updateHandle()` handles the claim, `authStore.checkHandle()` fetches current handle
   - Resolution: Availability check lives directly in HandleSetupInterstitial and HandleSetupStep as a local Supabase query with 400ms debounce (per Plan 44-02 Task 1). It's transient UI state, not app-wide state. Also reused in Edit Profile handle change flow (Plan 44-04).

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/stores/authStore.ts`, `src/lib/handle-utils.ts`, `supabase/migrations/00025_add_handle_column.sql`
- Codebase analysis: `app/_layout.tsx`, `app/(app)/onboarding.tsx`, `src/stores/onboardingStore.ts`
- Codebase analysis: `src/components/social/FeedCard.tsx`, `app/(app)/(tabs)/profile.tsx`
- UI Spec: `.planning/phases/44-handle-system-identity-foundation/44-UI-SPEC.md`
- Plan 44-01 Summary: completed work reference

### Secondary (MEDIUM confidence)
- None needed -- all findings verified against codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use, verified against package.json
- Architecture: HIGH - patterns derived directly from existing codebase conventions
- Pitfalls: HIGH - identified from actual code structure and known edge cases
- Validation: HIGH - test framework and patterns verified from existing test files

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- no external API or library changes expected)
