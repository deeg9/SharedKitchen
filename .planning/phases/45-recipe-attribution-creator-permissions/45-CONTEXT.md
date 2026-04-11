# Phase 45: Recipe Attribution & Creator Permissions - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see who created each recipe and only the creator can edit it — establishing clear recipe ownership while preserving collaborative access for legacy recipes. Requirements: ATTR-01, ATTR-02, ATTR-03, ATTR-04, IDEN-03.

</domain>

<decisions>
## Implementation Decisions

### Creator Attribution UI
- Recipe detail displays avatar + "Created by @handle" row below recipe name — matches feed card identity pattern
- Hide Edit button entirely for non-creators — cleaner UX, no confusion
- No "Suggest Edit" option for v8.0 — keep it simple, add later if needed

### Legacy Recipe Handling
- Assign legacy recipes (created_by IS NULL) to household admin via SQL migration
- Legacy recipes remain editable by all household members (special RLS rule)
- Backfill query: UPDATE recipes SET created_by = first household_member by created_at WHERE created_by IS NULL

### User Search & Discovery
- Extend existing KitchenSearchBar with a "People" tab — reuses search overlay pattern
- Search results show: avatar + @handle + display_name, tap navigates to public profile
- Public profile page: avatar, @handle, display_name, their public recipes (grid) — minimal for v8.0
- Following remains kitchen-only (existing system) — user search lets you discover people and their recipes

### RLS & Data Integrity
- New RLS UPDATE policy: allow if auth.uid() = created_by OR legacy (created_by = household admin AND user is household member)
- DELETE follows same rules as edit — only creator can delete, legacy recipes deletable by any household member
- Recipe creation automatically sets created_by: user.id on insert (verify recipeStore.addRecipe)

### Claude's Discretion
- Visual layout of the public profile page
- Search debounce timing and result limit
- Animation/transition for the People tab in search

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `created_by` column already exists on recipes table (UUID, nullable, references profiles.id)
- Recipe detail already fetches creator handle via Phase 44-03 (creatorHandle state in recipe/[id].tsx)
- KitchenSearchBar component exists at src/components/social/KitchenSearchBar.tsx
- Avatar component at src/components/ui/Avatar.tsx
- Handle display patterns established in FeedCard, profile.tsx

### Established Patterns
- RLS via is_household_member() function in migrations
- Supabase queries in stores (recipeStore, socialStore)
- Bottom sheet patterns for overlays (@gorhom/bottom-sheet)

### Integration Points
- recipe/[id].tsx — add creator attribution row, conditional Edit button
- recipe/edit/[id].tsx — no changes needed (RLS handles permissions)
- recipeStore.ts — verify created_by is set on addRecipe
- KitchenSearchBar.tsx — add People tab
- New public profile route needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing design system.

</specifics>

<deferred>
## Deferred Ideas

- "Suggest Edit" feature for non-creators
- User-level follows (currently kitchen-only)
- Full public profile with cook stats, kitchens, followers
- Recipe version history

</deferred>
