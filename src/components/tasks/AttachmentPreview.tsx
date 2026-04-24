import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, FileIcon, Loader2 } from 'lucide-react';
import type { TaskAttachment } from '@/types/task';
import { formatFileSize } from '@/lib/utils';

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported';

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'log', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml',
  'ini', 'conf', 'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'rb',
  'go', 'rs', 'java', 'kt', 'c', 'cpp', 'h', 'sh', 'sql', 'env',
]);

function getPreviewKind(attachment: TaskAttachment): PreviewKind {
  const mime = (attachment.file_type || '').toLowerCase();
  const ext = attachment.file_name.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime === 'application/json' || TEXT_EXTENSIONS.has(ext)) {
    return 'text';
  }
  return 'unsupported';
}

interface AttachmentPreviewProps {
  attachment: TaskAttachment;
  getUrl: (filePath: string, opts?: { download?: boolean | string }) => Promise<string>;
  onClose: () => void;
}

export function AttachmentPreview({ attachment, getUrl, onClose }: AttachmentPreviewProps) {
  const kind = getPreviewKind(attachment);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const url = await getUrl(attachment.file_path);
        if (cancelled) return;
        setPreviewUrl(url);

        if (kind === 'text') {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load preview (${res.status})`);
          const text = await res.text();
          if (cancelled) return;
          setTextContent(text.length > 200_000 ? text.slice(0, 200_000) + '\n\n…truncated…' : text);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load preview');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [attachment.file_path, kind, getUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getUrl(attachment.file_path, { download: attachment.file_name });
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const renderBody = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <FileIcon className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    switch (kind) {
      case 'image':
        return (
          <img
            src={previewUrl}
            alt={attachment.file_name}
            className="max-h-full max-w-full object-contain mx-auto"
          />
        );
      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            title={attachment.file_name}
            className="w-full h-full border-0 bg-white"
          />
        );
      case 'video':
        return (
          <video
            src={previewUrl}
            controls
            className="max-h-full max-w-full mx-auto"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center py-16">
            <audio src={previewUrl} controls className="w-full max-w-lg" />
          </div>
        );
      case 'text':
        if (textContent === null) {
          return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }
        return (
          <pre className="text-xs whitespace-pre-wrap break-words font-mono bg-muted/30 p-4 rounded-md overflow-auto h-full">
            {textContent}
          </pre>
        );
      case 'unsupported':
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Preview not available for this file type.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />

      <div className="relative z-10 flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 bg-background rounded-t-lg border-b px-4 py-3 shadow">
          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.file_size)}
              {attachment.file_type ? ` · ${attachment.file_type}` : ''}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-muted disabled:opacity-50"
            title="Download"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 bg-background rounded-b-lg overflow-auto flex items-center justify-center p-4">
          <div className="w-full h-full flex items-center justify-center">
            {renderBody()}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
