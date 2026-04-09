-- ============================================================================
-- 009_fix_task_update_rls.sql
-- Fix UPDATE RLS on tasks:
--   1. Backfill org_id on tasks where it is NULL (inherit from assigned_by user)
--   2. Loosen UPDATE policy so assignee can update their own tasks
--      without being blocked by org_id mismatch on legacy rows
-- ============================================================================

-- 1. Backfill org_id from the assigner's profile for any tasks with NULL org_id
UPDATE tasks t
SET org_id = p.org_id
FROM profiles p
WHERE t.org_id IS NULL
  AND t.assigned_by = p.id
  AND p.org_id IS NOT NULL;

-- 2. Replace the UPDATE policy to handle NULL org_id rows and
--    separate the assignee permission from the org_id requirement.

DROP POLICY IF EXISTS "Users can update tasks in their org" ON tasks;

CREATE POLICY "Users can update tasks in their org"
    ON tasks FOR UPDATE
    TO authenticated
    USING (
        (assigned_to = auth.uid() OR assigned_by = auth.uid())
        AND (org_id = auth_user_org_id() OR org_id IS NULL)
    )
    WITH CHECK (
        org_id = auth_user_org_id() OR org_id IS NULL
    );

-- 3. Also fix the start_date column type: it's DATE but we pass ISO timestamps.
--    Cast it to TIMESTAMPTZ for precision.
ALTER TABLE tasks ALTER COLUMN start_date TYPE TIMESTAMPTZ
    USING start_date::TIMESTAMPTZ;
