import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

const SectionHeader = ({ title, subtitle, onSeeAll }: SectionHeaderProps) => (
  <div className="flex items-end justify-between px-4">
    <div>
      <h2 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="flex items-center gap-0.5 text-xs font-medium text-primary tap-highlight"
      >
        Все <ChevronRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

export default SectionHeader;
