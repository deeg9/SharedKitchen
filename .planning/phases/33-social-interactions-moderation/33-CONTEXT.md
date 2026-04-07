# Phase 33: Social Interactions & Moderation - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can engage with feed content through likes, comments, recipe saving, and Cook This Too. Moderation tools (report/block) ship alongside comments. This phase adds all interaction UI and data flows to the existing feed cards.

</domain>

<decisions>
## Implementation Decisions

### Likes & Comments UX
- Like: heart icon fills red with brief scale animation — standard micro-interaction
- Comment input: bottom sheet with text input and send button — opens from comment icon on feed card
- Comment display: show 2 most recent comments below card, "View all X comments" link opens full comment bottom sheet

### Save Recipe & Moderation
- Save recipe: bookmark icon on feed card → clone recipe to user's library with "Saved from Kitchen X" badge → success toast
- Cook This Too: separate button next to bookmark → clone recipe + open MealSlotPickerSheet (reuse from v4.0) → save + assign
- Report/block: long-press on feed card → action sheet with "Report" and "Block Kitchen" options. Report saves to reported_content table. Block adds to blocked_kitchens table and filters feed.

### Claude's Discretion
- Comment bottom sheet layout details
- Optimistic like count update implementation
- Recipe clone implementation (copy all fields, set saved_from_kitchen_id)
- Blocked kitchen filtering in feed query

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FeedCard.tsx` — action bar already has placeholder icons for like/comment/save
- `socialStore.ts` — extend with like, comment, save, report, block methods
- `MealSlotPickerSheet` from v4.0 — reuse for Cook This Too day/slot picking
- `recipeStore.ts` — existing addRecipe method pattern for recipe cloning
- `@gorhom/bottom-sheet` — for comment sheet
- `blocked_kitchens` table (created in Phase 30 migration)

### Established Patterns
- Optimistic UI: follow/unfollow in Phase 31
- Bottom sheets: used throughout app
- Recipe creation: recipeStore.addRecipe pattern

### Integration Points
- `FeedCard.tsx` — wire action bar icons
- `socialStore.ts` — add interaction methods
- `post_likes`, `post_comments` tables
- `blocked_kitchens` table — filter in feed query
- `recipeStore.ts` — clone recipe method

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
