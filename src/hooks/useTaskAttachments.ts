import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskAttachment, AttachmentType } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function useTaskAttachments(taskId: string) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data: attachments = [], isLoading } = useQuery<TaskAttachment[]>({
    queryKey: ['task-attachments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select(
          '*, uploader:profiles!task_attachments_uploaded_by_fkey(id,full_name,email,avatar_url)',
        )
        .eq('task_id', taskId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as TaskAttachment[];
    },
    enabled: !!taskId,
  });

  const uploadAttachment = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: AttachmentType;
    }) => {
      const filePath = `tasks/${taskId}/${type}/${Date.now()}_${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Insert attachment record
      const { data, error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          attachment_type: type,
          uploaded_by: user!.id,
          org_id: orgId,
        })
        .select(
          '*, uploader:profiles!task_attachments_uploaded_by_fkey(id,full_name,email,avatar_url)',
        )
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Attachment uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload attachment: ${error.message}`);
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete record
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Attachment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete attachment: ${error.message}`);
    },
  });

  const getDownloadUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    return data.signedUrl;
  };

  return {
    attachments,
    isLoading,
    uploadAttachment,
    deleteAttachment,
    getDownloadUrl,
  };
}
