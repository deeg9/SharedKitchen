# Phase 32: Feed & Auto-Post - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see a chronological feed of meals from kitchens they follow, populated automatically from meal plans. This phase adds the feed UI to the Plan tab, auto-post mechanism when meals are assigned, meal photo upload to Supabase Storage, and infinite scroll pagination.

</domain>

<decisions>
## Implementation Decisions

### Feed Layout on Plan Tab
- Segmented control on Plan tab: "My Plan" / "Feed" — reuses Kitchen tab pattern, feed is a separate view
- Feed empty state: illustration + "Follow kitchens to see what they're eating" with search CTA
- Standard pull-to-refresh on feed list

### Feed Cards & Content
- Card layout: kitchen avatar + name (header), meal name + day/slot, recipe photo (large), timestamp, action bar (like, comment, save)
- Tap photo/title → recipe detail screen; tap kitchen name → kitchen profile
- Large photo in card if available, placeholder gradient if no photo — photos drive engagement

### Auto-Post & Photo Attach
- Auto-post triggered when meal is assigned via planStore.assignRecipe — create feed_post row with snapshot data
- Photo upload: camera button on feed card (own posts only) → existing CameraSheet → upload to Supabase Storage `meal-photos` bucket → attach URL to feed_post
- Create `meal-photos` bucket with public read, authenticated write

### Claude's Discretion
- Feed card component implementation details
- Pagination cursor implementation
- Photo compression before upload (can reuse v4.0 compressForVision)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `planStore.ts` — assignRecipe method is the hook point for auto-post
- `socialStore.ts` — existing store, extend with feed methods
- Kitchen tab segmented control pattern — reusable for Plan tab
- `compressForVision` from `src/lib/vision.ts` — reusable for photo compression
- `CameraSheet` + camera components from v4.0 — reusable for photo capture
- `FlashList` or `FlatList` for performant feed rendering

### Established Patterns
- Cursor-based pagination: research recommended `created_at` cursor with `.lt()`
- Supabase Storage: existing `recipe-images` bucket pattern from migration 00008
- Segmented control: used on Kitchen tab (On Hand / Shopping List)

### Integration Points
- `plan.tsx` — add segmented control and feed view
- `planStore.ts` — modify assignRecipe to auto-create feed_post
- `feed_posts` table (created in Phase 30 migration)
- Supabase Storage — new `meal-photos` bucket
- Navigation to recipe detail and kitchen profile from feed cards

</code_context>

<specifics>
## Specific Ideas

- Feed card inspired by Venmo transaction card but with food photo prominently displayed
- Action bar at bottom of each card for like/comment/save (icons only, counts next to like)
- "Cooking tonight" context line on cards (e.g., "Tuesday Dinner")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
