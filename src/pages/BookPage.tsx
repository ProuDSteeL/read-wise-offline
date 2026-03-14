import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Headphones, BookOpen, BookMarked, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBook, useKeyIdeas } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BookPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useBook(id!);
  const { data: keyIdeas } = useKeyIdeas(id!);
  const queryClient = useQueryClient();

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
        .eq("shelf", "want_to_read")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

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

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div className="relative">
        <div className="absolute left-4 top-4 z-10 flex w-[calc(100%-2rem)] justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl glass shadow-card tap-highlight"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-xl glass shadow-card tap-highlight"
          >
            <Share2 className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="relative flex justify-center overflow-hidden px-4 pb-8 pt-16">
          {/* Background blur of cover */}
          <div className="absolute inset-0 overflow-hidden">
            <img src={book.cover_url || "/placeholder.svg"} alt="" className="h-full w-full scale-150 object-cover opacity-15 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          </div>
          <img
            src={book.cover_url || "/placeholder.svg"}
            alt={book.title}
            className="relative h-60 w-auto rounded-2xl shadow-elevated object-cover"
          />
        </div>
      </div>

      <div className="space-y-5 px-4">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{book.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        </div>

        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
          {book.read_time_min ? (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{book.read_time_min} мин</span>
            </div>
          ) : null}
          {book.listen_time_min ? (
            <div className="flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" />
              <span>{book.listen_time_min} мин</span>
            </div>
          ) : null}
          {book.rating && Number(book.rating) > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{Number(book.rating).toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {book.categories.map((cat) => (
              <span key={cat} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-card">
                {cat}
              </span>
            ))}
          </div>
        )}

        {book.description && (
          <div className="space-y-2">
            <h2 className="text-[15px] font-bold text-foreground">О книге</h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-serif">{book.description}</p>
          </div>
        )}

        {book.why_read && Array.isArray(book.why_read) && (book.why_read as string[]).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[15px] font-bold text-foreground">Зачем читать</h2>
            <ul className="space-y-2">
              {(book.why_read as string[]).map((reason, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full gradient-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {keyIdeas && keyIdeas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[15px] font-bold text-foreground">
              Ключевые идеи · {keyIdeas.length}
            </h2>
            <div className="space-y-2.5">
              {keyIdeas.map((idea, i) => (
                <div key={idea.id} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg gradient-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{idea.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-serif line-clamp-3">{idea.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {book.about_author && (
          <div className="space-y-2">
            <h2 className="text-[15px] font-bold text-foreground">Об авторе</h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-serif">{book.about_author}</p>
          </div>
        )}

        {/* Rating */}
        {user && (
          <div className="space-y-2">
            <h2 className="text-[15px] font-bold text-foreground">Ваша оценка</h2>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => rateMutation.mutate(star)}
                  className="tap-highlight p-0.5"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-200 ${
                      (userRating ?? 0) >= star
                        ? "fill-amber-400 text-amber-400 scale-100"
                        : "text-muted-foreground/20 hover:text-amber-300/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button
            onClick={handleBookmark}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl tap-highlight transition-all ${
              isBookmarked ? "bg-primary/10 shadow-glow" : "bg-card shadow-card"
            }`}
          >
            <BookMarked
              className={`h-5 w-5 transition-all ${
                isBookmarked ? "fill-primary text-primary" : "text-foreground"
              }`}
            />
          </button>
          <Button
            className="h-12 flex-1 gap-2 rounded-xl text-sm font-semibold gradient-primary border-0 hover:opacity-90"
            onClick={() => navigate(`/book/${id}/read`)}
          >
            <BookOpen className="h-4 w-4" />
            Читать
          </Button>
          {book.listen_time_min && book.listen_time_min > 0 && (
            <Button
              variant="secondary"
              className="h-12 flex-1 gap-2 rounded-xl text-sm font-semibold shadow-card"
              onClick={() => navigate(`/book/${id}/listen`)}
            >
              <Headphones className="h-4 w-4" />
              Слушать
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
