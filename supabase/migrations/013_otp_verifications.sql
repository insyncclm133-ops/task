-- ============================================================================
-- 013_otp_verifications.sql
-- Temporary OTP storage for registration email + phone verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  email_otp  TEXT        NOT NULL,
  phone_otp  TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_verifications_email_idx ON public.otp_verifications (email);

-- No RLS — accessed only via service role in edge functions
ALTER TABLE public.otp_verifications DISABLE ROW LEVEL SECURITY;
