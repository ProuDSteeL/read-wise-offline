import { useState, type Dispatch, type ReactNode } from "react";
import {
  Copy,
  Globe,
  Share2,
  ArrowLeft,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { HIGHLIGHT_COLORS, getColor } from "@/lib/highlightColors";
import type { SelectionState, SelectionAction } from "@/hooks/useTextSelection";

interface Props {
  state: SelectionState;
  dispatch: Dispatch<SelectionAction>;
  onSaveNew: (color: string) => void;
  onColorChange: (color: string) => void;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onDelete: () => void;
  onNoteSave: (note: string) => void;
}

// Caret arrow SVG — points up (toward selection above) or down (toward selection below)
function Caret({ arrowBelow }: { arrowBelow: boolean }) {
  return arrowBelow ? (
    // Arrow points UP — card is below the selection
    <svg
      width="20"
      height="10"
      viewBox="0 0 20 10"
      className="absolute -top-[9px] left-1/2 -translate-x-1/2 drop-shadow-[0_-1px_1px_rgba(0,0,0,0.08)]"
    >
      <polygon points="0,10 10,0 20,10" className="fill-card" />
    </svg>
  ) : (
    // Arrow points DOWN — card is above the selection
    <svg
      width="20"
      height="10"
      viewBox="0 0 20 10"
      className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
    >
      <polygon points="0,0 10,10 20,0" className="fill-card" />
    </svg>
  );
}

export default function HighlightMenu({
  state,
  dispatch,
  onSaveNew,
  onColorChange,
  onCopy,
  onShare,
  onDelete,
  onNoteSave,
}: Props) {
  const [noteValue, setNoteValue] = useState<string>("");

  if (state.phase === "idle") return null;

  const menuPos = state.menuPos;
  const text = state.phase === "selected" || state.phase === "saving"
    ? state.text
    : state.highlight.text;

  const currentNote = (state.phase === "editing" || state.phase === "editing-note")
    ? state.highlight.note ?? ""
    : "";

  const renderContent = () => {
    // ── Saving ──
    if (state.phase === "saving") {
      return (
        <div className="flex h-14 items-center justify-center gap-2.5 px-5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Сохраняю...</span>
        </div>
      );
    }

    // ── Selected: color swatches + quick actions ──
    if (state.phase === "selected") {
      return (
        <div className="flex items-center px-1 py-2">
          {/* Color swatches */}
          <div className="flex items-center gap-1.5 px-2.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => onSaveNew(c.key)}
                className="h-7 w-7 rounded-full border-2 border-transparent transition-transform duration-150 hover:scale-110 active:scale-95"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          {/* Vertical divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-border/50" />
          {/* Quick actions */}
          <div className="flex items-center">
            <ActionBtn
              icon={<Copy size={18} />}
              label="Копировать"
              onClick={() => { onCopy(text); dispatch({ type: "DISMISS" }); }}
            />
            <ActionBtn
              icon={<Globe size={18} />}
              label="Поиск"
              onClick={() => {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, "_blank");
                dispatch({ type: "DISMISS" });
              }}
            />
            <ActionBtn
              icon={<Share2 size={18} />}
              label="Поделиться"
              onClick={() => { onShare(text); dispatch({ type: "DISMISS" }); }}
            />
          </div>
        </div>
      );
    }

    // ── Editing: color swatches (with active) + edit actions ──
    if (state.phase === "editing") {
      const currentColor = state.highlight.color ?? "yellow";
      const activeColor = getColor(currentColor);
      return (
        <div className="flex items-center px-1 py-2">
          {/* Color swatches with active indicator */}
          <div className="flex items-center gap-1.5 px-2.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => onColorChange(c.key)}
                className={`h-7 w-7 rounded-full border-2 transition-all duration-150 ${
                  currentColor === c.key
                    ? "border-white/80 scale-125"
                    : "border-transparent hover:scale-110 active:scale-95"
                }`}
                style={{
                  backgroundColor: c.hex,
                  boxShadow: currentColor === c.key ? `0 0 0 2.5px ${activeColor.hex}` : undefined,
                }}
              />
            ))}
          </div>
          {/* Vertical divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-border/50" />
          {/* Edit actions */}
          <div className="flex items-center">
            <ActionBtn
              icon={<Copy size={18} />}
              label="Копировать"
              onClick={() => { onCopy(state.highlight.text); dispatch({ type: "DISMISS" }); }}
            />
            <ActionBtn
              icon={<MessageSquare size={18} />}
              label="Заметка"
              onClick={() => {
                setNoteValue(state.highlight.note ?? "");
                dispatch({ type: "OPEN_NOTE" });
              }}
            />
            <ActionBtn
              icon={<Share2 size={18} />}
              label="Поделиться"
              onClick={() => { onShare(state.highlight.text); dispatch({ type: "DISMISS" }); }}
            />
            <ActionBtn
              icon={<Trash2 size={18} />}
              label="Удалить"
              onClick={onDelete}
              danger
            />
          </div>
        </div>
      );
    }

    // ── Editing-note: note editor ──
    if (state.phase === "editing-note") {
      return (
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
            <button
              onClick={() => {
                setNoteValue(currentNote);
                dispatch({ type: "SHOW_BACK" });
              }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-foreground">Заметка</span>
          </div>
          {/* Textarea */}
          <div className="p-3">
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Добавить заметку..."
              className="w-full min-h-[80px] resize-none rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus
              onFocus={(e) => {
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-2 border-t border-border/40 p-3">
            <button
              onClick={() => {
                setNoteValue(currentNote);
                dispatch({ type: "SHOW_BACK" });
              }}
              className="flex-1 rounded-xl py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => onNoteSave(noteValue)}
              className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Сохранить
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const isNoteEditor = state.phase === "editing-note";
  const menuWidth = isNoteEditor ? 300 : 310;

  return (
    <div
      className="fixed z-50"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <div
        className="relative"
        style={{ width: menuWidth }}
        data-highlight-menu
      >
        <Caret arrowBelow={menuPos.arrowBelow} />
        <div className="animate-menu-enter overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ActionBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors hover:bg-secondary/60 tap-highlight ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[9px] font-semibold uppercase tracking-wide leading-none text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
