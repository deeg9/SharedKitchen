# Phase 44: Handle System & Identity Foundation - Research

**Researched:** 2026-04-10
**Domain:** Username/handle system, Supabase schema migration, Expo Router navigation guards
**Confidence:** HIGH

## Summary

Phase 44 adds a unique @handle to every SharedKitchen user. The work is: (1) add a NULLABLE `handle` column to the existing `profiles` table with a case-insensitive unique index, (2) build a HandleInput component with debounced uniqueness checking, (3) create a handle setup step in the onboarding flow for new users, (4) add a blocking interstitial screen for existing users who lack a handle, (5) broaden RLS on profiles so any authenticated user can read handle/avatar_url/display_name, and (6) update all content display points to show @handle.

No new npm dependencies are required. The entire phase uses existing libraries (Supabase JS, Zustand 5, Expo Router, existing UI components). The codebase already has established patterns for debounced search (manual setTimeout/clearTimeout in KitchenSearchBar and FoodSearchSheet), onboarding step management (OnboardingStore with step enum), and auth-gated navigation (root _layout.tsx with useSegments-based routing).

**Primary recommendation:** Follow the existing codebase patterns exactly -- manual debounce refs, Zustand stores, RLS helper functions, and the root layout navigation guard pattern for the blocking interstitial.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Handle format: lowercase alphanumeric + underscores only, 3-20 characters
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
| IDEN-01 | User can set a unique @handle during signup that is validated for uniqueness and format | HandleInput component with regex validation + debounced Supabase uniqueness RPC; handle column with UNIQUE index on LOWER(handle) |
| IDEN-02 | Existing users prompted with blocking interstitial to set handle on first launch after v8.0 | Root layout navigation guard checks profile.handle; redirects to handle-setup screen when null |
| IDEN-04 | @handle displayed on all user-generated content | Broadened profiles RLS + updated profile JOIN queries to include handle column |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (existing) | DB queries, RPC calls for uniqueness check | Already integrated, all stores use it |
| zustand | 5.x (existing) | authStore extension for handle state | Established store pattern across 14+ stores |
| expo-router | (existing) | Navigation guard for blocking interstitial | Root layout already has auth/onboarding guards |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native TextInput | (built-in) | Handle input field | Via existing Input component |
| AsyncStorage | (existing) | Not needed for handle (server-side only) | Handle state comes from profiles table, not local |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual debounce (setTimeout) | lodash.debounce or use-debounce | Project already uses manual pattern in KitchenSearchBar and FoodSearchSheet; adding a dependency for one use is not justified |
| Supabase RPC for uniqueness | Direct .select().eq() query | RPC is cleaner -- single round-trip, can combine format validation server-side; but direct query works fine too since RLS will be broadened |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    authStore.ts              # Add handle, handleChecked fields + checkHandle(), setHandle() actions
  components/
    handle/
      HandleInput.tsx          # Reusable input with "@" prefix, debounced uniqueness check, status indicator
      HandleSuggestions.tsx     # Shows alternative suggestions when handle is taken
    onboarding/
      ChooseHandleStep.tsx     # New onboarding step (step 1, after Welcome)
  lib/
    handle-utils.ts            # Validation regex, reserved words list, auto-suggest logic
app/
  (app)/
    handle-setup.tsx           # Blocking interstitial screen for existing users
    onboarding.tsx             # Updated step map (7 steps instead of 6)
supabase/
  migrations/
    00025_add_handle_column.sql  # ALTER TABLE + index + RLS policy + RPC function
```

### Pattern 1: Debounced Uniqueness Check (matching existing codebase pattern)
**What:** Manual setTimeout/clearTimeout debounce for handle availability checking
**When to use:** In HandleInput component when user types
**Example:**
```typescript
// Source: Follows pattern from src/components/social/KitchenSearchBar.tsx [VERIFIED: codebase]
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

const handleTextChange = (text: string) => {
  const normalized = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
  setHandle(normalized);

  if (debounceRef.current) clearTimeout(debounceRef.current);

  if (normalized.length < 3) {
    setAvailability('idle');
    return;
  }

  // Check reserved words synchronously
  if (RESERVED_WORDS.includes(normalized)) {
    setAvailability('taken');
    return;
  }

  setAvailability('checking');
  debounceRef.current = setTimeout(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('handle', normalized)
      .limit(1)
      .maybeSingle();

    setAvailability(data ? 'taken' : 'available');
  }, 400); // 400ms debounce -- slightly longer than 300ms food search since uniqueness is less urgent
};
```

### Pattern 2: Blocking Interstitial via Root Layout Navigation Guard
**What:** Extend existing auth/onboarding navigation guard to also check for handle presence
**When to use:** In app/_layout.tsx, after auth check but before tab navigation
**Example:**
```typescript
// Source: Extends existing pattern in app/_layout.tsx [VERIFIED: codebase]
// In the navigation effect, after session and onboarding checks:
const { handle, handleChecked } = useAuthStore();

// Add to navigation guard conditions:
if (session && handleChecked && !handle && !inHandleSetup) {
  router.replace('/(app)/handle-setup');
}
```

### Pattern 3: NULLABLE Column with Case-Insensitive Unique Index
**What:** Add handle as NULLABLE TEXT with UNIQUE index on LOWER() expression
**When to use:** Migration file
**Example:**
```sql
-- Source: Standard Postgres pattern [ASSUMED]
ALTER TABLE profiles ADD COLUMN handle TEXT;
ALTER TABLE profiles ADD COLUMN handle_changed_at TIMESTAMPTZ;

-- Case-insensitive uniqueness (NULL values don't conflict)
CREATE UNIQUE INDEX idx_profiles_handle_lower ON profiles (LOWER(handle));

-- Partial index for non-null handles only (optional, improves lookup perf)
-- The UNIQUE index above already handles NULLs correctly in Postgres (NULLs are distinct)

-- CHECK constraint for format validation at DB level
ALTER TABLE profiles ADD CONSTRAINT chk_handle_format
  CHECK (handle IS NULL OR (
    handle ~ '^[a-z0-9_]{3,20}$'
    AND handle = LOWER(handle)
  ));
```

### Pattern 4: Broadened RLS for Public Profile Fields
**What:** Add a new SELECT policy allowing any authenticated user to read handle, avatar_url, display_name
**When to use:** Migration file
**Example:**
```sql
-- Source: Extends existing RLS patterns in 00001 and 00002 migrations [VERIFIED: codebase]
-- Current policies: "Users can read own profile" + "Users can read co-member profiles"
-- New policy: any authenticated user can read public profile fields
CREATE POLICY "Authenticated users can read public profile fields"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
```
**Note:** This replaces the need for the co-member policy for SELECT purposes (it's a superset). The existing policy can remain -- Postgres ORs multiple SELECT policies. The broadening is necessary because @handles need to be visible across kitchens (e.g., on feed posts from followed kitchens). [VERIFIED: codebase shows current RLS only allows reading co-household member profiles, which is too restrictive for social features]

### Pattern 5: Onboarding Step Insertion
**What:** Add ChooseHandleStep as step 1 (after Welcome, before CreateHousehold)
**When to use:** Onboarding flow
**Example:**
```typescript
// Source: Extends existing onboarding pattern [VERIFIED: codebase]
// Current: 0=Welcome, 1=CreateHousehold, 2=InviteMembers, 3=AddRecipes, 4=PlanWeek, 5=AllSet
// New:     0=Welcome, 1=ChooseHandle, 2=CreateHousehold, 3=InviteMembers, 4=AddRecipes, 5=PlanWeek, 6=AllSet

export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  0: WelcomeStep,
  1: ChooseHandleStep,   // NEW
  2: CreateHouseholdStep,
  3: InviteMembersStep,
  4: AddRecipesStep,
  5: PlanWeekStep,
  6: AllSetStep,
};

const TOTAL_STEPS = 7;
const HIDE_PROGRESS_STEPS: OnboardingStep[] = [0, 6];
```

### Anti-Patterns to Avoid
- **NOT NULL column on existing table:** Never add NOT NULL without a default on a table with existing rows. The CONTEXT.md explicitly locks this as NULLABLE forever at the DB level.
- **Client-side uniqueness enforcement only:** Always verify server-side. The UNIQUE index on LOWER(handle) is the source of truth; the client debounce check is a UX convenience, not a guarantee.
- **Storing "@" prefix in database:** The "@" is display-only. Store bare handle ("johndoe" not "@johndoe"). Display with `@${profile.handle}`.
- **Separate handle table:** Handle belongs on profiles -- it's a 1:1 user attribute, not a separate entity. Adding a table adds JOINs everywhere for no benefit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Handle format validation | Custom char-by-char parser | Single regex `^[a-z0-9_]{3,20}$` | Regex is more maintainable and testable |
| Debounced API calls | Custom debounce utility | setTimeout/clearTimeout ref pattern (existing) | Already used in 2 places in codebase, works fine |
| Case-insensitive uniqueness | Application-level toLower() checks | Postgres `LOWER()` expression index | DB-level enforcement is the only reliable approach |
| Reserved word checking | Server-side reserved word RPC | Client-side array lookup | Reserved words change rarely, keeping client-side avoids a network round-trip; the UNIQUE index catches any edge cases |

## Common Pitfalls

### Pitfall 1: Race Condition on Handle Claim
**What goes wrong:** Two users check the same handle simultaneously, both see "available", both try to save -- one fails with a cryptic Supabase error.
**Why it happens:** The debounce check and the save are separate operations with no locking.
**How to avoid:** Let the UNIQUE index be the final arbiter. Catch the duplicate key error (Postgres error code 23505) on save and show "This handle was just taken, please choose another" with a friendly message. The debounce check is UX sugar, not a guarantee.
**Warning signs:** Error handling on the save operation doesn't check for uniqueness violations.

### Pitfall 2: Navigation Loop in Root Layout
**What goes wrong:** Adding the handle check to _layout.tsx creates an infinite redirect loop (handle-setup -> check handle -> handle-setup -> ...).
**Why it happens:** The navigation guard fires on every segment change, including when navigating TO the handle-setup screen.
**How to avoid:** Guard the redirect with `!inHandleSetup` check: `const inHandleSetup = (segments as string[])[1] === 'handle-setup';`. This matches the existing `inOnboarding` pattern already in the codebase.
**Warning signs:** App freezes or flickers on launch for users without handles.

### Pitfall 3: Stale Handle State After Setting
**What goes wrong:** User sets handle on interstitial, but authStore still has `handle: null`, so the guard redirects them back.
**Why it happens:** The profile update writes to Supabase but the local store isn't updated.
**How to avoid:** After successful handle save, immediately update authStore's handle field AND navigate away. Don't rely on a re-fetch cycle.
**Warning signs:** User gets stuck on handle-setup screen after setting their handle.

### Pitfall 4: handle_new_user() Trigger Not Updated
**What goes wrong:** New users created via auth signup don't get handle pre-populated, which is correct. But if the trigger is modified to set a default handle, it could conflict with the onboarding flow.
**Why it happens:** The existing `handle_new_user()` trigger in migration 00001 inserts into profiles with display_name only.
**How to avoid:** Do NOT modify the handle_new_user() trigger to set a handle. Handle is set explicitly during onboarding step 1 (ChooseHandle). The trigger should continue inserting with handle=NULL.
**Warning signs:** New users skip the handle step because a handle was already set by the trigger.

### Pitfall 5: 30-Day Change Limit Not Enforced
**What goes wrong:** Users change handles repeatedly, breaking @mentions and confusing followers.
**Why it happens:** The `handle_changed_at` column exists but nothing checks it.
**How to avoid:** Add a CHECK in the handle update function: if `handle_changed_at` is less than 30 days ago, reject the change. Enforce both client-side (disable edit button with countdown) and server-side (RPC or trigger).
**Warning signs:** No validation on handle update path in profile settings.

## Code Examples

### Handle Validation Utility
```typescript
// Source: Standard pattern for username validation [ASSUMED]
// File: src/lib/handle-utils.ts

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

const RESERVED_WORDS = [
  'admin', 'support', 'sharedkitchen', 'help', 'system',
  'mod', 'moderator', 'official', 'team', 'staff',
  'null', 'undefined', 'api', 'www', 'app',
];

export function validateHandle(handle: string): { valid: boolean; error?: string } {
  if (handle.length < 3) return { valid: false, error: 'Must be at least 3 characters' };
  if (handle.length > 20) return { valid: false, error: 'Must be 20 characters or less' };
  if (!HANDLE_REGEX.test(handle)) return { valid: false, error: 'Only lowercase letters, numbers, and underscores' };
  if (RESERVED_WORDS.includes(handle)) return { valid: false, error: 'This username is reserved' };
  return { valid: true };
}

export function suggestHandle(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'user';
}

export function suggestAlternatives(base: string): string[] {
  const suffix1 = Math.floor(Math.random() * 90 + 10); // 10-99
  const suffix2 = Math.floor(Math.random() * 90 + 10);
  const suffix3 = Math.floor(Math.random() * 90 + 10);
  return [`${base}${suffix1}`, `${base}${suffix2}`, `${base}_${suffix3}`].slice(0, 3);
}
```

### Migration SQL
```sql
-- File: supabase/migrations/00025_add_handle_column.sql
-- Source: Standard Postgres ALTER TABLE + Supabase RLS [VERIFIED: codebase migration patterns]

-- 1. Add handle column (NULLABLE per locked decision)
ALTER TABLE profiles ADD COLUMN handle TEXT;
ALTER TABLE profiles ADD COLUMN handle_changed_at TIMESTAMPTZ;

-- 2. Case-insensitive unique index (NULLs don't conflict in Postgres)
CREATE UNIQUE INDEX idx_profiles_handle_lower ON profiles (LOWER(handle));

-- 3. Format constraint at DB level (defense in depth)
ALTER TABLE profiles ADD CONSTRAINT chk_handle_format
  CHECK (handle IS NULL OR (handle ~ '^[a-z0-9_]{3,20}$'));

-- 4. Broaden profiles RLS: any authenticated user can read basic profile fields
-- This is needed because @handles must be visible on feed posts, recipe attribution, etc.
-- across households and followed kitchens
CREATE POLICY "Authenticated users can read any profile"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Note: Existing policies ("Users can read own profile" and "Users can read co-member profiles")
-- are now subsumed by this broader policy but can remain without harm (Postgres ORs SELECT policies)
```

### authStore Handle Extension
```typescript
// Source: Extends existing authStore pattern [VERIFIED: codebase]
interface AuthState {
  // ... existing fields ...
  handle: string | null;
  handleChecked: boolean;

  checkHandle: () => Promise<void>;
  updateHandle: (handle: string) => Promise<{ success: boolean; error?: string }>;
}

// In store implementation:
checkHandle: async () => {
  const userId = get().user?.id;
  if (!userId) return;

  const { data } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', userId)
    .single();

  set({ handle: data?.handle ?? null, handleChecked: true });
},

updateHandle: async (handle: string) => {
  const userId = get().user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({ handle, handle_changed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    // Postgres 23505 = unique violation
    if (error.code === '23505') {
      return { success: false, error: 'This handle was just taken' };
    }
    return { success: false, error: error.message };
  }

  set({ handle });
  return { success: true };
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| User-to-user social | Kitchen-to-kitchen social (v5.0) | v5.0 | Handle is per-user (profiles), but social display context is per-kitchen |
| Profiles read by co-members only | Profiles readable by any authenticated user | This phase | Enables cross-kitchen @handle display |

**Key distinction:** Handles are on the `profiles` table (per-user), while social identity is on `kitchen_profiles` (per-household). A user's @handle appears everywhere regardless of which kitchen context they're in. This is intentional -- the handle is personal identity, the kitchen is social identity.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Postgres UNIQUE index on expression `LOWER(handle)` allows multiple NULLs | Architecture Patterns | Migration would fail if NULLs conflict; but this is standard Postgres behavior since version 15+ and likely earlier |
| A2 | Supabase error code 23505 is returned to the client for unique constraint violations | Code Examples | Error handling for duplicate handle would not catch the right error; would need to check error.message instead |
| A3 | 400ms is an appropriate debounce timing for handle uniqueness check | Architecture Patterns | LOW impact -- easily tunable if too fast (server load) or too slow (feels laggy) |

## Open Questions

1. **Where does handle-setup.tsx live in Expo Router hierarchy?**
   - What we know: It should be a screen under `app/(app)/` alongside `edit-profile.tsx` and `onboarding.tsx`
   - What's unclear: Whether it should be a modal presentation or a full screen
   - Recommendation: Full screen (like onboarding.tsx), not a modal. The user MUST complete it -- modal implies dismissibility. Use `router.replace()` to prevent back navigation.

2. **Should the 30-day change limit be enforced via RLS or application code?**
   - What we know: `handle_changed_at` column tracks last change
   - What's unclear: Whether to use a Postgres trigger (prevents all paths) or app-side check (simpler, covers main path)
   - Recommendation: App-side check in authStore.updateHandle() for v8.0; add DB trigger in a future hardening pass if needed. The only update path is through the app.

3. **How to handle the profile JOIN expansion?**
   - What we know: `householdStore` currently selects `profiles(id, display_name, avatar_url)` in member queries
   - What's unclear: Whether to update ALL existing joins or create a shared constant
   - Recommendation: Create a `PROFILE_SELECT` constant: `'id, display_name, avatar_url, handle'` and use it in all `.select()` calls that join profiles. Update householdStore, socialStore, and any component-level queries.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 with jest-expo preset |
| Config file | jest.config.js |
| Quick run command | `npx jest --testPathPattern="handle" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IDEN-01 | Handle format validation (regex, length, reserved words) | unit | `npx jest tests/lib/handle-utils.test.ts -x` | Wave 0 |
| IDEN-01 | Handle auto-suggest from display_name | unit | `npx jest tests/lib/handle-utils.test.ts -x` | Wave 0 |
| IDEN-01 | authStore.updateHandle() sets handle and handles errors | unit | `npx jest tests/stores/authStore.test.ts -x` | Existing (extend) |
| IDEN-02 | authStore.checkHandle() fetches handle from profiles | unit | `npx jest tests/stores/authStore.test.ts -x` | Existing (extend) |
| IDEN-02 | Onboarding step count updated to 7 | unit | `npx jest tests/stores/onboardingStore.test.ts -x` | Existing (extend) |
| IDEN-04 | Profile select constant includes handle field | unit | `npx jest tests/lib/handle-utils.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="handle|auth|onboarding" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/handle-utils.test.ts` -- covers IDEN-01 (validation, suggestions, reserved words)
- [ ] Extend `tests/stores/authStore.test.ts` -- covers IDEN-01/02 (checkHandle, updateHandle)
- [ ] Extend `tests/stores/onboardingStore.test.ts` -- covers step count change to 7

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Handles are not auth credentials |
| V3 Session Management | No | No session changes |
| V4 Access Control | Yes | RLS policy broadening must not expose private profile data |
| V5 Input Validation | Yes | Handle regex + DB CHECK constraint + reserved word blocklist |
| V6 Cryptography | No | No crypto involved |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Handle squatting (reserving popular names) | Denial of Service | Reserved word blocklist; 30-day change cooldown |
| Impersonation via similar handles (l vs 1, O vs 0) | Spoofing | Alphanumeric-only reduces this; no full homoglyph protection needed for a cooking app |
| Uniqueness bypass via race condition | Tampering | UNIQUE index on LOWER(handle) is atomic; catch 23505 error |
| Profile data leakage via broadened RLS | Information Disclosure | New policy allows reading ALL profile columns; evaluate whether to restrict to specific columns via a view or just accept that profiles only contain handle, display_name, avatar_url, created_at (no sensitive data) |

**RLS broadening risk assessment:** The profiles table currently contains: id, display_name, avatar_url, created_at, and (after this phase) handle and handle_changed_at. None of these are sensitive. Email is on auth.users (not profiles), so the broadened SELECT policy is safe. [VERIFIED: codebase migration 00001]

## Sources

### Primary (HIGH confidence)
- SharedKitchen codebase: `supabase/migrations/00001_create_profiles.sql` -- current profiles schema and RLS
- SharedKitchen codebase: `supabase/migrations/00002_create_households.sql` -- co-member profile read policy
- SharedKitchen codebase: `supabase/migrations/00018_create_social_tables.sql` -- kitchen_profiles, feed patterns
- SharedKitchen codebase: `app/_layout.tsx` -- auth/onboarding navigation guard pattern
- SharedKitchen codebase: `src/stores/onboardingStore.ts` -- step management pattern
- SharedKitchen codebase: `src/stores/authStore.ts` -- auth state management pattern
- SharedKitchen codebase: `src/components/social/KitchenSearchBar.tsx` -- debounce pattern
- SharedKitchen codebase: `src/components/food/FoodSearchSheet.tsx` -- debounce pattern
- SharedKitchen codebase: `src/stores/householdStore.ts` -- profile JOIN pattern

### Secondary (MEDIUM confidence)
- Postgres documentation on UNIQUE indexes and NULL handling [ASSUMED but well-established]
- Supabase RLS documentation on multiple SELECT policies being ORed [ASSUMED but well-established]

### Tertiary (LOW confidence)
- Supabase client error code mapping (23505 for unique violations) [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns verified in codebase
- Architecture: HIGH -- extends existing patterns directly (navigation guard, onboarding steps, debounce, RLS)
- Pitfalls: HIGH -- identified from direct codebase analysis of navigation flow and Postgres constraints

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- no external dependency changes expected)
