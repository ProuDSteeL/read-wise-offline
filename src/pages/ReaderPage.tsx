import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Settings2, Bookmark, BookmarkCheck, Highlighter, MessageSquare } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
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

const themeClasses: Record<ReaderTheme, string> = {
  light: "",
  dark: "dark",
  sepia: "sepia",
};

const ReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  // Settings state (persisted in localStorage)
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

  // Selection / highlight state
  const [selectedText, setSelectedText] = useState("");
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [highlightNote, setHighlightNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Bookmark state
  const { data: isBookmarked } = useQuery({
    queryKey: ["is_bookmarked", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_shelves")
        .select("id")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .eq("shelf", "want_to_read")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Highlights
  const { data: highlights } = useQuery({
    queryKey: ["highlights", user?.id, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_highlights")
        .select("*")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
    localStorage.setItem("reader-font", fontFamily);
    localStorage.setItem("reader-font-size", String(fontSize));
  }, [theme, fontFamily, fontSize]);

  // Listen for text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 2 && selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current?.getBoundingClientRect();
        if (rect && containerRect) {
          setSelectedText(text);
          setMenuPosition({
            top: rect.bottom + window.scrollY + 6,
            left: Math.max(16, Math.min(
              rect.left + rect.width / 2 - 100,
              window.innerWidth - 216
            )),
          });
          setShowSelectionMenu(true);
        }
      } else if (!showNoteInput) {
        setShowSelectionMenu(false);
        setSelectedText("");
        setMenuPosition(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [showNoteInput]);

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await supabase
          .from("user_shelves")
          .delete()
          .eq("user_id", user!.id)
          .eq("book_id", id!)
          .eq("shelf", "want_to_read");
      } else {
        await supabase.from("user_shelves").insert({
          user_id: user!.id,
          book_id: id!,
          shelf: "want_to_read",
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["is_bookmarked", user?.id, id] });
      const prev = queryClient.getQueryData(["is_bookmarked", user?.id, id]);
      queryClient.setQueryData(["is_bookmarked", user?.id, id], !isBookmarked);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["is_bookmarked", user?.id, id], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["is_bookmarked", user?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["shelf_counts"] });
    },
  });

  // Highlight mutation
  const highlightMutation = useMutation({
    mutationFn: async ({ text, note }: { text: string; note?: string }) => {
      const { error } = await supabase.from("user_highlights").insert({
        user_id: user!.id,
        book_id: id!,
        text,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id, id] });
      toast({ title: "Выделение сохранено" });
      setShowSelectionMenu(false);
      setShowNoteInput(false);
      setHighlightNote("");
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveHighlight = () => {
    if (!user) { navigate("/auth"); return; }
    highlightMutation.mutate({ text: selectedText, note: highlightNote || undefined });
  };

  const handleBookmark = () => {
    if (!user) { navigate("/auth"); return; }
    bookmarkMutation.mutate();
  };

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
    <div className={`min-h-screen ${themeClasses[theme]} bg-background text-foreground transition-colors duration-300`}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="max-w-[50%] truncate text-sm font-semibold text-foreground">
          {book?.title}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleBookmark} className="tap-highlight">
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="tap-highlight"
          >
            <Settings2 className={`h-5 w-5 ${showSettings ? "text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="sticky top-[53px] z-10 animate-fade-in border-b bg-card px-4 py-4 shadow-card">
          {/* Theme */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Тема</p>
            <div className="flex gap-2">
              {([
                { key: "light" as const, label: "Светлая", bg: "bg-white", text: "text-gray-900", border: "border-gray-200" },
                { key: "dark" as const, label: "Тёмная", bg: "bg-gray-900", text: "text-gray-100", border: "border-gray-700" },
                { key: "sepia" as const, label: "Сепия", bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200" },
              ]).map(({ key, label, bg, text, border }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex-1 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${bg} ${text} ${
                    theme === key ? `${border} ring-2 ring-primary` : `${border} opacity-70`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Шрифт</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFontFamily("sans")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-all ${
                  fontFamily === "sans" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("serif")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-serif transition-all ${
                  fontFamily === "serif" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                Serif
              </button>
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Размер шрифта</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">A</span>
              <div className="flex flex-1 gap-1">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                      fontSize === size
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <span className="text-base text-muted-foreground">A</span>
            </div>
          </div>
        </div>
      )}

      {/* Markdown content */}
      <article
        ref={contentRef}
        className={`mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 mt-8 text-[1.4em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-6 text-[1.2em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-[1.1em] font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-muted-foreground">{children}</p>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            li: ({ children }) => (
              <li className="mb-1 text-muted-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            hr: () => <hr className="my-6 border-border" />,
          }}
        >
          {summary.content}
        </ReactMarkdown>
      </article>

      {/* Highlights list */}
      {highlights && highlights.length > 0 && (
        <div className="mx-auto max-w-md border-t px-5 py-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Мои выделения · {highlights.length}</h3>
          <div className="space-y-3">
            {highlights.map((h) => (
              <div key={h.id} className="rounded-xl bg-card p-3 shadow-card">
                <p className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
                  «{h.text}»
                </p>
                {h.note && (
                  <p className="mt-2 text-xs text-foreground">{h.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom selection menu */}
      {showSelectionMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in safe-bottom">
          <div className="mx-auto max-w-md border-t bg-card px-4 py-3 shadow-elevated">
            {showNoteInput ? (
              <div className="space-y-2">
                <p className="line-clamp-1 text-xs italic text-muted-foreground">«{selectedText}»</p>
                <Input
                  value={highlightNote}
                  onChange={(e) => setHighlightNote(e.target.value)}
                  placeholder="Добавьте заметку..."
                  className="rounded-xl bg-secondary border-0 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowNoteInput(false); setHighlightNote(""); }}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={handleSaveHighlight}
                    disabled={highlightMutation.isPending}
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-xs italic text-muted-foreground">
                  «{selectedText}»
                </p>
                <button
                  onClick={handleSaveHighlight}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary tap-highlight"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                  Выделить
                </button>
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-foreground tap-highlight"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Заметка
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
