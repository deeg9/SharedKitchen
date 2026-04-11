-- Phase 45: Recipe Attribution & Creator Permissions
-- 1. Backfill legacy recipes (created_by IS NULL) to household admin or oldest member
-- 2. Replace permissive UPDATE/DELETE with creator-only policies + legacy exception

BEGIN;

-- Step 1: Backfill legacy recipes with NULL created_by
-- Assign to household admin first, fall back to oldest member if no admin exists
UPDATE recipes r
SET created_by = COALESCE(
  (SELECT hm.user_id FROM household_members hm
   WHERE hm.household_id = r.household_id AND hm.role = 'admin'
   ORDER BY hm.joined_at ASC LIMIT 1),
  (SELECT hm.user_id FROM household_members hm
   WHERE hm.household_id = r.household_id
   ORDER BY hm.joined_at ASC LIMIT 1)
)
WHERE r.created_by IS NULL;

-- Step 2: Drop old permissive UPDATE and DELETE policies
-- SELECT and INSERT policies remain unchanged
DROP POLICY IF EXISTS "Users can update recipes in their household" ON recipes;
DROP POLICY IF EXISTS "Users can delete recipes in their household" ON recipes;

-- Step 3: Create creator-only UPDATE policy with legacy exception
-- Legacy exception: if recipe was backfilled to household admin, any household member can still edit
CREATE POLICY "Creator can update own recipes"
  ON recipes FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (
      is_household_member(household_id, auth.uid())
      AND created_by = (
        SELECT hm.user_id FROM household_members hm
        WHERE hm.household_id = recipes.household_id
        AND hm.role = 'admin'
        ORDER BY hm.joined_at ASC
        LIMIT 1
      )
    )
  );

-- Step 4: Create creator-only DELETE policy with legacy exception (same logic)
CREATE POLICY "Creator can delete own recipes"
  ON recipes FOR DELETE
  USING (
    auth.uid() = created_by
    OR (
      is_household_member(household_id, auth.uid())
      AND created_by = (
        SELECT hm.user_id FROM household_members hm
        WHERE hm.household_id = recipes.household_id
        AND hm.role = 'admin'
        ORDER BY hm.joined_at ASC
        LIMIT 1
      )
    )
  );

COMMIT;
