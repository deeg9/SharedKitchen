# Phase 31: Follow System - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can build their social graph by following and unfollowing kitchens. This phase adds follow/unfollow functionality to socialStore, wires the Follow button on the kitchen profile screen, and creates a follower/following list screen.

</domain>

<decisions>
## Implementation Decisions

### Follow/Unfollow UX
- Follow/Unfollow button lives on KitchenProfileCard — prominent CTA, toggles between "Follow" and "Following" states
- Optimistic UI for follow — instant toggle with rollback on error, counter updates immediately
- No confirmation to follow; brief toast on unfollow ("Unfollowed Kitchen X") — low friction

### Follower/Following Lists
- Access via tapping follower/following count on KitchenProfileCard — natural pattern
- List item shows kitchen avatar + name + Follow/Unfollow button — same as search results with action button, tap row to navigate to profile
- Single screen with segmented control (Followers / Following) — reuses existing segmented control pattern from Kitchen tab

### Claude's Discretion
- Implementation details for optimistic state rollback on follow/unfollow error
- Loading/empty states for follower/following lists

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `socialStore.ts` — already has fetchKitchenProfile, searchKitchens, getOrCreateKitchenProfile from Phase 30
- `KitchenProfileCard.tsx` — already renders profile with stats row, needs Follow button wiring
- `KitchenSearchResult.tsx` — row component pattern reusable for follower/following list items
- `kitchen/[id].tsx` — profile screen already exists, needs follow button integration
- Kitchen tab segmented control pattern — reusable for Followers/Following toggle

### Established Patterns
- Optimistic UI: existing patterns in groceryStore (check/uncheck items)
- Toast notifications: useActivityToast hook
- Supabase insert/delete for follow/unfollow operations
- Trigger-maintained counters (already in migration 00018)

### Integration Points
- `follows` table (created in Phase 30 migration)
- `kitchen_profiles` follower_count/following_count triggers (already exist)
- Navigation: new followers/following list screen

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
