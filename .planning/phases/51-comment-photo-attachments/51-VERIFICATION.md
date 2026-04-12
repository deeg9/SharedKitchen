---
phase: 51-comment-photo-attachments
verified: 2026-04-11T00:00:00Z
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Run supabase db push and confirm photo_url column exists on recipe_comments in remote DB"
    expected: "Migration 00031_comment_photo_url.sql applied; recipe_comments table has photo_url text column"
    why_human: "Claude cannot authenticate to the remote Supabase instance — Plan 02 was a human-action checkpoint"
  - test: "Confirm comment-photos storage bucket exists in Supabase Dashboard (Storage) and is public"
    expected: "Bucket named comment-photos is present and set to public access"
    why_human: "Bucket creation requires Supabase Dashboard or authenticated CLI — not verifiable from code inspection"
  - test: "Open a recipe, tap the camera icon in the comment input, select a photo, and submit the comment"
    expected: "Photo appears as a thumbnail below the comment text immediately after posting"
    why_human: "End-to-end photo upload flow requires a running device/simulator with dev build (expo-image-manipulator not available in Expo Go)"
  - test: "Tap a comment photo thumbnail"
    expected: "Full-size photo viewer modal appears with dark background; tapping background or X closes it"
    why_human: "Modal interaction requires a running device/simulator"
---

# Phase 51: Comment Photo Attachments — Verification Report

**Phase Goal:** Users can attach photos to recipe and feed comments -- showing off their cook results, asking questions about a step, or sharing modifications visually
**Verified:** 2026-04-11
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Comment input bar includes a camera/media icon that lets the user attach a photo before submitting the comment | VERIFIED | `CommentInput.tsx` line 120-127: `Pressable` with `MaterialCommunityIcons name="camera"` calls `handlePickPhoto` which calls `launchImageLibraryAsync`. Photo preview with X removal renders conditionally when `photoUri` is truthy. |
| 2 | Comments with photos display a thumbnail image inline within the comment body | VERIFIED | `CommentItem.tsx` lines 67-71: `{comment.photo_url && <Pressable><Image ... style={s.photoThumb} /></Pressable>}`. `CommentReplyItem.tsx` lines 64-68: identical pattern. `photoThumb` style: width 200, height 150, borderRadius 8. |
| 3 | Tapping a comment photo thumbnail opens a full-size view of the image | VERIFIED | `CommentPhotoViewer.tsx` is a `Modal` with `transparent`, `animationType="fade"`, dark background `rgba(0,0,0,0.9)`, full-screen `Image` with `contentFit="contain"`, and X close button. Imported and rendered in both `CommentItem.tsx` and `CommentReplyItem.tsx` via `viewerVisible` state. Pressable overlay dismisses on tap. |
| 4 | Comment photos are compressed client-side and stored in Supabase Storage with CDN-backed URLs | VERIFIED (code) / NEEDS HUMAN (remote infra) | `commentPhotoHelpers.ts`: lazy-imports `expo-image-manipulator`, resizes to 1200px width, JPEG compress 0.7, uploads to `comment-photos` bucket at `{userId}/{Date.now()}.jpg`, returns `getPublicUrl()`. Store calls `uploadCommentPhoto` before insert. Remote DB column and storage bucket cannot be confirmed from code alone — see Human Verification Required. |

**Score:** 4/4 truths verified (code-side). Remote infrastructure requires human confirmation.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00031_comment_photo_url.sql` | photo_url column on recipe_comments | VERIFIED | File exists. Contains `ALTER TABLE recipe_comments ADD COLUMN photo_url text;` — exactly as specified. |
| `src/lib/commentPhotoHelpers.ts` | uploadCommentPhoto function | VERIFIED | Exports `uploadCommentPhoto`. Contains `comment-photos` bucket name, `compress: 0.7`, `resize: { width: 1200 }`. Follows cook log pattern with lazy import. |
| `src/types/database.ts` | photo_url field on RecipeComment types | VERIFIED | `RecipeComment` interface (line 1244): `photo_url: string \| null`. `RecipeCommentInsert` (line 1253): `photo_url?: string \| null`. Table `recipe_comments` Row/Insert/Update (lines 828, 837, 846) all updated. |
| `src/stores/recipeCommentStore.ts` | addComment with photo support | VERIFIED | Imports `uploadCommentPhoto` (line 5). `addComment` params include `photoUri?: string \| null` (line 71). Implementation uploads before insert and sets `photo_url: photoUrl` in the DB insert (line 151). |
| `src/components/comments/CommentInput.tsx` | Camera icon, photo state, preview thumbnail, upload indicator | VERIFIED | `photoUri` state, `handlePickPhoto` with `launchImageLibraryAsync`, 5MB file size guard, 60x60 preview thumbnail with `uploadOverlay` ActivityIndicator when `submitting`, X removal button via `close-circle` icon, `onSubmit` signature updated to include `photoUri`. |
| `src/components/comments/CommentItem.tsx` | Photo thumbnail display in comments | VERIFIED | Conditional `photo_url` thumbnail render with `Pressable` to open viewer, `photoThumb` style (200x150, radius 8), `CommentPhotoViewer` imported and rendered. |
| `src/components/comments/CommentPhotoViewer.tsx` | Full-size photo modal with dark background | VERIFIED | Exports `CommentPhotoViewer`. Modal with `transparent`, dark overlay `rgba(0,0,0,0.9)`, `Image contentFit="contain"`, close button top-right, tap-overlay-to-dismiss. |
| `src/components/comments/RecipeCommentsSection.tsx` | Wiring for photo URL in onSubmit and photo viewer state | VERIFIED | `handleSubmit` (line 57) accepts `photoUri?: string \| null` and passes `photoUri: photoUri ?? null` to `addComment`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `recipeCommentStore.ts` | `commentPhotoHelpers.ts` | `uploadCommentPhoto` import | WIRED | Line 5: `import { uploadCommentPhoto } from '../lib/commentPhotoHelpers'`. Called in `addComment` at line 141. |
| `recipeCommentStore.ts` | supabase recipe_comments | insert with photo_url | WIRED | Lines 144-153: `.insert({..., photo_url: photoUrl })`. `photoUrl` set by `uploadCommentPhoto` call or null. |
| `CommentInput.tsx` | expo-image-picker | `launchImageLibraryAsync` | WIRED | Lines 35-48: `const ImagePicker = await import('expo-image-picker')` + `launchImageLibraryAsync(...)`. |
| `CommentInput.tsx` | `RecipeCommentsSection.tsx` | `onSubmit` callback with `photoUri` | WIRED | `onSubmit` prop type updated to `(body, parentId?, photoUri?) => Promise<boolean>`. `handleSend` passes `photoUri` at line 58. |
| `CommentItem.tsx` | `CommentPhotoViewer.tsx` | Pressable onPress sets viewer URL | WIRED | Import at line 11. `viewerVisible` state, `onPress={() => setViewerVisible(true)}` on thumbnail, `CommentPhotoViewer` rendered at lines 82-84. |
| `RecipeCommentsSection.tsx` | `recipeCommentStore.ts` | `addComment` with `photoUri` param | WIRED | Line 59-65: `addComment({ recipeId, userId, body, parentId, photoUri: photoUri ?? null })`. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CommentItem.tsx` | `comment.photo_url` | `fetchComments` → Supabase `recipe_comments` `SELECT *` | Yes — all columns selected including `photo_url` (line 90 store: `select('*, profiles(handle, avatar_url)')`) | FLOWING |
| `CommentInput.tsx` | `photoUri` state | `launchImageLibraryAsync` → local device URI | Yes — set from picker `asset.uri` | FLOWING |
| `commentPhotoHelpers.ts` | `uploadCommentPhoto` return value | Supabase Storage upload + `getPublicUrl` | Yes — returns CDN URL or null on error | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — core behavior (photo picker, upload, modal) requires a running device with a dev build. expo-image-manipulator is not available in Node.js test context.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| CMNT-P01 | 51-03-PLAN.md | Comment input bar includes a camera/media icon button for attaching a photo | SATISFIED | `CommentInput.tsx` has camera icon Pressable invoking `launchImageLibraryAsync` |
| CMNT-P02 | 51-03-PLAN.md | Attached photos display as thumbnails within the comment body | SATISFIED | `CommentItem.tsx` and `CommentReplyItem.tsx` both render `photo_url` as 200x150 thumbnail with 8px radius |
| CMNT-P03 | 51-03-PLAN.md | Tapping a comment photo thumbnail expands it to full-size view | SATISFIED | `CommentPhotoViewer.tsx` modal rendered in both comment components via `viewerVisible` state |
| CMNT-P04 | 51-01-PLAN.md | Comment photos are compressed and stored in Supabase Storage | SATISFIED (code) | `commentPhotoHelpers.ts` compresses 1200px/0.7 JPEG and uploads to `comment-photos` bucket; remote DB/bucket needs human confirmation |

No orphaned requirements — all four phase-51 IDs (CMNT-P01 through CMNT-P04) are accounted for across the three plans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No stubs, placeholders, empty implementations, or TODO markers found in phase-51 files |

The optimistic `photo_url: null` in `addComment` (store line 126) is not a stub — it is an intentional optimistic state that is replaced with real data after the insert returns (store line 159-163).

---

### Human Verification Required

#### 1. Remote Database Migration

**Test:** Run `supabase db push` from the project root (or confirm it was already run after Phase 51 Plan 02).
**Expected:** Migration `00031_comment_photo_url.sql` applied. In Supabase Dashboard > Table Editor > `recipe_comments`, a `photo_url` column of type `text` (nullable) is visible.
**Why human:** Plan 02 was explicitly a human-action checkpoint. Claude cannot authenticate to the remote Supabase project to verify the column exists.

#### 2. comment-photos Storage Bucket

**Test:** Open Supabase Dashboard > Storage and check for a bucket named `comment-photos`.
**Expected:** Bucket exists, is set to Public, and has RLS policies permitting authenticated users to INSERT under their own `userId/` path prefix and all users to SELECT.
**Why human:** Bucket creation and RLS policies require authenticated Supabase access — not inferable from code alone.

#### 3. End-to-End Photo Attach and Submit

**Test:** On a device or simulator with the dev build installed, open a recipe, tap the camera icon in the comment input bar, select a photo from the library, and tap Send.
**Expected:** Comment appears in the thread with the photo displayed as a rounded thumbnail (200x150) below the comment text. The upload progress overlay (ActivityIndicator) appears on the preview during submission.
**Why human:** Full upload flow requires expo-image-manipulator (dev build only) and an authenticated Supabase session with the `comment-photos` bucket populated.

#### 4. Full-Size Photo Viewer

**Test:** Tap a comment thumbnail in the thread.
**Expected:** `CommentPhotoViewer` modal opens with the photo displayed at full-screen size on a near-black (`rgba(0,0,0,0.9)`) background. An X button is visible top-right. Tapping the background or the X closes the modal.
**Why human:** Requires a running app session with an existing comment that has a `photo_url`.

---

### Gaps Summary

No code gaps. All four roadmap success criteria are fully implemented in the codebase:

- Camera icon with image picker and preview (SC1): complete in `CommentInput.tsx`
- Thumbnail display in comment body (SC2): complete in `CommentItem.tsx` and `CommentReplyItem.tsx`
- Full-size viewer modal (SC3): complete in `CommentPhotoViewer.tsx`, wired in both comment components
- Client-side compression + Supabase Storage upload (SC4): complete in `commentPhotoHelpers.ts`, wired through store

The only open items are infrastructure confirmations (remote DB migration and storage bucket) that were intentionally deferred to a human-action checkpoint in Plan 02. These are operational deployment steps, not code gaps.

---

_Verified: 2026-04-11_
_Verifier: Claude (gsd-verifier)_
