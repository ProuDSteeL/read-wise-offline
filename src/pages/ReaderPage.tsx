import React, { useState, useEffect, useRef, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Settings2, Heart, Highlighter, MessageSquare, Pencil, Trash2, Share2, Headphones } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { useBook } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type ReaderTheme = "light" | "dark" | "sepia";
type ReaderFont = "sans" | "serif";

const FONT_SIZES = [14, 16, 18, 20, 22, 24];
const HIGHLIGHT_COLORS = [
  { key: "yellow", bg: "bg-yellow-200/60", border: "border-yellow-400", ring: "ring-yellow-400" },
  { key: "green", bg: "bg-emerald-200/60", border: "border-emerald-400", ring: "ring-emerald-400" },
  { key: "blue", bg: "bg-blue-200/60", border: "border-blue-400", ring: "ring-blue-400" },
  { key: "pink", bg: "bg-pink-200/60", border: "border-pink-400", ring: "ring-pink-400" },
  { key: "purple", bg: "bg-violet-200/60", border: "border-violet-400", ring: "ring-violet-400" },
];

const themeClasses: Record<ReaderTheme, string> = { light: "", dark: "dark", sepia: "sepia" };

// Highlight text segments within a string
function applyHighlights(text: string, highlights: Array<{ id: string; text: string; note: string | null; color?: string }>): ReactNode[] {
  if (!highlights.length) return [text];

  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Sort highlights by position in text (first occurrence)
  const sorted = highlights
    .map((h) => ({ ...h, idx: remaining.indexOf(h.text) }))
    .filter((h) => h.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  let offset = 0;
  for (const hl of sorted) {
    const pos = text.indexOf(hl.text, offset);
    if (pos === -1) continue;

    if (pos > offset) {
      parts.push(text.slice(offset, pos));
    }

    const colorKey = hl.color || "yellow";
    const color = HIGHLIGHT_COLORS.find((c) => c.key === colorKey) || HIGHLIGHT_COLORS[0];

    parts.push(
      <mark
        key={`hl-${keyIdx++}`}
        className={`${color.bg} rounded-sm px-0.5`}
        data-highlight-id={hl.id}
      >
        {hl.text}
      </mark>
    );

    offset = pos + hl.text.length;
  }

  if (offset < text.length) {
    parts.push(text.slice(offset));
  }

  return parts.length ? parts : [text];
}

// Recursively process React children to highlight text nodes
function highlightChildren(
  children: ReactNode,
  highlights: Array<{ id: string; text: string; note: string | null; color?: string }>,
): ReactNode {
  if (!highlights.length) return children;

  if (typeof children === "string") {
    return <>{applyHighlights(children, highlights)}</>;
  }

  if (Array.isArray(children)) {
    return <>{children.map((child, i) => {
      if (typeof child === "string") {
        return <React.Fragment key={i}>{applyHighlights(child, highlights)}</React.Fragment>;
      }
      return child;
    })}</>;
  }

  return children;
}

interface HighlightData {
  id: string;
  text: string;
  note: string | null;
  color?: string;
}

const ReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<ReaderTheme>(() =>
    (localStorage.getItem("reader-theme") as ReaderTheme) || "light"
  );
  const [fontFamily, setFontFamily] = useState<ReaderFont>(() =>
    (localStorage.getItem("reader-font") as ReaderFont) || "serif"
  );
  const [fontSize, setFontSize] = useState(() =>
    parseInt(localStorage.getItem("reader-font-size") || "18")
  );
  const [showSettings, setShowSettings] = useState(false);

  // New selection state
  const [selectedText, setSelectedText] = useState("");
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [highlightNote, setHighlightNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedColor, setSelectedColor] = useState("yellow");

  // Existing highlight editing
  const [editingHighlight, setEditingHighlight] = useState<HighlightData | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editMenuPos, setEditMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Favorite
  const { data: isFavorite } = useQuery({
    queryKey: ["is_favorite", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_shelves").select("id")
        .eq("user_id", user!.id).eq("book_id", id!).eq("shelf", "favorite")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Highlights
  const { data: highlights = [] } = useQuery({
    queryKey: ["highlights", user?.id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_highlights")
        .select("*")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as HighlightData[];
    },
    enabled: !!user && !!id,
  });

  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
    localStorage.setItem("reader-font", fontFamily);
    localStorage.setItem("reader-font-size", String(fontSize));
  }, [theme, fontFamily, fontSize]);

  // Text selection — only check on mouseup/touchend so we don't interfere with dragging
  useEffect(() => {
    const checkSelection = () => {
      if (editingHighlight) return;
      // Small delay to let browser finalize selection
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 2 && sel?.rangeCount) {
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          setSelectedText(text);
          setMenuPosition({
            top: rect.bottom + window.scrollY + 8,
            left: Math.max(8, Math.min(rect.left + rect.width / 2 - 110, window.innerWidth - 230)),
          });
          setShowSelectionMenu(true);
        }
      }, 10);
    };

    const clearSelection = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking on menu or mark
      if (target.closest("[data-highlight-menu]") || target.closest("mark")) return;
      if (!window.getSelection()?.toString().trim() && !showNoteInput) {
        setShowSelectionMenu(false);
        setSelectedText("");
        setMenuPosition(null);
      }
    };

    // Handle click on existing highlight marks
    const handleMarkClick = (e: MouseEvent) => {
      const mark = (e.target as HTMLElement).closest("mark[data-highlight-id]");
      if (!mark) return;
      const hlId = mark.getAttribute("data-highlight-id");
      const hl = highlights.find((h) => h.id === hlId);
      if (!hl) return;

      // Only open edit if there's no active text selection
      const sel = window.getSelection();
      if (sel?.toString().trim()) return;

      const rect = mark.getBoundingClientRect();
      setEditMenuPos({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - 110, window.innerWidth - 230)),
      });
      setEditingHighlight(hl);
      setEditNote(hl.note || "");
    };

    const container = contentRef.current;
    document.addEventListener("mouseup", checkSelection);
    document.addEventListener("touchend", checkSelection);
    document.addEventListener("mousedown", clearSelection);
    container?.addEventListener("click", handleMarkClick);

    return () => {
      document.removeEventListener("mouseup", checkSelection);
      document.removeEventListener("touchend", checkSelection);
      document.removeEventListener("mousedown", clearSelection);
      container?.removeEventListener("click", handleMarkClick);
    };
  }, [showNoteInput, editingHighlight, highlights]);

  // Close edit menu on outside click
  useEffect(() => {
    if (!editingHighlight) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-highlight-menu]")) {
        setEditingHighlight(null);
        setEditMenuPos(null);
      }
    };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [editingHighlight]);

  const favMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await supabase.from("user_shelves").delete()
          .eq("user_id", user!.id).eq("book_id", id!).eq("shelf", "favorite");
      } else {
        await supabase.from("user_shelves").insert({ user_id: user!.id, book_id: id!, shelf: "favorite" });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["is_favorite", user?.id, id] });
      const prev = queryClient.getQueryData(["is_favorite", user?.id, id]);
      queryClient.setQueryData(["is_favorite", user?.id, id], !isFavorite);
      return { prev };
    },
    onError: (_e, _v, ctx) => { queryClient.setQueryData(["is_favorite", user?.id, id], ctx?.prev); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["is_favorite", user?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["shelf_counts"] });
    },
  });

  // Create highlight
  const createHighlight = useMutation({
    mutationFn: async ({ text, note, color }: { text: string; note?: string; color: string }) => {
      const { error } = await supabase.from("user_highlights").insert({
        user_id: user!.id, book_id: id!, text, note: note || null, color,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
      toast({ title: "Выделение сохранено" });
      resetSelection();
    },
    onError: (err: any) => { toast({ title: "Ошибка", description: err.message, variant: "destructive" }); },
  });

  // Update highlight note
  const updateHighlight = useMutation({
    mutationFn: async ({ highlightId, note }: { highlightId: string; note: string }) => {
      const { error } = await supabase.from("user_highlights").update({ note: note || null }).eq("id", highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
      toast({ title: "Заметка обновлена" });
      setEditingHighlight(null);
      setEditMenuPos(null);
    },
  });

  // Delete highlight
  const deleteHighlight = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase.from("user_highlights").delete().eq("id", highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
      toast({ title: "Выделение удалено" });
      setEditingHighlight(null);
      setEditMenuPos(null);
    },
  });

  const resetSelection = () => {
    setShowSelectionMenu(false);
    setShowNoteInput(false);
    setHighlightNote("");
    setSelectedText("");
    setSelectedColor("yellow");
    window.getSelection()?.removeAllRanges();
  };

  const handleSaveHighlight = () => {
    if (!user) { navigate("/auth"); return; }
    createHighlight.mutate({ text: selectedText, note: highlightNote || undefined, color: selectedColor });
  };

  const handleShareText = async (text: string) => {
    const shareData = {
      text: `«${text}»\n— ${book?.title}, ${book?.author}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast({ title: "Цитата скопирована" });
      }
    } catch {}
  };

  // Wrapper to inject highlights into markdown text nodes
  const wrapWithHighlights = (children: ReactNode) =>
    highlightChildren(children, highlights);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!summary?.content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-muted-foreground">Саммари пока не добавлено</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    );
  }

  const fontClass = fontFamily === "serif" ? "font-serif" : "font-sans";

  return (
    <div className={`relative min-h-screen ${themeClasses[theme]} bg-background text-foreground transition-colors duration-300`}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="max-w-[50%] truncate text-sm font-semibold text-foreground">{book?.title}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (!user) navigate("/auth"); else favMutation.mutate(); }} className="tap-highlight">
            <Heart className={`h-5 w-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="tap-highlight">
            <Settings2 className={`h-5 w-5 ${showSettings ? "text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="sticky top-[53px] z-10 animate-fade-in border-b bg-card px-4 py-4 shadow-card">
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Тема</p>
            <div className="flex gap-2">
              {([
                { key: "light" as const, label: "Светлая", bg: "bg-white", text: "text-gray-900", border: "border-gray-200" },
                { key: "dark" as const, label: "Тёмная", bg: "bg-gray-900", text: "text-gray-100", border: "border-gray-700" },
                { key: "sepia" as const, label: "Сепия", bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200" },
              ]).map(({ key, label, bg, text, border }) => (
                <button key={key} onClick={() => setTheme(key)}
                  className={`flex-1 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${bg} ${text} ${
                    theme === key ? `${border} ring-2 ring-primary` : `${border} opacity-70`
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Шрифт</p>
            <div className="flex gap-2">
              <button onClick={() => setFontFamily("sans")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-all ${fontFamily === "sans" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
              >Sans</button>
              <button onClick={() => setFontFamily("serif")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-serif transition-all ${fontFamily === "serif" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
              >Serif</button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Размер шрифта</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">A</span>
              <div className="flex flex-1 gap-1">
                {FONT_SIZES.map((size) => (
                  <button key={size} onClick={() => setFontSize(size)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                      fontSize === size ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >{size}</button>
                ))}
              </div>
              <span className="text-base text-muted-foreground">A</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <article
        ref={contentRef}
        className={`mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 mt-8 text-[1.4em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {wrapWithHighlights(children)}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-6 text-[1.2em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {wrapWithHighlights(children)}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-[1.1em] font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {wrapWithHighlights(children)}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-muted-foreground">{wrapWithHighlights(children)}</p>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            li: ({ children }) => (
              <li className="mb-1 text-muted-foreground">{wrapWithHighlights(children)}</li>
            ),
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="my-6 border-border" />,
          }}
        >
          {summary.content}
        </ReactMarkdown>
      </article>

      {/* Highlights list */}
      {highlights.length > 0 && (
        <div className="mx-auto max-w-md border-t px-5 py-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Мои выделения · {highlights.length}</h3>
          <div className="space-y-3">
            {highlights.map((h) => {
              const color = HIGHLIGHT_COLORS.find((c) => c.key === (h.color || "yellow")) || HIGHLIGHT_COLORS[0];
              return (
                <div key={h.id} className="group rounded-xl bg-card p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color.bg}`} />
                    <p className="flex-1 text-sm italic text-muted-foreground">«{h.text}»</p>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingHighlight(h);
                          setEditNote(h.note || "");
                          setEditMenuPos(null); // show inline below the list item
                        }}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteHighlight.mutate(h.id)}
                        className="rounded-lg p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {h.note && <p className="mt-1.5 pl-4 text-xs text-foreground">{h.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New selection popup */}
      {showSelectionMenu && menuPosition && !editingHighlight && (
        <div className="absolute z-50" style={{ top: menuPosition.top, left: menuPosition.left }}>
          <div className="w-[220px] animate-fade-in rounded-2xl border bg-card p-2 shadow-elevated" data-highlight-menu>
            {showNoteInput ? (
              <div className="space-y-2 p-1">
                <Input value={highlightNote} onChange={(e) => setHighlightNote(e.target.value)}
                  placeholder="Заметка..." className="h-8 rounded-lg bg-secondary border-0 text-xs" autoFocus />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs"
                    onClick={() => { setShowNoteInput(false); setHighlightNote(""); }}>✕</Button>
                  <Button size="sm" className="h-7 flex-1 rounded-lg text-xs"
                    onClick={handleSaveHighlight} disabled={createHighlight.isPending}>OK</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Color picker */}
                <div className="flex justify-center gap-2 py-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button key={c.key} onClick={() => setSelectedColor(c.key)}
                      className={`h-6 w-6 rounded-full ${c.bg} border-2 transition-all ${
                        selectedColor === c.key ? `${c.border} scale-110` : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={handleSaveHighlight}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-primary hover:bg-primary/10 tap-highlight">
                    <Highlighter className="h-3.5 w-3.5" /> Выделить
                  </button>
                  <button onClick={() => setShowNoteInput(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-foreground hover:bg-secondary tap-highlight">
                    <MessageSquare className="h-3.5 w-3.5" /> Заметка
                  </button>
                  <button onClick={() => { handleShareText(selectedText); resetSelection(); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-foreground hover:bg-secondary tap-highlight">
                    <Share2 className="h-3.5 w-3.5" /> Поделиться
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit existing highlight popup */}
      {editingHighlight && editMenuPos && (
        <div className="absolute z-50" style={{ top: editMenuPos.top, left: editMenuPos.left }}>
          <div className="w-[220px] animate-fade-in rounded-2xl border bg-card p-3 shadow-elevated" data-highlight-menu>
            <p className="mb-2 line-clamp-2 text-xs italic text-muted-foreground">«{editingHighlight.text}»</p>
            <Input value={editNote} onChange={(e) => setEditNote(e.target.value)}
              placeholder="Заметка..." className="mb-2 h-8 rounded-lg bg-secondary border-0 text-xs" autoFocus />
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs text-destructive"
                onClick={() => deleteHighlight.mutate(editingHighlight.id)}>
                <Trash2 className="mr-1 h-3 w-3" /> Удалить
              </Button>
              <Button size="sm" className="h-7 flex-1 rounded-lg text-xs"
                onClick={() => updateHighlight.mutate({ highlightId: editingHighlight.id, note: editNote })}
                disabled={updateHighlight.isPending}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
