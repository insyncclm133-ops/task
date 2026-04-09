import { useQuery } from '@tanstack/react-query';
import type { TaskStats, AIInsight, UserCompletionStat } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { startOfWeek, endOfWeek, subWeeks, format, eachWeekOfInterval } from 'date-fns';

function computeAIInsights(
  totalTasks: number,
  overdueTasks: number,
  statusDistribution: { name: string; value: number }[],
  priorityDistribution: { name: string; value: number }[],
  weeklyTrend: { week: string; created: number; completed: number }[],
  teamWorkload: { name: string; tasks: number }[],
  userCompletionStats: UserCompletionStat[],
): AIInsight[] {
  const insights: AIInsight[] = [];

  if (totalTasks === 0) {
    insights.push({
      type: 'info',
      title: 'Getting Started',
      description: 'No tasks yet. Create your first task to start tracking progress.',
    });
    return insights;
  }

  const overdueRate = totalTasks > 0 ? overdueTasks / totalTasks : 0;
  if (overdueRate > 0.3) {
    insights.push({
      type: 'critical',
      title: 'Critical Overdue Rate',
      description: `${Math.round(overdueRate * 100)}% of tasks are overdue. Immediate attention needed to re-prioritize deadlines.`,
    });
  } else if (overdueRate > 0.15) {
    insights.push({
      type: 'warning',
      title: 'Rising Overdue Tasks',
      description: `${overdueTasks} tasks (${Math.round(overdueRate * 100)}%) past due. Consider reassigning or extending deadlines.`,
    });
  } else if (overdueTasks === 0 && totalTasks > 0) {
    insights.push({
      type: 'success',
      title: 'Zero Overdue Tasks',
      description: 'All tasks are on track. Great job keeping deadlines!',
    });
  }

  const urgentCount = priorityDistribution.find((p) => p.name === 'urgent')?.value ?? 0;
  const highCount = priorityDistribution.find((p) => p.name === 'high')?.value ?? 0;
  if (urgentCount > 0) {
    insights.push({
      type: 'critical',
      title: `${urgentCount} Urgent Task${urgentCount > 1 ? 's' : ''} Active`,
      description: `${urgentCount} urgent and ${highCount} high-priority tasks need immediate focus.`,
    });
  }

  if (teamWorkload.length > 1) {
    const maxLoad = Math.max(...teamWorkload.map((w) => w.tasks));
    const avgLoad = teamWorkload.reduce((s, w) => s + w.tasks, 0) / teamWorkload.length;
    const heaviest = teamWorkload.find((w) => w.tasks === maxLoad);
    const minLoad = Math.min(...teamWorkload.map((w) => w.tasks));
    if (maxLoad > avgLoad * 2 && maxLoad - minLoad > 2) {
      insights.push({
        type: 'warning',
        title: 'Workload Imbalance Detected',
        description: `${heaviest?.name} has ${maxLoad} open tasks — ${Math.round((maxLoad / avgLoad - 1) * 100)}% above average. Consider redistributing.`,
      });
    }
  }

  if (weeklyTrend.length >= 2) {
    const latest = weeklyTrend[weeklyTrend.length - 1];
    const prev = weeklyTrend[weeklyTrend.length - 2];
    if (latest.completed > prev.completed && latest.completed > 0) {
      const improvement =
        prev.completed > 0
          ? Math.round(((latest.completed - prev.completed) / prev.completed) * 100)
          : 100;
      insights.push({
        type: 'success',
        title: 'Completion Velocity Up',
        description: `Team completed ${latest.completed} tasks this week — ${improvement}% more than last week. Momentum building!`,
      });
    } else if (latest.completed < prev.completed && prev.completed > 0) {
      insights.push({
        type: 'warning',
        title: 'Completion Rate Declining',
        description: `Only ${latest.completed} tasks completed this week vs ${prev.completed} last week. Check for blockers.`,
      });
    }
  }

  if (weeklyTrend.length > 0) {
    const latest = weeklyTrend[weeklyTrend.length - 1];
    if (latest.created > latest.completed * 2 && latest.created > 3) {
      insights.push({
        type: 'info',
        title: 'Task Backlog Growing',
        description: `${latest.created} tasks created vs ${latest.completed} completed this week. Backlog is accumulating.`,
      });
    }
  }

  const lowPerformers = userCompletionStats.filter(
    (u) => u.total >= 3 && u.completionRate < 30,
  );
  if (lowPerformers.length > 0) {
    insights.push({
      type: 'warning',
      title: `${lowPerformers.length} Member${lowPerformers.length > 1 ? 's' : ''} Below 30% Completion`,
      description: `${lowPerformers.map((u) => u.userName).join(', ')} may need support or task reallocation.`,
    });
  }

  const starPerformers = userCompletionStats.filter(
    (u) => u.total >= 3 && u.completionRate >= 80,
  );
  if (starPerformers.length > 0) {
    insights.push({
      type: 'success',
      title: 'Star Performers',
      description: `${starPerformers.map((u) => u.userName).join(', ')} maintaining completion rate above 80%.`,
    });
  }

  const pendingCount = statusDistribution.find((s) => s.name === 'pending')?.value ?? 0;
  const inProgressCount = statusDistribution.find((s) => s.name === 'in_progress')?.value ?? 0;
  if (pendingCount > inProgressCount * 3 && pendingCount > 5) {
    insights.push({
      type: 'info',
      title: 'Large Pending Queue',
      description: `${pendingCount} tasks stuck in pending vs ${inProgressCount} in progress. Many tasks haven't been picked up.`,
    });
  }

  return insights;
}

export function useTaskStats(startDate?: string, endDate?: string, isAdmin = true, userId = '') {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ['task-stats', user?.id, startDate, endDate, isAdmin],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Single query: fetch all tasks with assigned user profiles
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select(
          'id, status, priority, assigned_to, assigned_by, due_date, created_at, completed_at, closed_at, assigned_user:profiles!tasks_assigned_to_fkey(full_name)',
        );

      if (error) throw error;

      // For non-admin users, restrict to tasks they are assigned to or created
      const effectiveUserId = userId || user.id;
      const rawTasks = isAdmin
        ? (allTasks ?? [])
        : (allTasks ?? []).filter(
            (t) => t.assigned_to === effectiveUserId || t.assigned_by === effectiveUserId,
          );
      const now = new Date();

      // Filter tasks by date range if provided
      const filterStart = startDate ? new Date(startDate) : null;
      const filterEnd = endDate ? new Date(endDate + 'T23:59:59.999Z') : null;

      const tasks =
        filterStart && filterEnd
          ? rawTasks.filter((t) => {
              const created = new Date(t.created_at);
              if (created > filterEnd) return false;
              if (t.status === 'pending' || t.status === 'in_progress') return true;
              if (t.completed_at && new Date(t.completed_at) >= filterStart) return true;
              if (t.closed_at && new Date(t.closed_at) >= filterStart) return true;
              return false;
            })
          : rawTasks;

      // My open tasks (current user, always against full dataset)
      const myOpenTasks = rawTasks.filter(
        (t) => t.assigned_to === user.id && ['pending', 'in_progress'].includes(t.status),
      ).length;

      // Overdue tasks in filtered set
      const overdueTasks = tasks.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) < now &&
          ['pending', 'in_progress'].includes(t.status),
      ).length;

      // Completed this week (always current week, full dataset)
      const weekNowStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekNowEnd = endOfWeek(now, { weekStartsOn: 1 });
      const completedThisWeek = rawTasks.filter(
        (t) =>
          t.status === 'completed' &&
          t.completed_at &&
          new Date(t.completed_at) >= weekNowStart &&
          new Date(t.completed_at) <= weekNowEnd,
      ).length;

      const totalTasks = tasks.length;

      // Status distribution
      const statusCounts: Record<string, number> = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        closed: 0,
      };
      for (const t of tasks) {
        if (t.status in statusCounts) statusCounts[t.status]++;
      }
      const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Priority distribution
      const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
      for (const t of tasks) {
        if (t.priority in priorityCounts) priorityCounts[t.priority]++;
      }
      const priorityDistribution = Object.entries(priorityCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Weekly trend
      const trendStart = filterStart ?? startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
      const trendEnd = filterEnd ?? now;
      const weeks = eachWeekOfInterval(
        { start: trendStart, end: trendEnd },
        { weekStartsOn: 1 },
      );
      const weeklyTrend = weeks.map((ws) => {
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const label = format(ws, 'MMM d');
        const created = rawTasks.filter((t) => {
          const c = new Date(t.created_at);
          return c >= ws && c <= we;
        }).length;
        const completed = rawTasks.filter((t) => {
          if (t.status !== 'completed' || !t.completed_at) return false;
          const c = new Date(t.completed_at);
          return c >= ws && c <= we;
        }).length;
        return { week: label, created, completed };
      });

      // Per-user completion stats
      const userMap = new Map<
        string,
        UserCompletionStat
      >();
      const completionDaysMap = new Map<string, number[]>();

      for (const task of tasks) {
        const assignee = task.assigned_user as unknown as { full_name: string } | null;
        const name = assignee?.full_name ?? 'Unassigned';
        const userId = task.assigned_to;

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userName: name,
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            overdue: 0,
            onTime: 0,
            highPriority: 0,
            avgCompletionDays: null,
            completionRate: 0,
          });
          completionDaysMap.set(userId, []);
        }

        const stat = userMap.get(userId)!;
        stat.total++;

        if (task.status === 'completed' || task.status === 'closed') {
          stat.completed++;
          if (task.completed_at && task.due_date) {
            const completedDate = new Date(task.completed_at);
            const dueDate = new Date(task.due_date + 'T23:59:59');
            if (completedDate <= dueDate) {
              stat.onTime++;
            }
          }
          if (task.completed_at) {
            const days = Math.max(
              0,
              Math.round(
                (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) /
                  86400000,
              ),
            );
            completionDaysMap.get(userId)!.push(days);
          }
        } else if (task.status === 'in_progress') {
          stat.inProgress++;
        } else if (task.status === 'pending') {
          stat.pending++;
        }

        if (
          task.due_date &&
          new Date(task.due_date) < now &&
          ['pending', 'in_progress'].includes(task.status)
        ) {
          stat.overdue++;
        }

        if (task.priority === 'high' || task.priority === 'urgent') {
          stat.highPriority++;
        }
      }

      // Calculate averages and rates
      for (const [userId, stat] of userMap.entries()) {
        stat.completionRate =
          stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
        const days = completionDaysMap.get(userId) ?? [];
        stat.avgCompletionDays =
          days.length > 0
            ? Math.round(days.reduce((a, b) => a + b, 0) / days.length)
            : null;
      }

      const userCompletionStats = Array.from(userMap.values()).sort(
        (a, b) => b.completed - a.completed,
      );

      // Team workload (open tasks per user)
      const teamWorkload = userCompletionStats
        .filter((u) => u.inProgress + u.pending > 0)
        .map((u) => ({ name: u.userName, tasks: u.inProgress + u.pending }))
        .sort((a, b) => b.tasks - a.tasks);

      // AI Insights
      const aiInsights = computeAIInsights(
        totalTasks,
        overdueTasks,
        statusDistribution,
        priorityDistribution,
        weeklyTrend,
        teamWorkload,
        userCompletionStats,
      );

      return {
        myOpenTasks,
        overdueTasks,
        completedThisWeek,
        totalTasks,
        statusDistribution,
        priorityDistribution,
        weeklyTrend,
        teamWorkload,
        userCompletionStats,
        aiInsights,
      };
    },
    enabled: !!user,
  });

  return { stats, isLoading };
}
