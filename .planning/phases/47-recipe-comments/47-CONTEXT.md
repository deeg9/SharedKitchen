# Phase 47: Recipe Comments - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can have conversations on recipes with threaded comments that are visually distinct from private recipe notes — enabling recipe discussion within households and across followed kitchens. Requirements: CMNT-01, CMNT-02, CMNT-03, CMNT-04.

</domain>

<decisions>
## Implementation Decisions

### Comment Structure & Threading
- Flat with reply-to — single level of nesting (reply shows parent context inline)
- Comments are public (household + followers), notes are private per-user — visually separated sections
- Sticky input bar at bottom of comment section (like iMessage) with @handle shown
- Max 500 characters per comment (matches cook log notes limit)

### Comment Display & Interactions
- "Comments" section below cook photo gallery on recipe detail — with count badge in section header
- Delete own comments via long-press; recipe creator can delete any comment
- Each comment shows: avatar + @handle + relative time, body below
- No real-time updates — pull-to-refresh and refresh on post

### Data & Visibility
- Visibility: household members + anyone following the kitchen (matches cook log/feed visibility)
- No notifications for v8.0 — keep simple
- New `recipe_comments` table: id, recipe_id, user_id, parent_id (nullable for replies), body (max 500), created_at
- RLS: household-based SELECT, user-based INSERT, user+creator DELETE

### Claude's Discretion
- Visual styling of comment bubbles and reply indentation
- Input bar animation and keyboard handling
- Empty state messaging for comments section
- Reply UX (how user initiates and sees reply context)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- CommentSheet component exists at src/components/social/CommentSheet.tsx (feed comments — different from recipe comments but similar pattern)
- Avatar component, @handle display patterns from Phase 44
- Bottom sheet patterns via @gorhom/bottom-sheet
- date-fns for relative time formatting

### Established Patterns
- RLS via is_household_member() function
- Zustand stores for data management
- Long-press delete with Alert confirmation (cook log pattern)

### Integration Points
- recipe/[id].tsx — add Comments section below CookPhotoGallery
- New recipe_comments table + RLS
- commentStore (new) for fetch/create/delete

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing design system.

</specifics>

<deferred>
## Deferred Ideas

- Comment notifications (push/in-app)
- @mention support in comments
- Comment reactions (emoji)
- Comment editing (only delete for v8.0)

</deferred>
