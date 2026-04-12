# Phase 52: Co-Cook Tagging - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can tag who they cooked with when logging a cook — making cooking a social activity that credits participants and appears in the feed. Stored in a junction table, displayed as "cooked with @alice and @bob" on feed posts.

</domain>

<decisions>
## Implementation Decisions

### Co-Cook Search & Selection UI
- Text input with live search: type @handle, dropdown shows matching users from public_profiles view. Tap to add as chip
- Selected co-cooks display as horizontal chips with avatar + handle, each with X to remove
- Field positioned below caption/notes, above "Post to Feed" button (matches social post feel)
- Maximum 5 co-cooks per log entry

### Feed Display
- "cooked with @alice and @bob" text line below caption in feed posts
- Handles are tappable links to user profiles
- Format: "cooked with @handle1" for 1, "cooked with @handle1 and @handle2" for 2, "cooked with @handle1, @handle2, and @handle3" for 3+

### Database & Storage
- New `cook_log_participants` junction table: id (uuid PK), cook_log_id (FK → cook_logs), user_id (FK → profiles), created_at
- RLS: readable by authenticated users, insertable by the cook log creator only
- No notifications for co-cook tags in this phase (future scope)
- No profile integration in this phase (logs appear in feed only)

### Claude's Discretion
- Search debounce timing
- Avatar size in chips
- Animation for adding/removing chips
- Error handling for failed participant inserts

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/cook-log/CookLogSheet.tsx` — main cook log bottom sheet, add co-cook field here
- `src/stores/cookLogStore.ts` — cook log CRUD, add participant insertion
- `src/components/social/FeedCard.tsx` — feed post display, add co-cook line here
- `src/lib/feedHelpers.ts` — feed data formatting
- `public_profiles` view — safe for user search (id, handle, display_name, avatar_url)

### Established Patterns
- Bottom sheet UI with @gorhom/bottom-sheet
- User search via public_profiles view (used in handle system)
- Feed post structure with caption, photo, attribution
- Cook log flow: CookLogSheet → cookLogStore.logCook → feed auto-post

### Integration Points
- CookLogSheet.tsx: add co-cook picker field
- cookLogStore.ts: add participants to logCook function
- FeedCard.tsx: display co-cook line from participants data
- New migration: create cook_log_participants table

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Co-cook push notifications ("You were tagged as co-cook by @user")
- Co-cook profile integration (show on co-cook's cooking history/stats)

</deferred>
