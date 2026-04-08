-- ============================================================================
-- 010_trial.sql
-- 14-day free trial for organizations
-- ============================================================================

-- 1. Add trial_ends_at and plan to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'team', 'business')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ NOT NULL
    DEFAULT (now() + INTERVAL '14 days');

-- 2. Existing orgs get 14 days from now
UPDATE public.organizations
SET trial_ends_at = now() + INTERVAL '14 days'
WHERE plan = 'trial';
