import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BarChart3, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { Task, TaskFilters as TaskFiltersType, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useAuth } from '@/lib/auth-context';
import { useTasks } from '@/hooks/useTasks';
import { useProfiles } from '@/hooks/useProfiles';
import { useTaskStats } from '@/hooks/useTaskStats';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { SubtaskDialog } from '@/components/tasks/SubtaskDialog';
import { CompleteTaskDialog } from '@/components/tasks/CompleteTaskDialog';
import { CloseTaskDialog } from '@/components/tasks/CloseTaskDialog';
import { RestartTaskDialog } from '@/components/tasks/RestartTaskDialog';
import { PaginationControls } from '@/components/tasks/PaginationControls';

export function TasksPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const currentUserId = user?.id || '';

  const [filters, setFilters] = useState<TaskFiltersType>({
    status: 'all',
    priority: 'all',
    page: 1,
    items_per_page: 10,
  });

  const { tasks, totalCount, isLoading, createTask, updateTask } = useTasks(filters);
  const { profiles } = useProfiles();
  const { stats } = useTaskStats();

  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [closingTask, setClosingTask] = useState<Task | null>(null);
  const [restartingTask, setRestartingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPages = Math.ceil((totalCount || 0) / filters.items_per_page);

  const handleFiltersChange = (changes: Partial<TaskFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
  };

  const handleCreateTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...data });
      } else {
        await createTask.mutateAsync(data as CreateTaskInput);
      }
      setTaskDialogOpen(false);
      setEditingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubtask = async (data: CreateTaskInput) => {
    setIsSubmitting(true);
    try {
      await createTask.mutateAsync(data);
      setSubtaskParent(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTask = async (task: Task) => {
    await updateTask.mutateAsync({ id: task.id, status: 'in_progress' });
  };

  const handleCompleteTask = async (notes: string, _files: File[]) => {
    if (!completingTask) return;
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: completingTask.id,
        status: 'completed',
        completion_notes: notes,
        completion_percentage: 100,
      });
      setCompletingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTask = async (_reason: string) => {
    if (!closingTask) return;
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: closingTask.id,
        status: 'closed',
      });
      setClosingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartTask = async (_reason: string) => {
    if (!restartingTask) return;
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: restartingTask.id,
        status: 'pending',
        completion_notes: undefined,
        completion_percentage: 0,
      });
      setRestartingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTask = async (task: Task) => {
    if (confirm('Are you sure you want to cancel this task?')) {
      await updateTask.mutateAsync({ id: task.id, status: 'cancelled' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-sm text-muted-foreground">{totalCount || 0} total tasks</p>
          </div>
          <button
            onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          assignees={profiles.map((p) => ({ id: p.id, full_name: p.full_name }))}
        />

        {/* Task List */}
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No tasks found</p>
              <button
                onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
                className="text-sm text-primary hover:underline"
              >
                Create your first task
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onStart={handleStartTask}
                onComplete={setCompletingTask}
                onCancel={handleCancelTask}
                onClose={setClosingTask}
                onRestart={setRestartingTask}
                onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }}
                onAddSubtask={setSubtaskParent}
                onClick={(t) => navigate(`/tasks/${t.id}`)}
              />
            ))
          )}
        </div>

        <PaginationControls
          page={filters.page}
          totalPages={totalPages}
          onPageChange={(page) => handleFiltersChange({ page })}
        />
      </div>

      {/* Stats Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  My Open Tasks
                </span>
                <span className="font-bold text-lg">{stats?.myOpenTasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  Overdue
                </span>
                <span className="font-bold text-lg text-red-600">{stats?.overdueTasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  Completed This Week
                </span>
                <span className="font-bold text-lg text-green-600">{stats?.completedThisWeek ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          {stats?.statusDistribution && stats.statusDistribution.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">By Status</h3>
              <div className="space-y-2">
                {stats.statusDistribution.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{s.name.replace('_', ' ')}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Workload */}
          {stats?.teamWorkload && stats.teamWorkload.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">Team Workload</h3>
              <div className="space-y-2">
                {stats.teamWorkload.map((w) => (
                  <div key={w.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{w.name}</span>
                    <span className="font-medium">{w.tasks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => { setTaskDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
      />

      {subtaskParent && (
        <SubtaskDialog
          open={!!subtaskParent}
          onOpenChange={(open) => { if (!open) setSubtaskParent(null); }}
          parentTask={subtaskParent}
          profiles={profiles}
          onSubmit={handleCreateSubtask}
          isSubmitting={isSubmitting}
        />
      )}

      {completingTask && (
        <CompleteTaskDialog
          open={!!completingTask}
          onOpenChange={(open) => { if (!open) setCompletingTask(null); }}
          task={completingTask}
          onSubmit={handleCompleteTask}
          isSubmitting={isSubmitting}
        />
      )}

      {closingTask && (
        <CloseTaskDialog
          open={!!closingTask}
          onOpenChange={(open) => { if (!open) setClosingTask(null); }}
          task={closingTask}
          onSubmit={handleCloseTask}
          isSubmitting={isSubmitting}
        />
      )}

      {restartingTask && (
        <RestartTaskDialog
          open={!!restartingTask}
          onOpenChange={(open) => { if (!open) setRestartingTask(null); }}
          task={restartingTask}
          onSubmit={handleRestartTask}
          isSubmitting={isSubmitting}
        />
      )}
    </motion.div>
  );
}
