import { Download, FileText, Headphones, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/offlineStorage";
import { getDownloadDisplayState, roundProgress } from "@/lib/downloadDisplayState";

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
  downloadProgress?: number;    // 0-100
  downloadStatus?: "downloading" | "done" | "error";
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
  downloadProgress,
  downloadStatus,
}: DownloadDialogProps) => {
  const textSize = textContent ? new Blob([textContent]).size : 0;
  const audioSize = audioSizeBytes || 0;
  const displayState = getDownloadDisplayState(downloadProgress, downloadStatus);
  const rounded = roundProgress(downloadProgress);

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

  // Prevent closing during active download
  const handleOpenChange = (value: boolean) => {
    if (displayState === "downloading" && !value) return; // block close
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Скачать офлайн</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{bookTitle}</p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {options.map((opt) => {
            if (!opt.available) return null;
            const isAudioDownload = opt.type === "audio" || opt.type === "both";
            return (
              <button
                key={opt.type}
                disabled={downloading || opt.done}
                onClick={() => onDownload(opt.type)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 tap-highlight"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {opt.done || displayState === "done" ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : displayState === "downloading" && isAudioDownload ? (
                    <span className="text-xs font-bold text-primary">{rounded}%</span>
                  ) : downloading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <opt.icon className="h-5 w-5 text-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  {displayState === "downloading" && isAudioDownload ? (
                    <Progress value={downloadProgress} className="h-1.5" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {opt.done ? "Уже скачано" : `~${formatBytes(opt.size)}`}
                    </p>
                  )}
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
