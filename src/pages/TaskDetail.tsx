import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, User, Tag,
  Play, CheckCircle, XCircle, Lock, RotateCcw, Edit, Trash2,
} from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useAuth } from '@/lib/auth-context';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTaskAttachments } from '@/hooks/useTaskAttachments';
import { useProfiles } from '@/hooks/useProfiles';
import { useTasks } from '@/hooks/useTasks';
import { useStartTask } from '@/hooks/useStartTask';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '@/lib/taskUtils';
import * as perms from '@/lib/taskUtils';
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskAttachments } from '@/components/tasks/TaskAttachments';
import { SubtaskList } from '@/components/tasks/SubtaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { SubtaskDialog } from '@/components/tasks/SubtaskDialog';
import { StartTaskDialog } from '@/components/tasks/StartTaskDialog';
import { CompleteTaskDialog } from '@/components/tasks/CompleteTaskDialog';
import { CloseTaskDialog } from '@/components/tasks/CloseTaskDialog';
import { RestartTaskDialog } from '@/components/tasks/RestartTaskDialog';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const currentUserId = user?.id || '';

  const { task, isLoading, updateTask, closeTask, restartTask, cancelTask } = useTaskDetail(id!);
  const { comments, isLoading: commentsLoading, addComment } = useTaskComments(id!);
  const { attachments, isLoading: attachmentsLoading, uploadAttachment, deleteAttachment, getDownloadUrl } = useTaskAttachments(id!);
  const { profiles } = useProfiles();
  const { createTask: createSubtask } = useTasks({ page: 1, items_per_page: 1 });
  const startTask = useStartTask();
  const completeTask = useCompleteTask();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !task) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {isLoading ? 'Loading task...' : 'Task not found'}
      </div>
    );
  }

  const handleUpdate = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync(data as UpdateTaskInput);
      setEditDialogOpen(false);
      setEditingSubtask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (files: File[]) => {
    setIsSubmitting(true);
    try {
      await startTask.mutateAsync({ taskId: id!, files });
      setStartDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (notes: string, files: File[]) => {
    setIsSubmitting(true);
    try {
      await completeTask.mutateAsync({ taskId: id!, notes, files });
      setCompleteDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await closeTask.mutateAsync({ closure_reason: reason });
      setCloseDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await restartTask.mutateAsync({ restart_reason: reason });
      setRestartDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    const url = await getDownloadUrl(filePath);
    window.open(url, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="mb-6">
        <Link to="/tasks" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {task.task_number}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(task.status))}>
                {getStatusLabel(task.status)}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getPriorityColor(task.priority))}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{task.task_name}</h1>
            {task.parent_task_id && (
              <p className="text-sm text-muted-foreground mt-1">
                Subtask of a parent task
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {perms.canStartTask(task.status, currentUserId, task.assigned_to) && (
              <button onClick={() => setStartDialogOpen(true)} className="flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all">
                <Play className="h-5 w-5" /> Start Activity
              </button>
            )}
            {perms.canCompleteTask(task.status, currentUserId, task.assigned_to) && (
              <button onClick={() => setCompleteDialogOpen(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> Complete
              </button>
            )}
            {perms.canCloseTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button onClick={() => setCloseDialogOpen(true)} className="flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-purple-200 transition-all">
                <Lock className="h-5 w-5" /> Close Activity
              </button>
            )}
            {perms.canCancelTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button onClick={() => cancelTask.mutate()} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-muted">
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            {perms.canRestartTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button onClick={() => setRestartDialogOpen(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-muted">
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </button>
            )}
            {perms.canEditTask(currentUserId, task.assigned_to, task.assigned_by, isAdmin) && (
              <button onClick={() => { setEditingSubtask(null); setEditDialogOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-muted">
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {perms.canDeleteTask(currentUserId, task.assigned_by, isAdmin) && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    navigate('/tasks');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        {task.description && (
          <p className="text-sm mb-4 whitespace-pre-wrap">{task.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Assigned To</span>
            <p className="font-medium mt-0.5">{task.assigned_user?.full_name || '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Created By</span>
            <p className="font-medium mt-0.5">{task.assigned_by_user?.full_name || '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due Date</span>
            <p className="font-medium mt-0.5">{formatDate(task.due_date)}</p>
          </div>
          {task.start_date && (
            <div>
              <span className="text-muted-foreground">Start Date</span>
              <p className="font-medium mt-0.5">{formatDate(task.start_date)}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created</span>
            <p className="font-medium mt-0.5">{formatDateTime(task.created_at)}</p>
          </div>
          {task.estimated_hours != null && (
            <div>
              <span className="text-muted-foreground">Est. Hours</span>
              <p className="font-medium mt-0.5">{task.estimated_hours}h</p>
            </div>
          )}
          {task.actual_hours != null && (
            <div>
              <span className="text-muted-foreground">Actual Hours</span>
              <p className="font-medium mt-0.5">{task.actual_hours}h</p>
            </div>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="col-span-full">
              <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {task.completion_percentage > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.completion_percentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${task.completion_percentage}%` }} />
            </div>
          </div>
        )}

        {/* Completion info */}
        {task.completed_at && (
          <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
            <p className="font-medium text-green-800">Completed: {formatDateTime(task.completed_at)}</p>
            {task.completion_notes && <p className="text-green-700 mt-1">{task.completion_notes}</p>}
          </div>
        )}

        {/* Closure info */}
        {task.closed_at && (
          <div className="mt-4 p-3 rounded-md bg-purple-50 border border-purple-200 text-sm">
            <p className="font-medium text-purple-800">
              Closed: {formatDateTime(task.closed_at)} by {task.closed_by_user?.full_name || 'Unknown'}
            </p>
            {task.closure_reason && <p className="text-purple-700 mt-1">{task.closure_reason}</p>}
          </div>
        )}

        {/* Restart info */}
        {task.restarted_at && (
          <div className="mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm">
            <p className="font-medium text-yellow-800">Restarted: {formatDateTime(task.restarted_at)}</p>
            {task.restart_reason && <p className="text-yellow-700 mt-1">{task.restart_reason}</p>}
          </div>
        )}
      </div>

      {/* Subtasks */}
      {!task.parent_task_id && (
        <div className="rounded-lg border bg-card p-6 mb-6">
          <SubtaskList
            subtasks={task.subtasks || []}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            parentTask={task}
            onStart={() => {
              updateTask.mutate({ status: 'in_progress' });
            }}
            onComplete={(st) => navigate(`/tasks/${st.id}`)}
            onEdit={(st) => { setEditingSubtask(st); setEditDialogOpen(true); }}
            onAddSubtask={() => setSubtaskDialogOpen(true)}
            onClick={(st) => navigate(`/tasks/${st.id}`)}
          />
        </div>
      )}

      {/* Attachments */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <TaskAttachments
          attachments={attachments}
          isLoading={attachmentsLoading}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          taskCreatorId={task.assigned_by}
          onUpload={(file, type) => uploadAttachment.mutate({ file, type })}
          onDelete={(attachId, filePath) => deleteAttachment.mutate({ id: attachId, filePath })}
          onDownload={handleDownload}
          isUploading={uploadAttachment.isPending}
        />
      </div>

      {/* Comments */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <TaskComments
          comments={comments}
          isLoading={commentsLoading}
          onAddComment={(text) => addComment.mutate({ comment: text })}
          isSubmitting={addComment.isPending}
        />
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={editDialogOpen}
        onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingSubtask(null); }}
        task={editingSubtask || task}
        profiles={profiles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {subtaskDialogOpen && (
        <SubtaskDialog
          open={subtaskDialogOpen}
          onOpenChange={setSubtaskDialogOpen}
          parentTask={task}
          profiles={profiles}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await createSubtask.mutateAsync(data);
              setSubtaskDialogOpen(false);
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {startDialogOpen && (
        <StartTaskDialog
          open={startDialogOpen}
          onOpenChange={setStartDialogOpen}
          task={task}
          onSubmit={handleStart}
          isSubmitting={isSubmitting}
        />
      )}

      {completeDialogOpen && (
        <CompleteTaskDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          task={task}
          onSubmit={handleComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {closeDialogOpen && (
        <CloseTaskDialog
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          task={task}
          onSubmit={handleClose}
          isSubmitting={isSubmitting}
        />
      )}

      {restartDialogOpen && (
        <RestartTaskDialog
          open={restartDialogOpen}
          onOpenChange={setRestartDialogOpen}
          task={task}
          onSubmit={handleRestart}
          isSubmitting={isSubmitting}
        />
      )}
    </motion.div>
  );
}
