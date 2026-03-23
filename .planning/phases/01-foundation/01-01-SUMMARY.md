---
phase: 01-foundation
plan: 01
subsystem: auth
tags: [expo, supabase, google-oauth, zustand, jest, expo-router, asyncstorage]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Expo SDK 55 project with expo-router file-based routing
  - Supabase client with AsyncStorage session persistence
  - Email/password sign-up and sign-in
  - Google OAuth sign-in flow with nonce security
  - Auth-gated navigation (auth group vs app group)
  - Zustand auth store with session management
  - Profiles table migration with RLS and auto-create trigger
  - Jest test infrastructure with 10 passing tests
  - 5-tab navigation layout (Plan, Recipes, Grocery, Budget, Profile)
affects: [01-02, 01-03, 02-01, 02-02, 02-03]

# Tech tracking
tech-stack:
  added: [expo ~55.0.8, expo-router ~55.0.7, @supabase/supabase-js, @react-native-async-storage/async-storage, @react-native-google-signin/google-signin, @gorhom/bottom-sheet, zustand, base64-arraybuffer, react-native-url-polyfill, @expo-google-fonts/plus-jakarta-sans, @expo-google-fonts/inter, jest-expo, @testing-library/react-native, expo-crypto, expo-splash-screen]
  patterns: [expo-router file-based routing with route groups, Supabase auth with onAuthStateChange listener, Zustand store for auth state, nonce-secured Google OAuth via signInWithIdToken]

key-files:
  created: [app/_layout.tsx, app/(auth)/sign-in.tsx, app/(auth)/sign-up.tsx, app/(app)/(tabs)/_layout.tsx, src/lib/supabase.ts, src/stores/authStore.ts, src/types/database.ts, supabase/migrations/00001_create_profiles.sql, jest.config.js, tests/setup.ts, tests/auth.test.ts, tests/supabase-client.test.ts]
  modified: []

key-decisions:
  - "Used jest@29 instead of jest@30 due to compatibility issues with jest-expo 55"
  - "Used --legacy-peer-deps for npm installs due to react/react-dom version conflicts in expo-router dependencies"
  - "Used blank-typescript template instead of tabs template, then manually added expo-router"
  - "Supabase client source-file verification test pattern instead of module isolation (jest-expo runtime restrictions)"

patterns-established:
  - "Route groups: (auth) for unauthenticated, (app) for authenticated screens"
  - "Auth gating: root _layout.tsx listens to onAuthStateChange and redirects via router.replace"
  - "Zustand stores in src/stores/ with useXxxStore naming convention"
  - "Test mocks centralized in tests/setup.ts via setupFilesAfterEnv"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 1 Plan 01: Expo Project Setup and Auth Summary

**Expo SDK 55 app with Supabase email/password and Google OAuth auth, AsyncStorage session persistence, and auth-gated 5-tab navigation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-23T16:22:05Z
- **Completed:** 2026-03-23T16:30:21Z
- **Tasks:** 2
- **Files modified:** 26

## Accomplishments
- Scaffolded Expo SDK 55 project with expo-router, all Phase 1 dependencies installed
- Supabase client configured with AsyncStorage persistence, auto-refresh tokens, detectSessionInUrl: false
- Sign-in screen with email/password form and Google OAuth button (nonce-secured)
- Sign-up screen with password confirmation validation
- Auth-gated navigation: unauthenticated users see sign-in, authenticated users see 5-tab layout
- Zustand auth store managing session, user, and initialization state
- Profiles table migration with RLS policies and auto-create trigger on user signup
- Jest test infrastructure with 10 passing tests covering signup, signin, google OAuth, signout, and client config

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Expo project, install dependencies, configure Supabase client, and set up test infrastructure** - `f02862d` (feat)
2. **Task 2: Implement auth screens, auth-gated navigation, profiles migration, and auth store** - `38de1b8` (feat)

## Files Created/Modified
- `app/_layout.tsx` - Root layout with font loading, auth listener, splash screen, and route gating
- `app/(auth)/_layout.tsx` - Auth stack layout (no header)
- `app/(auth)/sign-in.tsx` - Email/password sign-in + Google OAuth with nonce security
- `app/(auth)/sign-up.tsx` - Sign-up with password confirmation
- `app/(app)/_layout.tsx` - Authenticated layout wrapper
- `app/(app)/(tabs)/_layout.tsx` - 5-tab navigation (Plan, Recipes, Grocery, Budget, Profile)
- `app/(app)/(tabs)/plan.tsx` - Plan tab placeholder
- `app/(app)/(tabs)/recipes.tsx` - Recipes tab placeholder
- `app/(app)/(tabs)/grocery.tsx` - Grocery tab placeholder
- `app/(app)/(tabs)/budget.tsx` - Budget tab placeholder
- `app/(app)/(tabs)/profile.tsx` - Profile tab placeholder
- `src/lib/supabase.ts` - Supabase client with AsyncStorage adapter
- `src/lib/constants.ts` - App constants (TAB_BAR_HEIGHT)
- `src/types/database.ts` - TypeScript types for profiles, households, household_members
- `src/stores/authStore.ts` - Zustand auth store with session management
- `supabase/migrations/00001_create_profiles.sql` - Profiles table with RLS and auto-create trigger
- `jest.config.js` - Jest config with jest-expo preset
- `tests/setup.ts` - Centralized test mocks
- `tests/auth.test.ts` - Auth flow tests (signup, google, signout, email signin)
- `tests/supabase-client.test.ts` - Supabase client configuration tests
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules for Expo project
- `.npmrc` - NPM config for legacy-peer-deps
- `app.json` - Expo config with expo-router plugin, scheme, bundle IDs
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config with path aliases

## Decisions Made
- Used jest@29 instead of jest@30: jest-expo 55 has runtime compatibility issues with Jest 30's new module scoping
- Used --legacy-peer-deps: expo-router's radix-ui dependencies require react-dom@19.2.4 but Expo pins react@19.2.0
- Used blank-typescript template: plan specified blank-typescript; manually added expo-router and all routing config
- Source-file verification for supabase config tests: jest-expo runtime restrictions prevent jest.isolateModules from re-requiring modules, so config tests read source file directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed jest@29 for jest-expo compatibility**
- **Found during:** Task 1
- **Issue:** jest@30 (auto-installed latest) causes "import outside scope" errors with jest-expo 55 runtime
- **Fix:** Downgraded to jest@29 which jest-expo 55 is built against
- **Files modified:** package.json, package-lock.json
- **Verification:** All tests pass
- **Committed in:** f02862d (Task 1 commit)

**2. [Rule 3 - Blocking] Added react-native-worklets dependency**
- **Found during:** Task 1
- **Issue:** react-native-reanimated v4 requires react-native-worklets/plugin which was not installed
- **Fix:** Installed react-native-worklets
- **Files modified:** package.json, package-lock.json
- **Verification:** Babel transform no longer errors
- **Committed in:** f02862d (Task 1 commit)

**3. [Rule 3 - Blocking] Added .npmrc with legacy-peer-deps**
- **Found during:** Task 1
- **Issue:** npm ERESOLVE conflict between react@19.2.0 (Expo) and react-dom@19.2.4 (expo-router radix-ui deps)
- **Fix:** Created .npmrc with legacy-peer-deps=true
- **Files modified:** .npmrc
- **Verification:** All installs succeed
- **Committed in:** f02862d (Task 1 commit)

**4. [Rule 1 - Bug] Fixed jest config key name**
- **Found during:** Task 1
- **Issue:** Plan specified `setupFilesAfterSetup` which is not a valid Jest config key
- **Fix:** Changed to correct key `setupFilesAfterEnv`
- **Files modified:** jest.config.js
- **Verification:** Setup file loads correctly, all tests pass
- **Committed in:** f02862d (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered
- NPM peer dependency resolution required --legacy-peer-deps flag due to react version mismatch in expo ecosystem
- jest-expo 55 incompatible with Jest 30, required downgrade to Jest 29

## User Setup Required

External services require manual configuration before the app can connect to a backend:

**Supabase:**
1. Create a Supabase project at https://supabase.com/dashboard
2. Copy Project URL and anon key from Project Settings -> API
3. Run the profiles migration (supabase/migrations/00001_create_profiles.sql) in the SQL editor
4. Enable Google OAuth provider in Authentication -> Providers -> Google

**Google OAuth:**
1. Create OAuth 2.0 credentials (Web + iOS) in Google Cloud Console
2. Configure the Web Client ID in the Supabase Google provider settings

**Environment Variables:**
Copy `.env.example` to `.env` and fill in the values from above.

## Next Phase Readiness
- Auth foundation complete, ready for household features (Plan 01-02)
- Tab navigation skeleton in place for all 5 tabs
- Supabase client and types ready for household data modeling
- Test infrastructure operational for continued TDD

## Self-Check: PASSED

All 13 key files verified present. Both task commits (f02862d, 38de1b8) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-23*
