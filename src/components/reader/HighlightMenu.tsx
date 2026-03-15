import { useState, type Dispatch, type ReactNode } from "react";
import {
  Copy,
  Bookmark,
  Languages,
  MoreHorizontal,
  ArrowLeft,
  MessageSquare,
  Globe,
  Share2,
  Trash2,
} from "lucide-react";
import { HIGHLIGHT_COLORS, getColor } from "@/lib/highlightColors";
import type { SelectionState, SelectionAction } from "@/hooks/useTextSelection";

interface Props {
  state: SelectionState;
  dispatch: Dispatch<SelectionAction>;
  onSaveNew: () => void;
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

function Divider() {
  return <div className="h-px bg-border/40" />;
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
  const text = state.phase === "selected" || state.phase === "selected-more" || state.phase === "saving"
    ? state.text
    : state.highlight.text;

  // Sync note value when entering editing-note
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

    // ── Selected: primary toolbar ──
    if (state.phase === "selected") {
      return (
        <div className="grid grid-cols-4">
          <ToolbarBtn icon={<Copy size={20} />} label="Копировать" onClick={() => { onCopy(text); dispatch({ type: "DISMISS" }); }} />
          <ToolbarBtn
            icon={<Bookmark size={20} />}
            label="Цитата"
            onClick={onSaveNew}
            accent
          />
          <ToolbarBtn
            icon={<Languages size={20} />}
            label="Перевод"
            onClick={() => {
              window.open(`https://translate.google.com/?sl=auto&tl=ru&text=${encodeURIComponent(text)}`, "_blank");
              dispatch({ type: "DISMISS" });
            }}
          />
          <ToolbarBtn icon={<MoreHorizontal size={20} />} label="Ещё" onClick={() => dispatch({ type: "SHOW_MORE" })} />
        </div>
      );
    }

    // ── Selected-more: submenu ──
    if (state.phase === "selected-more") {
      return (
        <div>
          <button
            onClick={() => dispatch({ type: "SHOW_BACK" })}
            className="flex w-full items-center gap-2 px-4 py-3.5 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <Divider />
          <SubMenuItem
            label="ЗАМЕТКА"
            onClick={() => {
              onSaveNew();
            }}
          />
          <Divider />
          <SubMenuItem
            label="ВЕБ ПОИСК"
            onClick={() => {
              window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, "_blank");
              dispatch({ type: "DISMISS" });
            }}
          />
          <Divider />
          <SubMenuItem
            label="ПОДЕЛИТЬСЯ"
            onClick={() => { onShare(text); dispatch({ type: "DISMISS" }); }}
          />
        </div>
      );
    }

    // ── Editing: edit toolbar ──
    if (state.phase === "editing") {
      const currentColor = state.highlight.color ?? "yellow";
      return (
        <>
          {/* Color picker row */}
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => onColorChange(c.key)}
                className={`h-7 w-7 rounded-full border-2 transition-all duration-150 ${
                  currentColor === c.key
                    ? `border-white/80 scale-125 ring-2 ${c.ring} ring-offset-2`
                    : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <Divider />
          {/* Action buttons */}
          <div className="grid grid-cols-4">
            <ToolbarBtn icon={<Copy size={20} />} label="Копировать" onClick={() => { onCopy(state.highlight.text); dispatch({ type: "DISMISS" }); }} />
            <ToolbarBtn icon={<MessageSquare size={20} />} label="Заметка" onClick={() => {
              setNoteValue(state.highlight.note ?? "");
              dispatch({ type: "OPEN_NOTE" });
            }} />
            <ToolbarBtn icon={<Share2 size={20} />} label="Поделиться" onClick={() => { onShare(state.highlight.text); dispatch({ type: "DISMISS" }); }} />
            <ToolbarBtn icon={<Trash2 size={20} />} label="Удалить" onClick={onDelete} danger />
          </div>
        </>
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
                // Move cursor to end
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
              onClick={() => {
                onNoteSave(noteValue);
              }}
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

  // For editing-note, use a wider menu
  const isNoteEditor = state.phase === "editing-note";
  const menuWidth = isNoteEditor ? 300 : 280;

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

function ToolbarBtn({
  icon,
  label,
  onClick,
  accent,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3.5 px-1 transition-colors hover:bg-secondary/60 tap-highlight ${
        danger ? "text-destructive" : accent ? "text-primary" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">{label}</span>
    </button>
  );
}

function SubMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-3.5 text-left text-[13px] font-bold tracking-widest text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
    >
      {label}
    </button>
  );
}
