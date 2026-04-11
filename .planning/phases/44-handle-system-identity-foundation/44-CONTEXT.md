# Phase 44: Handle System & Identity Foundation - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Every user has a unique @handle that identifies them across the app — new users set it during onboarding, existing users set it via a blocking interstitial. Handles appear on all user-generated content. Requirements: IDEN-01, IDEN-02, IDEN-04.

</domain>

<decisions>
## Implementation Decisions

### Handle Format & Validation
- Lowercase alphanumeric + underscores only, 3-20 characters
- "@" prefix is display-only — stored without it in `profiles.handle`
- Auto-suggest from display_name: lowercase, strip spaces/special chars, append random digits if taken
- Block reserved words (admin, support, sharedkitchen, help, etc.) via app-side blocklist array

### Existing User Migration UX
- Blocking interstitial — user can't use app until handle is set
- Simple modal with auto-suggested handle + edit field, one tap to accept
- If suggested handle is taken, show alternatives with random 2-digit suffix
- Handles can be changed once per 30 days from profile settings
- Column added as NULLABLE, app enforces completeness — never NOT NULL at DB level

### Handle Display Across App
- Show @handle on: recipe detail (attribution), feed posts (author), cook logs (who cooked), comments (author), profile screen
- @handle is primary identity, display_name as secondary subtitle where space allows
- Existing feed posts backfilled via JOIN to kitchen_profiles → profiles at render time (no data migration)
- Profiles RLS broadened: any authenticated user can read handle + avatar_url + display_name

### Claude's Discretion
- Onboarding flow integration: where exactly in the signup flow the handle step appears
- Handle uniqueness check debounce timing
- Visual design of the handle setup modal (follows existing design system)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `profiles` table with id, display_name, avatar_url, created_at
- `householdStore` joins profiles via `select('*, profiles(id, display_name, avatar_url)')`
- `socialStore` handles kitchen_profiles CRUD with display_name, bio, avatar_url
- Onboarding flow exists at app/(app)/onboarding/

### Established Patterns
- Zustand stores with Supabase client queries
- RLS policies on all tables
- Profile data accessed via foreign key joins, not denormalization

### Integration Points
- `profiles` table (add handle column)
- `householdStore` member queries (include handle in join)
- `socialStore` kitchen profile display (show @handle)
- Onboarding flow (add handle setup step)
- Auth flow (check handle exists after login)

</code_context>

<specifics>
## Specific Ideas

- User wants @handle to feel like Instagram — primary identity across the app
- Handle search/discovery is in Phase 45 (IDEN-03), not this phase
- This phase is DB + migration + interstitial + display plumbing

</specifics>

<deferred>
## Deferred Ideas

- Handle search/discovery (Phase 45)
- @mentions in comments (future)
- Handle verification badges (future)

</deferred>
