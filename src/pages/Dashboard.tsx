import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { animate, motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, Zap, ListTodo,
  Flame, Target, Users, Gamepad2, LayoutDashboard,
  AlertOctagon, Lightbulb, TrendingUp, Activity,
} from 'lucide-react';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAuth } from '@/lib/auth-context';
import type { AIInsight } from '@/types/task';

/* ── Theme definitions ─────────────────────────────────────────────── */
type DashTheme = 'gaming' | 'classic';

interface ThemeConfig {
  // Page
  pageBg: string;
  pageStyle: React.CSSProperties;
  // Panels
  panel: React.CSSProperties;
  // Text
  title: string;
  subtitle: string;
  label: string;
  muted: string;
  value: string;
  // Charts
  axisStyle: object;
  gridColor: string;
  tipStyle: React.CSSProperties;
  cursorFill: string;
  barColors: { completed: string; inProgress: string; pending: string; overdue: string; created: string };
  pieColors: string[];
  // KPI
  kpiTopBorder: (neon: string) => string;
  kpiIconBg: (neon: string) => string;
  kpiIconShadow: (neon: string) => string;
  kpiValueShadow: (neon: string) => string;
  kpiNeons: { total: string; completed: string; inProgress: string; overdue: string; overdueOk: string };
  // Leaderboard
  rankStyle: React.CSSProperties;
  rankBadge: (i: number) => { label: string; color: string; bg: string };
  rankBarBg: string;
  rankBarFill: (color: string) => string;
  rankBarGlow: (color: string) => string;
  // Insights
  insightTitleColor: (neon: string) => string;
  insightDescClass: string;
  // Donut
  donutValueColor: string;
  donutValueShadow: string;
  donutLabelColor: string;
  // Misc
  headerTitle: string;
  sectionLabelColor: string;
  enable3dGlow: boolean;
  liveIndicator: boolean;
  loadingBg: string;
  loadingText: string;
  inputStyle: React.CSSProperties;
}

const NEON = {
  cyan: '#00d4ff', emerald: '#00ff88', amber: '#ffaa00',
  red: '#ff3366', purple: '#a855f7', blue: '#3b82f6',
};

const GAMING_RANKS = [
  { label: 'S', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
  { label: 'A', color: NEON.emerald, bg: 'rgba(0,255,136,0.15)' },
  { label: 'B', color: NEON.cyan,    bg: 'rgba(0,212,255,0.15)' },
  { label: 'C', color: NEON.purple,  bg: 'rgba(168,85,247,0.15)' },
];

const CLASSIC_RANKS = [
  { label: '1', color: '#b45309', bg: '#fef3c7' },
  { label: '2', color: '#374151', bg: '#f3f4f6' },
  { label: '3', color: '#92400e', bg: '#fde68a' },
  { label: '4', color: '#6b7280', bg: '#f9fafb' },
];

const THEMES: Record<DashTheme, ThemeConfig> = {
  gaming: {
    pageBg: '#050508',
    pageStyle: {
      background: '#050508',
      backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)`,
      backgroundSize: '48px 48px',
    },
    panel: {
      background: 'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(16px)',
    },
    title: 'text-white',
    subtitle: 'rgba(255,255,255,0.35)',
    label: 'rgba(255,255,255,0.38)',
    muted: 'rgba(255,255,255,0.25)',
    value: 'text-white',
    axisStyle: { fill: 'rgba(255,255,255,0.3)', fontSize: 11 },
    gridColor: 'rgba(255,255,255,0.05)',
    tipStyle: { background: 'rgba(8,8,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#fff' },
    cursorFill: 'rgba(255,255,255,0.03)',
    barColors: { completed: NEON.emerald, inProgress: NEON.blue, pending: NEON.amber, overdue: NEON.red, created: NEON.purple },
    pieColors: [NEON.emerald, NEON.blue, NEON.amber, NEON.red, '#6b7280'],
    kpiTopBorder: (n) => `2px solid ${n}`,
    kpiIconBg: (n) => `${n}18`,
    kpiIconShadow: (n) => `0 0 20px ${n}45`,
    kpiValueShadow: (n) => `0 0 28px ${n}65`,
    kpiNeons: { total: NEON.cyan, completed: NEON.emerald, inProgress: NEON.amber, overdue: NEON.red, overdueOk: NEON.emerald },
    rankStyle: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' },
    rankBadge: (i) => GAMING_RANKS[Math.min(i, GAMING_RANKS.length - 1)],
    rankBarBg: 'rgba(255,255,255,0.08)',
    rankBarFill: (c) => `linear-gradient(90deg,${c},${c}88)`,
    rankBarGlow: (c) => `0 0 8px ${c}80`,
    insightTitleColor: (n) => n,
    insightDescClass: 'text-white/40',
    donutValueColor: 'text-white',
    donutValueShadow: `0 0 24px ${NEON.emerald}80`,
    donutLabelColor: 'rgba(255,255,255,0.35)',
    headerTitle: 'Mission Control',
    sectionLabelColor: 'rgba(255,255,255,0.38)',
    enable3dGlow: true,
    liveIndicator: true,
    loadingBg: '#050508',
    loadingText: 'text-white/30',
    inputStyle: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark', color: '#fff' },
  },

  classic: {
    pageBg: 'hsl(var(--background))',
    pageStyle: { background: 'hsl(var(--background))' },
    panel: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    title: 'text-foreground',
    subtitle: 'hsl(var(--muted-foreground))',
    label: 'hsl(var(--muted-foreground))',
    muted: 'hsl(var(--muted-foreground))',
    value: 'text-foreground',
    axisStyle: { fill: 'hsl(220,9%,46%)', fontSize: 11 },
    gridColor: 'hsl(220,13%,91%)',
    tipStyle: { background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    cursorFill: 'rgba(0,0,0,0.04)',
    barColors: { completed: '#10b981', inProgress: '#3b82f6', pending: '#f59e0b', overdue: '#ef4444', created: '#8b5cf6' },
    pieColors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'],
    kpiTopBorder: () => '2px solid hsl(var(--primary))',
    kpiIconBg: (n) => `${n}15`,
    kpiIconShadow: () => 'none',
    kpiValueShadow: () => 'none',
    kpiNeons: { total: '#0284c7', completed: '#059669', inProgress: '#d97706', overdue: '#dc2626', overdueOk: '#059669' },
    rankStyle: { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' },
    rankBadge: (i) => CLASSIC_RANKS[Math.min(i, CLASSIC_RANKS.length - 1)],
    rankBarBg: 'hsl(var(--muted))',
    rankBarFill: () => 'hsl(var(--primary))',
    rankBarGlow: () => 'none',
    insightTitleColor: (n) => n,
    insightDescClass: 'text-muted-foreground',
    donutValueColor: 'text-foreground',
    donutValueShadow: 'none',
    donutLabelColor: 'hsl(var(--muted-foreground))',
    headerTitle: 'Dashboard',
    sectionLabelColor: 'hsl(var(--muted-foreground))',
    enable3dGlow: false,
    liveIndicator: false,
    loadingBg: 'hsl(var(--background))',
    loadingText: 'text-muted-foreground',
    inputStyle: { background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' },
  },
};

const INSIGHT_CFG: Record<AIInsight['type'], { neon: string; bg: string; border: string; Icon: React.ElementType }> = {
  critical: { neon: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   Icon: AlertOctagon },
  warning:  { neon: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  Icon: AlertTriangle },
  success:  { neon: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  Icon: TrendingUp },
  info:     { neon: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  Icon: Lightbulb },
};

/* ── Animated counter ───────────────────────────────────────────────── */
function AnimatedNumber({ target, shadow }: { target: number; shadow: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return ctrl.stop;
  }, [target]);
  return <span style={{ textShadow: shadow }}>{val.toLocaleString()}</span>;
}

/* ── 3-D tilt wrapper ───────────────────────────────────────────────── */
function Card3D({
  children, glow = 'rgba(124,58,237,0.4)', enableGlow = true, style = {},
}: {
  children: React.ReactNode;
  glow?: string;
  enableGlow?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 20;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -20;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.03,1.03,1.03)`;
    el.style.boxShadow = enableGlow
      ? `0 30px 64px rgba(0,0,0,0.5), 0 0 48px ${glow}`
      : `0 12px 32px rgba(0,0,0,0.12)`;
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.boxShadow = enableGlow ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)';
  };
  return (
    <div
      ref={ref}
      style={{
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        boxShadow: enableGlow ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label, neon, color }: {
  icon: React.ElementType; label: string; neon: string; color: string;
}) {
  return (
    <p className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0 mb-3"
      style={{ color }}>
      <Icon size={11} color={neon} />{label}
    </p>
  );
}

/* ── Theme toggle ───────────────────────────────────────────────────── */
function ThemeToggle({ theme, onToggle }: { theme: DashTheme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={theme === 'gaming' ? 'Switch to Classic' : 'Switch to Mission Control'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={
        theme === 'gaming'
          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
          : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }
      }
    >
      {theme === 'gaming'
        ? <><LayoutDashboard size={13} /> Classic</>
        : <><Gamepad2 size={13} /> Gaming</>
      }
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export function DashboardPage() {
  const now = new Date();
  const [monthStart, setMonthStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [monthEnd,   setMonthEnd]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));
  const [theme, setTheme] = useState<DashTheme>(
    () => (localStorage.getItem('dashTheme') as DashTheme) ?? 'gaming',
  );

  const T = THEMES[theme];

  const toggleTheme = () => {
    const next: DashTheme = theme === 'gaming' ? 'classic' : 'gaming';
    setTheme(next);
    localStorage.setItem('dashTheme', next);
  };

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
    name: m.userName.split(' ')[0] || '?',
    Completed: m.completed, 'In Progress': m.inProgress,
    Pending: m.pending, Overdue: m.overdue,
  }));

  const hasTrend = stats?.weeklyTrend?.some(w => w.created > 0 || w.completed > 0);

  const overdueNeon = overdue > 0 ? T.kpiNeons.overdue : T.kpiNeons.overdueOk;

  /* loading */
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center" style={{ background: T.loadingBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 animate-spin"
            style={{ borderColor: theme === 'gaming' ? `${NEON.cyan} transparent transparent transparent` : `hsl(var(--primary)) transparent transparent transparent` }} />
          <p className={`text-[11px] tracking-widest uppercase ${T.loadingText}`}>
            {theme === 'gaming' ? 'Loading Mission Data' : 'Loading…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden p-4 gap-3"
        style={T.pageStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <motion.div
          className="flex items-center justify-between shrink-0"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={theme === 'gaming'
                ? { background: 'rgba(168,85,247,0.2)', boxShadow: '0 0 24px rgba(168,85,247,0.5)' }
                : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
              <Activity size={17} color={theme === 'gaming' ? NEON.purple : 'hsl(var(--primary))'} />
            </div>
            <div>
              <h1 className={`text-base font-black tracking-tight leading-none ${T.title}`}>{T.headerTitle}</h1>
              <p className="text-[11px] mt-0.5" style={{ color: T.subtitle }}>
                {isOrgAdmin
                  ? `${members.length} member${members.length !== 1 ? 's' : ''} · ${format(new Date(monthStart), 'MMM yyyy')}`
                  : `My tasks · ${format(new Date(monthStart), 'MMM yyyy')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {T.liveIndicator && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400 tracking-widest">LIVE</span>
              </div>
            )}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <input
              type="month"
              value={monthStart.slice(0, 7)}
              onChange={handleMonthChange}
              className="text-xs px-3 py-1.5 rounded-lg outline-none"
              style={T.inputStyle}
            />
          </div>
        </motion.div>

        {/* ── KPI ROW ────────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-4 gap-3 shrink-0"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {([
            { label: 'Total Tasks',  value: totalTasks,      icon: ListTodo,      neon: T.kpiNeons.total      },
            { label: 'Completed',    value: completedCount,  icon: CheckCircle2,  neon: T.kpiNeons.completed  },
            { label: 'In Progress',  value: inProgressCount, icon: Zap,           neon: T.kpiNeons.inProgress },
            { label: 'Overdue',      value: overdue,         icon: AlertTriangle, neon: overdueNeon           },
          ] as const).map(({ label, value, icon: Icon, neon }) => (
            <Card3D key={label} glow={`${neon}55`} enableGlow={T.enable3dGlow} style={{ borderRadius: 16 }}>
              <div className="rounded-2xl p-4 h-full flex flex-col justify-between"
                style={{ ...T.panel, borderTop: T.kpiTopBorder(neon) }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: T.kpiIconBg(neon), boxShadow: T.kpiIconShadow(neon) }}>
                    <Icon size={18} color={neon} />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: T.muted }}>
                    {label}
                  </span>
                </div>
                <div>
                  <p className={`text-3xl font-black leading-none mb-1 ${T.value}`}>
                    <AnimatedNumber target={value} shadow={T.kpiValueShadow(neon)} />
                  </p>
                  <p className="text-[11px]" style={{ color: T.subtitle }}>
                    {label === 'Total Tasks'  ? `${stats?.myOpenTasks ?? 0} assigned to you`       : ''}
                    {label === 'Completed'    ? `${completionRate}% completion rate`               : ''}
                    {label === 'In Progress'  ? 'Currently active'                                  : ''}
                    {label === 'Overdue'      ? (overdue > 0 ? 'Needs attention' : 'All on track') : ''}
                  </p>
                </div>
              </div>
            </Card3D>
          ))}
        </motion.div>

        {/* ── MAIN GRID ──────────────────────────────────────────────── */}
        <motion.div
          className="flex-1 min-h-0 grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left — charts ─────────────────────────────────────────── */}
          <div className="col-span-2 flex flex-col gap-3 min-h-0">

            {isOrgAdmin && (
              <div className="flex-1 rounded-2xl p-4 min-h-0 flex flex-col" style={{ ...T.panel, borderRadius: 16 }}>
                <SectionLabel icon={Target} label="Team Performance" neon={theme === 'gaming' ? NEON.purple : 'hsl(var(--primary))'} color={T.sectionLabelColor} />
                {memberChartData.length === 0
                  ? <div className="flex-1 flex items-center justify-center"><Users size={32} style={{ color: T.muted }} /></div>
                  : (
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={memberChartData} barCategoryGap="24%">
                          <CartesianGrid stroke={T.gridColor} strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="name" tick={T.axisStyle} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tick={T.axisStyle} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={T.tipStyle} cursor={{ fill: T.cursorFill }} />
                          <Bar dataKey="Completed"   fill={T.barColors.completed}  radius={[3,3,0,0]} />
                          <Bar dataKey="In Progress" fill={T.barColors.inProgress} radius={[3,3,0,0]} />
                          <Bar dataKey="Pending"     fill={T.barColors.pending}    radius={[3,3,0,0]} />
                          <Bar dataKey="Overdue"     fill={T.barColors.overdue}    radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </div>
            )}

            {hasTrend ? (
              <div
                className={`rounded-2xl p-4 flex flex-col min-h-0 ${isOrgAdmin ? 'shrink-0' : 'flex-1'}`}
                style={{ ...T.panel, borderRadius: 16, ...(isOrgAdmin ? { height: 172 } : {}) }}
              >
                <SectionLabel icon={TrendingUp} label="Weekly Trend" neon={theme === 'gaming' ? NEON.cyan : 'hsl(var(--primary))'} color={T.sectionLabelColor} />
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats!.weeklyTrend} barCategoryGap="30%">
                      <CartesianGrid stroke={T.gridColor} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="week" tick={T.axisStyle} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={T.axisStyle} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={T.tipStyle} cursor={{ fill: T.cursorFill }} />
                      <Bar dataKey="created"   name="Created"   fill={T.barColors.created}    radius={[3,3,0,0]} />
                      <Bar dataKey="completed" name="Completed" fill={T.barColors.completed}  radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : !isOrgAdmin ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ ...T.panel, borderRadius: 16 }}>
                <p className="text-sm" style={{ color: T.muted }}>No trend data yet</p>
              </div>
            ) : null}
          </div>

          {/* Right — donut + leaderboard ───────────────────────────── */}
          <div className="col-span-1 flex flex-col gap-3 min-h-0">

            <Card3D glow="rgba(0,255,136,0.35)" enableGlow={T.enable3dGlow} style={{ borderRadius: 16, flexShrink: 0 }}>
              <div className="rounded-2xl p-4" style={{ ...T.panel, borderRadius: 16 }}>
                <SectionLabel icon={CheckCircle2} label="Status Split" neon={T.barColors.completed} color={T.sectionLabelColor} />
                {statusPieData.length === 0
                  ? <div className="h-28 flex items-center justify-center text-sm" style={{ color: T.muted }}>No data</div>
                  : (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <ResponsiveContainer width={148} height={148}>
                          <PieChart>
                            <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={46} outerRadius={66}
                              dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                              {statusPieData.map((_, i) => (
                                <Cell key={i} fill={T.pieColors[i % T.pieColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className={`text-2xl font-black ${T.donutValueColor}`} style={{ textShadow: T.donutValueShadow }}>
                            {completionRate}%
                          </span>
                          <span className="text-[9px] tracking-widest uppercase" style={{ color: T.donutLabelColor }}>done</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                        {statusPieData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1 text-[10px]">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: T.pieColors[i] }} />
                            <span style={{ color: T.muted }}>{d.name}</span>
                            <span className={`font-bold ${T.value}`}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Card3D>

            {isOrgAdmin && members.length > 0 && (
              <div className="flex-1 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden" style={{ ...T.panel, borderRadius: 16 }}>
                <SectionLabel icon={Flame} label="Leaderboard" neon={T.barColors.pending} color={T.sectionLabelColor} />
                <div className="flex-1 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'none' }}>
                  {members.map((m, i) => {
                    const rank = T.rankBadge(i);
                    const pct  = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                    return (
                      <div key={m.userId} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl" style={T.rankStyle}>
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                          style={{ background: rank.bg, color: rank.color }}>
                          {rank.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${T.value}`}>{m.userName}</p>
                          <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: T.rankBarBg }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: T.rankBarFill(rank.color), boxShadow: T.rankBarGlow(rank.color) }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black" style={{ color: rank.color }}>{m.completed}</p>
                          <p className="text-[9px]" style={{ color: T.muted }}>done</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isOrgAdmin && (
              <div className="flex-1 rounded-2xl p-4 flex flex-col gap-2 min-h-0" style={{ ...T.panel, borderRadius: 16 }}>
                <SectionLabel icon={Activity} label="My Stats" neon={T.kpiNeons.total} color={T.sectionLabelColor} />
                {[
                  { label: 'Assigned',    value: stats?.myOpenTasks ?? 0, color: T.kpiNeons.total      },
                  { label: 'Completed',   value: completedCount,           color: T.kpiNeons.completed  },
                  { label: 'In Progress', value: inProgressCount,          color: T.kpiNeons.inProgress },
                  { label: 'Overdue',     value: overdue,                  color: overdueNeon           },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={T.rankStyle}>
                    <span className="text-xs" style={{ color: T.muted }}>{row.label}</span>
                    <span className={`text-sm font-black ${T.value}`} style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── AI INSIGHTS STRIP ────────────────────────────────────── */}
        {stats?.aiInsights && stats.aiInsights.length > 0 && (
          <motion.div
            className="shrink-0"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {stats.aiInsights.map((insight, i) => {
                const cfg = INSIGHT_CFG[insight.type];
                return (
                  <div key={i}
                    className="shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, minWidth: 220, maxWidth: 280 }}>
                    <cfg.Icon size={12} color={cfg.neon} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold leading-tight" style={{ color: T.insightTitleColor(cfg.neon) }}>
                        {insight.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${T.insightDescClass}`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
