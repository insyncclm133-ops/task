import { corsHeaders } from '../_shared/cors.ts';

// Submits both WhatsApp templates to Meta via Exotel.
// Call this once after deployment to register the templates.
// Templates will be in PENDING state until Meta approves them (24-48 hrs).

const TEMPLATES = [
  {
    name: 'worksync_task_notification',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, \n\nHere\'s an update from Work-Sync:\n\nTask - *{{2}}*\n\nCreator:\n{{3}}\n\nDescription\n{{4}}\n\nExpected completion date:\n\n{{5}}\n\nThis notification is sent by Work-Sync',
        example: {
          body_text: [['Priya', 'Fix login bug', 'Ravi Kumar', 'The login page throws a 500 error on incorrect password entry.', '15 Apr 2026']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Open Task',
            url: 'https://task.in-sync.co.in/tasks/{{1}}',
            example: ['e3b0c442-98fc-4def-b1ab-5a3d2f8e1c09'],
          },
        ],
      },
    ],
  },
  {
    name: 'worksync_summary',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}},\n\nHere is your {{2}} Work-Sync summary:\n\nCompleted: {{3}}\nIn Progress: {{4}}\nOverdue: {{5}}\n\nKey Insight:\n{{6}}\n\nThis report is sent by Work-Sync',
        example: {
          body_text: [['Priya', 'Weekly', '5', '3', '1', 'You completed 5 tasks this week with an 83% on-time rate. Keep it up!']],
        },
      },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('EXOTEL_API_KEY');
    const apiToken = Deno.env.get('EXOTEL_API_TOKEN');
    const accountSid = Deno.env.get('EXOTEL_ACCOUNT_SID');
    const wabaId = Deno.env.get('EXOTEL_WABA_ID');
    const subdomain = Deno.env.get('EXOTEL_SUBDOMAIN') || 'api.exotel.com';

    if (!apiKey || !apiToken || !accountSid || !wabaId) {
      return new Response(
        JSON.stringify({ error: 'Missing Exotel env vars: EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_WABA_ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `https://${apiKey}:${apiToken}@${subdomain}/v2/accounts/${accountSid}/templates?waba_id=${wabaId}`;
    const results = [];

    for (const template of TEMPLATES) {
      const payload = {
        whatsapp: {
          templates: [{ template }],
        },
      };

      console.log(`Submitting template: ${template.name}`);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result;
      try { result = JSON.parse(text); } catch { result = { raw: text }; }

      console.log(`${template.name} response:`, JSON.stringify(result));

      const templateRes = result?.response?.whatsapp?.templates?.[0];
      const errorMsg = templateRes?.data?.error?.error_user_msg
        || templateRes?.data?.error?.message
        || (!res.ok ? `HTTP ${res.status}` : null);

      results.push({
        template: template.name,
        success: res.ok && templateRes?.code === 200,
        status: templateRes?.data?.status || (res.ok ? 'PENDING' : 'ERROR'),
        error: errorMsg || null,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-whatsapp-template error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
