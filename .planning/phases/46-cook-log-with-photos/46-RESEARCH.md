# Phase 46: Cook Log with Photos - Research

**Researched:** 2026-04-10
**Domain:** Cook logging, photo upload, Supabase Storage, React Native UI
**Confidence:** HIGH

## Summary

This phase adds cook logging to the SharedKitchen app -- users can record when they cook a recipe with optional photo and notes, building a visible cooking history. The feature touches three entry points (recipe detail button, post-cooking-mode prompt, past meal plan prompt) and requires a new `cook_logs` database table with Supabase Storage for photos.

The existing codebase already has all the building blocks: `CameraSheet` for photo capture, `compressForVision` for image compression (needs adjusted settings), `uploadMealPhoto` as a reference pattern for Supabase Storage uploads, `BottomSheet` for sheets, and zustand for state management. The primary work is wiring these together with a new data model and UI components.

**Primary recommendation:** Create a new `cookLogStore.ts` zustand store, a `cook_logs` table with RLS, a dedicated storage bucket `cook-log-photos`, and three UI integration points that share a common `CookLogSheet` bottom sheet component.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- "I Cooked This" button on recipe detail page, below Start Cooking / Add to Plan row
- Bottom sheet after completing last cooking mode step -- "Log this cook?" with photo+note fields
- Notification-style banner on Plan tab for yesterday's unlogged dinners -- "Did you cook [recipe]?"
- Photo capture via existing CameraSheet component + gallery picker option
- "Cooked N times" badge on recipe detail, next to rating pill -- small green badge with count
- Horizontal scrollable photo strip below ingredients -- thumbnails with date + @handle overlay
- Each gallery item shows: photo thumbnail, relative date ("2 days ago"), @handle of who cooked
- Empty state: no gallery section shown, badge shows "Not cooked yet" in muted text
- Photo compression: resize to max 1200px width, 80% JPEG quality via expo-image-manipulator
- Storage bucket: `cook-logs/{recipe_id}/{user_id}/{timestamp}.jpg`
- New `cook_logs` table: id, recipe_id, user_id, household_id, photo_url, notes, cooked_at, created_at
- Visibility: all household members + anyone following the kitchen (matches feed visibility)

### Claude's Discretion
- Exact placement and styling of the "I Cooked This" button
- Banner design for past meal prompts
- Photo gallery thumbnail size and spacing
- Animation for the cook logging bottom sheet

### Deferred Ideas (OUT OF SCOPE)
- Cook log analytics/stats dashboard
- Cook streaks and achievements
- Social sharing of cook photos to feed (Phase 48 handles feed integration)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COOK-01 | User can tap "I Cooked This" on recipe detail to log a cook with optional photo and note | Recipe detail page ([id].tsx) has bottom bar with Start Cooking + Add to Plan buttons; new button goes in this row. CookLogSheet bottom sheet provides photo+note form. |
| COOK-02 | After completing cooking mode, user is prompted with a sheet to log the cook | CookingMode component has `onClose` callback on last step "Done Cooking". Modify to trigger CookLogSheet instead of immediate navigation back. |
| COOK-03 | After a meal plan date passes, user is prompted to log whether they cooked the planned recipe | Plan tab (plan.tsx) can query yesterday's meal plans with recipes. Banner component checks cook_logs for existing entries to avoid duplicate prompts. |
| COOK-04 | Recipe detail shows "Cooked N times" badge with count | cookLogStore fetches count via Supabase `.select('id', { count: 'exact' })` for the recipe. Badge renders next to existing rating pill. |
| COOK-05 | Recipe detail shows a photo gallery of past cooks with cook date and @handle | cookLogStore fetches cook_logs joined with profiles for handle. Horizontal FlatList renders thumbnail cards with date overlay. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.12 | cookLogStore state management | Already used for all stores in project [VERIFIED: package.json] |
| @supabase/supabase-js | (existing) | Database queries, storage uploads | Already configured project-wide [VERIFIED: codebase] |
| expo-image-manipulator | ~55.0.15 | Photo compression before upload | Already installed and used in vision.ts [VERIFIED: package.json] |
| @gorhom/bottom-sheet | (existing) | CookLogSheet UI | Already used via BottomSheet wrapper component [VERIFIED: codebase] |
| expo-image-picker | (existing) | Camera/gallery access via CameraSheet | Already used in CameraSheet.tsx [VERIFIED: codebase] |
| date-fns | ^4.1.0 | Relative date formatting for gallery | Already used throughout the app [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | (existing) | Haptic feedback on "I Cooked This" tap | Already imported in recipe detail [VERIFIED: codebase] |

### No New Dependencies Required

All libraries needed are already installed. No `npm install` needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    cookLogStore.ts           # New zustand store for cook logs
  components/
    cook-log/
      CookLogSheet.tsx        # Bottom sheet with photo + note form
      CookCountBadge.tsx      # "Cooked N times" green badge
      CookPhotoGallery.tsx    # Horizontal scrollable photo strip
      PastMealBanner.tsx      # Banner for unlogged past meals on Plan tab
  lib/
    cookLogHelpers.ts         # Photo upload + compression (adapted from feedHelpers)
supabase/
  migrations/
    00027_create_cook_logs.sql  # Table, indexes, RLS, storage bucket
```

### Pattern 1: Zustand Store (matches existing pattern)
**What:** Single store file with state + actions, Supabase calls inside actions
**When to use:** All data operations for cook logs
**Example:**
```typescript
// Source: existing pattern from src/stores/recipeStore.ts
interface CookLogState {
  cookLogs: CookLog[];
  cookCount: number;
  loading: boolean;
  error: string | null;

  fetchCookLogs: (recipeId: string) => Promise<void>;
  fetchCookCount: (recipeId: string) => Promise<void>;
  createCookLog: (params: CreateCookLogParams) => Promise<CookLog | null>;
}
```

### Pattern 2: Photo Upload (adapted from feedHelpers.ts)
**What:** Compress image, convert base64 to ArrayBuffer, upload to Supabase Storage, get public URL
**When to use:** When user attaches a photo to a cook log
**Example:**
```typescript
// Source: existing pattern from src/lib/feedHelpers.ts (uploadMealPhoto)
// Key difference: use 1200px width + 0.8 quality per CONTEXT.md decision
// Storage path: cook-log-photos/{recipe_id}/{user_id}/{timestamp}.jpg
export async function uploadCookLogPhoto(
  recipeId: string,
  userId: string,
  imageUri: string
): Promise<string | null> {
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1200 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8, base64: true }
  );
  // ... base64 to ArrayBuffer, upload to 'cook-log-photos' bucket
}
```

### Pattern 3: CookingMode Completion Hook
**What:** Modify CookingMode's "Done Cooking" to call a callback instead of immediately closing
**When to use:** COOK-02 -- post-cooking prompt
**Example:**
```typescript
// Current: onClose() is called directly
// New: Add onCookComplete callback that shows CookLogSheet, then navigates back
// In cook/[id].tsx, handle the callback to show the sheet
```

### Pattern 4: Past Meal Detection for COOK-03
**What:** Query meal_plans where plan_date < today AND recipe_id IS NOT NULL, then LEFT JOIN with cook_logs to find unlogged meals
**When to use:** Plan tab banner
**Example:**
```typescript
// Query yesterday's dinner plans that have a recipe but no cook log
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const { data: plans } = await supabase
  .from('meal_plans')
  .select('id, recipe_id, recipes(name, image_url)')
  .eq('household_id', householdId)
  .eq('plan_date', yesterday)
  .eq('meal_type', 'dinner')
  .not('recipe_id', 'is', null);

// Then check cook_logs for existing entries
const { count } = await supabase
  .from('cook_logs')
  .select('id', { count: 'exact', head: true })
  .eq('recipe_id', planRecipeId)
  .eq('user_id', userId)
  .gte('cooked_at', yesterday);
```

### Anti-Patterns to Avoid
- **Do NOT create a new compression function:** Adapt the existing `compressForVision` pattern from `src/lib/vision.ts` but with different parameters (1200px/0.8 instead of 1024px/0.6). Write a new utility function, don't modify vision.ts.
- **Do NOT modify the existing `meal-photos` bucket:** Create a separate `cook-log-photos` bucket. The context specifies `cook-logs/{recipe_id}/{user_id}/{timestamp}.jpg` as the path, so use bucket name `cook-log-photos` with that path structure. [ASSUMED]
- **Do NOT auto-create cook logs from meal plans:** STATE.md explicitly says "Cook logs are prompt-only, never auto-created from meal plan dates"
- **Do NOT share cook photos to feed in this phase:** Deferred to Phase 48

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo compression | Custom resize logic | expo-image-manipulator `manipulateAsync` | Already proven in codebase, handles EXIF rotation |
| Bottom sheet | Custom modal/overlay | @gorhom/bottom-sheet via BottomSheet wrapper | Gesture handling, snap points, backdrop |
| Date formatting | Manual "X days ago" | date-fns `formatDistanceToNow` | Handles edge cases (minutes, hours, days, months) |
| Image upload | Fetch API multipart | Supabase Storage `upload` with ArrayBuffer | Handles auth, retries, CDN URL generation |

## Common Pitfalls

### Pitfall 1: CookingMode onClose Interference
**What goes wrong:** CookingMode currently calls `onClose()` which triggers `router.back()`. If we intercept this for the cook log prompt, the user may be stuck if they dismiss the sheet.
**Why it happens:** `onClose` serves dual purpose (close cooking mode + navigate).
**How to avoid:** Add a separate `onCookComplete` callback prop to CookingMode. When last step "Done Cooking" is pressed, call `onCookComplete` instead of `onClose`. In `cook/[id].tsx`, show CookLogSheet on `onCookComplete`, and navigate back only after sheet is dismissed or logged.
**Warning signs:** Pressing "Done Cooking" doesn't show the log sheet, or dismissing the sheet doesn't navigate back.

### Pitfall 2: Storage Bucket RLS Path Mismatch
**What goes wrong:** Upload succeeds but photo URL returns 404, or upload is denied.
**Why it happens:** The storage RLS policies use `storage.foldername(name)` to extract path segments. If the path structure doesn't match the policy expectations, access fails silently.
**How to avoid:** Ensure the storage policy for cook-log-photos uses the correct path segment index. The CONTEXT specifies `cook-logs/{recipe_id}/{user_id}/{timestamp}.jpg` inside the bucket. RLS should check `(storage.foldername(name))[2]` equals `auth.uid()::text` for the user_id segment.
**Warning signs:** Photos upload but don't display; or other users can overwrite photos.

### Pitfall 3: Duplicate Cook Logs from Multiple Entry Points
**What goes wrong:** User cooks a recipe, logs via the post-cooking sheet, then also taps "I Cooked This" on the recipe detail -- creating duplicate entries.
**Why it happens:** Three entry points all create cook_logs with no dedup.
**How to avoid:** Don't prevent duplicates -- they represent different cook events. But for the Plan tab banner (COOK-03), DO check for existing logs on that date to avoid prompting for already-logged cooks. Also, after logging from CookingMode, optionally show a success state instead of the "I Cooked This" button briefly.
**Warning signs:** Plan banner keeps showing after user already logged.

### Pitfall 4: Plan Tab Banner Breaking Scroll Structure
**What goes wrong:** Adding a banner to plan.tsx disrupts the existing ScrollView layout or causes visual glitches.
**Why it happens:** plan.tsx has a complex layout with DateStrip, HeroDinnerCard, segments, and FAB.
**How to avoid:** Insert the PastMealBanner component at the top of the day view content (inside `dayViewContent`), conditionally rendered. Don't add it outside the ScrollView. CONTEXT.md explicitly warns: "careful: do NOT break scroll structure".
**Warning signs:** Content jumps, FAB overlaps banner, or banner doesn't scroll with content.

### Pitfall 5: Photo Gallery Performance with Many Cook Logs
**What goes wrong:** Recipe detail loads slowly when there are many cook logs with photos.
**Why it happens:** Fetching all cook log photos + profile data for the gallery.
**How to avoid:** Limit the initial fetch to the most recent 10-20 cook logs. Use `expo-image` for cached thumbnail rendering. Only fetch additional logs on demand.
**Warning signs:** Recipe detail loading indicator stays visible for seconds.

## Code Examples

### Database Migration (00027_create_cook_logs.sql)
```sql
-- Source: adapted from existing migration patterns (00018, 00019)
BEGIN;

-- cook_logs table
CREATE TABLE cook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  photo_url TEXT,
  notes TEXT CHECK (char_length(notes) <= 500),
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cook_logs_recipe ON cook_logs(recipe_id);
CREATE INDEX idx_cook_logs_user ON cook_logs(user_id);
CREATE INDEX idx_cook_logs_household ON cook_logs(household_id);
CREATE INDEX idx_cook_logs_cooked_at ON cook_logs(cooked_at DESC);
CREATE INDEX idx_cook_logs_recipe_cooked ON cook_logs(recipe_id, cooked_at DESC);

-- Enable RLS
ALTER TABLE cook_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Household members can view cook logs for their household
CREATE POLICY "Household members can view cook logs"
  ON cook_logs FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

-- RLS: Authenticated users can insert cook logs for their household
CREATE POLICY "Household members can create cook logs"
  ON cook_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_household_member(household_id, auth.uid())
  );

-- RLS: Users can delete their own cook logs
CREATE POLICY "Users can delete own cook logs"
  ON cook_logs FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
```

### Storage Bucket Migration (included in same file)
```sql
-- cook-log-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cook-log-photos', 'cook-log-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for cook log photos
CREATE POLICY "Public read access for cook-log-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cook-log-photos');

-- Authenticated users can upload cook log photos
CREATE POLICY "Authenticated users can upload cook log photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cook-log-photos'
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own cook log photos
CREATE POLICY "Users can delete own cook log photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cook-log-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
```

### TypeScript Types (add to database.ts)
```typescript
// Source: follows existing pattern in src/types/database.ts
export interface CookLog {
  id: string;
  recipe_id: string;
  user_id: string;
  household_id: string;
  photo_url: string | null;
  notes: string | null;
  cooked_at: string;
  created_at: string;
}

export interface CookLogInsert {
  recipe_id: string;
  user_id: string;
  household_id: string;
  photo_url?: string | null;
  notes?: string | null;
  cooked_at?: string;
}

export interface CookLogWithProfile extends CookLog {
  profiles: {
    handle: string | null;
    avatar_url: string | null;
  } | null;
}
```

### Cook Log Photo Upload Helper
```typescript
// Source: adapted from src/lib/feedHelpers.ts uploadMealPhoto
export async function uploadCookLogPhoto(
  recipeId: string,
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8, base64: true }
    );

    const binaryString = atob(result.base64!);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${recipeId}/${userId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('cook-log-photos')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[cookLog] upload error:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('cook-log-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('[cookLog] upload exception:', err);
    return null;
  }
}
```

### Fetching Cook Logs with Profile Data
```typescript
// Source: follows Supabase select + join pattern used throughout codebase
const { data, error } = await supabase
  .from('cook_logs')
  .select('*, profiles(handle, avatar_url)')
  .eq('recipe_id', recipeId)
  .order('cooked_at', { ascending: false })
  .limit(20);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| compressForVision 1024px/0.6 | Cook log uses 1200px/0.8 | This phase | Higher quality photos for gallery display |
| CookingMode always calls onClose | New onCookComplete callback | This phase | Enables post-cook logging flow |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Storage bucket should be named `cook-log-photos` (separate from `meal-photos`) | Architecture Patterns | Low -- bucket name is configurable, the path structure matters more |
| A2 | RLS policy for cook_logs SELECT should be household-scoped only (not follower-visible) | Code Examples | Medium -- CONTEXT says "matches feed visibility" which includes followers. May need additional policy for followers. See Open Questions. |
| A3 | expo-image-manipulator v55 API uses `manipulateAsync` with same signature as current codebase | Code Examples | Low -- already working in vision.ts with same version |

## Open Questions

1. **Cook log visibility for followers**
   - What we know: CONTEXT says "Visibility: all household members + anyone following the kitchen (matches feed visibility)"
   - What's unclear: The RLS for cook_logs SELECT needs to also allow followers to see cook logs. This requires joining through `kitchen_profiles` and `follows` tables.
   - Recommendation: Add a second SELECT policy: "Followers can view cook logs" that checks if the requesting user's kitchen follows the cook log's household's kitchen. Alternatively, since Phase 48 handles feed integration, keep cook_logs household-only for now and let feed posts expose the data to followers. The simpler approach is household-only RLS now, feed integration adds public visibility later.

2. **Banner dismissal persistence for COOK-03**
   - What we know: User sees a banner for yesterday's unlogged dinners
   - What's unclear: If user dismisses without logging, should it persist? Show again next app open?
   - Recommendation: Store dismissed banner IDs in AsyncStorage with date. Only show for yesterday (not older). If dismissed, don't show again for that specific meal plan.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config file | jest.config.js (assumed from package.json test script) |
| Quick run command | `npx jest tests/stores/cookLogStore.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COOK-01 | createCookLog inserts row + uploads photo | unit | `npx jest tests/stores/cookLogStore.test.ts -x` | Wave 0 |
| COOK-02 | CookingMode calls onCookComplete on last step | unit | `npx jest tests/components/CookingMode.test.tsx -x` | Exists (extend) |
| COOK-03 | fetchUnloggedMeals returns yesterday's dinners without cook logs | unit | `npx jest tests/stores/cookLogStore.test.ts -x` | Wave 0 |
| COOK-04 | fetchCookCount returns correct count for recipe | unit | `npx jest tests/stores/cookLogStore.test.ts -x` | Wave 0 |
| COOK-05 | fetchCookLogs returns logs with profile data | unit | `npx jest tests/stores/cookLogStore.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/stores/cookLogStore.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/stores/cookLogStore.test.ts` -- covers COOK-01, COOK-03, COOK-04, COOK-05
- [ ] Extend `tests/components/CookingMode.test.tsx` -- covers COOK-02 onCookComplete callback

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | yes | RLS policies: household membership check via is_household_member() |
| V5 Input Validation | yes | Notes field: 500 char CHECK constraint at DB level |
| V6 Cryptography | no | -- |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized cook log creation for another user | Spoofing | RLS INSERT policy: auth.uid() = user_id |
| Overwriting another user's photos in storage | Tampering | Storage RLS: user_id segment in path must match auth.uid() |
| Reading cook logs from other households | Information Disclosure | RLS SELECT policy: is_household_member check |
| Photo upload abuse (large files) | Denial of Service | Client-side compression to 1200px/0.8 JPEG before upload |

## Sources

### Primary (HIGH confidence)
- Codebase inspection: src/lib/feedHelpers.ts, src/lib/vision.ts, src/components/camera/CameraSheet.tsx
- Codebase inspection: src/stores/recipeStore.ts, src/stores/planStore.ts (store patterns)
- Codebase inspection: app/(app)/recipe/[id].tsx, app/(app)/recipe/cook/[id].tsx (integration points)
- Codebase inspection: supabase/migrations/ (RLS patterns, table structures)
- Codebase inspection: package.json (dependency versions)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions (user-provided requirements and constraints)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed and patterns proven in codebase
- Architecture: HIGH - follows existing store/component/migration patterns exactly
- Pitfalls: HIGH - identified from actual codebase structure (CookingMode flow, plan.tsx complexity)

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable -- no external dependencies changing)
