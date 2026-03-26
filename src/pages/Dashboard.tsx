import { motion } from 'framer-motion';
import {
  BarChart3, Clock, AlertTriangle, CheckCircle, ListTodo, Users,
  Sparkles, AlertOctagon, TrendingUp, Lightbulb, Target,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { useTaskStats } from '@/hooks/useTaskStats';
import type { AIInsight } from '@/types/task';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#6b7280',
  closed: '#a855f7',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#0ea5e9',
  high: '#f97316',
  urgent: '#ef4444',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const kpiCards = [
  { key: 'myOpen', label: 'MY OPEN TASKS', icon: ListTodo, gradient: 'from-sky-500 to-blue-600' },
  { key: 'overdue', label: 'OVERDUE TASKS', icon: AlertTriangle, gradient: 'from-rose-500 to-pink-600' },
  { key: 'completed', label: 'COMPLETED THIS WEEK', icon: CheckCircle, gradient: 'from-emerald-500 to-green-600' },
  { key: 'total', label: 'TOTAL TASKS', icon: Clock, gradient: 'from-violet-500 to-purple-600' },
];

const INSIGHT_STYLES: Record<AIInsight['type'], { border: string; bg: string; text: string; iconColor: string }> = {
  critical: { border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-800', iconColor: 'text-red-500' },
  warning: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', iconColor: 'text-amber-500' },
  success: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
  info: { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', iconColor: 'text-blue-500' },
};

const INSIGHT_ICONS: Record<AIInsight['type'], typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  success: TrendingUp,
  info: Lightbulb,
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardPage() {
  const { stats, isLoading } = useTaskStats();

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
    );
  }

  const kpiValues: Record<string, number> = {
    myOpen: stats?.myOpenTasks ?? 0,
    overdue: stats?.overdueTasks ?? 0,
    completed: stats?.completedThisWeek ?? 0,
    total: stats?.totalTasks ?? 0,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold">
          Task{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Command Center
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your team's progress</p>
      </motion.div>

      {/* AI-Powered Insights */}
      {stats?.aiInsights && stats.aiInsights.length > 0 && (
        <motion.div variants={fadeUp} className="mb-8">
          <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/60 via-white to-purple-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">AI-Powered Insights</h2>
                <p className="text-xs text-muted-foreground">Real-time analysis of your team's performance</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">
                {stats.aiInsights.length} flag{stats.aiInsights.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.aiInsights.map((insight, i) => {
                const style = INSIGHT_STYLES[insight.type];
                const Icon = INSIGHT_ICONS[insight.type];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`border-l-4 ${style.border} ${style.bg} rounded-r-xl px-4 py-3.5 transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className={`font-semibold text-sm ${style.text}`}>{insight.title}</p>
                        <p className={`text-xs mt-1 ${style.text} opacity-75 leading-relaxed`}>
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="relative z-10">
              <p className="text-3xl font-bold">{kpiValues[card.key]}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-white/80">
                {card.label}
              </p>
            </div>
            <card.icon
              className="absolute bottom-3 right-3 h-12 w-12 opacity-[0.07]"
              strokeWidth={1.5}
            />
          </div>
        ))}
      </motion.div>

      {/* User-wise Completion Status */}
      {stats?.userCompletionStats && stats.userCompletionStats.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border bg-card p-6 mb-8">
          <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            Team Performance — User-wise Completion
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Member</th>
                  <th className="pb-3 px-3 text-center">Total</th>
                  <th className="pb-3 px-3 text-center">Done</th>
                  <th className="pb-3 px-3 text-center">In Progress</th>
                  <th className="pb-3 px-3 text-center">Pending</th>
                  <th className="pb-3 px-3 text-center">Overdue</th>
                  <th className="pb-3 pl-3 min-w-[180px]">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.userCompletionStats.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {getInitials(u.userName)}
                        </div>
                        <span className="font-medium truncate max-w-[140px]">{u.userName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold">{u.total}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                        {u.completed}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5">
                        {u.inProgress}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5">
                        {u.pending}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {u.overdue > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 animate-pulse">
                          {u.overdue}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-gray-100 text-gray-400 text-xs font-bold px-2 py-0.5">
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${u.completionRate}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              u.completionRate >= 80
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : u.completionRate >= 50
                                  ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                                  : u.completionRate >= 30
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold min-w-[36px] text-right ${
                            u.completionRate >= 80
                              ? 'text-emerald-600'
                              : u.completionRate >= 50
                                ? 'text-blue-600'
                                : u.completionRate >= 30
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                          }`}
                        >
                          {u.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution Pie */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Task Status Distribution
          </h3>
          {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.statusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Priority Distribution Bar */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Priority Breakdown
          </h3>
          {stats?.priorityDistribution && stats.priorityDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.priorityDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Tasks">
                  {stats.priorityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          )}
        </div>
      </motion.div>

      {/* Weekly Trend */}
      <motion.div variants={fadeUp} className="rounded-2xl border bg-card p-5 mb-8">
        <h3 className="font-semibold text-sm mb-4">Tasks Created vs Completed Over Time</h3>
        {stats?.weeklyTrend && stats.weeklyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.weeklyTrend}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="#a855f7" strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            No trend data available
          </div>
        )}
      </motion.div>

      {/* Team Workload */}
      {stats?.teamWorkload && stats.teamWorkload.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Workload
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.teamWorkload} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#8b5cf6" name="Open Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
}
