import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lock,
  Plus,
  Paperclip,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import type { Task } from '@/types/task';
import { cn, formatDate, getOverdueDays } from '@/lib/utils';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '@/lib/taskUtils';
import * as perms from '@/lib/taskUtils';

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  isAdmin: boolean;
  onStart: (task: Task) => void;
  onComplete: (task: Task) => void;
  onCancel: (task: Task) => void;
  onClose: (task: Task) => void;
  onRestart: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onClick: (task: Task) => void;
  level?: number;
}

export function TaskCard({
  task,
  currentUserId,
  isAdmin,
  onStart,
  onComplete,
  onCancel,
  onClose,
  onRestart,
  onEdit,
  onAddSubtask,
  onClick,
  level = 0,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const overdueDays = getOverdueDays(task.due_date);
  const isOverdue = overdueDays > 0 && !['completed', 'closed', 'cancelled'].includes(task.status);
  const [daysOpen] = useState(() => Math.max(0, Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86400000)));

  return (
    <div style={{ marginLeft: level * 16 }}>
      <div
        className={cn(
          'rounded-lg border bg-card p-4 transition-all hover:shadow-md',
          isOverdue && 'border-red-300 bg-red-50/50'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Expand/Collapse for subtasks */}
          <div className="pt-1 w-5 flex-shrink-0">
            {hasSubtasks ? (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-muted-foreground hover:text-foreground"
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : null}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {task.task_number}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(task.status))}>
                {getStatusLabel(task.status)}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getPriorityColor(task.priority))}>
                {getPriorityLabel(task.priority)}
              </span>
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueDays}d overdue
                </span>
              )}
              {hasSubtasks && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {task.subtasks!.length} subtask{task.subtasks!.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h3
              className="font-semibold text-sm cursor-pointer hover:text-primary truncate"
              onClick={() => onClick(task)}
            >
              {task.task_name}
            </h3>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due: {formatDate(task.due_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysOpen}d open
              </span>
              {task.assigned_user && (
                <span>Assigned to: {task.assigned_user.full_name}</span>
              )}
              {task.assigned_by_user && (
                <span>By: {task.assigned_by_user.full_name}</span>
              )}
              {task.attachment_count && task.attachment_count > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {task.attachment_count}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {task.completion_percentage > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${task.completion_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {perms.canStartTask(task.status, currentUserId, task.assigned_to) && (
              <button
                onClick={(e) => { e.stopPropagation(); onStart(task); }}
                className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600"
                title="Start"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {perms.canCompleteTask(task.status, currentUserId, task.assigned_to) && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(task); }}
                className="p-1.5 rounded-md hover:bg-green-100 text-green-600"
                title="Complete"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            {perms.canCloseTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(task); }}
                className="p-1.5 rounded-md hover:bg-purple-100 text-purple-600"
                title="Close"
              >
                <Lock className="h-4 w-4" />
              </button>
            )}
            {perms.canCancelTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(task); }}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                title="Cancel"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
            {perms.canRestartTask(task.status, currentUserId, task.assigned_by, isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onRestart(task); }}
                className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-600"
                title="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {perms.canAddSubtask(task, currentUserId, task.assigned_to, task.assigned_by, isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }}
                className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-600"
                title="Add Subtask"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {perms.canEditTask(currentUserId, task.assigned_to, task.assigned_by, isAdmin) && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onClick(task)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title="Details"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && hasSubtasks && (
        <div className="mt-1 space-y-1">
          {task.subtasks!.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onStart={onStart}
              onComplete={onComplete}
              onCancel={onCancel}
              onClose={onClose}
              onRestart={onRestart}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
