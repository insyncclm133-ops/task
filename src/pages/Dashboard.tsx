import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, Zap,
  ListTodo, Trophy, Target, Users, Timer, ArrowUp, Flame,
  Sparkles, AlertOctagon, Lightbulb, TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAuth } from '@/lib/auth-context';
import type { AIInsight } from '@/types/task';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const INSIGHT_STYLES: Record<AIInsight['type'], { border: string; bg: string; text: string; iconColor: string }> = {
  critical: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-300', iconColor: 'text-red-500' },
  warning: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-300', iconColor: 'text-amber-500' },
  success: { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-300', iconColor: 'text-emerald-500' },
  info: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-800 dark:text-blue-300', iconColor: 'text-blue-500' },
};

const INSIGHT_ICONS: Record<AIInsight['type'], typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  success: TrendingUp,
  info: Lightbulb,
};

export function DashboardPage() {
  const now = new Date();
  const [monthStart, setMonthStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [monthEnd, setMonthEnd] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const { isAdmin, isPlatformAdmin, user } = useAuth();
  const isOrgAdmin = isAdmin || isPlatformAdmin;
  const { stats, isLoading } = useTaskStats(monthStart, monthEnd, isOrgAdmin, user?.id ?? '');

  const members = stats?.userCompletionStats ?? [];
  const totalTasks = stats?.totalTasks ?? 0;
  const completedCount = stats?.statusDistribution?.find((s) => s.name === 'completed')?.value ?? 0;
  const inProgressCount = stats?.statusDistribution?.find((s) => s.name === 'in_progress')?.value ?? 0;
  const pendingCount = stats?.statusDistribution?.find((s) => s.name === 'pending')?.value ?? 0;
  const overdue = stats?.overdueTasks ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const topPerformer = members.length > 0 ? members[0] : null;

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    setMonthStart(format(startOfMonth(d), 'yyyy-MM-dd'));
    setMonthEnd(format(endOfMonth(d), 'yyyy-MM-dd'));
  };

  const statusPieData = [
    { name: 'Completed', value: completedCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Overdue', value: overdue },
  ].filter((d) => d.value > 0);

  const memberChartData = members.map((m) => ({
    name: m.userName.split(' ')[0] || '?',
    Completed: m.completed,
    'In Progress': m.inProgress,
    Pending: m.pending,
    Overdue: m.overdue,
  }));

  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <div className="h-10 w-64 animate-pulse bg-muted rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 animate-pulse bg-muted rounded-2xl" />
          <div className="h-72 animate-pulse bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden p-5 gap-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isOrgAdmin
              ? `${members.length} team member${members.length !== 1 ? 's' : ''} · ${format(new Date(monthStart), 'MMMM yyyy')}`
              : `My tasks · ${format(new Date(monthStart), 'MMMM yyyy')}`}
          </p>
        </div>
        <Input
          type="month"
          value={monthStart.slice(0, 7)}
          onChange={handleMonthChange}
          className="w-44"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Tasks"
            value={totalTasks}
            icon={ListTodo}
            iconBg="bg-sky-500/10"
            iconColor="text-sky-600"
            subtitle={`${stats?.myOpenTasks ?? 0} assigned to you`}
          />
          <KpiCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle2}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            subtitle={`${completionRate}% completion rate`}
          />
          <KpiCard
            label="In Progress"
            value={inProgressCount}
            icon={Zap}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            subtitle="Currently active"
          />
          <KpiCard
            label="Overdue"
            value={overdue}
            icon={AlertTriangle}
            iconBg={overdue > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
            iconColor={overdue > 0 ? 'text-red-600' : 'text-emerald-600'}
            subtitle={overdue > 0 ? 'Needs attention' : 'All on track'}
          />
        </div>

        {/* AI Insights */}
        {stats?.aiInsights && stats.aiInsights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                </div>
                AI Insights
                <span className="ml-auto text-[10px] font-semibold text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full">
                  {stats.aiInsights.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {stats.aiInsights.map((insight, i) => {
                  const style = INSIGHT_STYLES[insight.type];
                  const Icon = INSIGHT_ICONS[insight.type];
                  return (
                    <div
                      key={i}
                      className={`border-l-2 ${style.border} ${style.bg} rounded-r-lg px-3 py-2`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 ${style.iconColor} shrink-0 mt-0.5`} />
                        <div className="min-w-0">
                          <p className={`font-semibold text-xs ${style.text} leading-tight`}>
                            {insight.title}
                          </p>
                          <p className={`text-[11px] mt-0.5 ${style.text} opacity-70 leading-snug line-clamp-2`}>
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row: Member Performance + Status Pie */}
        <div className={`grid grid-cols-1 ${isOrgAdmin ? 'lg:grid-cols-3' : ''} gap-4`}>
          {/* Member Performance Bar Chart — admin only */}
          {isOrgAdmin && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  Member Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                    <div className="text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p className="text-sm">No data yet</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={memberChartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid hsl(220,13%,91%)',
                          fontSize: 12,
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Pie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Status Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusPieData.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                  <p className="text-sm">No data</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {statusPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-2xl font-bold"
                      >
                        {completionRate}%
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {statusPieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trend */}
        {stats?.weeklyTrend && stats.weeklyTrend.some((w) => w.created > 0 || w.completed > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Weekly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.weeklyTrend} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(220,13%,91%)',
                      fontSize: 12,
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="created" name="Created" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Performer + Team Leaderboard — admin only */}
        {isOrgAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Performer Spotlight */}
            {topPerformer && topPerformer.completed > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    Top Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-bold text-foreground mb-4">{topPerformer.userName}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold text-emerald-600">{topPerformer.completed}</p>
                      <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold text-sky-600">{topPerformer.onTime}</p>
                      <p className="text-[10px] text-muted-foreground">On Time</p>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/50">
                      <p className="text-xl font-bold text-foreground">{topPerformer.avgCompletionDays ?? '-'}</p>
                      <p className="text-[10px] text-muted-foreground">Avg Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Leaderboard */}
            <Card className={topPerformer && topPerformer.completed > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  Team Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <p className="text-sm">No members yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {members.map((member, idx) => {
                      const pct = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-xs font-semibold text-muted-foreground text-center">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{member.userName}</p>
                              <p className="text-[10px] text-muted-foreground">{pct}% complete</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">
                              {member.completed} done
                            </Badge>
                            {member.overdue > 0 && (
                              <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-700 dark:text-red-400 border-0">
                                {member.overdue} overdue
                              </Badge>
                            )}
                            {member.avgCompletionDays != null && (
                              <Badge variant="outline" className="text-[10px]">
                                <Timer className="h-3 w-3 mr-0.5" />
                                {member.avgCompletionDays}d avg
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Member Breakdown Cards — admin only */}
        {isOrgAdmin && members.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Individual Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => {
                const pct = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                const onTimePct = member.completed > 0 ? Math.round((member.onTime / member.completed) * 100) : 0;
                return (
                  <Card key={member.userId}>
                    <CardContent className="p-5">
                      {/* Member Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                          {member.userName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{member.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{member.total} total tasks</p>
                        </div>
                      </div>

                      {/* Completion Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-1.5 rounded-lg bg-muted/50">
                          <p className="text-base font-bold text-emerald-600">{member.completed}</p>
                          <p className="text-[9px] text-muted-foreground">Done</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-muted/50">
                          <p className="text-base font-bold text-blue-600">{member.inProgress}</p>
                          <p className="text-[9px] text-muted-foreground">Active</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-muted/50">
                          <p className={`text-base font-bold ${member.overdue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {member.overdue}
                          </p>
                          <p className="text-[9px] text-muted-foreground">Overdue</p>
                        </div>
                      </div>

                      {/* Bottom Stats */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-emerald-500" />
                          {onTimePct}% on-time
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {member.avgCompletionDays ?? '-'}d avg
                        </span>
                        {member.highPriority > 0 && (
                          <span className="flex items-center gap-1 text-orange-600 font-medium">
                            <Flame className="h-3 w-3" />
                            {member.highPriority} critical
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── KPI Card Component ────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
