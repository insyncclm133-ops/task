import { useCallback, useState } from 'react';
import { X, Play, Upload, FileIcon, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { formatFileSize } from '@/lib/utils';

interface StartTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSubmit: (files: File[]) => void;
  isSubmitting: boolean;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function StartTaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  isSubmitting,
}: StartTaskDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        alert(`${f.name} exceeds the 10 MB limit`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(files);
  };

  const handleClose = () => {
    setFiles([]);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Start Task</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Begin working and optionally attach reference files
            </p>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task info banner */}
        <div className="mx-6 mt-4 p-3 rounded-md bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-700">
          <Play className="h-4 w-4 flex-shrink-0" />
          <span>Starting: <strong>{task.task_name}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium">
              Reference files{' '}
              <span className="text-muted-foreground font-normal">
                — optional, up to {MAX_FILES} files, 10 MB each
              </span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`mt-1.5 border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-default ${
                dragOver ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground/40'
              }`}
            >
              <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files here, or{' '}
                <label className="text-primary cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Work orders, specs, reference docs…
              </p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-md bg-muted text-sm"
                >
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {isSubmitting ? 'Starting…' : 'Start Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
