import { useState } from "react";
import { Download, FileText, Headphones, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/offlineStorage";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
  hasText: boolean;
  hasAudio: boolean;
  audioSizeBytes?: number;
  textContent?: string | null;
  alreadyDownloaded?: { hasText: boolean; hasAudio: boolean } | null;
  onDownload: (type: "text" | "audio" | "both") => void;
  downloading?: boolean;
}

const DownloadDialog = ({
  open,
  onOpenChange,
  bookTitle,
  hasText,
  hasAudio,
  audioSizeBytes,
  textContent,
  alreadyDownloaded,
  onDownload,
  downloading,
}: DownloadDialogProps) => {
  const textSize = textContent ? new Blob([textContent]).size : 0;
  const audioSize = audioSizeBytes || 0;

  const options = [
    {
      type: "text" as const,
      label: "Только текст",
      icon: FileText,
      size: textSize,
      available: hasText && !!textContent,
      done: alreadyDownloaded?.hasText,
    },
    {
      type: "audio" as const,
      label: "Только аудио",
      icon: Headphones,
      size: audioSize,
      available: hasAudio,
      done: alreadyDownloaded?.hasAudio,
    },
    {
      type: "both" as const,
      label: "Текст + аудио",
      icon: Download,
      size: textSize + audioSize,
      available: hasText && hasAudio && !!textContent,
      done: alreadyDownloaded?.hasText && alreadyDownloaded?.hasAudio,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Скачать офлайн</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{bookTitle}</p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {options.map((opt) => {
            if (!opt.available) return null;
            return (
              <button
                key={opt.type}
                disabled={downloading || opt.done}
                onClick={() => onDownload(opt.type)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 tap-highlight"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {opt.done ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : downloading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <opt.icon className="h-5 w-5 text-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {opt.done ? "Уже скачано" : `~${formatBytes(opt.size)}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;
