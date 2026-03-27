# Phase 18: Auth, Onboarding & Household QA - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that auth flows (sign up, sign in, session persistence), onboarding, profile management, and household operations (create, invite, join) all work correctly end-to-end. Run existing tests, write new tests for gaps, fix bugs found inline.

</domain>

<decisions>
## Implementation Decisions

### Testing Methodology
- Run existing Jest unit tests and Maestro E2E flows first, then write new tests for uncovered gaps, with manual verification for remainder
- Prioritize Jest unit tests for store logic, Maestro E2E for user flows — matches existing pattern (18 Maestro flows + Jest suites)
- Use Supabase test credentials from .env for auth-dependent tests — existing tests mock Supabase client

### Failure Handling
- Fix bugs inline during the QA phase, then verify the fix
- Document test results in VERIFICATION.md with pass/fail per requirement + SUMMARY.md per plan

### Test Scope
- Session persistence (AUTH-03) tested manually on simulator — app restart testing unreliable in Maestro
- Household invite (HOUSE-02/03) tested via unit tests for store logic + manual verification — multi-device E2E requires two simulators

### Claude's Discretion
- Specific test data and mock setup approaches
- Order of test execution within the phase

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/auth.test.ts` (104 lines) — existing auth store tests
- `tests/household.test.ts` (191 lines) — existing household store tests
- `tests/screens/profile.test.tsx` (172 lines) — existing profile screen tests
- `tests/setup.tsx` — test setup with mocks
- `.maestro/auth-signup.yaml`, `auth-login.yaml`, `auth-logout.yaml` — auth E2E flows
- `.maestro/onboarding-flow.yaml` — onboarding E2E flow

### Established Patterns
- Jest with @testing-library/react-native, jest-expo preset
- Supabase client mocked in tests via jest.mock
- Maestro YAML flows for E2E (external CLI, no project deps)
- Zustand stores tested directly (import store, call actions, assert state)

### Integration Points
- `src/stores/authStore.ts` — auth state management
- `src/stores/householdStore.ts` — household CRUD
- `src/stores/onboardingStore.ts` — onboarding flow state
- `app/(auth)/sign-in.tsx`, `sign-up.tsx` — auth screens
- `app/(app)/onboarding.tsx` — onboarding screen
- `app/(app)/(tabs)/profile.tsx` — profile screen
- `app/(app)/edit-profile.tsx` — profile editing
- `app/(app)/household/create.tsx`, `invite.tsx`, `join.tsx` — household screens

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for QA testing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
