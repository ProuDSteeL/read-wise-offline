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
        "flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl bg-primary p-5 text-primary-foreground",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wider opacity-70">
        Идея {index}
      </span>
      <h4 className="text-base font-semibold leading-snug">{title}</h4>
      <p className="text-sm leading-relaxed opacity-90">{content}</p>
    </div>
  );
};

export default KeyIdeaCard;
