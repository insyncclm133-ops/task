import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskComment } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function useTaskComments(taskId: string) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data: comments = [], isLoading } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*, user:profiles!task_comments_user_id_fkey(id,full_name,email,avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data as TaskComment[];
    },
    enabled: !!taskId,
  });

  // Subscribe to realtime changes for comments on this task
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  const addComment = useMutation({
    mutationFn: async ({
      comment,
      commentType = 'comment',
      metadata,
    }: {
      comment: string;
      commentType?: TaskComment['comment_type'];
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user!.id,
          comment,
          comment_type: commentType,
          metadata: metadata ?? null,
          org_id: orgId,
        })
        .select('*, user:profiles!task_comments_user_id_fkey(id,full_name,email,avatar_url)')
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  return {
    comments,
    isLoading,
    addComment,
  };
}
