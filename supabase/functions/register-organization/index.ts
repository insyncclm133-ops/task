import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      org_name,
      admin_name,
      admin_email,
      admin_password,
      admin_phone,
      verification_id,
      email_otp,
      phone_otp,
    } = await req.json();

    // ── Basic validation ───────────────────────────────────────────────────
    if (!org_name || !admin_name || !admin_email || !admin_password || !admin_phone) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!verification_id || !email_otp || !phone_otp) {
      return new Response(
        JSON.stringify({ error: 'OTP verification is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (org_name.trim().length < 2 || org_name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Organization name must be 2–100 characters' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!isValidEmail(admin_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (admin_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const trimmedEmail = admin_email.toLowerCase().trim();

    // ── Verify OTPs ────────────────────────────────────────────────────────
    const { data: verification, error: verErr } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('id', verification_id)
      .eq('email', trimmedEmail)
      .single();

    if (verErr || !verification) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification session. Please request new OTPs.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (new Date() > new Date(verification.expires_at)) {
      await supabase.from('otp_verifications').delete().eq('id', verification_id);
      return new Response(
        JSON.stringify({ error: 'OTPs have expired. Please request new ones.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (verification.email_otp !== email_otp.trim()) {
      return new Response(
        JSON.stringify({ error: 'Invalid email OTP. Please check and try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (verification.phone_otp !== phone_otp.trim()) {
      return new Response(
        JSON.stringify({ error: 'Invalid WhatsApp OTP. Please check and try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // OTPs verified — delete the record
    await supabase.from('otp_verifications').delete().eq('id', verification_id);

    // ── Create organization ────────────────────────────────────────────────
    const trimmedName = org_name.trim();
    const trimmedAdminName = admin_name.trim();
    const nameParts = trimmedAdminName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: trimmedName })
      .select('id')
      .single();

    if (orgErr) {
      console.error('Organization creation failed:', orgErr);
      return new Response(
        JSON.stringify({ error: 'Failed to create organization. Please try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Create auth user (email already verified via OTP) ──────────────────
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: trimmedAdminName, first_name: firstName, last_name: lastName },
    });

    if (authErr || !authData.user) {
      console.error('Auth user creation failed:', authErr);
      await supabase.from('organizations').delete().eq('id', org.id);

      const message = authErr?.message?.includes('already been registered')
        ? 'This email is already registered. Please sign in instead.'
        : 'Failed to create account. Please try again.';

      return new Response(
        JSON.stringify({ error: message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = authData.user.id;

    // ── Update profile ─────────────────────────────────────────────────────
    await supabase.from('profiles').update({
      org_id: org.id,
      full_name: trimmedAdminName,
      first_name: firstName,
      last_name: lastName,
      phone: admin_phone,
      onboarding_completed: true,
    }).eq('id', userId);

    // ── Assign admin role ──────────────────────────────────────────────────
    const { error: roleErr } = await supabase.from('user_roles').insert({
      user_id: userId,
      org_id: org.id,
      role: 'admin',
      is_active: true,
    });

    if (roleErr) {
      console.error('Admin role assignment failed:', roleErr);
      // Rollback: remove the created user and org
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('organizations').delete().eq('id', org.id);
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role. Please try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, org_id: org.id, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Organization registration error:', err);
    return new Response(
      JSON.stringify({ error: 'Registration failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
