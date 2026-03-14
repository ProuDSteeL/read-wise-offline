import { cn } from "@/lib/utils";

interface ContinueCardProps {
  title: string;
  author: string;
  coverUrl: string;
  progress: number;
  className?: string;
  onClick?: () => void;
}

const ContinueCard = ({
  title,
  author,
  coverUrl,
  progress,
  className,
  onClick,
}: ContinueCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-card text-left tap-highlight transition-shadow hover:shadow-elevated",
        className
      )}
    >
      <img
        src={coverUrl}
        alt={title}
        className="h-20 w-14 shrink-0 rounded-xl object-cover shadow-card"
        loading="lazy"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{author}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Читаю</span>
          <span className="text-xs font-medium text-foreground">● {Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  );
};

export default ContinueCard;
