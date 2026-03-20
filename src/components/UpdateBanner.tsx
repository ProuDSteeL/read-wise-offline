import { RefreshCw, X } from "lucide-react";

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateBanner = ({ onUpdate, onDismiss }: UpdateBannerProps) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[70] animate-fade-in">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-card p-3 shadow-elevated border border-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Доступно обновление</p>
          <p className="text-xs text-muted-foreground">Новая версия приложения готова</p>
        </div>
        <button
          onClick={onUpdate}
          className="shrink-0 rounded-full gradient-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground tap-highlight"
        >
          Обновить
        </button>
        <button onClick={onDismiss} className="shrink-0 tap-highlight p-1">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
