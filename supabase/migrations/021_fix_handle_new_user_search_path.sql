-- ============================================================================
-- 021_fix_handle_new_user_search_path.sql
--
-- ROOT CAUSE: The supabase_auth_admin role has search_path = 'auth'.
-- When GoTrue fires the on_auth_user_created trigger, the SECURITY DEFINER
-- function handle_new_user() inherits that session search_path.
-- PostgreSQL then looks for 'profiles' in the auth schema — it doesn't
-- exist there — and the INSERT fails with "relation does not exist".
-- Production had a silent EXCEPTION handler masking this, so auth users
-- were created but had no corresponding profile row.
--
-- FIX: Redefine handle_new_user() with SET search_path = public so it
-- always resolves 'profiles' to public.profiles regardless of the caller's
-- session search_path. Also remove the silent exception swallowing so any
-- future failure surfaces immediately during registration.
--
-- DATA REPAIR: Create missing profile rows and admin user_roles for all
-- auth users whose trigger-based profile creation silently failed.
-- ============================================================================

-- ── 1. Fix the trigger function ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data ->> 'avatar_url',
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 2. Data repair — recreate profiles for users that the broken trigger missed ──

-- insyncclm955@gmail.com (org: Insync Test)
-- Profile was manually patched with test data; update it with real metadata values.
UPDATE public.profiles
SET
    full_name           = 'In Sync Test',
    first_name          = 'In',
    last_name           = 'Sync Test',
    org_id              = 'b4da0e03-811f-44dd-90b5-5b80a0c96e10',
    onboarding_completed = true
WHERE id = 'e1d4f232-833e-4b75-8ece-1c5a4a185b9a';

-- amaan.mansuri1005@gmail.com (org: ABC Infra)
INSERT INTO public.profiles (id, full_name, email, first_name, last_name, org_id, onboarding_completed)
VALUES (
    '48b86f3d-3861-4dde-8e41-eacbf4bf6409',
    'ABC',
    'amaan.mansuri1005@gmail.com',
    'ABC',
    '',
    'a3d45d8d-dd7f-4dea-bc08-781168fe3906',
    true
)
ON CONFLICT (id) DO UPDATE
    SET org_id = EXCLUDED.org_id, onboarding_completed = true;

-- pinkymansuri1@gmail.com (org: Pinky's Fashion Corner)
INSERT INTO public.profiles (id, full_name, email, first_name, last_name, org_id, onboarding_completed)
VALUES (
    'a701cf61-e311-4e5e-ae9a-0552228c5d55',
    'Pinky',
    'pinkymansuri1@gmail.com',
    'Pinky',
    '',
    'bdd4da67-d5cf-44e1-9d71-aafa108abe9c',
    true
)
ON CONFLICT (id) DO UPDATE
    SET org_id = EXCLUDED.org_id, onboarding_completed = true;

-- amina@in-sync.co.in (org: Test / ef1a2a93)
INSERT INTO public.profiles (id, full_name, email, first_name, last_name, org_id, onboarding_completed)
VALUES (
    '014f58f3-f48c-4fe4-9384-4b5daf3bdb13',
    'Test',
    'amina@in-sync.co.in',
    'Test',
    '',
    'ef1a2a93-be21-4038-81e6-8ed33ff4f2de',
    true
)
ON CONFLICT (id) DO UPDATE
    SET org_id = EXCLUDED.org_id, onboarding_completed = true;

-- echocommunicator@gmail.com — no matching org; create profile only
INSERT INTO public.profiles (id, full_name, email, first_name, last_name)
VALUES (
    '7ae7c50f-cfab-4132-a5f2-a58a21afde20',
    'In-Sync Demo',
    'echocommunicator@gmail.com',
    'In-Sync',
    'Demo'
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Data repair — create admin user_roles for the four org-admin users ──

INSERT INTO public.user_roles (user_id, org_id, role, is_active)
SELECT v.user_id, v.org_id, v.role::app_role, v.is_active
FROM (VALUES
    ('e1d4f232-833e-4b75-8ece-1c5a4a185b9a'::uuid, 'b4da0e03-811f-44dd-90b5-5b80a0c96e10'::uuid, 'admin', true),
    ('48b86f3d-3861-4dde-8e41-eacbf4bf6409'::uuid, 'a3d45d8d-dd7f-4dea-bc08-781168fe3906'::uuid, 'admin', true),
    ('a701cf61-e311-4e5e-ae9a-0552228c5d55'::uuid, 'bdd4da67-d5cf-44e1-9d71-aafa108abe9c'::uuid, 'admin', true),
    ('014f58f3-f48c-4fe4-9384-4b5daf3bdb13'::uuid, 'ef1a2a93-be21-4038-81e6-8ed33ff4f2de'::uuid, 'admin', true)
) AS v(user_id, org_id, role, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v.user_id AND ur.org_id = v.org_id
);
