-- ============================================================================
-- 010_welcome_tier.sql
-- Welcome tier: first 100 tasks + notifications free, then paid
-- ============================================================================

-- 1. Add plan column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'welcome'
  CHECK (plan IN ('welcome', 'team'));

-- 2. Trigger function to enforce 100-task limit on welcome tier
CREATE OR REPLACE FUNCTION public.enforce_task_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan TEXT;
  v_count INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM public.organizations WHERE id = NEW.org_id;

  IF v_plan = 'welcome' THEN
    SELECT COUNT(*) INTO v_count FROM public.tasks WHERE org_id = NEW.org_id;
    IF v_count >= 100 THEN
      RAISE EXCEPTION 'TASK_LIMIT_REACHED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_task_limit
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_limit();
