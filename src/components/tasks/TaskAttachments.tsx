import { useState, useCallback } from 'react';
import { Upload, FileIcon, Trash2, Download, Paperclip, Eye } from 'lucide-react';
import type { TaskAttachment, AttachmentType } from '@/types/task';
import { formatFileSize, formatRelativeDate } from '@/lib/utils';

interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
  isLoading: boolean;
  currentUserId: string;
  isAdmin: boolean;
  taskCreatorId: string;
  onUpload: (file: File, type: AttachmentType) => void;
  onDelete: (id: string, filePath: string) => void;
  onDownload: (filePath: string, fileName: string) => void;
  onPreview: (attachment: TaskAttachment) => void;
  isUploading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function TaskAttachments({
  attachments,
  isLoading,
  currentUserId,
  isAdmin,
  taskCreatorId,
  onUpload,
  onDelete,
  onDownload,
  onPreview,
  isUploading,
}: TaskAttachmentsProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name} exceeds 10MB limit`);
          return;
        }
        onUpload(file, 'general');
      });
    },
    [onUpload]
  );

  const canDeleteAttachment = (uploadedBy: string) => {
    return uploadedBy === currentUserId || taskCreatorId === currentUserId || isAdmin;
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground text-sm py-4">Loading attachments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({attachments.length})
      </h3>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-input'
        }`}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Uploading...' : (
            <>
              Drop files here or{' '}
              <label className="text-primary cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </label>
            </>
          )}
        </p>
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2.5 rounded-md border bg-card text-sm"
            >
              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <button
                type="button"
                onClick={() => onPreview(attachment)}
                className="flex-1 min-w-0 text-left group"
                title="Preview"
              >
                <p className="font-medium truncate group-hover:text-primary group-hover:underline">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)} · {attachment.uploader?.full_name || 'Unknown'} · {formatRelativeDate(attachment.uploaded_at)}
                  {attachment.attachment_type !== 'general' && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase">
                      {attachment.attachment_type}
                    </span>
                  )}
                </p>
              </button>
              <button
                onClick={() => onPreview(attachment)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDownload(attachment.file_path, attachment.file_name)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              {canDeleteAttachment(attachment.uploaded_by) && (
                <button
                  onClick={() => onDelete(attachment.id, attachment.file_path)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
