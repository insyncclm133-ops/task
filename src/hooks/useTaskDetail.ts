import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, UpdateTaskInput, CompleteTaskInput, CloseTaskInput, RestartTaskInput } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function useTaskDetail(taskId: string) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data: task, isLoading } = useQuery<Task | null>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      // Fetch the main task with joined profiles
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(
          '*, assigned_user:profiles!tasks_assigned_to_fkey(id,full_name,email,avatar_url), assigned_by_user:profiles!tasks_assigned_by_fkey(id,full_name,email,avatar_url), closed_by_user:profiles!tasks_closed_by_fkey(id,full_name,email,avatar_url)',
        )
        .eq('id', taskId)
        .single();

      if (taskError) {
        // PGRST116 = no rows found (404); return null so the UI shows "Task not found"
        if (taskError.code === 'PGRST116') return null;
        throw taskError;
      }

      // Fetch subtasks
      const { data: subtasks, error: subtasksError } = await supabase
        .from('tasks')
        .select(
          '*, assigned_user:profiles!tasks_assigned_to_fkey(id,full_name,email,avatar_url)',
        )
        .eq('parent_task_id', taskId)
        .order('created_at', { ascending: true });

      if (subtasksError) {
        throw subtasksError;
      }

      // Fetch attachment count
      const { count, error: countError } = await supabase
        .from('task_attachments')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId);

      if (countError) {
        throw countError;
      }

      return {
        ...taskData,
        subtasks: subtasks ?? [],
        attachment_count: count ?? 0,
      } as Task;
    },
    enabled: !!taskId,
  });

  const updateTask = useMutation({
    mutationFn: async (updates: Record<string, unknown> | UpdateTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const completeTask = useMutation({
    mutationFn: async (input: CompleteTaskInput) => {
      // Upload files to storage if any
      const uploadedFiles: { file_path: string; file_name: string; file_size: number; file_type: string }[] = [];

      for (const file of input.files) {
        const filePath = `tasks/${taskId}/completion/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        uploadedFiles.push({
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        });
      }

      // Insert attachment records
      if (uploadedFiles.length > 0) {
        const attachments = uploadedFiles.map((f) => ({
          task_id: taskId,
          file_path: f.file_path,
          file_name: f.file_name,
          file_size: f.file_size,
          file_type: f.file_type,
          attachment_type: 'completion' as const,
          uploaded_by: user!.id,
          org_id: orgId,
        }));

        const { error: attachError } = await supabase
          .from('task_attachments')
          .insert(attachments);

        if (attachError) {
          throw attachError;
        }
      }

      // Update task status to completed
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completion_notes: input.completion_notes,
          completion_percentage: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task completed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });

  const closeTask = useMutation({
    mutationFn: async (input: CloseTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'closed',
          closure_reason: input.closure_reason,
          closed_at: new Date().toISOString(),
          closed_by: user!.id,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task closed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to close task: ${error.message}`);
    },
  });

  const restartTask = useMutation({
    mutationFn: async (input: RestartTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'pending',
          restart_reason: input.restart_reason,
          restarted_at: new Date().toISOString(),
          restarted_by: user!.id,
          completion_notes: null,
          completion_percentage: 0,
          completed_at: null,
          closed_at: null,
          closed_by: null,
          closure_reason: null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task restarted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to restart task: ${error.message}`);
    },
  });

  const cancelTask = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'cancelled',
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task cancelled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel task: ${error.message}`);
    },
  });

  const startTask = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          start_date: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start task: ${error.message}`);
    },
  });

  return {
    task: task ?? null,
    isLoading,
    updateTask,
    completeTask,
    closeTask,
    restartTask,
    cancelTask,
    startTask,
  };
}
