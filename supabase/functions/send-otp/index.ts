import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function emailHtml(otp: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:28px 36px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Work-Sync</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Email Verification</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 8px;color:#374151;font-size:14px;">Use this code to verify your email address:</p>
            <div style="margin:24px 0;text-align:center;">
              <span style="display:inline-block;background:#f5f3ff;border:2px dashed #7c3aed;border-radius:12px;padding:16px 32px;font-size:36px;font-weight:800;letter-spacing:12px;color:#7c3aed;">${otp}</span>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Valid for 10 minutes. Do not share this code with anyone.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Work-Sync &bull; In-Sync Solutions</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, phone } = await req.json();

    if (!email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Email and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Delete any existing unexpired verifications for this email
    await supabase.from('otp_verifications').delete().eq('email', email);

    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();

    // Store OTPs
    const { data: verification, error: dbError } = await supabase
      .from('otp_verifications')
      .insert({ email, phone, email_otp: emailOtp, phone_otp: phoneOtp })
      .select('id')
      .single();

    if (dbError) throw new Error('Failed to store verification: ' + dbError.message);

    // ── Send email OTP via Resend ──────────────────────────────────────────
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@in-sync.co.in';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Work-Sync <${fromEmail}>`,
        to: [email],
        subject: `${emailOtp} is your Work-Sync verification code`,
        html: emailHtml(emailOtp),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      throw new Error('Failed to send email OTP: ' + JSON.stringify(err));
    }

    // ── Send WhatsApp OTP via Exotel ───────────────────────────────────────
    const exotelApiKey = Deno.env.get('EXOTEL_API_KEY')!;
    const exotelApiToken = Deno.env.get('EXOTEL_API_TOKEN')!;
    const exotelAccountSid = Deno.env.get('EXOTEL_ACCOUNT_SID')!;
    const exotelFrom = Deno.env.get('EXOTEL_WHATSAPP_NUMBER')!;

    const credentials = btoa(`${exotelApiKey}:${exotelApiToken}`);
    const waRes = await fetch(
      `https://api.exotel.com/v2/accounts/${exotelAccountSid}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: {
            messages: [{
              from: exotelFrom,
              to: phone,
              content: {
                type: 'template',
                template: {
                  name: 'otp',
                  language: { code: 'en' },
                  components: [{
                    type: 'body',
                    parameters: [{ type: 'text', text: phoneOtp }],
                  }],
                },
              },
            }],
          },
        }),
      },
    );

    if (!waRes.ok) {
      const err = await waRes.json();
      throw new Error('Failed to send WhatsApp OTP: ' + JSON.stringify(err));
    }

    return new Response(
      JSON.stringify({ verification_id: verification.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-otp error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
