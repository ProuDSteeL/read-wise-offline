import React, { useState, useEffect } from "react";
import {
  Copy,
  StickyNote,
  Languages,
  MoreVertical,
  ArrowLeft,
  Search,
  Share2,
  Settings,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { HIGHLIGHT_COLORS } from "@/lib/highlightColors";

interface HighlightInfo {
  id: string;
  text: string;
  color?: string;
  note: string | null;
}

interface Props {
  /** Position of the tap — menu bottom edge sits above this point */
  tapY: number;
  tapX: number;
  highlight: HighlightInfo;
  onChangeColor: (id: string, color: string) => void;
  onRemoveHighlight: (id: string) => void;
  onNote: (highlight: HighlightInfo) => void;
  onClose: () => void;
}

/* ── Level 1 action buttons ── */
const L1_ITEMS = [
  { id: "copy", label: "Копировать", Icon: Copy },
  { id: "note", label: "Заметка", Icon: StickyNote },
  { id: "translate", label: "Перевод", Icon: Languages },
  { id: "more", label: "Ещё", Icon: MoreVertical },
] as const;

/* ── Level 2 items ── */
const L2_ITEMS = [
  { id: "search", label: "ВЕБ ПОИСК", Icon: Search },
  { id: "share", label: "ПОДЕЛИТЬСЯ", Icon: Share2 },
  { id: "settings", label: "НАСТРОИТЬ", Icon: Settings },
  { id: "delete", label: "УДАЛИТЬ", Icon: Trash2 },
] as const;

const MENU_W = 260;
const COLOR_ROW_H = 48;
const ACTION_ROW_H = 64;
const L2_ROW_H = 44;
const L2_H = L2_ROW_H + L2_ITEMS.length * L2_ROW_H + 1; // back + items + separator

export default function HighlightEditMenu({
  tapY,
  tapX,
  highlight,
  onChangeColor,
  onRemoveHighlight,
  onNote,
  onClose,
}: Props) {
  const [level, setLevel] = useState<1 | 2>(1);

  /* Reset level when highlight changes */
  useEffect(() => setLevel(1), [highlight.id]);

  /* ── Positioning: bottom edge above tap point ── */
  const currentH = level === 1 ? COLOR_ROW_H + ACTION_ROW_H : COLOR_ROW_H + L2_H;
  const fitsAbove = tapY > currentH + 16;
  const top = fitsAbove ? tapY - currentH - 8 : tapY + 8;
  const left = Math.max(8, Math.min(
    tapX - MENU_W / 2,
    window.innerWidth - MENU_W - 8,
  ));

  /* ── Handlers ── */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(highlight.text);
      toast({ title: "Скопировано" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
    onClose();
  }

  function handleL1(id: string) {
    switch (id) {
      case "copy":
        handleCopy();
        break;
      case "note":
        onNote(highlight);
        onClose();
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
      case "search":
        toast({ title: "Веб-поиск скоро появится" });
        break;
      case "share":
        if (navigator.share) {
          navigator.share({ text: `«${highlight.text}»` }).catch(() => {});
        } else {
          navigator.clipboard.writeText(`«${highlight.text}»`).then(
            () => toast({ title: "Скопировано для отправки" }),
          ).catch(() => {});
        }
        onClose();
        break;
      case "settings":
        toast({ title: "Настройки скоро появятся" });
        break;
      case "delete":
        onRemoveHighlight(highlight.id);
        onClose();
        break;
    }
  }

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left, width: MENU_W }}
      data-highlight-menu
    >
      <div
        className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xl backdrop-blur-xl"
        style={{
          height: currentH,
          transition: "height 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* ── Color row (always visible) ── */}
        <div
          className="flex items-center justify-center gap-3 px-4"
          style={{ height: COLOR_ROW_H }}
        >
          {HIGHLIGHT_COLORS.map((c) => {
            const isActive = highlight.color === c.key || (!highlight.color && c.key === "yellow");
            return (
              <button
                key={c.key}
                onClick={() => onChangeColor(highlight.id, c.key)}
                className="relative h-7 w-7 rounded-full border-2 transition-transform active:scale-90"
                style={{
                  backgroundColor: c.hex,
                  borderColor: isActive ? "var(--foreground)" : "transparent",
                }}
              >
                {isActive && (
                  <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow-sm" />
                )}
              </button>
            );
          })}
          {/* Remove highlight */}
          <button
            onClick={() => {
              onRemoveHighlight(highlight.id);
              onClose();
            }}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-border/60 bg-muted transition-transform active:scale-90"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mx-3 h-px bg-border/30" />

        {/* ── Level 1: action buttons ── */}
        <div
          className="flex items-stretch"
          style={{
            height: ACTION_ROW_H,
            opacity: level === 1 ? 1 : 0,
            transform: level === 1 ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            pointerEvents: level === 1 ? "auto" : "none",
            position: level === 1 ? "relative" : "absolute",
            width: "100%",
          }}
        >
          {L1_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleL1(id)}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors active:bg-secondary"
            >
              <Icon size={18} className="text-foreground/80 shrink-0" />
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
            top: level === 2 ? undefined : COLOR_ROW_H + 1,
            width: "100%",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => setLevel(1)}
            className="flex w-full items-center gap-3 px-4 transition-colors active:bg-secondary"
            style={{ height: L2_ROW_H }}
          >
            <ArrowLeft size={18} className="text-foreground/80" />
            <span className="text-xs font-semibold text-foreground/60 tracking-wide">НАЗАД</span>
          </button>

          <div className="mx-3 h-px bg-border/40" />

          {L2_ITEMS.map(({ id, label, Icon }, i) => (
            <React.Fragment key={id}>
              {id === "delete" && <div className="mx-3 h-px bg-border/40" />}
              <button
                onClick={() => handleL2(id)}
                className={`flex w-full items-center gap-3 px-4 transition-colors active:bg-secondary ${
                  id === "delete" ? "text-destructive" : ""
                }`}
                style={{ height: L2_ROW_H }}
              >
                <Icon size={18} className={`shrink-0 ${id === "delete" ? "text-destructive" : "text-foreground/80"}`} />
                <span className={`text-xs font-semibold tracking-wide ${id === "delete" ? "text-destructive" : "text-foreground/80"}`}>
                  {label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
