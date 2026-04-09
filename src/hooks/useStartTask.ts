import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export function useStartTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, files }: { taskId: string; files: File[] }) => {
      for (const file of files) {
        const filePath = `tasks/${taskId}/reference/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { error: attachError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            attachment_type: 'reference',
            uploaded_by: user!.id,
          });
        if (attachError) throw attachError;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress', start_date: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Task not found or you do not have permission to start it.');
    },
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('Task started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start task: ${error.message}`);
    },
  });
}
