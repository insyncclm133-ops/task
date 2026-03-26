import { motion } from 'framer-motion';
import { BarChart3, Clock, AlertTriangle, CheckCircle, ListTodo, Users } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useTaskStats } from '@/hooks/useTaskStats';

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
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const kpiCards = [
  {
    key: 'myOpen',
    label: 'MY OPEN TASKS',
    icon: ListTodo,
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    key: 'overdue',
    label: 'OVERDUE TASKS',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    key: 'completed',
    label: 'COMPLETED THIS WEEK',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    key: 'total',
    label: 'TOTAL TASKS',
    icon: Clock,
    gradient: 'from-violet-500 to-purple-600',
  },
];

export function DashboardPage() {
  const { stats, isLoading } = useTaskStats();

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>;
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
            <card.icon className="absolute bottom-3 right-3 h-12 w-12 opacity-[0.07]" strokeWidth={1.5} />
          </div>
        ))}
      </motion.div>

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
