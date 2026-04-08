import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, ListTodo, AlertTriangle, CheckCircle, TrendingUp,
  Clock, Activity, Settings2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { usePlatformDashboard } from '@/hooks/usePlatformDashboard';
import type { OrgRow } from '@/hooks/usePlatformDashboard';
import { OrgManagementModal } from '@/components/platform/OrgManagementModal';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const BAR_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#ec4899'];

function timeAgo(ts: string | null) {
  if (!ts) return '-';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const PLAN_BADGE: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-700',
  team: 'bg-violet-100 text-violet-700',
  business: 'bg-emerald-100 text-emerald-700',
};

export function PlatformDashboard() {
  const { data, isLoading } = usePlatformDashboard();
  const [managingOrg, setManagingOrg] = useState<OrgRow | null>(null);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading platform dashboard...</div>;
  }

  if (!data) return null;

  const { summary, orgRows, trend, recentActivity } = data;

  const kpiCards = [
    { label: 'Organizations', value: summary.totalOrgs, icon: Building2, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Total Users', value: summary.totalUsers, icon: Users, gradient: 'from-sky-500 to-blue-600' },
    { label: 'Total Tasks', value: summary.totalTasks, icon: ListTodo, gradient: 'from-emerald-500 to-green-600' },
    { label: 'Active Tasks', value: summary.activeTasks, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
    { label: 'Overdue', value: summary.overdueTasks, icon: AlertTriangle, gradient: 'from-rose-500 to-pink-600' },
    { label: 'Completion Rate', value: `${summary.completionRate}%`, icon: CheckCircle, gradient: 'from-teal-500 to-cyan-600' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-5">
        <h1 className="text-2xl font-bold">
          Platform{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Overview
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor all organizations, users, and task activity</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
          >
            <p className="text-2xl font-bold leading-none">{card.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">{card.label}</p>
            <card.icon className="absolute bottom-2 right-2 h-8 w-8 opacity-[0.07]" strokeWidth={1.5} />
          </div>
        ))}
      </motion.div>

      {/* Charts Row: Task Trend + Org Comparison */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Task Trend */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Task Trend (4 weeks)
          </h3>
          {trend.some((t) => t.created > 0 || t.completed > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gPCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-card px-3 py-1.5 shadow-lg text-xs">
                        <p className="font-semibold mb-0.5">{label}</p>
                        {payload.map((p) => (
                          <div key={p.name} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-muted-foreground">{p.name}:</span>
                            <span className="font-medium">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} fill="url(#gPCreated)" name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} fill="url(#gPCompleted)" name="Completed" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">No data</div>
          )}
        </div>

        {/* Org Tasks Comparison */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> Tasks by Organization
          </h3>
          {orgRows.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={orgRows} layout="vertical" barSize={20} margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const org = payload[0].payload as OrgRow;
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
                        <p className="font-semibold mb-1">{org.name}</p>
                        <p>Total: <span className="font-medium">{org.totalTasks}</span></p>
                        <p>Active: <span className="font-medium">{org.activeTasks}</span></p>
                        <p>Completed: <span className="font-medium">{org.completedTasks}</span></p>
                        <p>Overdue: <span className="font-medium text-red-600">{org.overdueTasks}</span></p>
                        <p>Completion: <span className="font-medium">{org.completionRate}%</span></p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalTasks" name="Total Tasks" radius={[0, 4, 4, 0]}>
                  {orgRows.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">No organizations</div>
          )}
        </div>
      </motion.div>

      {/* Organizations Table + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Organizations Table */}
        <motion.div variants={fadeUp} className="lg:col-span-2 rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> All Organizations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Organization</th>
                  <th className="pb-2 font-medium text-center">Plan</th>
                  <th className="pb-2 font-medium text-center">Members</th>
                  <th className="pb-2 font-medium text-center">Tasks</th>
                  <th className="pb-2 font-medium text-center">Active</th>
                  <th className="pb-2 font-medium text-center">Overdue</th>
                  <th className="pb-2 font-medium text-center">Done %</th>
                  <th className="pb-2 font-medium text-right">Last Activity</th>
                  <th className="pb-2 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {orgRows.map((org) => (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 font-medium">{org.name}</td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[org.plan] ?? 'bg-muted text-muted-foreground'}`}>
                        {org.plan === 'trial'
                          ? org.trialDaysLeft > 0 ? `Trial (${org.trialDaysLeft}d)` : 'Expired'
                          : org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">{org.members}</td>
                    <td className="py-2.5 text-center">{org.totalTasks}</td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        {org.activeTasks}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {org.overdueTasks > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                          {org.overdueTasks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`font-medium ${org.completionRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {org.completionRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground text-xs">{timeAgo(org.lastActivity)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setManagingOrg(org)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Manage org"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orgRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs">No organizations yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={fadeUp} className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                  item.type === 'org_created' ? 'bg-violet-500' :
                  item.type === 'task_completed' ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-xs leading-snug">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {managingOrg && (
        <OrgManagementModal
          org={managingOrg}
          open={!!managingOrg}
          onClose={() => setManagingOrg(null)}
        />
      )}
    </motion.div>
  );
}
