import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCardProps {
  title: string;
  author: string;
  coverUrl: string;
  readTimeMin?: number;
  progress?: number;
  className?: string;
  onClick?: () => void;
}

const BookCard = ({
  title,
  author,
  coverUrl,
  readTimeMin,
  progress,
  className,
  onClick,
}: BookCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-[140px] shrink-0 flex-col items-start gap-2.5 text-left tap-highlight",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted shadow-card transition-shadow duration-300 group-hover:shadow-elevated">
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* Subtle bottom gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
        {typeof progress === "number" && progress > 0 && progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10">
            <div
              className="h-full rounded-full gradient-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="w-full space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-[11px] text-muted-foreground">{author}</p>
        {readTimeMin != null && readTimeMin > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            <span>{readTimeMin} мин</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default BookCard;
