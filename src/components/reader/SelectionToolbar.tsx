import { Quote } from "lucide-react";

interface Props {
  rect: DOMRect;
  onQuote: () => void;
}

const BTN_H = 40;
const BTN_W = 120;

export default function SelectionToolbar({ rect, onQuote }: Props) {
  const above = rect.top > BTN_H + 12;
  const top = above ? rect.top - BTN_H - 8 : rect.bottom + 8;
  const left = Math.max(8, Math.min(
    rect.left + rect.width / 2 - BTN_W / 2,
    window.innerWidth - BTN_W - 8,
  ));

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left }}
      data-highlight-menu
    >
      <button
        onClick={onQuote}
        className="flex items-center gap-2 rounded-xl border border-border/40 bg-card px-4 py-2 shadow-xl backdrop-blur-xl transition-colors active:bg-secondary"
        style={{ width: BTN_W, height: BTN_H }}
      >
        <Quote size={16} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">Цитата</span>
      </button>
    </div>
  );
}
