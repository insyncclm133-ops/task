-- ============================================================================
-- 009_signup_onboarding.sql
-- Self-service organization creation for new users during onboarding.
-- Creates org, assigns admin role, and updates profile in one transaction.
-- ============================================================================

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

  -- Prevent duplicate org creation
  SELECT org_id INTO v_existing_org_id FROM profiles WHERE id = v_user_id;
  IF v_existing_org_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  -- Create organization
  INSERT INTO organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  -- Assign admin role to the founding user
  INSERT INTO user_roles (user_id, org_id, role, is_active)
  VALUES (v_user_id, v_org_id, 'admin', true);

  -- Link profile to org and mark onboarding done
  UPDATE profiles
  SET org_id = v_org_id, onboarding_completed = true
  WHERE id = v_user_id;

  RETURN json_build_object('org_id', v_org_id, 'org_name', p_org_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
