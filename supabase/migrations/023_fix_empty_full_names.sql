-- ============================================================================
-- 023_fix_empty_full_names.sql
--
-- When users are created via manage-user, full_name was never derived from
-- first_name + last_name, leaving profiles with full_name = ''.
-- Repair existing rows by computing full_name from first_name and last_name.
-- ============================================================================

UPDATE public.profiles
SET full_name = TRIM(
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
)
WHERE (full_name IS NULL OR full_name = '')
  AND (first_name IS NOT NULL AND first_name <> '');
