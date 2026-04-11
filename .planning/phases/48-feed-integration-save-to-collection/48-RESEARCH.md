# Phase 48: Feed Integration & Save to Collection - Research

**Researched:** 2026-04-10
**Domain:** Supabase social feed, cook log integration, recipe cloning with attribution
**Confidence:** HIGH

## Summary

This phase connects cook logs to the social feed and completes the save-to-library flow. The codebase already has substantial infrastructure: `feed_posts` table with denormalized recipe data, `saved_recipes` junction table, `FeedCard` component with save button, and a `saveRecipeFromPost` method in socialStore that clones recipes. The primary work is: (1) adding feed post creation inside `createCookLog`, (2) adding a `type` column to `feed_posts` to distinguish cook-log posts from meal-plan posts, (3) adapting FeedCard rendering for cook-log-specific content, and (4) adding "Saved from @handle's kitchen" attribution on recipe detail.

A critical RLS issue exists: the recipes table SELECT policy only allows household members to read recipes. The existing `saveRecipeFromPost` queries the source recipe via `supabase.from('recipes').select('*').eq('id', post.recipe_id)`, which will fail for cross-household recipes. This needs either an RLS policy update or a SECURITY DEFINER function to perform the clone server-side.

**Primary recommendation:** Add a `post_type` column to `feed_posts`, hook cook-log post creation into `cookLogStore.createCookLog`, fix the cross-household recipe read RLS issue with a SECURITY DEFINER clone function, and add "Saved from" attribution UI on recipe detail.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Auto-create feed_posts entry when createCookLog succeeds -- type "cook_log"
- Cook-log feed posts show: recipe name, photo (if any), @handle, note, "Cooked [recipe]" header
- Reuse existing FeedCard layout -- no new card design needed
- Existing feed interactions (like, comment, save) work on cook-log posts (standard feed_posts)
- No opt-out for v8.0 -- every cook log creates a feed post
- Save = duplicate recipe into user's household with saved_from_kitchen_id + saved_from_recipe_id fields
- Save button on FeedCard (bookmark icon) + on recipe detail when viewing another kitchen's recipe
- Recipe detail shows "Saved from @handle's kitchen" with tappable link below title
- Save button hidden on own kitchen's recipes (already have them)

### Claude's Discretion
- Feed post content formatting for cook log posts
- Save confirmation UX (toast, haptic, animation)
- "Saved from" visual styling
- How the save button integrates with existing FeedCard layout

### Deferred Ideas (OUT OF SCOPE)
- Privacy toggle for cook log auto-posting
- Recipe fork tracking (version history across saves)
- "Trending recipes" based on save count
- Save collections/folders
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEED-01 | When a user logs a cook, a feed post is automatically created with the cook photo | Hook into cookLogStore.createCookLog to insert feed_posts row after successful cook log creation |
| FEED-02 | Feed posts from cook logs show recipe name, cook's @handle, photo, and optional note | Add post_type column to feed_posts, add cook_log_id FK, store notes in caption; FeedCard conditionally renders "Cooked [recipe]" header |
| FEED-03 | Existing feed interactions (like, comment, save recipe) work on cook log feed posts | Cook-log posts are standard feed_posts rows -- existing like/comment/save infrastructure works unchanged |
| SAVE-01 | User can save any recipe from the feed or another kitchen's profile to their own recipe library | Fix RLS cross-household read issue; add saved_from_kitchen_id/saved_from_recipe_id to recipes table |
| SAVE-02 | Saved recipes show "Saved from @handle's kitchen" attribution on recipe detail | Query saved_recipes on recipe detail load, render SavedFromAttribution component |
</phase_requirements>

## Architecture Patterns

### Database Changes Required

**Migration 00029: feed_cook_log_integration_and_save_fields**

1. **Add `post_type` to `feed_posts`** -- discriminates cook-log posts from meal-plan posts:
   ```sql
   ALTER TABLE feed_posts ADD COLUMN post_type TEXT DEFAULT 'meal_plan'
     CHECK (post_type IN ('meal_plan', 'cook_log'));
   ```
   Default ensures backward compatibility with existing meal-plan posts. [VERIFIED: feed_posts schema from migration 00018 has no type column]

2. **Add `cook_log_id` FK to `feed_posts`** -- links back to source cook log:
   ```sql
   ALTER TABLE feed_posts ADD COLUMN cook_log_id UUID REFERENCES cook_logs(id) ON DELETE SET NULL;
   ```

3. **Make `meal_date` and `meal_type` nullable** -- cook-log posts don't have meal plan context:
   ```sql
   ALTER TABLE feed_posts ALTER COLUMN meal_date DROP NOT NULL;
   ALTER TABLE feed_posts ALTER COLUMN meal_type DROP NOT NULL;
   ```

4. **Add `saved_from_kitchen_id` and `saved_from_recipe_id` to `recipes`** -- attribution fields:
   ```sql
   ALTER TABLE recipes ADD COLUMN saved_from_kitchen_id UUID REFERENCES kitchen_profiles(id) ON DELETE SET NULL;
   ALTER TABLE recipes ADD COLUMN saved_from_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;
   ```

5. **Add RLS-bypassing clone function** -- critical for cross-household recipe save:
   ```sql
   CREATE OR REPLACE FUNCTION clone_recipe_to_household(
     p_source_recipe_id UUID,
     p_target_household_id UUID,
     p_source_kitchen_id UUID,
     p_created_by UUID
   )
   RETURNS UUID
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_new_id UUID;
   BEGIN
     -- Verify caller is member of target household
     IF NOT is_household_member(p_target_household_id, auth.uid()) THEN
       RAISE EXCEPTION 'Not a member of target household';
     END IF;
     
     INSERT INTO recipes (household_id, name, category, image_url, prep_time_minutes,
       cook_time_minutes, servings, estimated_cost, ingredients, instructions, tags,
       source_url, nutrition_info, source_image_url, created_by,
       saved_from_kitchen_id, saved_from_recipe_id)
     SELECT p_target_household_id, name, category, image_url, prep_time_minutes,
       cook_time_minutes, servings, estimated_cost, ingredients, instructions, tags,
       source_url, nutrition_info, source_image_url, p_created_by,
       p_source_kitchen_id, id
     FROM recipes WHERE id = p_source_recipe_id
     RETURNING id INTO v_new_id;
     
     RETURN v_new_id;
   END;
   $$;
   ```
   This avoids the RLS problem where users cannot SELECT recipes from other households. [VERIFIED: recipes SELECT policy is `is_household_member(household_id, auth.uid())` from migration 00003]

### Pattern 1: Cook Log to Feed Post Pipeline

**What:** After `createCookLog` succeeds, insert a `feed_posts` row with `post_type = 'cook_log'`.

**When to use:** Every successful cook log creation.

**Implementation in cookLogStore.createCookLog:**
```typescript
// After successful cook log insert, create feed post
// Need kitchenId -- resolve from householdId via myKitchenProfile or param
const feedInsert: FeedPostInsert = {
  kitchen_id: kitchenId,
  recipe_id: params.recipeId,
  recipe_name: recipeName, // need to pass or look up
  recipe_image_url: photoUrl ?? recipeImageUrl,
  post_type: 'cook_log',
  cook_log_id: data.id,
  caption: params.notes ?? null,
  photo_url: photoUrl,
  // meal_date and meal_type are null for cook_log posts
};
```
[VERIFIED: cookLogStore.createCookLog at lines 75-109 returns CookLog with id]

### Pattern 2: FeedCard Conditional Rendering

**What:** FeedCard renders differently based on `post_type`:
- `meal_plan`: current behavior ("made [recipe]" with meal context)
- `cook_log`: "Cooked [recipe]" header, show note in quote area, prioritize cook photo

**Implementation:** Minimal conditional in FeedCard -- change the `mealContext` text and `quoteText` content based on `post.post_type`.

```typescript
// In FeedCard content section
const isCookLog = post.post_type === 'cook_log';

// Meal context line
<Text style={s.mealContext}>
  <Text style={s.mealContextBold}>{handleText ?? displayName}</Text>
  {isCookLog ? ' cooked ' : ' made '}
  <Text style={s.mealContextBold}>{post.recipe_name}</Text>
</Text>

// Quote section -- show cook note for cook_log, generic text for meal_plan
{isCookLog && post.caption ? (
  <View style={s.quoteContainer}>
    <Text style={s.quoteText}>{post.caption}</Text>
  </View>
) : !isCookLog ? (
  <View style={s.quoteContainer}>
    <Text style={s.quoteText}>A delicious {mealType.toLowerCase()} dish</Text>
  </View>
) : null}
```
[VERIFIED: FeedCard layout at src/components/social/FeedCard.tsx lines 158-172]

### Pattern 3: Save Recipe with Attribution

**What:** Replace the existing `saveRecipeFromPost` to use the SECURITY DEFINER function, then record in `saved_recipes`.

```typescript
// In socialStore.saveRecipeFromPost
const { data: newRecipeId, error } = await supabase
  .rpc('clone_recipe_to_household', {
    p_source_recipe_id: recipeData.id, // from feed_post.recipe_id
    p_target_household_id: myHouseholdId,
    p_source_kitchen_id: post.kitchen_id,
    p_created_by: userId, // current user
  });
```
[VERIFIED: existing saveRecipeFromPost at socialStore.ts lines 656-749 does direct SELECT which fails RLS]

### Pattern 4: Saved From Attribution on Recipe Detail

**What:** On recipe detail, if `saved_from_kitchen_id` is set, show "Saved from @handle's kitchen" below CreatorAttribution.

```typescript
// In recipe/[id].tsx, after fetching recipe
if (recipe.saved_from_kitchen_id) {
  // Look up source kitchen handle
  const { data } = await supabase
    .from('kitchen_profiles')
    .select('display_name, household_id')
    .eq('id', recipe.saved_from_kitchen_id)
    .single();
  // Render SavedFromAttribution component
}
```
[VERIFIED: recipe/[id].tsx already has CreatorAttribution at line 35]

### Anti-Patterns to Avoid
- **Direct cross-household recipe reads:** Never query recipes from another household client-side -- RLS will block it. Always use the SECURITY DEFINER clone function.
- **Creating feed post in a separate API call:** The feed post should be created atomically after cook log success, not as a separate user action. Fire-and-forget pattern (like feedHelpers.createFeedPost) is fine since feed post failure shouldn't roll back the cook log.
- **Adding a new card component for cook logs:** Reuse FeedCard with conditional rendering. The decision explicitly says "no new card design."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-household recipe cloning | Client-side SELECT + INSERT bypassing RLS | SECURITY DEFINER `clone_recipe_to_household` RPC | RLS prevents reading other households' recipes |
| Save deduplication | Client-side check before save | `UNIQUE(kitchen_id, recipe_id)` on saved_recipes + `UNIQUE(kitchen_id, saved_from_recipe_id)` or check | DB constraint is authoritative |
| Feed post count updates | Manual count tracking | Existing DB triggers on post_likes, post_comments | Already handled by migration 00018 triggers |

**Key insight:** The existing `saveRecipeFromPost` implementation tries to do the recipe clone client-side, which hits RLS walls. Moving the clone logic to a SECURITY DEFINER function is the only correct approach without opening recipe SELECT to all authenticated users.

## Common Pitfalls

### Pitfall 1: RLS Blocking Recipe Clone
**What goes wrong:** `saveRecipeFromPost` queries `recipes` table for source recipe -- but user is not a member of that household, so RLS returns null.
**Why it happens:** Recipes SELECT policy is household-scoped.
**How to avoid:** Use SECURITY DEFINER function that reads and clones in one atomic operation.
**Warning signs:** Save button always fails for other kitchens' recipes, returning null.

### Pitfall 2: Missing Recipe Name in Cook Log Feed Post
**What goes wrong:** `createCookLog` doesn't receive the recipe name -- it only has `recipeId`. Feed post needs `recipe_name` (NOT NULL in feed_posts schema).
**Why it happens:** cookLogStore.createCookLog params only include recipeId, userId, householdId, photoUri, notes.
**How to avoid:** Either add `recipeName` + `recipeImageUrl` to createCookLog params, or look up the recipe before inserting the feed post. Adding params is cleaner since the caller (CookLogSheet, CookingMode) already has the recipe in scope.
**Warning signs:** Feed posts with empty recipe names or extra Supabase queries.

### Pitfall 3: Duplicate Feed Posts for Same Cook Log
**What goes wrong:** If `createCookLog` is retried (network failure + retry), multiple feed posts could be created.
**Why it happens:** Feed post creation is fire-and-forget after cook log success.
**How to avoid:** Use `cook_log_id` FK + UNIQUE constraint on `feed_posts(cook_log_id)` where cook_log_id is not null. Or check existence before inserting.
**Warning signs:** Same cook event appearing multiple times in feed.

### Pitfall 4: meal_date NOT NULL Constraint
**What goes wrong:** Cook-log feed posts don't have a meal_date, but the column is NOT NULL.
**Why it happens:** Original feed_posts schema designed for meal-plan posts only.
**How to avoid:** Migration must `ALTER COLUMN meal_date DROP NOT NULL` and same for `meal_type`.
**Warning signs:** Insert errors when creating cook-log feed posts.

### Pitfall 5: Saving Own Recipe
**What goes wrong:** User sees save button on their own kitchen's recipes in the feed.
**Why it happens:** FeedCard save button shows for all posts.
**How to avoid:** Decision says "save button hidden on own kitchen's recipes." Check `isOwnPost` in FeedCard and conditionally render bookmark. Already partially handled -- `isOwnPost` prop exists in FeedCard.
**Warning signs:** Users duplicating their own recipes into their library.

## Code Examples

### Feed Post Creation After Cook Log
```typescript
// In cookLogStore.createCookLog, after successful insert:
// Fire-and-forget feed post creation
if (kitchenId) {
  supabase
    .from('feed_posts')
    .insert({
      kitchen_id: kitchenId,
      recipe_id: params.recipeId,
      recipe_name: params.recipeName,
      recipe_image_url: photoUrl ?? params.recipeImageUrl ?? null,
      post_type: 'cook_log',
      cook_log_id: data.id,
      caption: params.notes ?? null,
      photo_url: photoUrl,
    })
    .then(({ error }) => {
      if (error) console.warn('[cookLogStore] feed post creation failed:', error.message);
    });
}
```
[VERIFIED: matches fire-and-forget pattern from feedHelpers.ts lines 8-43]

### Save From Attribution Component
```typescript
// SavedFromAttribution.tsx -- simple pressable showing source kitchen
<Pressable onPress={() => router.push(`/kitchen/${sourceKitchenId}`)}>
  <Text style={s.savedFromText}>
    Saved from <Text style={s.savedFromHandle}>@{sourceHandle}'s kitchen</Text>
  </Text>
</Pressable>
```
[VERIFIED: similar to CreatorAttribution pattern used in recipe/[id].tsx line 35]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with @testing-library/react-native |
| Config file | jest.config.js (assumed) or package.json jest config |
| Quick run command | `npx jest --testPathPattern=<file> --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-01 | createCookLog creates feed post | unit | `npx jest tests/stores/cookLogStore.test.ts -x` | Exists (needs new tests) |
| FEED-02 | FeedCard renders cook-log post type | unit | `npx jest tests/components/FeedCard.test.tsx -x` | Exists (has todo stubs) |
| FEED-03 | Like/comment/save work on cook_log posts | unit | `npx jest tests/stores/socialStore.test.ts -x` | Does not exist |
| SAVE-01 | saveRecipeFromPost clones via RPC | unit | `npx jest tests/stores/socialStore.test.ts -x` | Does not exist |
| SAVE-02 | Recipe detail shows "Saved from" attribution | unit | `npx jest tests/screens/recipe-detail.test.tsx -x` | Does not exist |

### Wave 0 Gaps
- [ ] `tests/components/FeedCard.test.tsx` -- update from todo stubs to actual tests covering cook_log post rendering
- [ ] Update `tests/stores/cookLogStore.test.ts` -- add test for feed post creation after cook log

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | yes | RLS + SECURITY DEFINER clone function |
| V5 Input Validation | yes | caption length check via DB CHECK constraint |
| V6 Cryptography | no | -- |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized recipe access | Information Disclosure | SECURITY DEFINER validates caller membership in target household |
| Save spam (clone many recipes) | Denial of Service | UNIQUE constraint on saved_recipes(kitchen_id, recipe_id) |
| Feed post spoofing (fake kitchen_id) | Spoofing | RLS `is_kitchen_member(kitchen_id, auth.uid())` on feed_posts INSERT |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Jest is the test runner (inferred from package.json `"test": "jest"`) | Validation Architecture | Wrong test commands |
| A2 | The recipe detail screen at `app/(app)/recipe/[id].tsx` is the correct place for "Saved from" attribution | Architecture Patterns | UI placed in wrong location |

## Open Questions

1. **createCookLog needs additional params (recipeName, recipeImageUrl, kitchenId)**
   - What we know: Current params are recipeId, userId, householdId, photoUri, notes
   - What's unclear: Whether to add these as params or look them up inside the function
   - Recommendation: Add as params -- callers (CookLogSheet, CookingMode completion) already have recipe in scope. Also need kitchenId which callers can get from socialStore.myKitchenProfile.

2. **TypeScript types need regeneration**
   - What we know: database.ts types are generated from Supabase schema
   - What's unclear: Whether to manually update types or regenerate
   - Recommendation: Manually add new fields to the Database interface since running supabase gen types requires the migration to be applied first. This matches the pattern used in prior phases.

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/00018_create_social_tables.sql` -- feed_posts schema, saved_recipes schema, RLS policies
- `supabase/migrations/00003_create_recipes.sql` -- recipes RLS showing household-only SELECT
- `supabase/migrations/00020_add_reported_content_and_recipe_id.sql` -- recipe_id column on feed_posts
- `src/stores/socialStore.ts` -- saveRecipeFromPost implementation, feed CRUD
- `src/stores/cookLogStore.ts` -- createCookLog implementation
- `src/components/social/FeedCard.tsx` -- current card layout and props
- `src/components/social/FeedList.tsx` -- save and cook-this-too flow
- `src/lib/feedHelpers.ts` -- fire-and-forget feed post creation pattern
- `app/(app)/recipe/[id].tsx` -- recipe detail screen structure

### Secondary (MEDIUM confidence)
- `src/types/database.ts` -- generated types for FeedPost, FeedPostInsert (lines 550-596)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - building on existing patterns with verified schema
- Pitfalls: HIGH - RLS issue verified by reading actual migration policies

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable codebase, no external dependency changes)
