# Phase 30: Social Database & Kitchen Profiles - Research

**Researched:** 2026-04-06
**Domain:** Supabase Postgres schema design, RLS policies, React Native profile UI, deep link sharing
**Confidence:** HIGH

## Summary

Phase 30 creates the foundational social data layer for SharedKitchen v5.0. The core deliverables are: (1) a single Supabase migration (00018) creating all social tables (`kitchen_profiles`, `follows`, `feed_posts`, `post_likes`, `post_comments`, `saved_recipes`, `blocked_kitchens`) with RLS policies and triggers, (2) a kitchen profile viewing screen, (3) kitchen search by name, and (4) invite-to-follow link sharing. This phase does NOT implement the follow/unfollow action itself (that is Phase 31 FOLL-01), but DOES create the `follows` table and display follower/following counts on kitchen profiles (FOLL-03).

The existing codebase provides strong patterns to follow: `is_household_member()` SECURITY DEFINER function for RLS helpers, Zustand stores for state management, `@gorhom/bottom-sheet` for modals, and `Share.share()` from React Native for invite sharing. The `invite_code` column pattern on `households` is directly reusable for kitchen invite codes.

**Primary recommendation:** Build the migration first with all social tables, then the `socialStore` for kitchen profile CRUD, then the profile UI screen and search, then invite link sharing. Keep the migration as a single file since all tables are interdependent via foreign keys.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `kitchen_profiles` table separate from `households` -- isolates social data from private household logic
- Trigger-maintained denormalized follower/following counters on `kitchen_profiles` -- avoid COUNT(*) on every profile load
- Single migration file (00018) for all social tables since they're interdependent via foreign keys
- `follows` table uses `follower_kitchen_id + following_kitchen_id` with unique constraint -- kitchen-to-kitchen, not user-to-kitchen
- Kitchen profile screen is a modal pushed from feed cards or search results -- not a tab, accessed contextually
- Profile shows: name, avatar (from household), bio, recipe count, follower/following counts, Follow/Unfollow button
- Kitchen search uses text input with live results as you type (`ilike` on kitchen_profiles.display_name)
- Search entry point is a search icon on Plan tab near the feed area
- Reuse existing `invite_code` pattern from households -- generate unique code per kitchen, shareable as deep link, tapping auto-follows
- Kitchens are searchable by default with opt-out -- privacy toggle in kitchen settings to hide from search
- All household members can follow/unfollow and edit kitchen profile -- no social-specific admin role

### Claude's Discretion
None explicitly listed -- all decisions were locked during discussion.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KITC-01 | User can view a kitchen's public profile (name, avatar, bio, recipe count, follower/following counts) | `kitchen_profiles` table with denormalized counters + profile modal screen. Recipe count via COUNT from `recipes` table where `household_id` matches. |
| KITC-02 | User can search for kitchens by name to discover and follow | `ilike` search on `kitchen_profiles.display_name`. Live results via text input on Plan tab. `is_searchable` column for opt-out. |
| KITC-03 | User can share an invite link that lets someone follow their kitchen | Reuse `invite_code` pattern from households. `kitchen_profiles.invite_code` column. `Share.share()` from React Native. Deep link handling via expo-router. |
| FOLL-03 | Follower/following counts display on kitchen profile | Denormalized `follower_count` and `following_count` columns on `kitchen_profiles`, maintained by triggers on `follows` table insert/delete. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.100.0 | Database queries, RLS, storage | Already installed. All social tables accessed through existing client. [VERIFIED: package.json] |
| `zustand` | ^5.0.12 | State management for socialStore | Existing pattern for all stores in codebase. [VERIFIED: package.json] |
| `expo-router` | ~4.1.11 | Navigation to kitchen profile modal | Already installed. Modal screen routing via `app/(app)/kitchen/[id].tsx`. [VERIFIED: package.json] |
| `@gorhom/bottom-sheet` | existing | Kitchen settings / edit profile sheet | Already used throughout app for modals. [VERIFIED: codebase] |
| `expo-image` | 55.0.8 | Cached avatar/photo display on profiles | Needed for performant image rendering in search results and profiles. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-clipboard` | existing | Copy invite code to clipboard | Already used in `InviteMembersStep.tsx` for household invite codes. [VERIFIED: codebase] |
| React Native `Share` | built-in | Share invite link via system share sheet | Already used in `InviteMembersStep.tsx`. No additional dependency. [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ilike` search | `pg_trgm` + GIN index | `ilike` is sufficient at current scale (<10K kitchens). Add `pg_trgm` later if needed. [ASSUMED] |
| Expo Router deep links | Custom URL scheme | Expo Router handles deep links natively. No custom setup needed. [ASSUMED] |

**Installation:**
```bash
npx expo install expo-image
```

**Version verification:**
- `expo-image`: 55.0.8 confirmed [VERIFIED: npm registry 2026-04-06]

## Architecture Patterns

### Recommended Project Structure
```
supabase/
└── migrations/
    └── 00018_create_social_tables.sql    # All social tables, RLS, triggers

src/
├── stores/
│   └── socialStore.ts                     # NEW: kitchen profiles, search, invite codes
├── components/
│   ├── social/
│   │   ├── KitchenProfileCard.tsx         # Profile header (avatar, name, bio, counts)
│   │   ├── KitchenSearchBar.tsx           # Search input with live results
│   │   └── KitchenSearchResult.tsx        # Single search result row
│   └── household/
│       └── InviteCard.tsx                 # EXISTING: reuse pattern for kitchen invite
├── types/
│   └── database.ts                        # MODIFIED: add social table types

app/
└── (app)/
    └── kitchen/
        └── [id].tsx                       # NEW: kitchen profile modal screen
```

### Pattern 1: Kitchen-to-Kitchen Follow Model
**What:** The `follows` table uses `follower_kitchen_id` and `following_kitchen_id`, both referencing `kitchen_profiles.id`. This means a household follows another household, not a user following a kitchen. [VERIFIED: CONTEXT.md locked decision]

**IMPORTANT DISCREPANCY:** The ARCHITECTURE.md research shows `follower_user_id` (user-to-kitchen model), but the CONTEXT.md locks kitchen-to-kitchen follows (`follower_kitchen_id + following_kitchen_id`). The CONTEXT.md decision takes precedence.

**When to use:** All follow-related queries. When a user taps "Follow", the system resolves their active household's `kitchen_profile_id` as the follower.

**Schema:**
```sql
-- Source: CONTEXT.md locked decision (kitchen-to-kitchen)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  following_kitchen_id UUID NOT NULL REFERENCES kitchen_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_kitchen_id, following_kitchen_id),
  CHECK (follower_kitchen_id != following_kitchen_id) -- prevent self-follow
);
```

### Pattern 2: Denormalized Counters via Triggers
**What:** `kitchen_profiles` has `follower_count` and `following_count` columns updated by triggers on the `follows` table. [VERIFIED: CONTEXT.md locked decision]

**Why:** Avoids COUNT(*) on every profile load. Profile screen reads counts directly from `kitchen_profiles` row.

**Example:**
```sql
-- Source: ARCHITECTURE.md pattern (adapted for kitchen-to-kitchen model)
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kitchen_profiles SET follower_count = follower_count + 1
      WHERE id = NEW.following_kitchen_id;
    UPDATE kitchen_profiles SET following_count = following_count + 1
      WHERE id = NEW.follower_kitchen_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE kitchen_profiles SET follower_count = follower_count - 1
      WHERE id = OLD.following_kitchen_id;
    UPDATE kitchen_profiles SET following_count = following_count - 1
      WHERE id = OLD.follower_kitchen_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 3: RLS for Social Tables -- Public Read, Private Write
**What:** Social data uses a different RLS model than household data. Kitchen profiles are readable by anyone authenticated (if `is_public = true`). Write access requires household membership. [VERIFIED: ARCHITECTURE.md]

**Key difference from existing RLS:**
- Existing: `is_household_member(household_id, auth.uid())` gates ALL access
- Social: Anyone authenticated can SELECT public kitchen profiles. Only household members can UPDATE their own profile.

**Helper function:**
```sql
-- Source: ARCHITECTURE.md (adapted)
CREATE OR REPLACE FUNCTION is_kitchen_member(p_kitchen_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM kitchen_profiles kp
    JOIN household_members hm ON hm.household_id = kp.household_id
    WHERE kp.id = p_kitchen_id AND hm.user_id = p_user_id
  );
$$;
```

### Pattern 4: Invite Code for Follow Links
**What:** Reuse the `invite_code` pattern from `households` table. Each kitchen profile gets a unique code. Sharing the code (as a deep link or plain text) allows others to follow.

**Existing pattern (from households):**
```sql
-- Source: 00002_create_households.sql [VERIFIED: codebase]
invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8)
```

**For kitchen profiles:**
```sql
invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8)
```

**Share flow (existing pattern from InviteMembersStep.tsx):**
```typescript
// Source: src/components/onboarding/InviteMembersStep.tsx [VERIFIED: codebase]
await Share.share({
  message: `Follow my kitchen on SharedKitchen! Use code: ${inviteCode}`,
});
```

### Pattern 5: Zustand Store Pattern
**What:** Follow existing store conventions exactly. [VERIFIED: codebase -- householdStore.ts]

```typescript
// Source: src/stores/householdStore.ts pattern [VERIFIED: codebase]
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type KitchenProfile = Database['public']['Tables']['kitchen_profiles']['Row'];

interface SocialState {
  kitchenProfile: KitchenProfile | null;
  searchResults: KitchenProfile[];
  searchLoading: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  fetchKitchenProfile: (kitchenId: string) => Promise<void>;
  fetchMyKitchenProfile: (householdId: string) => Promise<void>;
  searchKitchens: (query: string) => Promise<void>;
  updateKitchenProfile: (id: string, updates: Partial<KitchenProfile>) => Promise<void>;
}
```

### Anti-Patterns to Avoid
- **Modifying existing RLS policies:** NEVER alter RLS on `households`, `profiles`, `recipes`, `meal_plans`, or any existing table. Social tables get their own independent policies. [VERIFIED: PITFALLS.md Pitfall 1]
- **Exposing household_id to followers:** Feed/social queries must reference `kitchen_profiles.id`, never raw `household_id`. [VERIFIED: PITFALLS.md Pitfall 2]
- **Using `auth.uid()` without subselect wrapper in RLS:** Always use `(select auth.uid())` to cache per-statement, not per-row evaluation. [VERIFIED: PITFALLS.md Pitfall 5]
- **User-level social identity:** Social unit is the kitchen (household), not the individual user. [VERIFIED: CONTEXT.md locked decision]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invite code generation | Custom UUID/token generator | `substr(md5(random()::text), 1, 8)` in SQL DEFAULT | Already proven pattern from households table. Short, human-readable codes. [VERIFIED: codebase] |
| Share sheet | Custom sharing UI | React Native `Share.share()` | OS-native share sheet, already used in InviteMembersStep. [VERIFIED: codebase] |
| Clipboard copy | Custom clipboard handler | `expo-clipboard` | Already used in InviteMembersStep. [VERIFIED: codebase] |
| Image caching | Custom cache layer | `expo-image` | Handles disk cache, memory management, blurhash placeholders. [VERIFIED: npm registry] |
| Follower count aggregation | COUNT(*) queries on read | Trigger-maintained counters | Denormalized counters avoid N+1. [VERIFIED: CONTEXT.md locked decision] |
| Search debouncing | Custom timer logic | `setTimeout` with cleanup in useEffect | Standard React pattern, no library needed for simple debounce. [ASSUMED] |

## Common Pitfalls

### Pitfall 1: Household Data Leakage
**What goes wrong:** Adding social visibility accidentally exposes private household data (grocery lists, budgets, pantry, member names) through overly permissive RLS.
**Why it happens:** Temptation to add broad SELECT policies on existing tables to enable social queries.
**How to avoid:** Social tables are completely independent from household tables. `kitchen_profiles` contains only public data. No existing RLS policies are modified.
**Warning signs:** Any migration that ALTERs existing RLS policies on household-scoped tables.
[VERIFIED: PITFALLS.md Pitfall 1]

### Pitfall 2: Self-Follow Prevention
**What goes wrong:** A kitchen can follow itself, corrupting follower counts and creating feed loops.
**Why it happens:** No CHECK constraint on `follows` table.
**How to avoid:** Add `CHECK (follower_kitchen_id != following_kitchen_id)` to `follows` table.
**Warning signs:** Kitchen appearing in its own followers list.
[ASSUMED]

### Pitfall 3: Kitchen Profile Not Created on Household Creation
**What goes wrong:** Existing households have no `kitchen_profiles` row. When users navigate to social features, queries return null.
**Why it happens:** `kitchen_profiles` is a new table. Existing households predate it.
**How to avoid:** Create kitchen profiles lazily on first social interaction OR via a backfill migration. The lazy approach is simpler: when `socialStore.fetchMyKitchenProfile(householdId)` finds no profile, auto-create one using the household name.
**Warning signs:** "Profile not found" errors for existing users.
[ASSUMED]

### Pitfall 4: Search Performance with ILIKE
**What goes wrong:** `ilike '%query%'` cannot use standard B-tree indexes, causing sequential scans as kitchen_profiles grows.
**Why it happens:** Leading wildcard in ILIKE pattern defeats index usage.
**How to avoid:** For initial scale (<10K kitchens), this is acceptable. Use `ilike 'query%'` (prefix match) instead of `'%query%'` where possible. Add `pg_trgm` GIN index later if needed.
**Warning signs:** Search queries exceeding 100ms.
[ASSUMED]

### Pitfall 5: Multi-Household User Identity
**What goes wrong:** User belongs to multiple households. When they search/follow kitchens, it's unclear which kitchen identity they're acting as.
**Why it happens:** The `activeHouseholdId` from `householdStore` determines context, but UI may not make this clear.
**How to avoid:** Social actions always use the active household's kitchen profile. Show the active kitchen name in the search/social UI so users know which identity they're using.
**Warning signs:** User confusion about which kitchen is following.
[VERIFIED: STATE.md blocker -- "Multi-household feed context" noted]

## Code Examples

### Kitchen Profile Schema (Full Migration Structure)
```sql
-- Source: CONTEXT.md decisions + ARCHITECTURE.md schema [VERIFIED]
CREATE TABLE kitchen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT CHECK (char_length(bio) <= 300),
  avatar_url TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  is_public BOOLEAN DEFAULT true,         -- searchable by default
  is_searchable BOOLEAN DEFAULT true,     -- opt-out from search
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kitchen_profiles_household ON kitchen_profiles(household_id);
CREATE INDEX idx_kitchen_profiles_display_name ON kitchen_profiles(display_name);
CREATE INDEX idx_kitchen_profiles_invite_code ON kitchen_profiles(invite_code);
```

### Kitchen Search Query
```typescript
// Source: CONTEXT.md decision (ilike on display_name) [VERIFIED]
searchKitchens: async (query: string) => {
  if (!query.trim()) {
    set({ searchResults: [] });
    return;
  }
  set({ searchLoading: true });
  const { data, error } = await supabase
    .from('kitchen_profiles')
    .select('id, display_name, bio, avatar_url, follower_count')
    .eq('is_searchable', true)
    .ilike('display_name', `%${query}%`)
    .limit(20);

  set({
    searchResults: data ?? [],
    searchLoading: false,
    error: error?.message ?? null,
  });
}
```

### Kitchen Profile Screen Data Fetch
```typescript
// Source: combined from CONTEXT.md decisions [VERIFIED]
fetchKitchenProfile: async (kitchenId: string) => {
  set({ loading: true });
  const { data, error } = await supabase
    .from('kitchen_profiles')
    .select('*')
    .eq('id', kitchenId)
    .single();

  if (data) {
    // Get recipe count from recipes table
    const { count } = await supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', data.household_id);

    set({
      viewedProfile: { ...data, recipe_count: count ?? 0 },
      loading: false,
    });
  }
}
```

### Invite Link Sharing
```typescript
// Source: InviteMembersStep.tsx pattern [VERIFIED: codebase]
import { Share } from 'react-native';

const handleShareInvite = async (inviteCode: string) => {
  await Share.share({
    message: `Follow my kitchen on SharedKitchen! Use code: ${inviteCode}`,
    // Deep link format: sharedkitchen://follow/${inviteCode}
  });
};
```

### RLS Policy Pattern for Kitchen Profiles
```sql
-- Source: ARCHITECTURE.md + codebase RLS patterns [VERIFIED]
ALTER TABLE kitchen_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view public/searchable profiles
CREATE POLICY "Anyone can view public kitchens"
  ON kitchen_profiles FOR SELECT
  USING (
    is_public = true
    OR is_household_member(household_id, (select auth.uid()))
  );

-- Household members can update their kitchen profile
CREATE POLICY "Household members can update kitchen profile"
  ON kitchen_profiles FOR UPDATE
  USING (is_household_member(household_id, (select auth.uid())));

-- Household members can insert kitchen profile (for lazy creation)
CREATE POLICY "Household members can create kitchen profile"
  ON kitchen_profiles FOR INSERT
  WITH CHECK (is_household_member(household_id, (select auth.uid())));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.uid()` in RLS policies | `(select auth.uid())` subselect wrapper | Supabase docs 2024 | Up to 99.99% performance improvement on per-row evaluation [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| `react-native-fast-image` | `expo-image` | 2023 (fast-image unmaintained) | expo-image is the official Expo-managed replacement with SDWebImage backend [VERIFIED: STACK.md] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ilike` search is sufficient at <10K kitchens without pg_trgm | Common Pitfalls | Search may be slow sooner than expected; fixable via migration |
| A2 | Expo Router handles deep links for `sharedkitchen://follow/CODE` natively | Standard Stack | May need custom linking config; low risk |
| A3 | Search debouncing with setTimeout is sufficient (no library needed) | Don't Hand-Roll | Could cause excessive queries; easily fixed with lodash.debounce |
| A4 | Lazy kitchen profile creation is better than backfill migration | Common Pitfalls | Could cause race conditions; backfill is safer but requires data migration |

## Open Questions

1. **Deep link format for invite-to-follow**
   - What we know: Existing invite codes are plain text shared via `Share.share()`. CONTEXT.md says "shareable as deep link, tapping auto-follows."
   - What's unclear: Whether to use `sharedkitchen://follow/CODE` (custom scheme) or `https://sharedkitchen.app/follow/CODE` (universal link). Universal links require server-side AALD/apple-app-site-association setup.
   - Recommendation: Use plain text code sharing for Phase 30 (matching existing household invite pattern). Deep link support can be added incrementally.

2. **Recipe count on kitchen profile**
   - What we know: CONTEXT.md says profile shows "recipe count." The `recipes` table has `household_id`.
   - What's unclear: Should recipe count be denormalized on `kitchen_profiles` (like follower/following counts) or computed on read?
   - Recommendation: Compute on read via `COUNT` for now. Recipe count changes less frequently than follow counts, and a single COUNT query per profile view is cheap.

3. **Kitchen profile creation timing**
   - What we know: New table. Existing households have no kitchen profile.
   - What's unclear: Create on first social interaction (lazy) vs. backfill all existing households?
   - Recommendation: Lazy creation with auto-populate from household name. Add a helper function `getOrCreateKitchenProfile(householdId)` in socialStore.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config file | `jest.config.js` (inferred from package.json `"test": "jest"`) |
| Quick run command | `npx jest --testPathPattern=social --bail` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KITC-01 | View kitchen profile with name, avatar, bio, counts | integration | `npx jest --testPathPattern=socialStore --bail` | Wave 0 |
| KITC-02 | Search kitchens by name with live results | integration | `npx jest --testPathPattern=socialStore --bail` | Wave 0 |
| KITC-03 | Generate and share invite code | unit | `npx jest --testPathPattern=socialStore --bail` | Wave 0 |
| FOLL-03 | Follower/following counts on profile | integration (DB trigger) | Manual verification via Supabase SQL editor | N/A |
| DB-RLS | Social RLS policies block unauthorized access | manual | Supabase SQL editor test queries | N/A |

### Maestro E2E Flows (existing pattern)
| Flow | Purpose | File Exists? |
|------|---------|-------------|
| kitchen-profile-view | View a kitchen profile from search | Wave 0 |
| kitchen-search | Search for kitchens by name | Wave 0 |

### Wave 0 Gaps
- [ ] `src/stores/__tests__/socialStore.test.ts` -- covers KITC-01, KITC-02, KITC-03
- [ ] `.maestro/kitchen-profile-view.yaml` -- E2E for profile viewing
- [ ] `.maestro/kitchen-search.yaml` -- E2E for search flow

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing Supabase Auth unchanged |
| V3 Session Management | no | Existing Supabase Auth unchanged |
| V4 Access Control | yes | RLS policies on all social tables. SECURITY DEFINER helpers. Never expose household_id to followers. |
| V5 Input Validation | yes | Bio field max 300 chars (CHECK constraint). Display name required (NOT NULL). Invite code auto-generated (not user-input). |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Household data leakage via social queries | Information Disclosure | Separate `kitchen_profiles` table. No modification to existing RLS. Social queries never join household-scoped tables. [VERIFIED: PITFALLS.md] |
| Invite code brute-force | Tampering | 8-char alphanumeric codes = 2.8 trillion combinations. Rate limiting on follow-by-code endpoint. [ASSUMED] |
| Kitchen profile bio/name injection | Tampering | Plain text only. Length constraints in DB CHECK. Client-side Text component (not WebView). [VERIFIED: PITFALLS.md] |
| Self-follow manipulation | Tampering | CHECK constraint `follower_kitchen_id != following_kitchen_id` on follows table. [ASSUMED] |
| Follower count manipulation | Tampering | Trigger-maintained counters (not client-settable). Unique constraint on follows prevents duplicates. [VERIFIED: CONTEXT.md] |

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/00002_create_households.sql` -- `is_household_member()` SECURITY DEFINER pattern, `invite_code` column pattern
- Codebase: `supabase/migrations/00001_create_profiles.sql` -- profiles table schema, RLS policies
- Codebase: `src/stores/householdStore.ts` -- Zustand store pattern, household CRUD
- Codebase: `src/components/onboarding/InviteMembersStep.tsx` -- Share.share() and clipboard invite code pattern
- Codebase: `src/types/database.ts` -- TypeScript type generation pattern
- npm registry: `expo-image` 55.0.8 confirmed current

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- Full social schema design, RLS policies, data flow patterns
- `.planning/research/PITFALLS.md` -- 7 critical pitfalls with prevention strategies
- `.planning/research/STACK.md` -- Stack additions analysis, only expo-image needed

### Tertiary (LOW confidence)
- Deep link handling via expo-router -- needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified in codebase or npm registry
- Architecture: HIGH -- schema design locked in CONTEXT.md, patterns from ARCHITECTURE.md verified against codebase
- Pitfalls: HIGH -- comprehensive pitfalls documented in PITFALLS.md, cross-verified with codebase patterns
- Security: HIGH -- RLS patterns directly from existing codebase, threat model from PITFALLS.md

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable domain, Supabase patterns well-established)
