-- ============================================================================
-- 012_fix_seed_users.sql
-- Fix seed demo users so GoTrue can authenticate them
-- ============================================================================

-- Fix null string fields GoTrue expects as empty strings,
-- add email_verified to metadata, and set password to Blizz26ard#
UPDATE auth.users SET
  email_change            = COALESCE(email_change, ''),
  email_change_token_new  = COALESCE(email_change_token_new, ''),
  raw_user_meta_data      = raw_user_meta_data || '{"email_verified": true}'::jsonb,
  encrypted_password      = crypt('Blizz26ard#', gen_salt('bf', 10)),
  email_confirmed_at      = COALESCE(email_confirmed_at, now()),
  updated_at              = now()
WHERE email IN (
  'priya@in-sync.co.in',
  'rahul@in-sync.co.in',
  'neha@in-sync.co.in',
  'amit@in-sync.co.in'
);

-- Fix identity_data to include email_verified and phone_verified
UPDATE auth.identities SET
  identity_data = identity_data || '{"email_verified": true, "phone_verified": false}'::jsonb,
  updated_at    = now()
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'priya@in-sync.co.in',
    'rahul@in-sync.co.in',
    'neha@in-sync.co.in',
    'amit@in-sync.co.in'
  )
);
