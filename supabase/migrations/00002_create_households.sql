-- Create households table
CREATE TABLE households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create household_members table
CREATE TABLE household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check household membership without recursive RLS
-- Uses SECURITY DEFINER to bypass RLS on household_members when checking membership
CREATE OR REPLACE FUNCTION is_household_member(p_household_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = p_user_id
  );
$$;

-- Helper function to check if user is admin of a household
CREATE OR REPLACE FUNCTION is_household_admin(p_household_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
$$;

-- RLS Policies for households

-- SELECT: User can see households they are a member of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (is_household_member(id, auth.uid()));

-- INSERT: User can create a household (created_by must be themselves)
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Only admins can update household details
CREATE POLICY "Admins can update households"
  ON households FOR UPDATE
  USING (is_household_admin(id, auth.uid()));

-- RLS Policies for household_members

-- SELECT: User can see members of households they belong to
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (is_household_member(household_id, auth.uid()));

-- INSERT: User can add themselves to a household (join flow)
CREATE POLICY "Users can join households"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only admins can remove members
CREATE POLICY "Admins can remove members"
  ON household_members FOR DELETE
  USING (is_household_admin(household_id, auth.uid()));
