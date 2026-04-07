# Phase 30: Social Database & Kitchen Profiles - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view, search, and share kitchen profiles as the public-facing social identity. This phase creates all social database tables (kitchen_profiles, follows, feed_posts, post_likes, post_comments, saved_recipes, blocked_kitchens) with RLS policies, the kitchen profile UI, kitchen search, and invite-to-follow links.

</domain>

<decisions>
## Implementation Decisions

### Database Schema Design
- New `kitchen_profiles` table separate from `households` — isolates social data from private household logic
- Trigger-maintained denormalized follower/following counters on `kitchen_profiles` — avoid COUNT(*) on every profile load
- Single migration file (00018) for all social tables since they're interdependent via foreign keys
- `follows` table uses `follower_kitchen_id + following_kitchen_id` with unique constraint — kitchen-to-kitchen, not user-to-kitchen

### Kitchen Profile UI & Search
- Kitchen profile screen is a modal pushed from feed cards or search results — not a tab, accessed contextually
- Profile shows: name, avatar (from household), bio, recipe count, follower/following counts, Follow/Unfollow button
- Kitchen search uses text input with live results as you type (`ilike` on kitchen_profiles.display_name)
- Search entry point is a search icon on Plan tab near the feed area

### Invite Links & Privacy
- Reuse existing `invite_code` pattern from households — generate unique code per kitchen, shareable as deep link, tapping auto-follows
- Kitchens are searchable by default with opt-out — privacy toggle in kitchen settings to hide from search
- All household members can follow/unfollow and edit kitchen profile — no social-specific admin role

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `households` table with `invite_code` column — pattern for invite link generation
- `is_household_member()` SECURITY DEFINER function — pattern for RLS helper functions
- `householdStore.ts` — Zustand store pattern for social stores
- `@gorhom/bottom-sheet` — used for modals throughout the app
- Existing `profiles` table with avatar, display_name

### Established Patterns
- Supabase migrations in `supabase/migrations/` numbered sequentially (00001-00017)
- RLS with SECURITY DEFINER helper functions for membership checks
- Zustand stores with Supabase real-time subscriptions
- Modal screens pushed via navigation for detail views

### Integration Points
- `households` table — kitchen_profiles references household_id
- `profiles` table — user identity for social actions
- Plan tab (`app/(app)/(tabs)/plan.tsx`) — search entry point
- Navigation — new kitchen profile modal screen

</code_context>

<specifics>
## Specific Ideas

- Kitchen-to-kitchen follow model (like Venmo but for households, not individuals)
- Bio field on kitchen profile for personality ("The Fill family kitchen — taco Tuesday enthusiasts")
- Recipe count pulled from recipes table (count where household_id matches)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
