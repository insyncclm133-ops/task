-- ============================================================================
-- 015_add_department_to_profiles.sql
-- Add free-text department field to profiles
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
