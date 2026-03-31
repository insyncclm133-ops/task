-- ============================================================================
-- 009_signup_onboarding.sql
-- Organization registration is handled by the register-organization edge
-- function (uses service role key).  This migration only adds an INSERT
-- policy on organizations so the service-role path works cleanly, and keeps
-- the RPC as a fallback for any future in-app org creation needs.
-- ============================================================================

-- Allow the edge function (service role) to insert organizations.
-- Service role already bypasses RLS, so this policy is mainly for
-- any future client-side fallback via the setup_new_organization RPC.
CREATE OR REPLACE FUNCTION setup_new_organization(p_org_name TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT org_id INTO v_existing_org_id FROM profiles WHERE id = v_user_id;
  IF v_existing_org_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  INSERT INTO organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  INSERT INTO user_roles (user_id, org_id, role, is_active)
  VALUES (v_user_id, v_org_id, 'admin', true);

  UPDATE profiles
  SET org_id = v_org_id, onboarding_completed = true
  WHERE id = v_user_id;

  RETURN json_build_object('org_id', v_org_id, 'org_name', p_org_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
