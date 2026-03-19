import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Circle,
  Languages,
  MoreVertical,
  ArrowLeft,
  StickyNote,
  Search,
  Share2,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  rect: DOMRect;
  text: string;
  onQuote: () => void;
}

/* ── Level 1 buttons ── */
const L1_ITEMS = [
  { id: "copy", label: "Копировать", Icon: Copy },
  { id: "quote", label: "Цитата", Icon: Circle },
  { id: "translate", label: "Перевод", Icon: Languages },
  { id: "more", label: "Ещё", Icon: MoreVertical },
] as const;

/* ── Level 2 items ── */
const L2_ITEMS = [
  { id: "note", label: "ЗАМЕТКА", Icon: StickyNote },
  { id: "search", label: "ВЕБ ПОИСК", Icon: Search },
  { id: "share", label: "ПОДЕЛИТЬСЯ", Icon: Share2 },
  { id: "settings", label: "НАСТРОИТЬ", Icon: Settings },
] as const;

const TOOLBAR_W = 260;
const L1_H = 64;
const L2_ROW = 44;
const L2_H = L2_ROW + L2_ITEMS.length * L2_ROW; // back row + items

export default function SelectionToolbar({ rect, text, onQuote }: Props) {
  const [level, setLevel] = useState<1 | 2>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Reset level when selection changes */
  useEffect(() => setLevel(1), [rect]);

  /* ── Positioning ── */
  const currentH = level === 1 ? L1_H : L2_H;
  const above = rect.top > currentH + 16;
  const top = above ? rect.top - currentH - 8 : rect.bottom + 8;
  const left = Math.max(8, Math.min(
    rect.left + rect.width / 2 - TOOLBAR_W / 2,
    window.innerWidth - TOOLBAR_W - 8,
  ));

  /* ── Handlers ── */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Скопировано" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  }

  function handleL1(id: string) {
    switch (id) {
      case "copy":
        handleCopy();
        break;
      case "quote":
        onQuote();
        break;
      case "translate":
        toast({ title: "Перевод пока недоступен" });
        break;
      case "more":
        setLevel(2);
        break;
    }
  }

  function handleL2(id: string) {
    switch (id) {
      case "note":
        toast({ title: "Заметки скоро появятся" });
        break;
      case "search":
        toast({ title: "Веб-поиск скоро появится" });
        break;
      case "share":
        toast({ title: "Поделиться скоро появится" });
        break;
      case "settings":
        toast({ title: "Настройки скоро появятся" });
        break;
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left, width: TOOLBAR_W }}
      data-highlight-menu
    >
      <div
        className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xl backdrop-blur-xl"
        style={{
          height: currentH,
          transition: "height 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* ── Level 1: horizontal toolbar ── */}
        <div
          className="flex items-stretch"
          style={{
            height: L1_H,
            opacity: level === 1 ? 1 : 0,
            transform: level === 1 ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: level === 1 ? "auto" : "none",
            position: level === 1 ? "relative" : "absolute",
            width: "100%",
          }}
        >
          {L1_ITEMS.map(({ id, label, Icon }, i) => (
            <button
              key={id}
              onClick={() => handleL1(id)}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors active:bg-secondary"
              style={{
                borderTopLeftRadius: i === 0 ? 16 : 0,
                borderBottomLeftRadius: i === 0 ? 16 : 0,
                borderTopRightRadius: i === L1_ITEMS.length - 1 ? 16 : 0,
                borderBottomRightRadius: i === L1_ITEMS.length - 1 ? 16 : 0,
              }}
            >
              {id === "quote" ? (
                <Circle size={18} className="text-amber-500 fill-amber-500 shrink-0" />
              ) : (
                <Icon size={18} className="text-foreground/80 shrink-0" />
              )}
              <span className="text-[10px] font-medium text-foreground/60 leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Level 2: vertical list ── */}
        <div
          style={{
            opacity: level === 2 ? 1 : 0,
            transform: level === 2 ? "translateX(0)" : "translateX(20px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: level === 2 ? "auto" : "none",
            position: level === 2 ? "relative" : "absolute",
            top: level === 2 ? undefined : 0,
            width: "100%",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => setLevel(1)}
            className="flex w-full items-center gap-3 px-4 transition-colors active:bg-secondary"
            style={{ height: L2_ROW }}
          >
            <ArrowLeft size={18} className="text-foreground/80" />
            <span className="text-xs font-semibold text-foreground/60 tracking-wide">НАЗАД</span>
          </button>

          <div className="mx-3 h-px bg-border/40" />

          {/* Menu items */}
          {L2_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleL2(id)}
              className="flex w-full items-center gap-3 px-4 transition-colors active:bg-secondary"
              style={{ height: L2_ROW }}
            >
              <Icon size={18} className="text-foreground/80 shrink-0" />
              <span className="text-xs font-semibold text-foreground/80 tracking-wide">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
