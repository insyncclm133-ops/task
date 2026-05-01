import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserStat {
  userId: string;
  userName: string;
  email: string;
  phone: string | null;
  role: string;
  completed: number;
  inProgress: number;
  overdue: number;
  total: number;
  onTimePct: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getPeriodRange(period: 'weekly' | 'monthly'): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (period === 'weekly') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: 'Weekly' };
  } else {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return {
      start,
      end,
      label: start.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    };
  }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── AI Insight via Claude ────────────────────────────────────────────────────

async function generateInsight(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data?.content?.[0]?.text?.trim() || 'Keep up the great work this period!';
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

function buildSummaryEmail(opts: {
  userName: string;
  period: string;
  periodRange: string;
  isAdmin: boolean;
  completed: number;
  inProgress: number;
  overdue: number;
  total: number;
  completionRate: number;
  onTimePct: number;
  aiInsight: string;
  topPerformer?: string;
  memberRows?: { name: string; completed: number; overdue: number; rate: number }[];
}): string {
  const {
    userName, period, periodRange, isAdmin,
    completed, inProgress, overdue, total, completionRate, onTimePct,
    aiInsight, topPerformer, memberRows,
  } = opts;

  const memberTable = isAdmin && memberRows && memberRows.length > 0
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;">
        <tr>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#9ca3af;padding:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Member</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:#9ca3af;padding:0 0 8px;text-transform:uppercase;">Done</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:#9ca3af;padding:0 0 8px;text-transform:uppercase;">Overdue</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:#9ca3af;padding:0 0 8px;text-transform:uppercase;">Rate</th>
        </tr>
        ${memberRows.map((m, i) => `
        <tr style="border-top:1px solid #f3f4f6;background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
          <td style="padding:10px 0;font-size:13px;color:#111827;font-weight:500;">${m.name}</td>
          <td style="text-align:center;padding:10px 0;font-size:13px;color:#059669;font-weight:600;">${m.completed}</td>
          <td style="text-align:center;padding:10px 0;font-size:13px;color:${m.overdue > 0 ? '#dc2626' : '#6b7280'};font-weight:${m.overdue > 0 ? '600' : '400'};">${m.overdue}</td>
          <td style="text-align:center;padding:10px 0;font-size:13px;color:#374151;">${m.rate}%</td>
        </tr>`).join('')}
      </table>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b,#334155);padding:28px 36px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Work-Sync</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">${period} Summary &bull; ${periodRange}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 36px 0;">
            <p style="margin:0 0 4px;color:#374151;font-size:14px;">Hi ${userName},</p>
            <p style="margin:0;color:#6b7280;font-size:13px;">Here is your ${period.toLowerCase()} task summary from Work-Sync.</p>
          </td>
        </tr>

        <!-- KPI Cards -->
        <tr>
          <td style="padding:20px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="25%" style="padding-right:8px;">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:#059669;">${completed}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;font-weight:500;">Completed</p>
                  </div>
                </td>
                <td width="25%" style="padding-right:8px;">
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:#2563eb;">${inProgress}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;font-weight:500;">In Progress</p>
                  </div>
                </td>
                <td width="25%" style="padding-right:8px;">
                  <div style="background:${overdue > 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${overdue > 0 ? '#fecaca' : '#bbf7d0'};border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:${overdue > 0 ? '#dc2626' : '#059669'};">${overdue}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;font-weight:500;">Overdue</p>
                  </div>
                </td>
                <td width="25%">
                  <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:#374151;">${completionRate}%</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;font-weight:500;">Done Rate</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Stats Row -->
        <tr>
          <td style="padding:0 36px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:14px 18px;">
              <tr>
                <td style="font-size:12px;color:#6b7280;">Total tasks: <strong style="color:#111827;">${total}</strong></td>
                <td style="text-align:right;font-size:12px;color:#6b7280;">On-time: <strong style="color:#059669;">${onTimePct}%</strong></td>
              </tr>
              ${topPerformer ? `<tr><td colspan="2" style="font-size:12px;color:#6b7280;padding-top:6px;">Top performer: <strong style="color:#7c3aed;">${topPerformer}</strong></td></tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- AI Insight -->
        <tr>
          <td style="padding:0 36px 24px;">
            <div style="border-left:3px solid #7c3aed;background:#faf5ff;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em;">AI Insight</p>
              <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${aiInsight}</p>
            </div>
          </td>
        </tr>

        <!-- Member Table (admin only) -->
        ${memberTable ? `<tr><td style="padding:0 36px 24px;">${memberTable}</td></tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:0 36px 28px;">
            <a href="https://task.in-sync.co.in/dashboard" style="display:inline-block;background:#1e293b;color:#fff;text-decoration:none;padding:11px 28px;border-radius:8px;font-size:13px;font-weight:600;">View Dashboard</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Automated ${period.toLowerCase()} report from Work-Sync &bull; In-Sync Solutions</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const period: 'weekly' | 'monthly' = body.period === 'monthly' ? 'monthly' : 'weekly';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@in-sync.co.in';
    const exotelApiKey = Deno.env.get('EXOTEL_API_KEY');
    const exotelApiToken = Deno.env.get('EXOTEL_API_TOKEN');
    const exotelAccountSid = Deno.env.get('EXOTEL_ACCOUNT_SID');
    const exotelWhatsAppFrom = Deno.env.get('EXOTEL_WHATSAPP_NUMBER');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { start, end, label } = getPeriodRange(period);
    const periodRange = `${fmtDate(start)} – ${fmtDate(end)}`;

    // ── Fetch all orgs (or a specific one) ──────────────────────────────────
    const orgFilter = body.org_id;
    let orgQuery = adminClient.from('organizations').select('id, name');
    if (orgFilter) orgQuery = orgQuery.eq('id', orgFilter);
    const { data: orgs } = await orgQuery;
    if (!orgs?.length) {
      return new Response(JSON.stringify({ error: 'No organizations found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allResults = [];

    for (const org of orgs) {
      // ── Fetch tasks for the period ─────────────────────────────────────────
      const { data: tasks } = await adminClient
        .from('tasks')
        .select('id, status, priority, assigned_to, due_date, created_at, completed_at, assigned_user:profiles!tasks_assigned_to_fkey(full_name)')
        .eq('org_id', org.id);

      const now = new Date();
      const periodTasks = (tasks ?? []).filter((t) => {
        const created = new Date(t.created_at);
        if (created > end) return false;
        if (t.status === 'pending' || t.status === 'in_progress') return true;
        if (t.completed_at && new Date(t.completed_at) >= start) return true;
        return false;
      });

      // ── Compute org-level stats ────────────────────────────────────────────
      const orgCompleted = periodTasks.filter((t) => t.status === 'completed').length;
      const orgInProgress = periodTasks.filter((t) => t.status === 'in_progress').length;
      const orgOverdue = periodTasks.filter(
        (t) => t.due_date && new Date(t.due_date) < now && ['pending', 'in_progress'].includes(t.status),
      ).length;
      const orgTotal = periodTasks.length;
      const orgRate = orgTotal > 0 ? Math.round((orgCompleted / orgTotal) * 100) : 0;

      // ── Per-user stats ─────────────────────────────────────────────────────
      const userMap = new Map<string, { completed: number; inProgress: number; overdue: number; total: number; onTime: number }>();
      for (const t of periodTasks) {
        const uid = t.assigned_to;
        if (!uid) continue;
        if (!userMap.has(uid)) userMap.set(uid, { completed: 0, inProgress: 0, overdue: 0, total: 0, onTime: 0 });
        const s = userMap.get(uid)!;
        s.total++;
        if (t.status === 'completed') {
          s.completed++;
          if (t.completed_at && t.due_date && new Date(t.completed_at) <= new Date(t.due_date + 'T23:59:59')) s.onTime++;
        } else if (t.status === 'in_progress') {
          s.inProgress++;
        }
        if (t.due_date && new Date(t.due_date) < now && ['pending', 'in_progress'].includes(t.status)) s.overdue++;
      }

      // ── Fetch active users with profiles ──────────────────────────────────
      const { data: activeUsers } = await adminClient
        .from('profiles')
        .select('id, full_name, email, phone, user_roles!inner(role, is_active)')
        .eq('org_id', org.id)
        .eq('is_active', true)
        .eq('user_roles.is_active', true);

      if (!activeUsers?.length) continue;

      // Top performer
      let topPerformerName: string | undefined;
      let topCompleted = 0;
      for (const [uid, s] of userMap.entries()) {
        if (s.completed > topCompleted) {
          topCompleted = s.completed;
          const u = activeUsers.find((u) => u.id === uid);
          topPerformerName = u?.full_name ?? undefined;
        }
      }

      // Member rows for admin email
      const memberRows = Array.from(userMap.entries())
        .map(([uid, s]) => {
          const u = activeUsers.find((u) => u.id === uid);
          return {
            name: u?.full_name || 'Unknown',
            completed: s.completed,
            overdue: s.overdue,
            rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
          };
        })
        .sort((a, b) => b.completed - a.completed);

      // ── Generate AI insights ───────────────────────────────────────────────
      const adminInsight = anthropicKey
        ? await generateInsight(
            `You are a concise productivity analyst. In 1-2 sentences max, summarize this ${period} team performance and give ONE specific actionable recommendation. Data: ${orgCompleted} tasks completed, ${orgInProgress} in progress, ${orgOverdue} overdue out of ${orgTotal} total. Completion rate: ${orgRate}%. Top performer: ${topPerformerName || 'N/A'}. Be direct and specific.`,
            anthropicKey,
          )
        : `Team completed ${orgCompleted} tasks this period with a ${orgRate}% completion rate.`;

      // ── Send to each user ─────────────────────────────────────────────────
      for (const user of activeUsers) {
        const roles = (user.user_roles as { role: string; is_active: boolean }[]) || [];
        const isAdmin = roles.some((r) => ['admin', 'platform_admin'].includes(r.role));
        const uStats = userMap.get(user.id) ?? { completed: 0, inProgress: 0, overdue: 0, total: 0, onTime: 0 };

        // For regular users: personal stats. For admins: team stats.
        const displayCompleted = isAdmin ? orgCompleted : uStats.completed;
        const displayInProgress = isAdmin ? orgInProgress : uStats.inProgress;
        const displayOverdue = isAdmin ? orgOverdue : uStats.overdue;
        const displayTotal = isAdmin ? orgTotal : uStats.total;
        const displayRate = displayTotal > 0 ? Math.round((displayCompleted / displayTotal) * 100) : 0;
        const displayOnTimePct = uStats.completed > 0 ? Math.round((uStats.onTime / uStats.completed) * 100) : 0;

        const userInsight = isAdmin
          ? adminInsight
          : anthropicKey
          ? await generateInsight(
              `In 1 sentence, encourage this team member based on their ${period} stats: ${uStats.completed} tasks completed, ${uStats.overdue} overdue, ${displayOnTimePct}% on-time. Be specific and motivating.`,
              anthropicKey,
            )
          : `You completed ${uStats.completed} tasks this period. Keep it up!`;

        const waText = `${displayCompleted}`;
        const waInProgress = `${displayInProgress}`;
        const waOverdue = `${displayOverdue}`;

        // WhatsApp
        if (exotelApiKey && exotelApiToken && exotelAccountSid && exotelWhatsAppFrom && user.phone) {
          try {
            const credentials = btoa(`${exotelApiKey}:${exotelApiToken}`);
            await fetch(`https://api.exotel.com/v2/accounts/${exotelAccountSid}/messages`, {
              method: 'POST',
              headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                whatsapp: {
                  messages: [{
                    from: exotelWhatsAppFrom,
                    to: user.phone,
                    content: {
                      type: 'template',
                      template: {
                        name: period === 'weekly' ? 'worksync_weekly_summary' : 'worksync_monthly_summary',
                        language: { code: 'en' },
                        components: [{
                          type: 'body',
                          parameters: [
                            { type: 'text', text: user.full_name || 'there' },
                            { type: 'text', text: waText },
                            { type: 'text', text: waInProgress },
                            { type: 'text', text: waOverdue },
                            { type: 'text', text: userInsight },
                          ],
                        }],
                      },
                    },
                  }],
                },
              }),
            });
          } catch (e) {
            console.error(`WhatsApp failed for ${user.email}:`, e);
          }
        }

        // Email
        if (resendApiKey && user.email) {
          try {
            const html = buildSummaryEmail({
              userName: user.full_name || 'there',
              period: label,
              periodRange,
              isAdmin,
              completed: displayCompleted,
              inProgress: displayInProgress,
              overdue: displayOverdue,
              total: displayTotal,
              completionRate: displayRate,
              onTimePct: displayOnTimePct,
              aiInsight: userInsight,
              topPerformer: isAdmin ? topPerformerName : undefined,
              memberRows: isAdmin ? memberRows : undefined,
            });

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: `Work-Sync <${fromEmail}>`,
                to: [user.email],
                subject: `Your ${label} Work-Sync Summary`,
                html,
              }),
            });
          } catch (e) {
            console.error(`Email failed for ${user.email}:`, e);
          }
        }
      }

      allResults.push({ org: org.name, users: activeUsers.length, orgCompleted, orgOverdue });
    }

    return new Response(JSON.stringify({ success: true, period, results: allResults }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-summary error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
