# Architecture: Social Recipe Features Integration

**Domain:** Social recipe features for SharedKitchen v8.0
**Researched:** 2026-04-10
**Confidence:** HIGH (based on direct codebase analysis of existing tables, stores, and data flows)

## Existing Architecture Inventory

### Current Database Tables (Relevant)

| Table | Key Columns | Role in v8.0 |
|-------|------------|--------------|
| `profiles` | `id`, `display_name`, `avatar_url` | **MODIFY** -- add `handle` column |
| `recipes` | `id`, `household_id`, `created_by`, `name`, `ingredients`, `instructions` | **MODIFY** -- add `cook_count`, `current_version` columns |
| `recipe_ratings` | `recipe_id`, `user_id`, `rating`, `is_favorite` | Unchanged |
| `recipe_notes` | `recipe_id`, `user_id`, `content` | Unchanged (private notes stay separate from public comments) |
| `meal_plans` | `id`, `household_id`, `recipe_id`, `plan_date`, `assigned_cook` | Read-only trigger source for cook log |
| `kitchen_profiles` | `id`, `household_id`, `display_name`, `follower_count` | Unchanged |
| `feed_posts` | `id`, `kitchen_id`, `recipe_id`, `recipe_name`, `photo_url` | **MODIFY** -- add `post_type`, `cook_log_id` columns |
| `post_comments` | `id`, `post_id`, `kitchen_id`, `content` | Existing feed comments -- unchanged |
| `saved_recipes` | `kitchen_id`, `recipe_id`, `source_kitchen_id` | Unchanged (already handles "save to collection") |

### Current Zustand Stores (Relevant)

| Store | Key State | Role in v8.0 |
|-------|-----------|--------------|
| `recipeStore` | `recipes`, `selectedRecipe`, `ratings`, `notes` | **EXTEND** -- add cook log, version history, recipe comments |
| `socialStore` | `feedPosts`, `myKitchenProfile`, `comments` | **EXTEND** -- new feed post types |
| `planStore` | `mealPlan`, `assignRecipe()` | **MODIFY** -- trigger cook log prompt after cooking |
| `authStore` | user session | **EXTEND** -- handle management |
| `onboardingStore` | `currentStep`, `completed` | **MODIFY** -- add handle selection step |

### Current Data Flows

1. **Meal assignment -> Feed post:** `planStore.assignRecipe()` calls `createFeedPost()` fire-and-forget via `feedHelpers.ts`
2. **Recipe creation:** `recipeStore.createRecipe()` inserts into `recipes` table with `created_by = auth.uid()`
3. **Feed rendering:** `socialStore.fetchFeedPosts()` does fan-out-on-read (get followed kitchen IDs, query `feed_posts` WHERE `kitchen_id` IN followed)
4. **Recipe saving:** `socialStore.saveRecipeFromPost()` clones recipe into user's household, records in `saved_recipes`

---

## New Tables Required

### 1. `cook_logs` -- Core new table

Records every time someone cooks a recipe. Central to cook count badges, photo gallery, and feed integration.

```sql
CREATE TABLE cook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  cooked_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT CHECK (char_length(notes) <= 500),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cook_logs_recipe ON cook_logs(recipe_id);
CREATE INDEX idx_cook_logs_user ON cook_logs(user_id);
CREATE INDEX idx_cook_logs_household ON cook_logs(household_id);
CREATE INDEX idx_cook_logs_cooked_at ON cook_logs(cooked_at DESC);
```

**RLS:** Household members can CRUD their own household's cook logs. Public read for cook count aggregation on shared recipes.

### 2. `cook_log_photos` -- Separate from cook_logs for 1:N

```sql
CREATE TABLE cook_log_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_log_id UUID NOT NULL REFERENCES cook_logs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cook_log_photos_cook_log ON cook_log_photos(cook_log_id);
```

**Storage:** New `cook-photos` bucket in Supabase Storage (mirrors existing `meal-photos` pattern).

### 3. `recipe_versions` -- Track recipe edit history

```sql
CREATE TABLE recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  change_summary TEXT CHECK (char_length(change_summary) <= 300),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id, version_number)
);

CREATE INDEX idx_recipe_versions_recipe ON recipe_versions(recipe_id);
```

**Strategy:** Snapshot-on-write. When `recipeStore.updateRecipe()` is called, snapshot current state to `recipe_versions` BEFORE applying the update. This avoids diffing complexity.

### 4. `recipe_comments` -- Distinct from `recipe_notes` and `post_comments`

```sql
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_created ON recipe_comments(created_at);
```

**Why not reuse `recipe_notes`?** Notes are private per-user annotations ("I used less salt"). Comments are social, visible to all household members. Different visibility model = different table.

**Why not reuse `post_comments`?** Post comments are on feed posts (kitchen-scoped). Recipe comments are on recipes (user-scoped, household-visible). Different entity, different RLS.

---

## Modified Tables

### `profiles` -- Add handle column

```sql
ALTER TABLE profiles ADD COLUMN handle TEXT UNIQUE;
CREATE UNIQUE INDEX idx_profiles_handle ON profiles(handle);
-- Enforce lowercase, alphanumeric + underscores, 3-30 chars
ALTER TABLE profiles ADD CONSTRAINT handle_format
  CHECK (handle ~ '^[a-z0-9_]{3,30}$');
```

**Why on `profiles` not `kitchen_profiles`?** Handles are per-USER identity ("@diego"), not per-kitchen. A user in multiple households keeps one @handle. The milestone spec says "unique @handle system -- required username for every user."

**RLS addition:** New SELECT policy allowing any authenticated user to look up profiles by handle (for @mention resolution and attribution display).

### `recipes` -- Add cook_count and version

```sql
ALTER TABLE recipes ADD COLUMN cook_count INT DEFAULT 0;
ALTER TABLE recipes ADD COLUMN current_version INT DEFAULT 1;
```

**cook_count maintenance:** Postgres trigger on `cook_logs` INSERT/DELETE increments/decrements `recipes.cook_count`. Same pattern as `like_count` on `feed_posts`.

### `feed_posts` -- Add post_type and cook_log_id

```sql
ALTER TABLE feed_posts ADD COLUMN post_type TEXT DEFAULT 'meal_planned'
  CHECK (post_type IN ('meal_planned', 'recipe_created', 'recipe_cooked'));
ALTER TABLE feed_posts ADD COLUMN cook_log_id UUID REFERENCES cook_logs(id) ON DELETE SET NULL;
```

**New feed post types:**
- `meal_planned` -- existing behavior (auto-posted when meal assigned to plan)
- `recipe_created` -- auto-posted when a new recipe is created
- `recipe_cooked` -- auto-posted when a cook log is created (with optional photos)

---

## New/Modified Zustand Stores

### New: `cookLogStore.ts`

```typescript
interface CookLogState {
  // For current recipe being viewed
  cookLogs: CookLog[];
  cookLogPhotos: Map<string, CookLogPhoto[]>; // keyed by cook_log_id
  loading: boolean;
  error: string | null;

  // Actions
  fetchCookLogs: (recipeId: string) => Promise<void>;
  createCookLog: (params: {
    recipeId: string;
    householdId: string;
    mealPlanId?: string;
    notes?: string;
    rating?: number;
    photos?: string[]; // local URIs to upload
  }) => Promise<CookLog | null>;
  deleteCookLog: (id: string) => Promise<void>;
  fetchPhotosForLogs: (logIds: string[]) => Promise<void>;

  // Gallery helpers
  allPhotosForRecipe: () => CookLogPhoto[];
  cookCountForRecipe: (recipeId: string) => number;
}
```

**Integration point:** After `createCookLog`, fire-and-forget call to `createFeedPost` with `post_type: 'recipe_cooked'`.

### Modified: `recipeStore` -- Add version history + recipe comments + edit permissions

```typescript
// New state additions
recipeComments: RecipeComment[];
recipeCommentsLoading: boolean;
versionHistory: RecipeVersion[];
versionHistoryLoading: boolean;

// New actions
fetchRecipeComments: (recipeId: string) => Promise<void>;
addRecipeComment: (recipeId: string, content: string) => Promise<void>;
deleteRecipeComment: (commentId: string) => Promise<void>;
fetchVersionHistory: (recipeId: string) => Promise<void>;
updateRecipeWithVersion: (id: string, updates: RecipeUpdate, changeSummary?: string) => Promise<void>;
canEditRecipe: (recipe: Recipe) => boolean; // created_by === auth.uid()
```

**`updateRecipeWithVersion` flow:**
1. Fetch current recipe state
2. INSERT snapshot into `recipe_versions` with `version_number = current_version`
3. UPDATE recipe with new data + `current_version = current_version + 1`
4. Both in a single RPC call or sequential with optimistic UI

### Modified: `socialStore` -- Handle profile enrichment

```typescript
// New state
handleProfile: Profile | null; // resolved @handle -> profile

// New actions
resolveHandle: (handle: string) => Promise<Profile | null>;
```

### Modified: `authStore` -- Handle management

```typescript
// New state
handle: string | null;
handleAvailable: boolean | null;

// New actions
checkHandleAvailability: (handle: string) => Promise<boolean>;
setHandle: (handle: string) => Promise<void>;
```

### Modified: `onboardingStore` -- Handle selection step

Insert new step between Welcome (step 0) and Create Kitchen (step 1). Total steps becomes 7 (0-6).

---

## Component Boundaries

### New Components

| Component | Responsibility | Consumes |
|-----------|---------------|----------|
| `HandleSetupScreen` | Onboarding handle selection with availability check | authStore |
| `HandleInput` | Reusable @handle text input with validation + debounced availability | authStore |
| `CookLogSheet` | Bottom sheet prompted after cooking mode or manual "I cooked this" | cookLogStore, recipeStore |
| `CookLogPhotoUploader` | Multi-photo capture/select for cook log | cookLogStore, Supabase Storage |
| `RecipeCommentSection` | Comment list + input on recipe detail | recipeStore |
| `CookCountBadge` | "Cooked N times" badge on recipe cards and detail | recipeStore |
| `CookPhotoGallery` | Horizontal photo gallery from past cooks on recipe detail | cookLogStore |
| `RecipeAttribution` | "Created by @username" with avatar, tappable to profile | recipeStore, socialStore |
| `VersionHistorySheet` | Bottom sheet showing edit history timeline | recipeStore |
| `CreatorEditGuard` | Wraps edit button, shows "Only creator can edit" for non-creators | recipeStore, authStore |

### Modified Components

| Component | Change | Why |
|-----------|--------|-----|
| `RecipeDetailScreen` | Add attribution, cook count badge, photo gallery, comments section, version history button | Central hub for all social recipe features |
| `RecipeCard` | Add cook count badge, creator avatar | Recipe grid needs social context |
| `CookingModeScreen` | Add "Log this cook" CTA at end of cooking flow | Natural trigger point for cook log |
| `FeedCard` | Handle new post_type variants (recipe_created, recipe_cooked) | Feed shows richer content |
| `OnboardingFlow` | Insert handle selection step | Required for all new users |
| `ProfileScreen` | Display @handle, edit handle option | User identity |
| `RecipeEditScreen` | Gate behind creator check, show "you can't edit" for non-creators | Permission enforcement |

---

## Data Flow Diagrams

### Flow 1: Cook Log Creation (Primary New Flow)

```
User finishes cooking mode
  |
  v
CookingModeScreen shows "Log this cook?" prompt
  |
  v
CookLogSheet opens
  - Optional: add photos (CookLogPhotoUploader)
  - Optional: add notes
  - Optional: rate this cook
  |
  v
cookLogStore.createCookLog()
  |
  +---> INSERT cook_logs (recipe_id, user_id, household_id, meal_plan_id?)
  |       |
  |       +---> Postgres trigger: UPDATE recipes SET cook_count = cook_count + 1
  |
  +---> Upload photos to 'cook-photos' bucket
  |       |
  |       +---> INSERT cook_log_photos (cook_log_id, photo_url)
  |
  +---> createFeedPost({ post_type: 'recipe_cooked', cook_log_id, recipe_id })
          |
          +---> Existing webhook: send-social-notification to followers
```

### Flow 2: Recipe Edit with Version History

```
Creator taps Edit on recipe detail
  |
  v
recipeStore.canEditRecipe(recipe) === true (created_by === auth.uid())
  |
  v
RecipeEditScreen loads
  |
  v
User saves changes
  |
  v
recipeStore.updateRecipeWithVersion(id, updates, changeSummary)
  |
  +---> Fetch current recipe snapshot
  +---> INSERT recipe_versions (recipe_id, version_number, name, ingredients, instructions, changed_by)
  +---> UPDATE recipes SET name = ..., ingredients = ..., current_version = current_version + 1
```

### Flow 3: Handle Setup (Onboarding Integration)

```
New user signs up
  |
  v
auth.users trigger -> handle_new_user() creates profiles row (NO handle yet)
  |
  v
Onboarding Step 0: Welcome
  |
  v
Onboarding Step 1: Choose @handle  <-- NEW STEP
  |
  +---> HandleInput: user types handle
  +---> Debounced check: SELECT 1 FROM profiles WHERE handle = $1
  +---> If available: authStore.setHandle() -> UPDATE profiles SET handle = $1
  |
  v
Onboarding Step 2: Create Kitchen (was Step 1)
  ... rest of onboarding continues
```

**Existing users:** On first app open after v8.0 update, intercept with a one-time HandleSetupScreen before allowing navigation. Check `profiles.handle IS NULL` on auth state change.

### Flow 4: Recipe Attribution Display

```
RecipeDetailScreen loads
  |
  v
recipeStore.fetchRecipeDetail(id)
  - Returns recipe with created_by UUID
  |
  v
Resolve created_by -> profile (handle, display_name, avatar_url)
  - JOIN profiles ON profiles.id = recipe.created_by
  - OR: separate fetch in component
  |
  v
RecipeAttribution component renders:
  "Created by @handle" with avatar
  - Tap -> navigate to profile
```

### Flow 5: Feed Integration for Recipe Creation

```
recipeStore.createRecipe(recipe)
  |
  v
Recipe inserted with created_by = auth.uid()
  |
  v
After successful insert, fire-and-forget:
  createFeedPost({
    post_type: 'recipe_created',
    kitchen_id: myKitchenProfile.id,
    recipe_id: newRecipe.id,
    recipe_name: newRecipe.name,
    recipe_image_url: newRecipe.image_url,
    meal_date: today,
    meal_type: 'recipe'  // sentinel value for non-meal posts
  })
```

---

## RLS Policy Design

### cook_logs

```sql
-- Household members can view their household's cook logs
CREATE POLICY "Household members can view cook logs"
  ON cook_logs FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

-- Users can create cook logs in their household
CREATE POLICY "Users can create cook logs"
  ON cook_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_household_member(household_id, auth.uid())
  );

-- Users can delete their own cook logs
CREATE POLICY "Users can delete own cook logs"
  ON cook_logs FOR DELETE
  USING (auth.uid() = user_id);
```

### recipe_comments

```sql
-- Household members can view comments on their recipes
CREATE POLICY "Household members can view recipe comments"
  ON recipe_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_comments.recipe_id
    AND is_household_member(r.household_id, auth.uid())
  ));

-- Users can add comments on household recipes
CREATE POLICY "Users can add recipe comments"
  ON recipe_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND is_household_member(r.household_id, auth.uid())
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own recipe comments"
  ON recipe_comments FOR DELETE
  USING (auth.uid() = user_id);
```

### recipe_versions (read-only for non-creators)

```sql
-- Household members can view version history
CREATE POLICY "Household members can view recipe versions"
  ON recipe_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_versions.recipe_id
    AND is_household_member(r.household_id, auth.uid())
  ));

-- Only recipe creator can insert versions
CREATE POLICY "Creator can insert recipe versions"
  ON recipe_versions FOR INSERT
  WITH CHECK (
    auth.uid() = changed_by
    AND EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_versions.recipe_id
      AND r.created_by = auth.uid()
    )
  );
```

### recipes -- Restrict UPDATE to creator only

```sql
-- REPLACE existing "Users can update recipes in their household" policy:
DROP POLICY "Users can update recipes in their household" ON recipes;

CREATE POLICY "Recipe creator can update their recipes"
  ON recipes FOR UPDATE
  USING (
    created_by = auth.uid()
    AND is_household_member(household_id, auth.uid())
  );
```

**Critical consideration:** This is a BREAKING CHANGE for existing behavior where any household member can edit any recipe. Need migration strategy -- see Pitfalls.

### profiles -- Handle lookup

```sql
-- Replace existing SELECT policy to also allow handle-based lookup
DROP POLICY "Users can read own profile" ON profiles;

CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR handle IS NOT NULL  -- any profile with a handle is publicly readable
  );
```

---

## Supabase Storage Changes

### New Bucket: `cook-photos`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cook-photos',
  'cook-photos',
  true,
  5242880,  -- 5MB (same as meal-photos)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

**Reuse existing pattern:** `uploadMealPhoto` in `feedHelpers.ts` already handles compress -> upload -> get public URL. Generalize for cook log photos.

---

## Postgres Triggers

### cook_count maintenance

```sql
CREATE OR REPLACE FUNCTION update_recipe_cook_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET cook_count = cook_count + 1 WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET cook_count = GREATEST(cook_count - 1, 0) WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_cook_count
  AFTER INSERT OR DELETE ON cook_logs
  FOR EACH ROW EXECUTE FUNCTION update_recipe_cook_count();
```

This follows the exact pattern of `update_like_count()` and `update_follow_counts()` already in the codebase.

---

## Suggested Build Order

Build order is dependency-driven. Each phase builds on the previous.

### Phase 1: @Handle System + Profile Changes
**Dependencies:** None (foundation)
**Deliverables:**
- `profiles.handle` column + UNIQUE index + format constraint
- Updated profile RLS for handle lookup
- `HandleInput` component with debounced availability check
- `HandleSetupScreen` for onboarding (new step)
- Existing user handle migration gate (intercept screen on app open)
- `authStore` extensions for handle management
- `onboardingStore` updated to 7 steps

**Why first:** Every subsequent feature references @handles for attribution. Existing users need handles before any social recipe feature makes sense.

### Phase 2: Creator Edit Permissions + Recipe Attribution
**Dependencies:** Phase 1 (handles exist for attribution display)
**Deliverables:**
- Drop + recreate recipe UPDATE RLS policy (creator-only)
- Data migration: backfill `created_by` for recipes where it is NULL
- `RecipeAttribution` component ("Created by @handle")
- `CreatorEditGuard` component
- `recipeStore.canEditRecipe()` method
- Updated `RecipeDetailScreen` with attribution display
- Updated `RecipeEditScreen` with permission gate

**Why second:** Sets the ownership model that cook log and version history depend on.

### Phase 3: Cook Log + Photos
**Dependencies:** Phase 2 (recipe ownership established)
**Deliverables:**
- `cook_logs` table + RLS
- `cook_log_photos` table + RLS
- `cook-photos` storage bucket
- `recipes.cook_count` column + trigger
- `cookLogStore.ts` (new store)
- `CookLogSheet` component
- `CookLogPhotoUploader` component
- `CookCountBadge` component
- `CookPhotoGallery` component on recipe detail
- Updated `CookingModeScreen` with cook log prompt at end
- Manual "I cooked this" button on recipe detail

**Why third:** Largest feature chunk. Depends on recipe ownership but not on version history or feed changes.

### Phase 4: Version History
**Dependencies:** Phase 2 (creator edit permissions)
**Deliverables:**
- `recipe_versions` table + RLS
- `recipes.current_version` column
- `recipeStore.updateRecipeWithVersion()` method
- `recipeStore.fetchVersionHistory()` method
- `VersionHistorySheet` component
- Updated `RecipeEditScreen` to snapshot before save

**Why fourth:** Isolated feature, only touches recipe edit flow. Can be built in parallel with Phase 3.

### Phase 5: Recipe Comments
**Dependencies:** Phase 1 (handles for comment attribution display)
**Deliverables:**
- `recipe_comments` table + RLS
- `recipeStore` comment methods (fetch, add, delete)
- `RecipeCommentSection` component
- Updated `RecipeDetailScreen` with comments section

**Why fifth:** Simpler feature, distinct from existing `recipe_notes` (private) and `post_comments` (feed). Can be built in parallel with Phase 4.

### Phase 6: Feed Integration
**Dependencies:** Phase 3 (cook logs exist for recipe_cooked posts)
**Deliverables:**
- `feed_posts.post_type` column + `cook_log_id` FK
- Updated `createFeedPost()` in feedHelpers.ts to accept post_type
- Updated `FeedCard` to render recipe_created and recipe_cooked variants
- Auto-post on recipe creation (in `recipeStore.createRecipe()`)
- Auto-post on cook log creation (in `cookLogStore.createCookLog()`)

**Why last:** Depends on cook logs being functional. Feed is the display layer for all the data created in earlier phases.

---

## Anti-Patterns to Avoid

### 1. Putting handle on kitchen_profiles
**Why bad:** Handles are per-user, not per-household. A user in 3 households has ONE handle.
**Instead:** Handle goes on `profiles` table.

### 2. Storing full recipe diffs in version history
**Why bad:** Complex diff/merge logic, hard to render, fragile across schema changes.
**Instead:** Snapshot-on-write. Store complete state at each version.

### 3. Using recipe_notes for public comments
**Why bad:** `recipe_notes` has private-per-user RLS. Changing visibility breaks existing privacy expectations.
**Instead:** New `recipe_comments` table with household-visible RLS.

### 4. Eager cook_count computation via COUNT(*)
**Why bad:** Counting cook_logs on every recipe card render is N+1 queries.
**Instead:** Denormalized `cook_count` on recipes, maintained by trigger.

### 5. Breaking existing recipe edit permissions without migration
**Why bad:** Users currently expect any household member can edit any recipe. Suddenly restricting this causes confusion and errors for recipes with NULL `created_by`.
**Instead:** Phase 2 must include a data migration that backfills `created_by` for existing recipes (assign to household creator or oldest member). Show clear UI messaging: "Only @creator can edit this recipe."

---

## Scalability Notes

| Concern | Current Scale | v8.0 Impact | Approach |
|---------|--------------|-------------|----------|
| Cook log photos | 0 | ~5-20 per recipe over time | Paginate gallery, lazy load |
| Version history | 0 | ~2-10 versions per recipe | Fetch on demand, not on recipe load |
| Recipe comments | 0 | ~5-50 per recipe | Paginate if >20. Fetch separately from recipe detail |
| Handle uniqueness checks | 0 | Burst during onboarding migration | Single index lookup, debounced 300ms client-side |
| Feed post types | 1 type | 3 types | No query change needed. post_type is display-layer |
| Cook count updates | 0 | 1 trigger per cook log | Negligible, same as existing like_count pattern |

## Sources

- Direct codebase analysis: all migration files (00001-00024), all 14 Zustand stores, feedHelpers.ts, database types
- Existing architectural patterns: trigger-based count maintenance, fire-and-forget feed posts, RLS via is_household_member/is_kitchen_member helpers
- Supabase Storage bucket pattern from 00008_create_storage_buckets.sql and 00019_create_meal_photos_bucket.sql
