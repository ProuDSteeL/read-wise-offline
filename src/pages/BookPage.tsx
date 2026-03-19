import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Headphones, BookOpen, BookMarked, Star, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/BookCard";
import { useBook, useKeyIdeas } from "@/hooks/useBooks";
import { useSimilarBooks } from "@/hooks/useSimilarBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSummary } from "@/hooks/useSummary";
import { useDownloads } from "@/hooks/useDownloads";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useAudio } from "@/contexts/AudioContext";
import DownloadDialog from "@/components/DownloadDialog";

const BookPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useBook(id!);
  const { data: keyIdeas } = useKeyIdeas(id!);
  const { data: similarBooks } = useSimilarBooks(book);
  const { data: summary } = useSummary(id!);
  const { isDownloaded, download: downloadBook, activeDownloads } = useDownloads();
  const audioCtx = useAudio();
  const { canDownload, canListenAudio } = useAccessControl();
  const queryClient = useQueryClient();
  const [activeIdeaIdx, setActiveIdeaIdx] = useState(0);
  const ideaScrollRef = useRef<HTMLDivElement>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [authorExpanded, setAuthorExpanded] = useState(false);
  const viewCounted = useRef(false);

  // views_count column doesn't exist in DB, skip view counting
  useEffect(() => {
    // no-op
  }, [id]);

  const { data: userRating } = useQuery({
    queryKey: ["user_rating", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .maybeSingle();
      return data?.rating ?? null;
    },
    enabled: !!user && !!id,
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const { error } = await supabase.from("user_ratings").upsert(
        { user_id: user!.id, book_id: id!, rating },
        { onConflict: "user_id,book_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_rating", user?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      toast({ title: "Оценка сохранена" });
    },
  });

  const handleShare = async () => {
    if (!book) return;
    const shareData = {
      title: book.title,
      text: `${book.title} — ${book.author}. Читай саммари в Букс!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast({ title: "Ссылка скопирована" });
      }
    } catch {}
  };

  const { data: isBookmarked } = useQuery({
    queryKey: ["is_bookmarked", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_shelves")
        .select("id")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .eq("shelf_type", "want_to_read")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await supabase.from("user_shelves").delete()
          .eq("user_id", user!.id).eq("book_id", id!).eq("shelf_type", "want_to_read");
      } else {
        await supabase.from("user_shelves").insert({ user_id: user!.id, book_id: id!, shelf_type: "want_to_read" });
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
      toast({ title: "Ошибка", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["is_bookmarked", user?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["shelf_counts"] });
      queryClient.invalidateQueries({ queryKey: ["user_shelves"] });
    },
  });

  const handleBookmark = () => {
    if (!user) { navigate("/auth"); return; }
    bookmarkMutation.mutate();
  };

  const handleIdeaScroll = () => {
    if (!ideaScrollRef.current) return;
    const el = ideaScrollRef.current;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.firstElementChild?.clientWidth ?? 280;
    const idx = Math.round(scrollLeft / (cardWidth + 12));
    setActiveIdeaIdx(idx);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-4 px-4 pt-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto aspect-[3/4] w-48 rounded-2xl" />
        <Skeleton className="mx-auto h-6 w-48 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-32 rounded-lg" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Книга не найдена</p>
      </div>
    );
  }

  const filteredRelated = similarBooks;

  return (
    <div className="animate-fade-in pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 glass">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            if (!user) { navigate("/auth"); return; }
            if (!canDownload) { toast({ title: "Загрузки доступны в подписке Pro" }); return; }
            setShowDownloadDialog(true);
          }} className="tap-highlight">
            <Download className={`h-5 w-5 transition-colors ${isDownloaded(id!) ? "text-primary" : "text-muted-foreground"}`} />
          </button>
          <button onClick={() => { if (!user) navigate("/auth"); else handleBookmark(); }} className="tap-highlight">
            <BookMarked className={`h-5 w-5 transition-colors ${isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
          <button onClick={handleShare} className="tap-highlight">
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Cover */}
      <div className="flex justify-center px-8 py-6">
        <img
          src={book.cover_url || "/placeholder.svg"}
          alt={book.title}
          className="h-64 w-auto rounded-2xl shadow-elevated object-cover"
        />
      </div>

      {/* Title + Author */}
      <div className="text-center px-4 space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">{book.title}</h1>
        <p className="text-sm text-muted-foreground">{book.author}</p>
      </div>

      {/* Stats row — SmartReading style */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {book.read_time_minutes ? (
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{book.read_time_minutes} минут</span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-6 px-4">
        {/* About */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">О книге</h2>
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {book.tags.map((cat) => (
                <span key={cat} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                  {cat}
                </span>
              ))}
            </div>
          )}
          {book.description && (
            <p className="text-sm leading-relaxed text-foreground">{book.description}</p>
          )}
        </section>

        {/* Why read — numbered list in card */}
        {(() => {
          if (!book.why_read) return null;
          let reasons: string[] = [];
          try { reasons = JSON.parse(book.why_read); } catch { reasons = book.why_read ? [book.why_read] : []; }
          if (!reasons.length) return null;
          return (
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="text-base font-bold text-foreground mb-3">Зачем читать?</h2>
            <ol className="space-y-3">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-sage">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ol>
          </section>
          );
        })()}

        {/* About author — collapsible */}
        {book.about_author && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">Об авторе</h2>
            <p className={`text-sm leading-relaxed text-foreground ${!authorExpanded ? "line-clamp-3" : ""}`}>
              {book.about_author}
            </p>
            {book.about_author.length > 150 && (
              <button
                onClick={() => setAuthorExpanded(!authorExpanded)}
                className="mt-1 text-xs font-medium text-sage"
              >
                {authorExpanded ? "Свернуть" : "Читать далее"}
              </button>
            )}
          </section>
        )}

        {/* Key ideas — swipeable carousel with dots */}
        {keyIdeas && keyIdeas.length > 0 && (
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full gradient-accent px-3 py-1 text-xs font-semibold text-primary-foreground">
              ✦ Ключевые мысли
            </div>
            <div
              ref={ideaScrollRef}
              onScroll={handleIdeaScroll}
              className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-5 px-5"
            >
              {keyIdeas.map((idea) => (
                <div key={idea.id} className="w-full shrink-0 snap-center">
                  <p className="text-sm font-semibold text-foreground mb-1">{idea.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{idea.content}</p>
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="mt-3 flex justify-center gap-1.5">
              {keyIdeas.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIdeaIdx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Related books */}
        {filteredRelated && filteredRelated.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">С этим саммари читают</h2>
              <button onClick={() => navigate("/search")} className="text-xs font-medium text-sage tap-highlight">Все</button>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
              {filteredRelated.map((b) => (
                <BookCard
                  key={b.id}
                  title={b.title}
                  author={b.author}
                  coverUrl={b.cover_url || "/placeholder.svg"}
                  readTimeMin={b.read_time_minutes ?? undefined}
                  onClick={() => navigate(`/book/${b.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Rating */}
        {user && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Рейтинг</h2>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => rateMutation.mutate(star)}
                  className="tap-highlight p-0.5"
                >
                  <Star
                    className={`h-8 w-8 transition-all ${
                      (userRating ?? 0) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky bottom bar — SmartReading style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button
            className="h-12 flex-1 gap-2 rounded-full text-sm font-bold"
            onClick={() => navigate(`/book/${id}/read`)}
          >
            <BookOpen className="h-4 w-4" />
            Читать
          </Button>
          {summary?.audio_url && canListenAudio && (
            <Button
              className="h-12 flex-1 gap-2 rounded-full text-sm font-bold gradient-accent border-0 hover:opacity-90"
              onClick={() => {
                if (id) audioCtx.play({ bookId: id, bookTitle: book?.title, author: book?.author, coverUrl: book?.cover_url });
              }}
            >
              <Headphones className="h-4 w-4" />
              Слушать
            </Button>
          )}
        </div>
      </div>

      {/* Download dialog */}
      <DownloadDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
        bookTitle={book.title}
        hasText={!!summary?.content}
        hasAudio={!!summary?.audio_url}
        audioSizeBytes={summary?.audio_size_bytes ?? undefined}
        textContent={summary?.content}
        alreadyDownloaded={isDownloaded(id!) ? { hasText: isDownloaded(id!)!.hasText, hasAudio: isDownloaded(id!)!.hasAudio } : null}
        downloading={activeDownloads.has(id!)}
        onDownload={(type) => {
          downloadBook(
            id!,
            type,
            { title: book.title, author: book.author, coverUrl: book.cover_url },
            summary?.content,
            summary?.audio_url,
            summary?.audio_size_bytes ?? 0
          );
          setShowDownloadDialog(false);
        }}
      />
    </div>
  );
};

export default BookPage;
