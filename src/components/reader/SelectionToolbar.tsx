import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Copy,
  MessageSquare,
  Share2,
  Globe,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { HIGHLIGHT_COLORS, getColor } from "@/lib/highlightColors";

interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

interface HighlightData {
  id: string;
  text: string;
  note: string | null;
  color?: string;
}

type ToolbarMode =
  | { type: "new-selection"; selection: SelectionInfo }
  | { type: "edit-highlight"; highlight: HighlightData; rect: DOMRect }
  | { type: "note-editor"; highlight: HighlightData; rect: DOMRect };

interface Props {
  mode: ToolbarMode;
  onSaveNew: (color: string) => void;
  onColorChange: (color: string) => void;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onDelete: () => void;
  onNoteSave: (note: string) => void;
  onDismiss: () => void;
}

const TOOLBAR_H = 64;
const TOOLBAR_W = 320;

function computePos(rect: DOMRect) {
  const above = rect.top > TOOLBAR_H + 16;
  return {
    top: above ? rect.top - TOOLBAR_H - 10 : rect.bottom + 10,
    left: Math.max(8, Math.min(
      rect.left + rect.width / 2 - TOOLBAR_W / 2,
      window.innerWidth - TOOLBAR_W - 8,
    )),
    arrowBelow: !above,
  };
}

export default function SelectionToolbar({
  mode,
  onSaveNew,
  onColorChange,
  onCopy,
  onShare,
  onDelete,
  onNoteSave,
  onDismiss,
}: Props) {
  const [noteValue, setNoteValue] = useState("");
  const prevHighlightId = useRef<string | null>(null);

  // Reset note value when switching to a new highlight's note editor
  useEffect(() => {
    if (mode.type === "note-editor") {
      if (prevHighlightId.current !== mode.highlight.id) {
        setNoteValue(mode.highlight.note ?? "");
      }
      prevHighlightId.current = mode.highlight.id;
    } else {
      prevHighlightId.current = null;
    }
  }, [mode]);

  const rect = mode.type === "new-selection" ? mode.selection.rect : mode.rect;
  const pos = computePos(rect);
  const text =
    mode.type === "new-selection" ? mode.selection.text : mode.highlight.text;

  const isNoteEditor = mode.type === "note-editor";
  const width = isNoteEditor ? 300 : TOOLBAR_W;

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: pos.top, left: pos.left }}
      data-highlight-menu
    >
      <div className="relative" style={{ width }}>
        {/* Caret arrow */}
        {pos.arrowBelow ? (
          <svg
            width="16"
            height="8"
            viewBox="0 0 16 8"
            className="absolute -top-[7px] left-1/2 -translate-x-1/2"
          >
            <polygon points="0,8 8,0 16,8" className="fill-card" />
          </svg>
        ) : (
          <svg
            width="16"
            height="8"
            viewBox="0 0 16 8"
            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2"
          >
            <polygon points="0,0 8,8 16,0" className="fill-card" />
          </svg>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xl backdrop-blur-xl">
          {/* ── New selection ── */}
          {mode.type === "new-selection" && (
            <div className="flex items-center gap-0.5 px-2 py-2.5">
              {/* Color swatches */}
              <div className="flex items-center gap-1.5 px-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => onSaveNew(c.key)}
                    className="h-7 w-7 rounded-full border-2 border-transparent transition-transform duration-100 active:scale-90"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <div className="mx-1 h-6 w-px shrink-0 bg-border/40" />
              <ActionBtn icon={<Copy size={18} />} label="Копировать" onClick={() => { onCopy(text); onDismiss(); }} />
              <ActionBtn
                icon={<Globe size={18} />}
                label="Поиск"
                onClick={() => {
                  window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(text)}`,
                    "_blank",
                  );
                  onDismiss();
                }}
              />
              <ActionBtn icon={<Share2 size={18} />} label="Поделиться" onClick={() => { onShare(text); onDismiss(); }} />
            </div>
          )}

          {/* ── Edit existing highlight ── */}
          {mode.type === "edit-highlight" && (
            <div className="flex items-center gap-0.5 px-2 py-2.5">
              <div className="flex items-center gap-1.5 px-1.5">
                {HIGHLIGHT_COLORS.map((c) => {
                  const isActive = (mode.highlight.color ?? "yellow") === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => onColorChange(c.key)}
                      className={`h-7 w-7 rounded-full border-2 transition-all duration-100 ${
                        isActive
                          ? "scale-110 border-foreground/30"
                          : "border-transparent active:scale-90"
                      }`}
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: isActive
                          ? `0 0 0 2px ${c.hex}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
              <div className="mx-1 h-6 w-px shrink-0 bg-border/40" />
              <ActionBtn icon={<Copy size={18} />} label="Копировать" onClick={() => { onCopy(text); onDismiss(); }} />
              <ActionBtn
                icon={<MessageSquare size={18} />}
                label="Заметка"
                onClick={() => {
                  setNoteValue(mode.highlight.note ?? "");
                  // Parent should switch to note-editor mode
                  onNoteOpen?.();
                }}
              />
              <ActionBtn icon={<Share2 size={18} />} label="Поделиться" onClick={() => { onShare(text); onDismiss(); }} />
              <ActionBtn icon={<Trash2 size={18} />} label="Удалить" onClick={onDelete} danger />
            </div>
          )}

          {/* ── Note editor ── */}
          {mode.type === "note-editor" && (
            <div>
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2.5">
                <button
                  onClick={onDismiss}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-foreground">Заметка</span>
              </div>
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
              <div className="flex gap-2 border-t border-border/30 p-3">
                <button
                  onClick={onDismiss}
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
          )}
        </div>
      </div>
    </div>
  );
}

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
      className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors active:bg-secondary/80 ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      {icon}
      <span className="text-[8px] font-semibold uppercase tracking-wide leading-none text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
