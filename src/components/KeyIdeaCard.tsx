import { cn } from "@/lib/utils";

interface KeyIdeaCardProps {
  index: number;
  title: string;
  content: string;
  className?: string;
}

const KeyIdeaCard = ({ index, title, content, className }: KeyIdeaCardProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl bg-card p-5 shadow-card border-l-4 border-primary",
        className
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index}
      </span>
      <h4 className="text-base font-semibold leading-snug text-foreground">{title}</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
    </div>
  );
};

export default KeyIdeaCard;
