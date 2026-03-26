import { useQuery } from '@tanstack/react-query';
import type { TaskStats, AIInsight, UserCompletionStat } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

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

  // Overdue rate analysis
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

  // Urgent tasks check
  const urgentCount = priorityDistribution.find((p) => p.name === 'urgent')?.value ?? 0;
  const highCount = priorityDistribution.find((p) => p.name === 'high')?.value ?? 0;
  if (urgentCount > 0) {
    insights.push({
      type: 'critical',
      title: `${urgentCount} Urgent Task${urgentCount > 1 ? 's' : ''} Active`,
      description: `${urgentCount} urgent and ${highCount} high-priority tasks need immediate focus.`,
    });
  }

  // Workload imbalance
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

  // Completion velocity trend
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

  // Task backlog growing
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

  // Low completion rate users
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

  // Star performers
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

  // Stale pending tasks
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

export function useTaskStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ['task-stats', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // My open tasks (pending or in_progress assigned to me)
      const { count: myOpenTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress']);

      // Overdue tasks (due_date < now, not completed/closed/cancelled)
      const { count: overdueTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', now.toISOString())
        .in('status', ['pending', 'in_progress']);

      // Completed this week
      const { count: completedThisWeek } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);

      // Total tasks
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      // Status distribution
      const statusValues = ['pending', 'in_progress', 'completed', 'cancelled', 'closed'] as const;
      const statusDistribution: { name: string; value: number }[] = [];

      for (const status of statusValues) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        statusDistribution.push({ name: status, value: count ?? 0 });
      }

      // Priority distribution
      const priorityValues = ['low', 'medium', 'high', 'urgent'] as const;
      const priorityDistribution: { name: string; value: number }[] = [];

      for (const priority of priorityValues) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('priority', priority);

        priorityDistribution.push({ name: priority, value: count ?? 0 });
      }

      // Weekly trend (last 4 weeks)
      const weeklyTrend: { week: string; created: number; completed: number }[] = [];

      for (let i = 3; i >= 0; i--) {
        const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const label = format(ws, 'MMM d');

        const { count: created } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', ws.toISOString())
          .lte('created_at', we.toISOString());

        const { count: completed } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_at', ws.toISOString())
          .lte('completed_at', we.toISOString());

        weeklyTrend.push({
          week: label,
          created: created ?? 0,
          completed: completed ?? 0,
        });
      }

      // Team workload (tasks per assignee - open tasks only)
      const { data: workloadData } = await supabase
        .from('tasks')
        .select('assigned_to, assigned_user:profiles!tasks_assigned_to_fkey(full_name)')
        .in('status', ['pending', 'in_progress']);

      const workloadMap = new Map<string, { name: string; tasks: number }>();

      if (workloadData) {
        for (const row of workloadData) {
          const assignee = row.assigned_user as unknown as { full_name: string } | null;
          const name = assignee?.full_name ?? 'Unassigned';
          const key = row.assigned_to;

          if (workloadMap.has(key)) {
            workloadMap.get(key)!.tasks += 1;
          } else {
            workloadMap.set(key, { name, tasks: 1 });
          }
        }
      }

      const teamWorkload = Array.from(workloadMap.values()).sort(
        (a, b) => b.tasks - a.tasks,
      );

      // User-wise completion stats (all tasks)
      const { data: allTaskData } = await supabase
        .from('tasks')
        .select('assigned_to, status, due_date, assigned_user:profiles!tasks_assigned_to_fkey(full_name)');

      const userMap = new Map<string, UserCompletionStat>();

      if (allTaskData) {
        for (const task of allTaskData) {
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
              completionRate: 0,
            });
          }

          const stat = userMap.get(userId)!;
          stat.total++;

          if (task.status === 'completed' || task.status === 'closed') {
            stat.completed++;
          } else if (task.status === 'in_progress') {
            stat.inProgress++;
          } else if (task.status === 'pending') {
            stat.pending++;
          }

          if (
            task.due_date &&
            new Date(task.due_date) < now &&
            (task.status === 'pending' || task.status === 'in_progress')
          ) {
            stat.overdue++;
          }
        }
      }

      for (const stat of userMap.values()) {
        stat.completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      }

      const userCompletionStats = Array.from(userMap.values()).sort(
        (a, b) => b.total - a.total,
      );

      // Compute AI insights
      const aiInsights = computeAIInsights(
        totalTasks ?? 0,
        overdueTasks ?? 0,
        statusDistribution,
        priorityDistribution,
        weeklyTrend,
        teamWorkload,
        userCompletionStats,
      );

      return {
        myOpenTasks: myOpenTasks ?? 0,
        overdueTasks: overdueTasks ?? 0,
        completedThisWeek: completedThisWeek ?? 0,
        totalTasks: totalTasks ?? 0,
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
