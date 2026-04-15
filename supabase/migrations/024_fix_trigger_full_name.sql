-- ============================================================================
-- 024_fix_trigger_full_name.sql
--
-- Update handle_new_user() to derive full_name from first_name + last_name
-- when full_name is not provided in user metadata. This ensures profiles
-- always have a non-empty full_name regardless of how the user was created.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    v_first_name := NEW.raw_user_meta_data ->> 'first_name';
    v_last_name  := NEW.raw_user_meta_data ->> 'last_name';
    v_full_name  := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), ''),
        ''
    );

    INSERT INTO public.profiles (id, full_name, email, avatar_url, first_name, last_name)
    VALUES (
        NEW.id,
        v_full_name,
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data ->> 'avatar_url',
        v_first_name,
        v_last_name
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
