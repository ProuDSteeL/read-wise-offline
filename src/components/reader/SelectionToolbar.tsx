import { Copy, Quote } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  rect: DOMRect;
  text: string;
  onQuote: () => void;
}

const BTN_H = 40;
const BTN_W = 240;

export default function SelectionToolbar({ rect, text, onQuote }: Props) {
  const above = rect.top > BTN_H + 12;
  const top = above ? rect.top - BTN_H - 8 : rect.bottom + 8;
  const left = Math.max(8, Math.min(
    rect.left + rect.width / 2 - BTN_W / 2,
    window.innerWidth - BTN_W - 8,
  ));

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Скопировано" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  }

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left }}
      data-highlight-menu
    >
      <div
        className="flex items-center rounded-xl border border-border/40 bg-card shadow-xl backdrop-blur-xl"
        style={{ width: BTN_W, height: BTN_H }}
      >
        <button
          onClick={onQuote}
          className="flex flex-1 items-center justify-center gap-2 py-2 transition-colors active:bg-secondary rounded-l-xl h-full"
        >
          <Quote size={16} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Цитата</span>
        </button>
        <div className="w-px h-5 bg-border/40" />
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 py-2 transition-colors active:bg-secondary rounded-r-xl h-full"
        >
          <Copy size={16} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Копировать</span>
        </button>
      </div>
    </div>
  );
}
