# Phase 51: Comment Photo Attachments - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can attach photos to recipe and feed comments — showing off their cook results, asking questions about a step, or sharing modifications visually. Single photo per comment, compressed client-side, stored in Supabase Storage with CDN-backed URLs.

</domain>

<decisions>
## Implementation Decisions

### Photo Capture & Upload
- Use expo-image-picker for system media picker (camera + gallery), same pattern as cook log photo upload
- Compress with expo-image-manipulator: resize to max 1200px wide, JPEG 0.7 quality (same as cookLogHelpers.ts)
- Store in Supabase Storage `comment-photos` bucket with CDN-backed public URLs
- Single photo per comment (keeps UI simple, matches social post feel)
- 5MB file size limit before compression with user-friendly error message

### Photo Display in Comments
- Rounded rectangle thumbnail (8px radius) below comment text, 200px wide, aspect ratio preserved
- Full-size view in modal overlay with pinch-to-zoom, dark background, tap outside to dismiss
- Preview before submit: thumbnail appears in input bar after selection, with X button to remove
- Progress indicator on thumbnail during upload, shows upload percentage, disables send until complete

### Database & Storage
- Add nullable `photo_url` text column to `recipe_comments` table via migration
- Public Supabase Storage bucket (`comment-photos`)
- File naming: `{userId}/{commentId}-{timestamp}.jpg`
- RLS policy: authenticated users can upload to their own userId folder

### Claude's Discretion
- Exact animation for modal open/close
- Error handling for failed uploads (retry logic, fallback)
- Image caching strategy
- Whether to use react-native-image-viewing or custom Modal for full-size view

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/comments/CommentInput.tsx` (156 lines) — comment input bar, add photo icon here
- `src/components/comments/CommentItem.tsx` (132 lines) — individual comment, add thumbnail here
- `src/components/comments/RecipeCommentsSection.tsx` (207 lines) — comment list container
- `src/stores/recipeCommentStore.ts` (203 lines) — comment CRUD operations
- `src/lib/cookLogHelpers.ts` — existing image compression and upload pattern
- `src/lib/images.ts` — image utility functions
- `src/lib/vision.ts` — image manipulation patterns

### Established Patterns
- Image picker: expo-image-picker used in cook log flow
- Image compression: expo-image-manipulator with resize + JPEG quality
- Storage: Supabase Storage with public bucket URLs
- Comments: recipe_comments table with RLS, addComment/fetchComments in recipeCommentStore

### Integration Points
- CommentInput.tsx: add camera icon and photo state
- CommentItem.tsx: render photo thumbnail if photo_url exists
- recipeCommentStore.ts: add photo_url to addComment parameters
- New migration: add photo_url column to recipe_comments table

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
