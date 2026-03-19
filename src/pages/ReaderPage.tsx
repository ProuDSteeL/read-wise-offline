import React, { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { X, Settings2, Heart, Trash2, Headphones, List, MoreVertical, Copy, Share2, StickyNote, Palette, Languages } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import { useBook } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { useAccessControl } from "@/hooks/useAccessControl";
import PaywallPrompt from "@/components/PaywallPrompt";
import { useNativeSelection } from "@/hooks/useNativeSelection";
import SelectionToolbar from "@/components/reader/SelectionToolbar";
import HighlightEditMenu from "@/components/reader/HighlightEditMenu";
import { getColor, HIGHLIGHT_COLORS } from "@/lib/highlightColors";

type ReaderTheme = "light" | "dark" | "sepia";
type ReaderFont = "sans" | "serif";

interface HighlightData {
  id: string;
  text: string;
  note: string | null;
  color?: string;
}

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
const themeClasses: Record<ReaderTheme, string> = { light: "", dark: "dark", sepia: "sepia" };

// Highlight text segments within a string
function applyHighlights(text: string, highlights: Array<{ id?: string; text: string; color?: string }>): ReactNode[] {
  if (!highlights.length) return [text];

  const parts: ReactNode[] = [];
  let keyIdx = 0;
  let offset = 0;

  const sorted = highlights
    .map((h) => {
      const norm = h.text.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ");
      return { ...h, _norm: norm, idx: text.indexOf(norm) };
    })
    .filter((h) => h.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  for (const hl of sorted) {
    const pos = text.indexOf(hl._norm, offset);
    if (pos === -1) continue;
    if (pos > offset) parts.push(text.slice(offset, pos));

    const color = getColor(hl.color);
    parts.push(
      <mark
        key={`hl-${keyIdx++}`}
        data-highlight-id={hl.id}
        style={{
          backgroundColor: `${color.hex}18`,
          borderBottom: `2.5px solid ${color.hex}`,
          borderRadius: "1px",
          padding: "0 1px",
          cursor: "pointer",
        }}
      >
        {hl._norm}
      </mark>
    );
    offset = pos + hl._norm.length;
  }

  if (offset < text.length) parts.push(text.slice(offset));
  return parts.length ? parts : [text];
}

function highlightChildren(children: ReactNode, highlights: Array<{ text: string; color?: string }>): ReactNode {
  if (!highlights.length) return children;
  if (typeof children === "string") return <>{applyHighlights(children, highlights)}</>;
  if (Array.isArray(children)) {
    return <>{children.map((child, i) =>
      typeof child === "string"
        ? <React.Fragment key={i}>{applyHighlights(child, highlights)}</React.Fragment>
        : child
    )}</>;
  }
  return children;
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
  const [tocTab, setTocTab] = useState<"toc" | "notes" | "quotes">("toc");
  const [noteEdit, setNoteEdit] = useState<{ id: string; text: string; note: string } | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [editingHighlight, setEditingHighlight] = useState<{ id: string; tapX: number; tapY: number } | null>(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const saveProgressTimeout = useRef<ReturnType<typeof setTimeout>>();
  const hasRestoredPosition = useRef(false);
  const { canReadFull, canListenAudio, canHighlight, isPro, freeReadsUsed, freeReadsLimit, highlightLimit } = useAccessControl();
  const [showAudioPlayer, setShowAudioPlayer] = useState(() => {
    return !!locState?.autoPlayAudio || audioCtx.state.bookId === id;
  });

  // Native selection
  const { selection, clearSelection } = useNativeSelection(contentRef, !isLoading);

  // Highlights query (must be before useEffects that reference it)
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
    staleTime: Infinity,
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
      audioCtx.play(id, book?.title);
    }
  };

  const toc = useMemo(() => summary?.content ? extractToc(summary.content) : [], [summary?.content]);

  const { data: savedProgress } = useQuery({
    queryKey: ["reader_progress", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("progress_percent, scroll_position")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!id,
  });

  useEffect(() => {
    if (savedProgress?.scroll_position && !isLoading && !hasRestoredPosition.current) {
      hasRestoredPosition.current = true;
      setTimeout(() => window.scrollTo(0, savedProgress.scroll_position), 150);
    }
  }, [savedProgress, isLoading]);


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
            scroll_position: window.scrollY,
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
            scroll_position: scrollTop,
          },
          { onConflict: "user_id,book_id" }
        );
      }
    };
  }, [saveProgress, user, id]);

  const { data: isFavorite } = useQuery({
    queryKey: ["is_favorite", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_shelves").select("id")
        .eq("user_id", user!.id).eq("book_id", id!).eq("shelf_type", "favorite")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });


  // Tap on existing highlight
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const mark = (e.target as HTMLElement).closest("mark[data-highlight-id]");
      if (!mark) return;
      // Only trigger on plain tap, not text selection drag
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim()) return;
      e.preventDefault();
      const hId = mark.getAttribute("data-highlight-id")!;
      setEditingHighlight({ id: hId, tapX: e.clientX, tapY: e.clientY });
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [highlights]);

  // Close highlight edit menu on outside click
  useEffect(() => {
    if (!editingHighlight) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-highlight-menu]")) return;
      setEditingHighlight(null);
    };
    // Use timeout so the opening click doesn't immediately close it
    const t = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", handler); };
  }, [editingHighlight]);

  // Save quote
  const handleQuote = () => {
    if (!selection) return;
    if (!user) { navigate("/auth"); return; }
    const text = selection.text;
    if (highlights.some((h) => h.text === text)) {
      clearSelection();
      return;
    }
    if (!canHighlight(highlights.length)) {
      toast({ title: `Лимит выделений (${highlightLimit}) для бесплатного плана`, description: "Оформите подписку Pro для безлимитных выделений" });
      return;
    }
    clearSelection();
    createHighlight.mutate({ text, color: "yellow" });
  };

  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
    localStorage.setItem("reader-font", fontFamily);
    localStorage.setItem("reader-font-size", String(fontSize));
    localStorage.setItem("reader-line-height", String(lineHeight));
  }, [theme, fontFamily, fontSize, lineHeight]);

  const favMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await supabase.from("user_shelves").delete()
          .eq("user_id", user!.id).eq("book_id", id!).eq("shelf_type", "favorite");
      } else {
        await supabase.from("user_shelves").insert({ user_id: user!.id, book_id: id!, shelf_type: "favorite" });
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

  const createHighlight = useMutation({
    mutationFn: async ({ text, note, color }: { text: string; note?: string; color: string }) => {
      const { data, error } = await supabase.from("user_highlights").insert({
        user_id: user!.id, book_id: id!, text, note: note || null, color,
      }).select().single();
      if (error) throw error;
      return data as HighlightData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<HighlightData[]>(
        ["highlights", user?.id, id],
        (old) => [...(old ?? []), data],
      );
      toast({ title: "Цитата сохранена" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const deleteHighlight = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase.from("user_highlights").delete().eq("id", highlightId);
      if (error) throw error;
      return highlightId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<HighlightData[]>(
        ["highlights", user?.id, id],
        (old) => old?.filter((h) => h.id !== deletedId) ?? [],
      );
      toast({ title: "Цитата удалена" });
    },
  });

  const updateHighlight = useMutation({
    mutationFn: async ({ highlightId, updates }: { highlightId: string; updates: { color?: string; note?: string } }) => {
      const { error } = await supabase.from("user_highlights").update(updates).eq("id", highlightId);
      if (error) throw error;
      return { highlightId, updates };
    },
    onSuccess: ({ highlightId, updates }) => {
      queryClient.setQueryData<HighlightData[]>(
        ["highlights", user?.id, id],
        (old) => old?.map((h) => h.id === highlightId ? { ...h, ...updates } : h) ?? [],
      );
    },
  });

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
  const isTruncated = summary?.truncated === true;

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
                audioCtx.play(id, book?.title);
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
        className={`relative mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
        }}
      >
        <ReactMarkdown
          key={highlights.map(h => h.text).join("\0")}
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
          {summary.content}
        </ReactMarkdown>
        {isTruncated && (
          <div className="relative -mt-32">
            <div className="pointer-events-none h-32 bg-gradient-to-t from-background to-transparent" />
            <div className="bg-background pb-8 pt-4 text-center">
              {summary.freeReadsUsed != null && summary.freeReadsLimit != null && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Использовано {summary.freeReadsUsed} из {summary.freeReadsLimit} бесплатных саммари
                </p>
              )}
              <PaywallPrompt
                inline
                message="Читайте полную версию с подпиской Pro"
              />
            </div>
          </div>
        )}
      </article>

      {/* Selection toolbar (new text selection) */}
      {selection && !editingHighlight && (
        <SelectionToolbar
          rect={selection.rect}
          text={selection.text}
          onQuote={handleQuote}
        />
      )}

      {/* Highlight edit menu (tap on existing highlight) */}
      {editingHighlight && (() => {
        const hl = highlights.find((h) => h.id === editingHighlight.id);
        if (!hl) return null;
        return (
          <HighlightEditMenu
            tapX={editingHighlight.tapX}
            tapY={editingHighlight.tapY}
            highlight={hl}
            onChangeColor={(hId, color) => {
              updateHighlight.mutate({ highlightId: hId, updates: { color } });
            }}
            onRemoveHighlight={(hId) => {
              deleteHighlight.mutate(hId);
            }}
            onNote={(h) => {
              setNoteValue(h.note ?? "");
              setNoteEdit({ id: h.id, text: h.text, note: h.note ?? "" });
            }}
            onClose={() => setEditingHighlight(null)}
          />
        );
      })()}

      {/* TOC / Notes / Quotes Sheet */}
      <Sheet open={showToc} onOpenChange={setShowToc}>
        <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Навигация</SheetTitle>
          </SheetHeader>

          {/* Tab bar */}
          <div className="flex border-b border-border/40 shrink-0">
            {(["toc", "notes", "quotes"] as const).map((tab) => {
              const label = tab === "toc" ? "ОГЛАВЛЕНИЕ" : tab === "notes" ? "ЗАМЕТКИ" : "ЦИТАТЫ";
              const isActive = (tocTab ?? "toc") === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setTocTab(tab)}
                  className="relative flex-1 py-3 text-center text-[11px] font-bold tracking-wider transition-colors"
                  style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* ОГЛАВЛЕНИЕ */}
            {(tocTab ?? "toc") === "toc" && (
              <div className="space-y-0.5 px-2 py-3">
                {toc.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">Нет заголовков</p>
                )}
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
            )}

            {/* ЗАМЕТКИ */}
            {(tocTab ?? "toc") === "notes" && (() => {
              const withNotes = highlights.filter((h) => h.note);
              return (
                <div className="px-3 py-3 space-y-2">
                  {withNotes.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      <StickyNote className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
                      Добавьте заметку к цитате
                    </p>
                  )}
                  {withNotes.map((h) => {
                    const color = getColor(h.color);
                    return (
                      <div
                        key={h.id}
                        className="rounded-xl bg-secondary/50 p-3"
                        style={{ borderLeft: `3px solid ${color.hex}` }}
                      >
                        <p className="text-sm leading-relaxed text-foreground">{h.note}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">«{h.text}»</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ЦИТАТЫ */}
            {(tocTab ?? "toc") === "quotes" && (
              <div className="px-3 py-3 space-y-2">
                {highlights.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Выделите текст, чтобы сохранить цитату
                  </p>
                )}
                {highlights.map((h) => {
                  const color = getColor(h.color);
                  return (
                    <div
                      key={h.id}
                      className="rounded-xl bg-secondary/50 p-3"
                      style={{ borderLeft: `3px solid ${color.hex}` }}
                    >
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm leading-relaxed text-foreground">«{h.text}»</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(h.text);
                                  toast({ title: "Скопировано" });
                                } catch { /* ignore */ }
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Копировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ text: `«${h.text}»` }).catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(`«${h.text}»`).then(
                                    () => toast({ title: "Скопировано для отправки" }),
                                  ).catch(() => {});
                                }
                              }}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Поделиться
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setNoteValue(h.note ?? "");
                                setNoteEdit({ id: h.id, text: h.text, note: h.note ?? "" });
                              }}
                            >
                              <StickyNote className="mr-2 h-4 w-4" />
                              {h.note ? "Ред. заметку" : "Добавить заметку"}
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Palette className="mr-2 h-4 w-4" />
                                Цвет
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="min-w-0 p-2">
                                <div className="flex gap-1.5">
                                  {HIGHLIGHT_COLORS.map((c) => (
                                    <button
                                      key={c.key}
                                      onClick={() => {
                                        updateHighlight.mutate({ highlightId: h.id, updates: { color: c.key } });
                                      }}
                                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                                      style={{
                                        backgroundColor: c.hex,
                                        borderColor: h.color === c.key ? "var(--foreground)" : "transparent",
                                      }}
                                    />
                                  ))}
                                </div>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              onClick={() => toast({ title: "Перевод пока недоступен" })}
                            >
                              <Languages className="mr-2 h-4 w-4" />
                              Перевод
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteHighlight.mutate(h.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {h.note && (
                        <p className="mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">{h.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Note edit dialog */}
      <Dialog open={!!noteEdit} onOpenChange={(open) => { if (!open) setNoteEdit(null); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl p-5 gap-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-left">
              {noteEdit?.note ? "Редактировать заметку" : "Добавить заметку"}
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground line-clamp-2">
              «{noteEdit?.text}»
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Ваша заметка..."
            className="min-h-[100px] resize-none rounded-xl text-sm"
          />
          <div className="flex gap-2 justify-end">
            {noteEdit?.note && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  updateHighlight.mutate({ highlightId: noteEdit.id, updates: { note: "" } });
                  toast({ title: "Заметка удалена" });
                  setNoteEdit(null);
                }}
              >
                Удалить
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setNoteEdit(null)}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                if (noteEdit) {
                  updateHighlight.mutate({ highlightId: noteEdit.id, updates: { note: noteValue } });
                  toast({ title: "Заметка сохранена" });
                }
                setNoteEdit(null);
              }}
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini audio player */}
      {showAudioPlayer && summary?.audio_url && canListenAudio && (
        <>
          <div className="h-24" />
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
