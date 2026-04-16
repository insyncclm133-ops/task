-- ============================================================================
-- 021_support_tickets.sql
-- Help / support tickets raised from the in-app Help widget.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  TEXT        NOT NULL,
  user_name   TEXT,
  subject     TEXT        NOT NULL,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'other'
                CHECK (category IN ('bug', 'feature', 'question', 'billing', 'other')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  status      TEXT        NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  page_url    TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_org_id_idx    ON public.support_tickets (org_id);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx   ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx    ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx   ON public.support_tickets (created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_tickets"      ON public.support_tickets;
DROP POLICY IF EXISTS "users_read_own_tickets"        ON public.support_tickets;
DROP POLICY IF EXISTS "admins_read_org_tickets"       ON public.support_tickets;
DROP POLICY IF EXISTS "platform_admins_manage_tickets" ON public.support_tickets;

-- Authenticated users may raise tickets for themselves
CREATE POLICY "users_insert_own_tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own tickets
CREATE POLICY "users_read_own_tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Org admins can read every ticket raised from within their org
CREATE POLICY "admins_read_org_tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'::app_role
        AND ur.is_active = true
        AND ur.org_id = support_tickets.org_id
    )
  );

-- Platform admins see and manage all tickets
CREATE POLICY "platform_admins_manage_tickets"
  ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_platform_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_platform_admin = true
    )
  );

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket_updated_at();
