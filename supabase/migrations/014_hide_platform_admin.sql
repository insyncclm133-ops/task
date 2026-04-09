-- ============================================================================
-- 014_hide_platform_admin.sql
-- Remove org_id IS NULL from profiles policy so platform_admin is not
-- visible to regular org users.
-- ============================================================================

DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;

CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (org_id IS NOT NULL AND org_id = auth_user_org_id())
    OR is_platform_admin()
  );
