import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface NotificationRecord {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  task_id: string | null;
}

interface TaskDetails {
  task_name: string;
  description: string | null;
  due_date: string | null;
  assigned_by: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildEmailHtml(
  notification: NotificationRecord,
  userName: string,
): string {
  const typeLabel: Record<string, string> = {
    task_assigned: 'New Task Assigned',
    status_change: 'Status Update',
    comment: 'New Comment',
    task_completed: 'Task Completed',
    task_overdue: 'Task Overdue',
  };
  const badge = typeLabel[notification.notification_type] || 'Notification';

  const badgeColor =
    notification.notification_type === 'task_overdue'
      ? '#ef4444'
      : notification.notification_type === 'task_completed'
        ? '#22c55e'
        : '#7c3aed';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:28px 36px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Work-Sync</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">In-Sync Solutions</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px;">
            <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:16px;">${badge}</span>
            <p style="margin:16px 0 8px;color:#374151;font-size:14px;">Hi ${userName},</p>
            <h2 style="margin:0 0 12px;color:#111827;font-size:17px;font-weight:600;">${notification.title}</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:13px;line-height:1.6;">${notification.message}</p>
            ${
              notification.task_id
                ? `<a href="https://task.in-sync.co.in/tasks/${notification.task_id}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">View Task</a>`
                : ''
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Automated notification from Work-Sync &bull; In-Sync Solutions</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWhatsAppTemplateBody(
  userName: string,
  taskName: string,
  creatorName: string,
  description: string,
  dueDate: string,
  taskId: string | null,
): object {
  // Approved template: worksync_task_notification
  // Body:
  //   Hi {{1}},
  //
  //   Here's an update from Work-Sync:
  //
  //   Task - *{{2}}*
  //
  //   Creator:
  //   {{3}}
  //
  //   Description
  //   {{4}}
  //
  //   Expected completion date:
  //
  //   {{5}}
  //
  //   This notification is sent by Work-Sync
  //
  // Button (dynamic URL): "Open Task" → https://task.in-sync.co.in/tasks/{{1}}

  const components: object[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: userName },
        { type: 'text', text: taskName },
        { type: 'text', text: creatorName },
        { type: 'text', text: description },
        { type: 'text', text: dueDate },
      ],
    },
  ];

  if (taskId) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: taskId }],
    });
  }

  return {
    type: 'template',
    template: {
      name: 'worksync_task_notification',
      language: { code: 'en' },
      components,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const notification: NotificationRecord = payload.record || payload;

    if (!notification.user_id || !notification.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up recipient profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('email, phone, full_name')
      .eq('id', notification.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup failed:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch task details for WhatsApp template variables
    let taskName = notification.title;
    let creatorName = 'Work-Sync';
    let description = notification.message;
    let dueDate = 'Not set';

    if (notification.task_id) {
      const { data: task } = await adminClient
        .from('tasks')
        .select('task_name, description, due_date, assigned_by')
        .eq('id', notification.task_id)
        .single<TaskDetails>();

      if (task) {
        taskName = task.task_name;
        description = task.description || notification.message;
        dueDate = formatDate(task.due_date);

        if (task.assigned_by) {
          const { data: creator } = await adminClient
            .from('profiles')
            .select('full_name')
            .eq('id', task.assigned_by)
            .single();
          creatorName = creator?.full_name || 'Work-Sync';
        }
      }
    }

    const results: { email: unknown; whatsapp: unknown } = {
      email: null,
      whatsapp: null,
    };

    // ==================== EMAIL via Resend ====================
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && profile.email) {
      try {
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@in-sync.co.in';
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Work-Sync <${fromEmail}>`,
            to: [profile.email],
            subject: notification.title,
            html: buildEmailHtml(notification, profile.full_name || 'there'),
          }),
        });
        results.email = await emailRes.json();
        console.log('Resend response:', JSON.stringify(results.email));
      } catch (emailErr) {
        console.error('Resend error:', emailErr);
        results.email = { error: emailErr.message };
      }
    }

    // ==================== WHATSAPP via Exotel ====================
    const exotelApiKey = Deno.env.get('EXOTEL_API_KEY');
    const exotelApiToken = Deno.env.get('EXOTEL_API_TOKEN');
    const exotelAccountSid = Deno.env.get('EXOTEL_ACCOUNT_SID');
    const exotelWhatsAppFrom = Deno.env.get('EXOTEL_WHATSAPP_NUMBER');

    if (exotelApiKey && exotelApiToken && exotelAccountSid && exotelWhatsAppFrom && profile.phone) {
      try {
        const credentials = btoa(`${exotelApiKey}:${exotelApiToken}`);
        const waRes = await fetch(
          `https://api.exotel.com/v2/accounts/${exotelAccountSid}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              whatsapp: {
                messages: [
                  {
                    from: exotelWhatsAppFrom,
                    to: profile.phone,
                    content: buildWhatsAppTemplateBody(
                      profile.full_name || 'there',
                      taskName,
                      creatorName,
                      description,
                      dueDate,
                      notification.task_id,
                    ),
                  },
                ],
              },
            }),
          },
        );
        results.whatsapp = await waRes.json();
        console.log('Exotel response:', JSON.stringify(results.whatsapp));
      } catch (waErr) {
        console.error('Exotel error:', waErr);
        results.whatsapp = { error: waErr.message };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
