-- ============================================================
-- Per-org task numbering
-- ============================================================
-- Previous state: task_number had a GLOBAL UNIQUE constraint, and
-- auto_generate_task_number() computed MAX(task_number) FROM tasks
-- under the invoker's RLS context. In a new org with no tasks yet,
-- MAX resolved to NULL -> next_num=1 -> "TASK-0001", which collides
-- with the seeded demo org's TASK-0001 and errors with 23505.
--
-- New state: unique is scoped to (org_id, task_number), and the
-- trigger is SECURITY DEFINER so it reliably reads all rows for the
-- target org regardless of the caller's RLS.
-- ============================================================

BEGIN;

-- 1. Drop the global unique constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_number_key;

-- 2. Add per-org unique constraint
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_org_task_number_key UNIQUE (org_id, task_number);

-- 3. Rewrite the trigger function: scope by org, SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.auto_generate_task_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 6) AS INT)), 0) + 1
      INTO next_num
      FROM public.tasks
      WHERE org_id = NEW.org_id;

    NEW.task_number := 'TASK-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
