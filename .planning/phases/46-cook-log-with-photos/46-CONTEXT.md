# Phase 46: Cook Log with Photos - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can record when they cook a recipe with optional photos and notes — building a visible cooking history with count badges and photo galleries on every recipe. Requirements: COOK-01, COOK-02, COOK-03, COOK-04, COOK-05.

</domain>

<decisions>
## Implementation Decisions

### Cook Logging Entry Points
- "I Cooked This" button on recipe detail page, below Start Cooking / Add to Plan row
- Bottom sheet after completing last cooking mode step — "Log this cook?" with photo+note fields
- Notification-style banner on Plan tab for yesterday's unlogged dinners — "Did you cook [recipe]?"
- Photo capture via existing CameraSheet component + gallery picker option

### Cook Log Display
- "Cooked N times" badge on recipe detail, next to rating pill — small green badge with count
- Horizontal scrollable photo strip below ingredients — thumbnails with date + @handle overlay
- Each gallery item shows: photo thumbnail, relative date ("2 days ago"), @handle of who cooked
- Empty state: no gallery section shown, badge shows "Not cooked yet" in muted text

### Storage & Data Model
- Photo compression: resize to max 1200px width, 80% JPEG quality via expo-image-manipulator
- Storage bucket: `cook-logs/{recipe_id}/{user_id}/{timestamp}.jpg`
- New `cook_logs` table: id, recipe_id, user_id, household_id, photo_url, notes, cooked_at, created_at
- Visibility: all household members + anyone following the kitchen (matches feed visibility)

### Claude's Discretion
- Exact placement and styling of the "I Cooked This" button
- Banner design for past meal prompts
- Photo gallery thumbnail size and spacing
- Animation for the cook logging bottom sheet

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- CameraSheet component at src/components/camera/CameraSheet.tsx
- expo-image-manipulator already installed
- Supabase Storage already configured
- Bottom sheet patterns via @gorhom/bottom-sheet
- Cooking mode at app/(app)/cooking/[id].tsx

### Established Patterns
- Photo upload via src/lib/feedHelpers.ts uploadMealPhoto function
- Supabase RLS via is_household_member() function
- Store pattern (zustand) for state management

### Integration Points
- recipe/[id].tsx — add "I Cooked This" button, cook count badge, photo gallery
- cooking/[id].tsx — add post-cook logging prompt
- plan.tsx — add past meal banner (careful: do NOT break scroll structure)
- New cook_logs table + RLS + storage bucket

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing design system.

</specifics>

<deferred>
## Deferred Ideas

- Cook log analytics/stats dashboard
- Cook streaks and achievements
- Social sharing of cook photos to feed (Phase 48 handles feed integration)

</deferred>
