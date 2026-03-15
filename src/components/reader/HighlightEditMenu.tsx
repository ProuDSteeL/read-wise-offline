import { useState } from "react";
import { MessageSquare, Trash2, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HIGHLIGHT_COLORS = [
  { key: "yellow", bg: "bg-yellow-200/60", border: "border-yellow-400", ring: "ring-yellow-400" },
  { key: "green", bg: "bg-emerald-200/60", border: "border-emerald-400", ring: "ring-emerald-400" },
  { key: "blue", bg: "bg-blue-200/60", border: "border-blue-400", ring: "ring-blue-400" },
  { key: "pink", bg: "bg-pink-200/60", border: "border-pink-400", ring: "ring-pink-400" },
  { key: "purple", bg: "bg-violet-200/60", border: "border-violet-400", ring: "ring-violet-400" },
];

interface Props {
  highlight: { id: string; text: string; note: string | null; color?: string };
  menuPos: { top: number; left: number };
  onColorChange: (color: string) => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
  onNoteSave: (note: string) => void;
}

export default function HighlightEditMenu({
  highlight,
  menuPos,
  onColorChange,
  onCopy,
  onShare,
  onDelete,
  onNoteSave,
}: Props) {
  const [showNote, setShowNote] = useState(false);
  const [noteValue, setNoteValue] = useState(highlight.note || "");

  return (
    <div
      className="fixed z-50"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <div
        className="w-[260px] animate-fade-in rounded-2xl border border-border/60 bg-card shadow-elevated overflow-hidden"
        data-highlight-menu
      >
        {/* Color picker */}
        <div className="flex justify-center gap-2.5 px-4 pt-3 pb-2">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => onColorChange(c.key)}
              className={`h-7 w-7 rounded-full ${c.bg} border-2 transition-all ${
                (highlight.color || "yellow") === c.key
                  ? `${c.border} scale-110 ring-2 ${c.ring} ring-offset-1`
                  : "border-transparent"
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 border-t border-border/40">
          <button
            onClick={onCopy}
            className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span className="text-[10px] font-medium">Копировать</span>
          </button>
          <button
            onClick={() => setShowNote(true)}
            className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">Заметка</span>
          </button>
          <button
            onClick={onShare}
            className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
          >
            <Share2 className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">Поделиться</span>
          </button>
          <button
            onClick={onDelete}
            className="flex flex-col items-center gap-1 py-3 text-destructive hover:bg-secondary/60 tap-highlight transition-colors"
          >
            <Trash2 className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">Удалить</span>
          </button>
        </div>

        {/* Note input (expandable) */}
        {showNote && (
          <div className="border-t border-border/40 p-3 space-y-2">
            <Input
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Добавить заметку..."
              className="h-9 rounded-xl bg-secondary border-0 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex-1 text-xs rounded-xl"
                onClick={() => { setShowNote(false); setNoteValue(highlight.note || ""); }}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                className="h-8 flex-1 rounded-xl text-xs"
                onClick={() => { onNoteSave(noteValue); setShowNote(false); }}
              >
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
