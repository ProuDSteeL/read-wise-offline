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
        "flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl gradient-primary p-5 text-primary-foreground shadow-elevated",
        className
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
        {index}
      </span>
      <h4 className="text-base font-semibold leading-snug">{title}</h4>
      <p className="text-sm leading-relaxed opacity-85">{content}</p>
    </div>
  );
};

export default KeyIdeaCard;
