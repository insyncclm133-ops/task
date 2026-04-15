-- ============================================================================
-- 022_fix_amina_profile_name.sql
--
-- The data-repair in migration 021 created amina@in-sync.co.in's profile
-- with full_name = 'Test' (placeholder). Fix it to her real name so she
-- appears correctly in all user-facing dropdowns and lists.
-- ============================================================================

UPDATE public.profiles
SET
    full_name  = 'Amina',
    first_name = 'Amina'
WHERE id    = '014f58f3-f48c-4fe4-9384-4b5daf3bdb13'
  AND email = 'amina@in-sync.co.in';
