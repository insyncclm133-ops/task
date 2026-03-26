-- ============================================================================
-- 008_platform_admin_setup.sql
-- Platform admin role setup, data changes, and RLS policy updates
-- ============================================================================

-- ============================================================================
-- 1. MAKE user_roles.org_id NULLABLE (platform_admin has no org)
-- ============================================================================
ALTER TABLE user_roles ALTER COLUMN org_id DROP NOT NULL;

-- Drop the old unique constraint and replace with partial indexes
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_org_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_org_unique
  ON user_roles (user_id, org_id) WHERE org_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_platform_admin_unique
  ON user_roles (user_id) WHERE org_id IS NULL AND role = 'platform_admin';

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Check if a user is platform_admin
CREATE OR REPLACE FUNCTION is_platform_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
      AND is_active = true
  );
$$;

-- Overloaded: check current authenticated user
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT is_platform_admin(auth.uid());
$$;

-- ============================================================================
-- 3. UPDATE a@in-sync.co.in TO platform_admin
-- ============================================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'a@in-sync.co.in';

  IF v_admin_id IS NOT NULL THEN
    -- Remove existing org-scoped roles
    DELETE FROM user_roles WHERE user_id = v_admin_id;

    -- Insert platform_admin role (no org)
    INSERT INTO user_roles (user_id, org_id, role, is_active)
    VALUES (v_admin_id, NULL, 'platform_admin', true);

    -- Update profile: no org, no designation, correct name
    UPDATE profiles
    SET org_id = NULL,
        designation_id = NULL,
        full_name = 'Amit Sengupta',
        first_name = 'Amit',
        last_name = 'Sengupta'
    WHERE id = v_admin_id;
  END IF;
END $$;

-- ============================================================================
-- 4. RENAME ORG & PROMOTE ORG ADMIN
-- ============================================================================

-- Rename "In-Sync Solutions" to "In-Sync Demo"
UPDATE organizations SET name = 'In-Sync Demo'
WHERE id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

-- Promote Priya Sharma to admin in In-Sync Demo
UPDATE user_roles SET role = 'admin'
WHERE org_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  AND user_id = (SELECT id FROM auth.users WHERE email = 'priya@in-sync.co.in');

-- Clean up the unused "In-Sync" org if it has no members
DELETE FROM organizations
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
  );

-- ============================================================================
-- 5. UPDATE RLS POLICIES — platform_admin gets READ access across all orgs
-- ============================================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR org_id = auth_user_org_id()
    OR org_id IS NULL
    OR is_platform_admin()
  );

-- ---- tasks ----
DROP POLICY IF EXISTS "Users can view tasks in their org" ON tasks;
CREATE POLICY "Users can view tasks in their org"
  ON tasks FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- task_comments ----
DROP POLICY IF EXISTS "Users can view comments in their org" ON task_comments;
CREATE POLICY "Users can view comments in their org"
  ON task_comments FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- task_attachments ----
DROP POLICY IF EXISTS "Users can view attachments in their org" ON task_attachments;
CREATE POLICY "Users can view attachments in their org"
  ON task_attachments FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- task_watchers ----
DROP POLICY IF EXISTS "Users can view watchers in their org" ON task_watchers;
CREATE POLICY "Users can view watchers in their org"
  ON task_watchers FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- notifications ----
DROP POLICY IF EXISTS "Users can view their notifications in their org" ON notifications;
CREATE POLICY "Users can view their notifications in their org"
  ON notifications FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() AND (org_id = auth_user_org_id() OR org_id IS NULL))
    OR is_platform_admin()
  );

-- ---- teams ----
DROP POLICY IF EXISTS "Users can view teams in their org" ON teams;
CREATE POLICY "Users can view teams in their org"
  ON teams FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- team_members ----
DROP POLICY IF EXISTS "Users can view team members in their org" ON team_members;
CREATE POLICY "Users can view team members in their org"
  ON team_members FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- organizations ----
DROP POLICY IF EXISTS "Users can view their org" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
CREATE POLICY "Users can view organizations"
  ON organizations FOR SELECT TO authenticated
  USING (
    id = auth_user_org_id()
    OR is_platform_admin()
  );

-- ---- user_roles ----
DROP POLICY IF EXISTS "Users can view roles in their org" ON user_roles;
DROP POLICY IF EXISTS "Admins can view roles in their org" ON user_roles;
CREATE POLICY "Users can view roles"
  ON user_roles FOR SELECT TO authenticated
  USING (
    org_id = auth_user_org_id()
    OR user_id = auth.uid()
    OR is_platform_admin()
  );

-- ---- designations ----
DROP POLICY IF EXISTS "Users can view designations in their org" ON designations;
CREATE POLICY "Users can view designations"
  ON designations FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());

-- ---- designation_feature_access ----
DROP POLICY IF EXISTS "Users can view designation access in their org" ON designation_feature_access;
CREATE POLICY "Users can view designation access"
  ON designation_feature_access FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designations d
      WHERE d.id = designation_id
        AND (d.org_id = auth_user_org_id() OR is_platform_admin())
    )
  );

-- ---- reporting_hierarchy ----
DROP POLICY IF EXISTS "Users can view reporting hierarchy in their org" ON reporting_hierarchy;
CREATE POLICY "Users can view reporting hierarchy"
  ON reporting_hierarchy FOR SELECT TO authenticated
  USING (org_id = auth_user_org_id() OR is_platform_admin());
