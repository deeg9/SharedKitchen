---
phase: 51-comment-photo-attachments
plan: 02
subsystem: database
tags: [supabase, migration, storage]

requires:
  - phase: 51-comment-photo-attachments
    provides: migration 00031_comment_photo_url.sql
provides:
  - Remote Supabase has photo_url column on recipe_comments
  - comment-photos storage bucket exists and is public
affects: [51-03]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Schema push and bucket creation deferred to user — requires Supabase auth"

patterns-established: []

requirements-completed: []

duration: 0min
completed: 2026-04-11
---

# Phase 51 Plan 02: Schema Push + Storage Bucket Summary

**Schema push and storage bucket creation deferred — requires manual Supabase authentication**

## Performance

- **Duration:** N/A (human-action checkpoint)
- **Tasks:** 0/2 (deferred to user)
- **Files modified:** 0

## User Setup Required
**REQUIRED:** Run the following to complete:
1. `supabase db push` — applies migration 00031 adding photo_url column
2. Create `comment-photos` storage bucket in Supabase Dashboard (public, 5MB limit)
3. Add RLS policy: authenticated users can upload to `{userId}/` prefix

---
*Phase: 51-comment-photo-attachments*
*Completed: 2026-04-11 (deferred)*
