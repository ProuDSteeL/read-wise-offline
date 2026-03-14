import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, HardDrive, Settings2, WifiOff, BookOpen } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDownloads } from "@/hooks/useDownloads";
import { formatBytes } from "@/lib/offlineStorage";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DownloadsPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { downloads, totalUsed, loading, remove, storageLimitMB, setStorageLimitMB } = useDownloads();
  const [showSettings, setShowSettings] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [localLimit, setLocalLimit] = useState(storageLimitMB);

  const limitBytes = storageLimitMB * 1024 * 1024;
  const usagePercent = limitBytes > 0 ? Math.min((totalUsed / limitBytes) * 100, 100) : 0;

  return (
    <div className="animate-fade-in min-h-screen bg-background pb-24">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
          <WifiOff className="h-3.5 w-3.5" />
          Нет подключения — доступны только загрузки
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 glass border-b border-border/60">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">Загрузки</span>
        <button onClick={() => setShowSettings(!showSettings)} className="tap-highlight">
          <Settings2 className={`h-5 w-5 ${showSettings ? "text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>

      {/* Storage indicator */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            {formatBytes(totalUsed)} из {formatBytes(limitBytes)}
          </span>
        </div>
        <Progress value={usagePercent} className="h-2" />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="animate-fade-in mx-4 mb-4 rounded-2xl bg-card p-4 shadow-card space-y-3">
          <p className="text-xs font-medium text-foreground">Лимит хранилища: {localLimit} МБ</p>
          <Slider
            value={[localLimit]}
            min={100}
            max={2000}
            step={100}
            onValueChange={([v]) => setLocalLimit(v)}
            onValueCommit={([v]) => setStorageLimitMB(v)}
          />
          <p className="text-[10px] text-muted-foreground">
            Перетащите ползунок для изменения лимита (100 — 2000 МБ)
          </p>
        </div>
      )}

      {/* Downloads list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : downloads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <HardDrive className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Нет загрузок</p>
          <p className="text-xs text-muted-foreground">Скачивайте саммари для чтения офлайн</p>
        </div>
      ) : (
        <div className="space-y-1 px-4">
          {downloads.map((dl) => (
            <div
              key={dl.bookId}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
            >
              <img
                src={dl.coverUrl || "/placeholder.svg"}
                alt={dl.title}
                className="h-14 w-10 shrink-0 rounded-lg object-cover"
                onClick={() => navigate(isOnline ? `/book/${dl.bookId}` : `/offline/read/${dl.bookId}`)}
              />
              <div className="flex-1 min-w-0" onClick={() => navigate(isOnline ? `/book/${dl.bookId}` : `/offline/read/${dl.bookId}`)}>
                <p className="text-sm font-medium text-foreground truncate">{dl.title}</p>
                <p className="text-xs text-muted-foreground truncate">{dl.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  {dl.hasText && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Текст
                    </span>
                  )}
                  {dl.hasAudio && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Аудио
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(dl.textSizeBytes + dl.audioSizeBytes)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDeleteBookId(dl.bookId)}
                className="shrink-0 tap-highlight p-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteBookId} onOpenChange={() => setDeleteBookId(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить загрузку?</AlertDialogTitle>
            <AlertDialogDescription>
              Скачанные данные будут удалены с устройства. Книга останется в вашей библиотеке.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteBookId) remove(deleteBookId);
                setDeleteBookId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DownloadsPage;
