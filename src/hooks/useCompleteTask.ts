import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export function useCompleteTask() {
  const qc = useQueryClient();
  const { user, orgId } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      notes,
      files,
    }: {
      taskId: string;
      notes: string;
      files: File[];
    }) => {
      for (const file of files) {
        const filePath = `tasks/${taskId}/completion/${Date.now()}_${file.name}`;
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
            attachment_type: 'completion',
            uploaded_by: user!.id,
            org_id: orgId,
          });
        if (attachError) throw attachError;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completion_notes: notes,
          completion_percentage: 100,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('Task completed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });
}
