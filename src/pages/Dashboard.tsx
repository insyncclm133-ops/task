import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { animate, motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, Zap, ListTodo,
  Flame, Target, Users,
  AlertOctagon, Lightbulb, TrendingUp, Activity,
} from 'lucide-react';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAuth } from '@/lib/auth-context';
import type { AIInsight } from '@/types/task';

/* ── Design tokens ─────────────────────────────────────────────────── */
const N = {
  cyan:    '#00d4ff',
  emerald: '#00ff88',
  amber:   '#ffaa00',
  red:     '#ff3366',
  purple:  '#a855f7',
  blue:    '#3b82f6',
};

const PIE_COLORS = [N.emerald, N.blue, N.amber, N.red, '#6b7280'];

const GLASS: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
};

const CHART_AXIS  = { fill: 'rgba(255,255,255,0.3)', fontSize: 11 };
const CHART_TIP: React.CSSProperties = {
  background: 'rgba(8,8,18,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 12,
  color: '#fff',
};

const INSIGHT_CFG: Record<
  AIInsight['type'],
  { neon: string; bg: string; border: string; Icon: React.ElementType }
> = {
  critical: { neon: N.red,     bg: 'rgba(255,51,102,0.08)',  border: 'rgba(255,51,102,0.3)',  Icon: AlertOctagon },
  warning:  { neon: N.amber,   bg: 'rgba(255,170,0,0.08)',   border: 'rgba(255,170,0,0.3)',   Icon: AlertTriangle },
  success:  { neon: N.emerald, bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.3)',   Icon: TrendingUp },
  info:     { neon: N.cyan,    bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.3)',   Icon: Lightbulb },
};

const RANKS = [
  { label: 'S', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
  { label: 'A', color: N.emerald, bg: 'rgba(0,255,136,0.15)' },
  { label: 'B', color: N.cyan,    bg: 'rgba(0,212,255,0.15)' },
  { label: 'C', color: N.purple,  bg: 'rgba(168,85,247,0.15)' },
];

/* ── Animated counter ───────────────────────────────────────────────── */
function AnimatedNumber({ target, neon }: { target: number; neon: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return ctrl.stop;
  }, [target]);
  return (
    <span style={{ textShadow: `0 0 28px ${neon}65` }}>
      {val.toLocaleString()}
    </span>
  );
}

/* ── 3-D tilt wrapper ───────────────────────────────────────────────── */
function Card3D({
  children,
  className = '',
  glow = 'rgba(124,58,237,0.4)',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 20;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -20;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.03,1.03,1.03)`;
    el.style.boxShadow = `0 30px 64px rgba(0,0,0,0.6), 0 0 48px ${glow}`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────────────────── */
function KpiCard({
  label, value, icon: Icon, neon, subtitle,
}: {
  label: string; value: number; icon: React.ElementType;
  neon: string; subtitle: string;
}) {
  return (
    <Card3D glow={`${neon}55`} style={{ borderRadius: 16 }}>
      <div
        className="rounded-2xl p-4 h-full flex flex-col justify-between"
        style={{ ...GLASS, borderTop: `2px solid ${neon}` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `${neon}18`, boxShadow: `0 0 20px ${neon}45` }}
          >
            <Icon size={18} color={neon} />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/30">
            {label}
          </span>
        </div>
        <div>
          <p className="text-3xl font-black text-white leading-none mb-1">
            <AnimatedNumber target={value} neon={neon} />
          </p>
          <p className="text-[11px] text-white/35">{subtitle}</p>
        </div>
      </div>
    </Card3D>
  );
}

/* ── Section label ──────────────────────────────────────────────────── */
function SectionLabel({
  icon: Icon, label, neon,
}: {
  icon: React.ElementType; label: string; neon: string;
}) {
  return (
    <p
      className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0 mb-3"
      style={{ color: 'rgba(255,255,255,0.38)' }}
    >
      <Icon size={11} color={neon} />
      {label}
    </p>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export function DashboardPage() {
  const now = new Date();
  const [monthStart, setMonthStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [monthEnd,   setMonthEnd]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));

  const { isAdmin, isPlatformAdmin, user } = useAuth();
  const isOrgAdmin = isAdmin || isPlatformAdmin;
  const { stats, isLoading } = useTaskStats(monthStart, monthEnd, isOrgAdmin, user?.id ?? '');

  const members         = stats?.userCompletionStats ?? [];
  const totalTasks      = stats?.totalTasks ?? 0;
  const completedCount  = stats?.statusDistribution?.find(s => s.name === 'completed')?.value   ?? 0;
  const inProgressCount = stats?.statusDistribution?.find(s => s.name === 'in_progress')?.value ?? 0;
  const pendingCount    = stats?.statusDistribution?.find(s => s.name === 'pending')?.value     ?? 0;
  const overdue         = stats?.overdueTasks ?? 0;
  const completionRate  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [yr, mo] = e.target.value.split('-').map(Number);
    const d = new Date(yr, mo - 1, 1);
    setMonthStart(format(startOfMonth(d), 'yyyy-MM-dd'));
    setMonthEnd(format(endOfMonth(d), 'yyyy-MM-dd'));
  };

  const statusPieData = [
    { name: 'Completed',   value: completedCount  },
    { name: 'In Progress', value: inProgressCount  },
    { name: 'Pending',     value: pendingCount     },
    { name: 'Overdue',     value: overdue          },
  ].filter(d => d.value > 0);

  const memberChartData = members.map(m => ({
    name:          m.userName.split(' ')[0] || '?',
    Completed:     m.completed,
    'In Progress': m.inProgress,
    Pending:       m.pending,
    Overdue:       m.overdue,
  }));

  const hasTrend = stats?.weeklyTrend?.some(w => w.created > 0 || w.completed > 0);

  /* ── Loading ───────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div
        className="h-[calc(100vh-3.5rem)] flex items-center justify-center"
        style={{ background: '#050508' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-full border-2 animate-spin"
            style={{ borderColor: `${N.cyan} transparent transparent transparent` }}
          />
          <p className="text-[11px] tracking-widest uppercase text-white/30">
            Loading Mission Data
          </p>
        </div>
      </div>
    );
  }

  /* ── Page ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden p-4 gap-3"
      style={{
        background: '#050508',
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <motion.div
        className="flex items-center justify-between shrink-0"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(168,85,247,0.2)',
              boxShadow: '0 0 24px rgba(168,85,247,0.5)',
            }}
          >
            <Activity size={17} color={N.purple} />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">
              Mission Control
            </h1>
            <p className="text-[11px] text-white/35 mt-0.5">
              {isOrgAdmin
                ? `${members.length} agent${members.length !== 1 ? 's' : ''} · ${format(new Date(monthStart), 'MMM yyyy')}`
                : `Personal ops · ${format(new Date(monthStart), 'MMM yyyy')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 tracking-widest">LIVE</span>
          </div>
          <input
            type="month"
            value={monthStart.slice(0, 7)}
            onChange={handleMonthChange}
            className="text-xs px-3 py-1.5 rounded-lg text-white outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              colorScheme: 'dark',
            }}
          />
        </div>
      </motion.div>

      {/* ── KPI ROW ──────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-4 gap-3 shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <KpiCard
          label="Total Tasks" value={totalTasks} icon={ListTodo}
          neon={N.cyan} subtitle={`${stats?.myOpenTasks ?? 0} assigned to you`}
        />
        <KpiCard
          label="Completed" value={completedCount} icon={CheckCircle2}
          neon={N.emerald} subtitle={`${completionRate}% completion rate`}
        />
        <KpiCard
          label="In Progress" value={inProgressCount} icon={Zap}
          neon={N.amber} subtitle="Currently active"
        />
        <KpiCard
          label="Overdue" value={overdue} icon={AlertTriangle}
          neon={overdue > 0 ? N.red : N.emerald}
          subtitle={overdue > 0 ? 'Needs attention' : 'All on track'}
        />
      </motion.div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 min-h-0 grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left — charts (2 cols) ─────────────────────────────────── */}
        <div className="col-span-2 flex flex-col gap-3 min-h-0">

          {/* Team Performance — admin */}
          {isOrgAdmin && (
            <div
              className="flex-1 rounded-2xl p-4 min-h-0 flex flex-col"
              style={{ ...GLASS, borderRadius: 16 }}
            >
              <SectionLabel icon={Target} label="Team Performance" neon={N.purple} />
              {memberChartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <Users size={32} color="rgba(255,255,255,0.1)" />
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberChartData} barCategoryGap="24%">
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="4 4"
                        vertical={false}
                      />
                      <XAxis dataKey="name" tick={CHART_AXIS} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={CHART_AXIS} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={CHART_TIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="Completed"    fill={N.emerald} radius={[3,3,0,0]} />
                      <Bar dataKey="In Progress"  fill={N.blue}    radius={[3,3,0,0]} />
                      <Bar dataKey="Pending"      fill={N.amber}   radius={[3,3,0,0]} />
                      <Bar dataKey="Overdue"      fill={N.red}     radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Weekly Trend */}
          {hasTrend ? (
            <div
              className={`rounded-2xl p-4 flex flex-col min-h-0 ${isOrgAdmin ? 'shrink-0' : 'flex-1'}`}
              style={{ ...GLASS, borderRadius: 16, ...(isOrgAdmin ? { height: 172 } : {}) }}
            >
              <SectionLabel icon={TrendingUp} label="Weekly Trend" neon={N.cyan} />
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats!.weeklyTrend} barCategoryGap="30%">
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis dataKey="week" tick={CHART_AXIS} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={CHART_AXIS} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={CHART_TIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="created"   name="Created"   fill={N.purple}  radius={[3,3,0,0]} />
                    <Bar dataKey="completed" name="Completed" fill={N.emerald} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : !isOrgAdmin ? (
            <div
              className="flex-1 flex items-center justify-center rounded-2xl"
              style={{ ...GLASS, borderRadius: 16 }}
            >
              <p className="text-white/20 text-sm">No trend data yet</p>
            </div>
          ) : null}
        </div>

        {/* Right — donut + leaderboard (1 col) ───────────────────── */}
        <div className="col-span-1 flex flex-col gap-3 min-h-0">

          {/* Status donut */}
          <Card3D glow="rgba(0,255,136,0.35)" style={{ borderRadius: 16, flexShrink: 0 }}>
            <div className="rounded-2xl p-4" style={{ ...GLASS, borderRadius: 16 }}>
              <SectionLabel icon={CheckCircle2} label="Status Split" neon={N.emerald} />
              {statusPieData.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-white/20 text-sm">
                  No data
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <ResponsiveContainer width={148} height={148}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%" cy="50%"
                          innerRadius={46} outerRadius={66}
                          dataKey="value" stroke="none"
                          startAngle={90} endAngle={-270}
                        >
                          {statusPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span
                        className="text-2xl font-black text-white"
                        style={{ textShadow: `0 0 24px ${N.emerald}80` }}
                      >
                        {completionRate}%
                      </span>
                      <span className="text-[9px] tracking-widest uppercase text-white/35">done</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                    {statusPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1 text-[10px]">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-white/40">{d.name}</span>
                        <span className="font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card3D>

          {/* Leaderboard — admin */}
          {isOrgAdmin && members.length > 0 && (
            <div
              className="flex-1 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden"
              style={{ ...GLASS, borderRadius: 16 }}
            >
              <SectionLabel icon={Flame} label="Leaderboard" neon={N.amber} />
              <div
                className="flex-1 overflow-y-auto space-y-1.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {members.map((m, i) => {
                  const rank = RANKS[Math.min(i, RANKS.length - 1)];
                  const pct  = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: rank.bg, color: rank.color }}
                      >
                        {rank.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/85 truncate">{m.userName}</p>
                        <div
                          className="h-1 rounded-full mt-1.5 overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg,${rank.color},${rank.color}88)`,
                              boxShadow: `0 0 8px ${rank.color}80`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black" style={{ color: rank.color }}>
                          {m.completed}
                        </p>
                        <p className="text-[9px] text-white/25">done</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My stats — non-admin */}
          {!isOrgAdmin && (
            <div
              className="flex-1 rounded-2xl p-4 flex flex-col gap-2 min-h-0"
              style={{ ...GLASS, borderRadius: 16 }}
            >
              <SectionLabel icon={Activity} label="My Stats" neon={N.cyan} />
              {[
                { label: 'Assigned',    value: stats?.myOpenTasks ?? 0, color: N.cyan    },
                { label: 'Completed',   value: completedCount,           color: N.emerald },
                { label: 'In Progress', value: inProgressCount,          color: N.amber   },
                { label: 'Overdue',     value: overdue, color: overdue > 0 ? N.red : N.emerald },
              ].map(row => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-xs text-white/50">{row.label}</span>
                  <span
                    className="text-sm font-black"
                    style={{ color: row.color, textShadow: `0 0 12px ${row.color}70` }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── AI INSIGHTS STRIP ────────────────────────────────────────── */}
      {stats?.aiInsights && stats.aiInsights.length > 0 && (
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {stats.aiInsights.map((insight, i) => {
              const cfg = INSIGHT_CFG[insight.type];
              return (
                <div
                  key={i}
                  className="shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    minWidth: 220,
                    maxWidth: 280,
                  }}
                >
                  <cfg.Icon size={12} color={cfg.neon} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-bold leading-tight"
                      style={{ color: cfg.neon }}
                    >
                      {insight.title}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-snug text-white/40 line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
