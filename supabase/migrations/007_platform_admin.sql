-- ============================================================================
-- 007_platform_admin.sql
-- Add platform_admin to app_role enum
-- (must be separate transaction before using the new value)
-- ============================================================================
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'platform_admin';
