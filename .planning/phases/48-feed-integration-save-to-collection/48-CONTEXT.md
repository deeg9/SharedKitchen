# Phase 48: Feed Integration & Save to Collection - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Cooking events automatically appear in the social feed and users can save recipes from the feed or other kitchens into their own library — completing the social recipe loop. Requirements: FEED-01, FEED-02, FEED-03, FEED-04.

</domain>

<decisions>
## Implementation Decisions

### Feed Integration
- Auto-create feed_posts entry when createCookLog succeeds — type "cook_log"
- Cook-log feed posts show: recipe name, photo (if any), @handle, note, "Cooked [recipe]" header
- Reuse existing FeedCard layout — no new card design needed
- Existing feed interactions (like, comment, save) work on cook-log posts (standard feed_posts)
- No opt-out for v8.0 — every cook log creates a feed post

### Save to Collection
- Save = duplicate recipe into user's household with `saved_from_kitchen_id` + `saved_from_recipe_id` fields
- Save button on FeedCard (bookmark icon) + on recipe detail when viewing another kitchen's recipe
- Recipe detail shows "Saved from @handle's kitchen" with tappable link below title
- Save button hidden on own kitchen's recipes (already have them)

### Claude's Discretion
- Feed post content formatting for cook log posts
- Save confirmation UX (toast, haptic, animation)
- "Saved from" visual styling
- How the save button integrates with existing FeedCard layout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- FeedCard component at src/components/social/FeedCard.tsx
- FeedList with kitchen profile lookup
- socialStore with feed CRUD
- cookLogStore from Phase 46
- recipeStore with addRecipe

### Established Patterns
- feed_posts table with type field
- Supabase insert triggers
- Optimistic UI updates in stores

### Integration Points
- cookLogStore.createCookLog — add feed post creation after cook log insert
- FeedCard — add save/bookmark button
- recipe/[id].tsx — add "Saved from" attribution, save button for other kitchens' recipes
- recipes table — add saved_from_kitchen_id, saved_from_recipe_id columns

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- Privacy toggle for cook log auto-posting
- Recipe fork tracking (version history across saves)
- "Trending recipes" based on save count
- Save collections/folders

</deferred>
