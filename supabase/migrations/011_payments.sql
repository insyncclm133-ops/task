-- ============================================================================
-- 011_payments.sql
-- Payment tracking for plan upgrades (recorded by platform admin)
-- Recording a payment triggers the plan upgrade.
-- Platform admin can also extend trial on a per-org basis.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency     TEXT          NOT NULL DEFAULT 'INR',
  method       TEXT          NOT NULL DEFAULT 'manual'
                 CHECK (method IN ('upi', 'bank_transfer', 'card', 'cash', 'manual')),
  reference_no TEXT,
  notes        TEXT,
  plan_target  TEXT          NOT NULL CHECK (plan_target IN ('team', 'business')),
  recorded_by  UUID          NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Only platform admin can read/write payments
CREATE POLICY "payments_platform_admin"
  ON public.payments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'platform_admin'
        AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'platform_admin'
        AND ur.is_active = true
    )
  );
