import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskFilters, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function useTasks(filters: TaskFilters) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(
          '*, assigned_user:profiles!tasks_assigned_to_fkey(id,full_name,email,avatar_url), assigned_by_user:profiles!tasks_assigned_by_fkey(id,full_name,email,avatar_url)',
          { count: 'exact' },
        );

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.search) {
        query = query.or(
          `task_name.ilike.%${filters.search}%,task_number.ilike.%${filters.search}%`,
        );
      }

      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      if (filters.created_date_from) {
        query = query.gte('created_at', filters.created_date_from);
      }

      if (filters.created_date_to) {
        query = query.lte('created_at', filters.created_date_to);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Ordering
      query = query.order('created_at', { ascending: false });

      // Pagination
      const from = (filters.page - 1) * filters.items_per_page;
      const to = from + filters.items_per_page - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message ?? 'Failed to fetch tasks');
      }

      const tasks = data as Task[];

      // Build subtask hierarchy
      const taskMap = new Map<string, Task>();
      for (const task of tasks) {
        task.subtasks = [];
        taskMap.set(task.id, task);
      }

      const rootTasks: Task[] = [];
      for (const task of tasks) {
        if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
          const parent = taskMap.get(task.parent_task_id)!;
          parent.subtasks!.push(task);
        } else if (!task.parent_task_id) {
          rootTasks.push(task);
        } else {
          // Parent not in current page — treat as root
          rootTasks.push(task);
        }
      }

      return { tasks: rootTasks, totalCount: count ?? 0 };
    },
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const payload = { ...input, assigned_by: user?.id, org_id: orgId };
      const { data, error } = await supabase.from('tasks').insert(payload).select().single();

      if (error) {
        console.error('createTask failed', { payload, error });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error: Error & { code?: string; details?: string; hint?: string }) => {
      const parts = [error.message, error.details, error.hint].filter(Boolean).join(' — ');
      toast.error(`Failed to create task${error.code ? ` (${error.code})` : ''}: ${parts || 'unknown error'}`);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskInput & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  return {
    tasks: data?.tasks ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}
