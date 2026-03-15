import React, { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { X, Settings2, Heart, MessageSquare, Pencil, Trash2, Share2, Headphones, List } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { useBook } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useAccessControl } from "@/hooks/useAccessControl";
import PaywallPrompt from "@/components/PaywallPrompt";

type ReaderTheme = "light" | "dark" | "sepia";
type ReaderFont = "sans" | "serif";

const FONT_SIZES = [14, 16, 18, 20, 22, 24];
const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\wа-яё]+/gi, "-").replace(/^-|-$/g, "");
}

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    entries.push({
      level: match[1].length,
      text: match[2].trim(),
      id: slugify(match[2].trim()),
    });
  }
  return entries;
}
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
  const location = useLocation();
  const locState = location.state as { audioPosition?: number; audioSpeed?: number; autoPlayAudio?: boolean } | null;
  const { user } = useAuth();
  const audioCtx = useAudio();
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
  const [lineHeight, setLineHeight] = useState(() =>
    parseFloat(localStorage.getItem("reader-line-height") || "1.8")
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const saveProgressTimeout = useRef<ReturnType<typeof setTimeout>>();
  const hasRestoredPosition = useRef(false);
  const { canReadFull, canListenAudio, canHighlight, isPro, freeReadsUsed, freeReadsLimit, highlightLimit } = useAccessControl();
  const [showAudioPlayer, setShowAudioPlayer] = useState(() => {
    // Show mini-player if coming back from full player or audio is already playing for this book
    return !!locState?.autoPlayAudio || audioCtx.state.bookId === id;
  });

  // Start audio when mini-player is shown
  useEffect(() => {
    if (showAudioPlayer && summary?.audio_url && id) {
      if (audioCtx.state.bookId !== id) {
        audio_start();
      }
    }
  }, [showAudioPlayer, summary?.audio_url, id]);

  const audio_start = () => {
    if (summary?.audio_url && id) {
      audioCtx.play(id, summary.audio_url, book?.title);
    }
  };

  // Parse TOC from summary content
  const toc = useMemo(() => summary?.content ? extractToc(summary.content) : [], [summary?.content]);

  // Saved reading progress
  const { data: savedProgress } = useQuery({
    queryKey: ["reader_progress", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("progress_percent, last_position")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!id,
  });

  // Restore scroll position once
  useEffect(() => {
    if (savedProgress?.last_position && !isLoading && !hasRestoredPosition.current) {
      hasRestoredPosition.current = true;
      setTimeout(() => window.scrollTo(0, parseInt(savedProgress.last_position)), 150);
    }
  }, [savedProgress, isLoading]);

  // Scroll tracking + debounced progress save
  const saveProgress = useCallback(
    (percent: number) => {
      if (!user || !id) return;
      clearTimeout(saveProgressTimeout.current);
      saveProgressTimeout.current = setTimeout(async () => {
        await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            book_id: id,
            progress_percent: Math.round(percent),
            last_position: String(window.scrollY),
          },
          { onConflict: "user_id,book_id" }
        );
      }, 3000);
    },
    [user, id]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPercent(percent);
      saveProgress(percent);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Flush save on unmount
      if (user && id) {
        clearTimeout(saveProgressTimeout.current);
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            book_id: id,
            progress_percent: Math.round(percent),
            last_position: String(scrollTop),
          },
          { onConflict: "user_id,book_id" }
        );
      }
    };
  }, [saveProgress, user, id]);

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
    localStorage.setItem("reader-line-height", String(lineHeight));
  }, [theme, fontFamily, fontSize, lineHeight]);

  // Refs to avoid stale closures and unnecessary effect re-runs
  const showNoteInputRef = useRef(showNoteInput);
  showNoteInputRef.current = showNoteInput;
  const editingHighlightRef = useRef(editingHighlight);
  editingHighlightRef.current = editingHighlight;
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const lastTouchEndRef = useRef(0);
  const autoCreateRef = useRef<((text: string) => void) | null>(null);

  // Text selection — stable effect with selectionchange for reliability
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Prevent native context menu inside reader
    const preventCtx = (e: Event) => e.preventDefault();
    container.addEventListener("contextmenu", preventCtx);

    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const showMenuForSelection = () => {
      pendingTimer = null;
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 3 || !sel?.rangeCount) return;

      const range = sel.getRangeAt(0);
      // Only handle selections within reader content
      if (!container.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      const menuH = 120;
      const posAbove = rect.top > menuH;
      const top = posAbove ? rect.top - menuH - 4 : rect.bottom + 8;
      const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 130, window.innerWidth - 272));

      setSelectedText(text);
      setMenuPosition({ top, left });
      setShowSelectionMenu(true);
      // Auto-create highlight with default color
      autoCreateRef.current?.(text);
    };

    const scheduleCheck = (delay: number) => {
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(showMenuForSelection, delay);
    };

    // selectionchange — reliable detection across all input methods
    const onSelectionChange = () => {
      if (editingHighlightRef.current) return;
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 3) return;
      scheduleCheck(250);
    };

    // mouseup/touchend — fast path for when user finishes selecting
    const onMouseUp = () => {
      if (editingHighlightRef.current) return;
      scheduleCheck(50);
    };

    const onTouchEnd = () => {
      lastTouchEndRef.current = Date.now();
      if (editingHighlightRef.current) return;
      scheduleCheck(100);
    };

    const clearSelection = (e: MouseEvent) => {
      // Skip synthetic mouse events emitted after touch
      if (Date.now() - lastTouchEndRef.current < 400) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-highlight-menu]") || target.closest("mark")) return;
      if (!window.getSelection()?.toString().trim() && !showNoteInputRef.current) {
        setShowSelectionMenu(false);
        setSelectedText("");
        setMenuPosition(null);
      }
    };

    const handleMarkClick = (e: MouseEvent) => {
      const mark = (e.target as HTMLElement).closest("mark[data-highlight-id]");
      if (!mark) return;
      const hlId = mark.getAttribute("data-highlight-id");
      const hl = highlightsRef.current.find((h) => h.id === hlId);
      if (!hl) return;

      const sel = window.getSelection();
      if (sel?.toString().trim()) return;

      const rect = mark.getBoundingClientRect();
      setEditMenuPos({
        top: rect.bottom + 8,
        left: Math.max(12, Math.min(rect.left + rect.width / 2 - 130, window.innerWidth - 272)),
      });
      setEditingHighlight(hl);
      setEditNote(hl.note || "");
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("mousedown", clearSelection);
    container.addEventListener("click", handleMarkClick);

    return () => {
      if (pendingTimer) clearTimeout(pendingTimer);
      container.removeEventListener("contextmenu", preventCtx);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("mousedown", clearSelection);
      container.removeEventListener("click", handleMarkClick);
    };
  // Re-run once when content mounts (isLoading: true → false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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

  // Create highlight — returns created row for immediate editing
  const createHighlight = useMutation({
    mutationFn: async ({ text, note, color }: { text: string; note?: string; color: string }) => {
      const { data, error } = await supabase.from("user_highlights").insert({
        user_id: user!.id, book_id: id!, text, note: note || null, color,
      } as any).select().single();
      if (error) throw error;
      return data as HighlightData;
    },
    onSuccess: (newHighlight) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
      // Switch to edit mode for the new highlight so user can change color / add note
      window.getSelection()?.removeAllRanges();
      setShowSelectionMenu(false);
      setSelectedText("");
      setEditingHighlight(newHighlight);
      setEditNote("");
      setMenuPosition((pos) => {
        if (pos) setEditMenuPos(pos);
        return null;
      });
    },
    onError: (err: any) => { toast({ title: "Ошибка", description: err.message, variant: "destructive" }); },
  });

  // Update highlight (note and/or color)
  const updateHighlight = useMutation({
    mutationFn: async ({ highlightId, note, color }: { highlightId: string; note?: string; color?: string }) => {
      const updates: Record<string, unknown> = {};
      if (note !== undefined) updates.note = note || null;
      if (color !== undefined) updates.color = color;
      const { error } = await supabase.from("user_highlights").update(updates).eq("id", highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
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
    if (!canHighlight(highlights.length)) {
      toast({ title: `Лимит выделений (${highlightLimit}) для бесплатного плана`, description: "Оформите подписку Pro для безлимитных выделений" });
      resetSelection();
      return;
    }
    createHighlight.mutate({ text: selectedText, note: highlightNote || undefined, color: selectedColor });
  };

  // Auto-highlight: create highlight immediately on text selection
  autoCreateRef.current = (text: string) => {
    if (!user || createHighlight.isPending) return;
    // Check if text is already highlighted
    if (highlights.some((h) => h.text === text)) return;
    if (!canHighlight(highlights.length)) return;
    createHighlight.mutate({ text, color: "yellow" });
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

  // Freemium: check access
  const hasAccess = !user || canReadFull(id!);

  return (
    <div className={`relative min-h-screen ${themeClasses[theme]} bg-background text-foreground transition-colors duration-300`}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${scrollPercent}%` }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="max-w-[50%] truncate text-sm font-semibold text-foreground">{book?.title}</span>
        <div className="flex items-center gap-2">
          {toc.length > 0 && (
            <button onClick={() => setShowToc(true)} className="tap-highlight">
              <List className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {summary?.audio_url && canListenAudio && (
            <button onClick={() => {
              const next = !showAudioPlayer;
              setShowAudioPlayer(next);
              if (next && summary?.audio_url && id && audioCtx.state.bookId !== id) {
                audioCtx.play(id, summary.audio_url, book?.title);
              }
              if (!next) {
                audioCtx.stop();
              }
            }} className="tap-highlight">
              <Headphones className={`h-5 w-5 transition-colors ${showAudioPlayer ? "text-primary" : "text-muted-foreground"}`} />
            </button>
          )}
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
          <div className="mb-4">
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
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Межстрочный интервал</p>
            <div className="flex gap-2">
              {LINE_HEIGHTS.map((lh) => (
                <button key={lh} onClick={() => setLineHeight(lh)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                    lineHeight === lh ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >{lh}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <article
        ref={contentRef}
        className={`mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground select-text`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          WebkitTouchCallout: "none",
          WebkitUserSelect: "text",
        }}
        onCopy={() => {
          // Allow copy but prevent native menu
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => {
              const text = typeof children === "string" ? children : Array.isArray(children) ? children.map(c => typeof c === "string" ? c : "").join("") : "";
              return (
                <h1 id={slugify(text)} className="mb-4 mt-8 text-[1.4em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {wrapWithHighlights(children)}
                </h1>
              );
            },
            h2: ({ children }) => {
              const text = typeof children === "string" ? children : Array.isArray(children) ? children.map(c => typeof c === "string" ? c : "").join("") : "";
              return (
                <h2 id={slugify(text)} className="mb-3 mt-6 text-[1.2em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {wrapWithHighlights(children)}
                </h2>
              );
            },
            h3: ({ children }) => {
              const text = typeof children === "string" ? children : Array.isArray(children) ? children.map(c => typeof c === "string" ? c : "").join("") : "";
              return (
                <h3 id={slugify(text)} className="mb-2 mt-5 text-[1.1em] font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {wrapWithHighlights(children)}
                </h3>
              );
            },
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
          {hasAccess ? summary.content : summary.content.slice(0, Math.floor(summary.content.length * 0.2))}
        </ReactMarkdown>
        {!hasAccess && (
          <div className="relative -mt-16 pt-16 bg-gradient-to-t from-background via-background to-transparent">
            <PaywallPrompt
              message={`Вы прочитали ${freeReadsUsed} из ${freeReadsLimit} бесплатных саммари`}
              inline
            />
          </div>
        )}
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

      {/* Selection saving indicator */}
      {showSelectionMenu && menuPosition && !editingHighlight && createHighlight.isPending && (
        <div className="fixed z-50" style={{ top: menuPosition.top, left: menuPosition.left }}>
          <div className="w-[140px] animate-fade-in rounded-2xl border border-border/60 bg-card p-3 shadow-elevated flex items-center justify-center gap-2" data-highlight-menu>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">Сохраняю...</span>
          </div>
        </div>
      )}

      {/* Edit existing highlight popup */}
      {editingHighlight && editMenuPos && (
        <div className="fixed z-50" style={{ top: editMenuPos.top, left: editMenuPos.left }}>
          <div className="w-[260px] animate-fade-in rounded-2xl border border-border/60 bg-card shadow-elevated overflow-hidden" data-highlight-menu>
            {/* Color picker row */}
            <div className="flex justify-center gap-2.5 px-4 pt-3 pb-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button key={c.key}
                  onClick={() => {
                    updateHighlight.mutate({ highlightId: editingHighlight.id, color: c.key });
                    setEditingHighlight({ ...editingHighlight, color: c.key });
                  }}
                  className={`h-7 w-7 rounded-full ${c.bg} border-2 transition-all ${
                    (editingHighlight.color || "yellow") === c.key
                      ? `${c.border} scale-110 ring-2 ${c.ring} ring-offset-1`
                      : "border-transparent"
                  }`}
                />
              ))}
            </div>
            {/* Action buttons */}
            <div className="grid grid-cols-4 border-t border-border/40">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(editingHighlight.text);
                  toast({ title: "Скопировано" });
                }}
                className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span className="text-[10px] font-medium">Копировать</span>
              </button>
              <button onClick={() => setShowNoteInput(true)}
                className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
              >
                <MessageSquare className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium">Заметка</span>
              </button>
              <button onClick={() => { handleShareText(editingHighlight.text); }}
                className="flex flex-col items-center gap-1 py-3 text-foreground hover:bg-secondary/60 tap-highlight transition-colors"
              >
                <Share2 className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium">Поделиться</span>
              </button>
              <button
                onClick={() => deleteHighlight.mutate(editingHighlight.id)}
                className="flex flex-col items-center gap-1 py-3 text-destructive hover:bg-secondary/60 tap-highlight transition-colors"
              >
                <Trash2 className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium">Удалить</span>
              </button>
            </div>
            {/* Note input (expandable) */}
            {showNoteInput && (
              <div className="border-t border-border/40 p-3 space-y-2">
                <Input value={editNote} onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Добавить заметку..." className="h-9 rounded-xl bg-secondary border-0 text-sm" autoFocus />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs rounded-xl"
                    onClick={() => { setShowNoteInput(false); setEditNote(""); }}>Отмена</Button>
                  <Button size="sm" className="h-8 flex-1 rounded-xl text-xs"
                    onClick={() => {
                      updateHighlight.mutate({ highlightId: editingHighlight.id, note: editNote });
                      setShowNoteInput(false);
                      setEditingHighlight(null);
                      setEditMenuPos(null);
                    }}
                    disabled={updateHighlight.isPending}>Сохранить</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOC Sheet */}
      <Sheet open={showToc} onOpenChange={setShowToc}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-base font-bold">Оглавление</SheetTitle>
          </SheetHeader>
          <div className="space-y-0.5 px-2 pb-4 overflow-y-auto max-h-[calc(100vh-80px)]">
            {toc.map((entry, i) => (
              <button
                key={i}
                onClick={() => {
                  setShowToc(false);
                  setTimeout(() => {
                    document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary tap-highlight ${
                  entry.level === 1 ? "font-semibold text-foreground" : entry.level === 2 ? "pl-6 text-foreground" : "pl-10 text-muted-foreground"
                }`}
              >
                {entry.text}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mini audio player */}
      {showAudioPlayer && summary?.audio_url && canListenAudio && (
        <>
          <div className="h-24" /> {/* Spacer so content isn't hidden behind player */}
          <MiniAudioPlayer
            onClose={() => setShowAudioPlayer(false)}
            onExpand={() => navigate(`/book/${id}/listen`)}
          />
        </>
      )}
    </div>
  );
};

export default ReaderPage;
