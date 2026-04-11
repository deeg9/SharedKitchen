# Phase 47: Recipe Comments - Research

**Researched:** 2026-04-11
**Domain:** Supabase RLS, Zustand store, React Native comment UI with threading
**Confidence:** HIGH

## Summary

Recipe comments are a well-understood feature with strong precedent in this codebase. The existing `post_comments` / `CommentSheet` pattern from the social feed (Phase 18) provides a near-identical implementation to reference. The key differences for recipe comments are: (1) threaded replies via a nullable `parent_id` column, (2) visibility scoped to household + followers rather than fully public, (3) recipe creator can delete any comment (not just own), and (4) inline rendering on the recipe detail page rather than a bottom sheet.

The `recipe_comments` table is a new table (confirmed: no existing table or types for it). It mirrors the `cook_logs` pattern for schema design (user_id, recipe_id, household_id) but adds `parent_id` for threading. RLS needs a compound policy: household members via `is_household_member()` OR followers via a subquery on `follows` + `kitchen_profiles`.

**Primary recommendation:** Create a new `recipe_comments` table with `parent_id`, a dedicated `recipeCommentStore` Zustand store (do NOT extend socialStore), and a `RecipeCommentsSection` component rendered inline on recipe/[id].tsx below the CookPhotoGallery.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Flat with reply-to -- single level of nesting (reply shows parent context inline)
- Comments are public (household + followers), notes are private per-user -- visually separated sections
- Sticky input bar at bottom of comment section (like iMessage) with @handle shown
- Max 500 characters per comment (matches cook log notes limit)
- "Comments" section below cook photo gallery on recipe detail -- with count badge in section header
- Delete own comments via long-press; recipe creator can delete any comment
- Each comment shows: avatar + @handle + relative time, body below
- No real-time updates -- pull-to-refresh and refresh on post
- Visibility: household members + anyone following the kitchen (matches cook log/feed visibility)
- No notifications for v8.0 -- keep simple
- New `recipe_comments` table: id, recipe_id, user_id, parent_id (nullable for replies), body (max 500), created_at
- RLS: household-based SELECT, user-based INSERT, user+creator DELETE

### Claude's Discretion
- Visual styling of comment bubbles and reply indentation
- Input bar animation and keyboard handling
- Empty state messaging for comments section
- Reply UX (how user initiates and sees reply context)

### Deferred Ideas (OUT OF SCOPE)
- Comment notifications (push/in-app)
- @mention support in comments
- Comment reactions (emoji)
- Comment editing (only delete for v8.0)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMNT-01 | User can add a comment on any recipe visible to them | New `recipe_comments` table + `recipeCommentStore.addComment()` + sticky input bar component |
| CMNT-02 | Recipe comments support one level of threading | `parent_id` nullable FK column + client-side grouping of replies under parents |
| CMNT-03 | Comments visible to household members and followers of the kitchen | Compound RLS SELECT policy using `is_household_member()` OR `follows` subquery |
| CMNT-04 | Comment author can delete their own comment | RLS DELETE policy with `auth.uid() = user_id`; recipe creator delete handled by OR clause checking `recipes.created_by` |
| CMNT-05 | Comments visually distinct from existing private recipe notes | Separate section with different styling; notes section already exists as "Household Tips" |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | (already installed) | recipeCommentStore state | Project standard for all stores |
| @supabase/supabase-js | (already installed) | DB queries + RLS | Project standard |
| react-native | (already installed) | FlatList, TextInput, Pressable | Comment list + input bar |
| date-fns | (already installed) | Relative time formatting | Already used throughout app |
| expo-haptics | (already installed) | Long-press feedback | Cook log delete pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-image | (already installed) | Avatar rendering | Comment avatars |
| @expo/vector-icons | (already installed) | Icons (reply, delete, send) | UI affordances |

No new packages needed. [VERIFIED: codebase inspection of package.json imports]

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    recipeCommentStore.ts          # New Zustand store
  components/
    recipes/
      RecipeCommentsSection.tsx    # Inline section for recipe detail
      RecipeCommentItem.tsx        # Single comment row (reusable for parent + reply)
      RecipeCommentInput.tsx       # Sticky input bar with reply context
  types/
    database.ts                    # Add RecipeComment + RecipeCommentInsert types
supabase/
  migrations/
    00028_create_recipe_comments.sql  # Table, indexes, RLS, comment_count trigger
app/
  (app)/
    recipe/
      [id].tsx                     # Add RecipeCommentsSection below CookPhotoGallery
```

### Pattern 1: Threaded Comment Data Model
**What:** Single `recipe_comments` table with nullable `parent_id` self-reference. Client fetches all comments for a recipe in one query, then groups parent/reply relationships client-side. [VERIFIED: matches CONTEXT.md decision for flat-with-reply-to]
**When to use:** Always -- this is the locked decision.
**Example:**
```sql
-- Source: project pattern from cook_logs migration + CONTEXT.md decision
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES recipe_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pattern 2: Compound Visibility RLS (Household + Followers)
**What:** SELECT policy that allows access if user is household member OR if user's kitchen follows the recipe's kitchen. [VERIFIED: follows table and is_household_member function exist in migrations 00002 and 00018]
**When to use:** For the SELECT policy on recipe_comments.
**Example:**
```sql
-- Source: combining patterns from 00003 (recipe_ratings RLS) + 00018 (follows table)
CREATE POLICY "Users can view recipe comments"
  ON recipe_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND (
        -- Household member
        is_household_member(r.household_id, auth.uid())
        -- OR follower of the kitchen
        OR EXISTS (
          SELECT 1 FROM kitchen_profiles kp
          JOIN follows f ON f.following_kitchen_id = kp.id
          JOIN kitchen_profiles my_kp ON my_kp.id = f.follower_kitchen_id
          JOIN household_members hm ON hm.household_id = my_kp.household_id
          WHERE kp.household_id = r.household_id
          AND hm.user_id = auth.uid()
        )
      )
    )
  );
```

### Pattern 3: Recipe Creator Delete Policy
**What:** DELETE policy allowing both the comment author AND the recipe creator to delete comments. [VERIFIED: CONTEXT.md locks "recipe creator can delete any comment"]
**Example:**
```sql
CREATE POLICY "Comment author or recipe creator can delete"
  ON recipe_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_comments.recipe_id
      AND r.created_by = auth.uid()
    )
  );
```

### Pattern 4: Client-Side Thread Grouping
**What:** Fetch all comments flat, then group in the store/component. Top-level comments have `parent_id = null`. Replies are grouped under their parent.
**Example:**
```typescript
// Source: standard threading pattern matching CONTEXT.md "flat with reply-to"
interface ThreadedComment {
  comment: RecipeComment & { profile: { handle: string | null; avatar_url: string | null } };
  replies: Array<RecipeComment & { profile: { handle: string | null; avatar_url: string | null } }>;
}

function groupComments(comments: RecipeCommentWithProfile[]): ThreadedComment[] {
  const topLevel = comments.filter(c => c.parent_id === null);
  const replies = comments.filter(c => c.parent_id !== null);
  const replyMap = new Map<string, RecipeCommentWithProfile[]>();

  for (const reply of replies) {
    const existing = replyMap.get(reply.parent_id!) ?? [];
    existing.push(reply);
    replyMap.set(reply.parent_id!, existing);
  }

  return topLevel.map(comment => ({
    comment,
    replies: replyMap.get(comment.id) ?? [],
  }));
}
```

### Pattern 5: Zustand Store (follows cookLogStore pattern)
**What:** Dedicated `recipeCommentStore` with fetch, add, delete, clear actions. Does NOT extend socialStore (different table, different visibility model). [VERIFIED: socialStore manages post_comments for feed; recipe_comments is a separate table per CONTEXT.md and STATE.md decision]
**Example:**
```typescript
// Source: cookLogStore.ts pattern
interface RecipeCommentState {
  comments: RecipeCommentWithProfile[];
  commentCount: number;
  loading: boolean;
  error: string | null;
  replyingTo: string | null; // parent comment id for reply mode

  fetchComments: (recipeId: string) => Promise<void>;
  fetchCommentCount: (recipeId: string) => Promise<void>;
  addComment: (params: { recipeId: string; userId: string; body: string; parentId?: string }) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  setReplyingTo: (commentId: string | null) => void;
  clearComments: () => void;
}
```

### Anti-Patterns to Avoid
- **Extending socialStore:** Recipe comments have different visibility (household+followers) vs. feed comments (public). Separate store avoids confusion. [VERIFIED: STATE.md decision "Recipe comments use separate table from feed comments (different visibility scopes)"]
- **Deep nesting in DB:** Only one level of replies. The `parent_id` must reference a top-level comment (parent_id IS NULL), never a reply. Enforce client-side or with a CHECK constraint.
- **Real-time subscriptions:** CONTEXT.md locks "no real-time updates -- pull-to-refresh and refresh on post." Do not add Supabase Realtime channels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time | Custom time formatting | `getRelativeTime()` from CommentSheet.tsx or date-fns `formatDistanceToNow` | Already implemented in CommentSheet.tsx |
| Avatar + initials | New avatar component | Existing pattern from CommentSheet.tsx (Image + fallback initials View) | Identical requirements |
| Long-press delete | Custom gesture handler | `Pressable onLongPress` + `Alert.alert` confirmation | Cook log pattern already established |
| Comment count trigger | Application-level count | Postgres trigger (like `update_comment_count` for feed_posts) | Consistency with existing pattern; add `comment_count` column to recipes table |

## Common Pitfalls

### Pitfall 1: Missing household_id on recipe_comments
**What goes wrong:** Without `household_id` on recipe_comments, the RLS SELECT must always join through `recipes` to check household membership, adding query overhead.
**Why it happens:** The CONTEXT.md schema only lists `id, recipe_id, user_id, parent_id, body, created_at` -- no `household_id`.
**How to avoid:** The join approach is fine for comments (small result sets per recipe). Do NOT denormalize `household_id` onto recipe_comments unless performance proves it necessary. The join through `recipes` is the established pattern (see recipe_ratings and recipe_notes RLS).
**Warning signs:** Slow comment load times on recipes with many comments.

### Pitfall 2: Reply-to-reply (depth > 1)
**What goes wrong:** Users reply to a reply, creating thread depth > 1, which breaks the flat-with-reply UI.
**Why it happens:** No constraint preventing `parent_id` from pointing to another reply.
**How to avoid:** Client-side: when replying to a reply, set `parent_id` to the reply's `parent_id` (i.e., always reply to the top-level comment). Optionally add a DB check: `CHECK (parent_id IS NULL OR NOT EXISTS (SELECT 1 FROM recipe_comments rc WHERE rc.id = parent_id AND rc.parent_id IS NOT NULL))` -- but this adds complexity. Client enforcement is sufficient for v8.0.
**Warning signs:** Nested comment rendering breaking.

### Pitfall 3: Keyboard Avoidance with Sticky Input
**What goes wrong:** The sticky input bar gets hidden behind the keyboard on iOS/Android.
**Why it happens:** React Native keyboard handling is platform-specific.
**How to avoid:** Use `KeyboardAvoidingView` with `behavior="padding"` on iOS. The input bar should be positioned within the ScrollView flow (not absolute-positioned at screen bottom) since it is part of the comments section, not a global bar.
**Warning signs:** Input hidden on keyboard open; content shifting unexpectedly.

### Pitfall 4: Missing comment_count on recipes table
**What goes wrong:** No count badge in the section header without a count column.
**Why it happens:** The recipes table doesn't have `comment_count`.
**How to avoid:** Add `comment_count INT DEFAULT 0` to recipes table via ALTER TABLE in the migration, plus a trigger mirroring the feed_posts `update_comment_count` pattern.
**Warning signs:** Extra queries to get comment count; count badge not working.

### Pitfall 5: Follower Visibility RLS Performance
**What goes wrong:** The compound RLS policy with nested joins (recipes -> kitchen_profiles -> follows -> kitchen_profiles -> household_members) can be slow.
**Why it happens:** Multiple joins in RLS evaluated per-row.
**How to avoid:** Ensure proper indexes exist on `follows(following_kitchen_id)`, `kitchen_profiles(household_id)`, and `household_members(household_id, user_id)`. These already exist from migration 00018 and 00002.
**Warning signs:** Slow comment fetching for followed kitchens' recipes.

## Code Examples

### Long-Press Delete with Confirmation (established pattern)
```typescript
// Source: cook log pattern from CookPhotoGallery component
import { Alert } from 'react-native';

const handleLongPress = (commentId: string, isOwn: boolean, isCreator: boolean) => {
  if (!isOwn && !isCreator) return;

  Alert.alert(
    'Delete Comment',
    'Are you sure you want to delete this comment?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteComment(commentId),
      },
    ]
  );
};
```

### Comment Section Header with Count Badge
```typescript
// Source: design pattern from cook count badge
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Comments</Text>
  {commentCount > 0 && (
    <View style={styles.countBadge}>
      <Text style={styles.countText}>{commentCount}</Text>
    </View>
  )}
</View>
```

### Reply Context in Input Bar
```typescript
// Source: discretion area - recommended pattern
// When replyingTo is set, show a small banner above the input
{replyingTo && (
  <View style={styles.replyBanner}>
    <Text style={styles.replyText}>
      Replying to @{replyingTo.handle}
    </Text>
    <Pressable onPress={() => setReplyingTo(null)}>
      <MaterialCommunityIcons name="close" size={16} color={colors.onSurfaceVariant} />
    </Pressable>
  </View>
)}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with jest-expo |
| Config file | package.json ("test": "jest") |
| Quick run command | `npx jest --testPathPattern=recipeComment --no-coverage` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMNT-01 | addComment creates comment in store | unit | `npx jest __tests__/stores/recipeCommentStore.test.ts -x` | Wave 0 |
| CMNT-02 | groupComments threads replies under parents | unit | `npx jest __tests__/stores/recipeCommentStore.test.ts -x` | Wave 0 |
| CMNT-03 | RLS visibility (household + followers) | manual-only | N/A -- requires Supabase instance | N/A |
| CMNT-04 | deleteComment removes from store state | unit | `npx jest __tests__/stores/recipeCommentStore.test.ts -x` | Wave 0 |
| CMNT-05 | Comments section renders distinctly from notes | manual-only | N/A -- visual distinction | N/A |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=recipeComment --no-coverage`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/stores/recipeCommentStore.test.ts` -- covers CMNT-01, CMNT-02, CMNT-04
- [ ] `__tests__/lib/commentUtils.test.ts` -- covers groupComments threading logic

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (uses existing auth) |
| V3 Session Management | no | N/A (uses existing session) |
| V4 Access Control | yes | RLS policies on recipe_comments (household + follower + creator) |
| V5 Input Validation | yes | DB CHECK constraint char_length(body) <= 500 + client maxLength |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized comment deletion | Elevation of Privilege | RLS DELETE policy: only auth.uid() = user_id OR recipe creator |
| Comment on inaccessible recipe | Information Disclosure | RLS INSERT policy: user must be household member of recipe's household |
| Body length bypass | Tampering | DB CHECK constraint enforced server-side regardless of client |
| Follower visibility leak | Information Disclosure | RLS SELECT policy joins through follows + kitchen_profiles |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next migration number is 00028 | Architecture Patterns | Low -- just a filename; easy to adjust |
| A2 | Client-side enforcement of reply depth is sufficient | Pitfall 2 | Low -- worst case is a misplaced reply, not data loss |
| A3 | Adding comment_count to recipes table is the right approach (vs. count query) | Pitfall 4 | Medium -- could use count query instead, but trigger is consistent with feed_posts pattern |

## Open Questions

1. **Reply depth enforcement**
   - What we know: CONTEXT.md says single level of nesting
   - What's unclear: Whether to enforce at DB level (CHECK constraint) or client only
   - Recommendation: Client-side enforcement; set parent_id to the root comment when replying to a reply

2. **Comment count column location**
   - What we know: Feed posts have `comment_count` on `feed_posts` table with trigger
   - What's unclear: Whether to add `comment_count` to `recipes` table or use a count query
   - Recommendation: Add `comment_count` column + trigger to match the established feed_posts pattern

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/00018_create_social_tables.sql` -- post_comments schema, RLS, triggers
- `supabase/migrations/00027_create_cook_logs.sql` -- cook_logs schema, RLS pattern
- `supabase/migrations/00003_create_recipes.sql` -- recipes schema, recipe_ratings/notes RLS pattern
- `src/components/social/CommentSheet.tsx` -- existing comment UI pattern
- `src/stores/socialStore.ts` -- existing comment CRUD methods
- `src/stores/cookLogStore.ts` -- Zustand store pattern for new feature
- `app/(app)/recipe/[id].tsx` -- recipe detail page (integration point)
- `.planning/phases/47-recipe-comments/47-CONTEXT.md` -- locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` -- decision that recipe comments use separate table from feed comments

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new packages
- Architecture: HIGH -- follows established patterns (cook_logs store, social comment UI, recipe RLS)
- Pitfalls: HIGH -- identified from codebase inspection and known React Native keyboard issues

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable -- no external dependencies changing)
