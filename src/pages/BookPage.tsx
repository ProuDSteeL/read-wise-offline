import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Headphones, BookOpen, BookMarked, Star } from "lucide-react";
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

  // Favorite status
  const { data: isFavorite } = useQuery({
    queryKey: ["is_favorite", user?.id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_shelves")
        .select("id")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .eq("shelf", "favorite")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const favMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await supabase
          .from("user_shelves")
          .delete()
          .eq("user_id", user!.id)
          .eq("book_id", id!)
          .eq("shelf", "favorite");
      } else {
        await supabase.from("user_shelves").insert({
          user_id: user!.id,
          book_id: id!,
          shelf: "favorite",
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["is_favorite", user?.id, id] });
      const prev = queryClient.getQueryData(["is_favorite", user?.id, id]);
      queryClient.setQueryData(["is_favorite", user?.id, id], !isFavorite);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["is_favorite", user?.id, id], ctx?.prev);
      toast({ title: "Ошибка", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["is_favorite", user?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["shelf_counts"] });
      queryClient.invalidateQueries({ queryKey: ["user_shelves"] });
    },
  });

  const handleFavorite = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    favMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-4 px-4 pt-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto aspect-[3/4] w-48 rounded-2xl" />
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="mx-auto h-4 w-32" />
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
        <div className="absolute left-4 top-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm tap-highlight"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex justify-center bg-gradient-to-b from-secondary to-background px-4 pb-6 pt-16">
          <img
            src={book.cover_url || "/placeholder.svg"}
            alt={book.title}
            className="h-56 w-auto rounded-2xl shadow-elevated object-cover"
          />
        </div>
      </div>

      <div className="space-y-4 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{book.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          {book.read_time_min ? (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{book.read_time_min} мин</span>
            </div>
          ) : null}
          {book.listen_time_min ? (
            <div className="flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5" />
              <span>{book.listen_time_min} мин</span>
            </div>
          ) : null}
          {book.rating && Number(book.rating) > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(book.rating).toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {book.categories.map((cat) => (
              <span key={cat} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {cat}
              </span>
            ))}
          </div>
        )}

        {book.description && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">О книге</h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-serif">{book.description}</p>
          </div>
        )}

        {book.why_read && Array.isArray(book.why_read) && (book.why_read as string[]).length > 0 && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Зачем читать</h2>
            <ul className="space-y-1.5">
              {(book.why_read as string[]).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {keyIdeas && keyIdeas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Ключевые идеи · {keyIdeas.length}
            </h2>
            <div className="space-y-2">
              {keyIdeas.map((idea, i) => (
                <div key={idea.id} className="rounded-xl bg-card p-4 shadow-card">
                  <p className="text-xs font-medium text-primary">Идея {i + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{idea.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground font-serif line-clamp-3">{idea.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {book.about_author && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Об авторе</h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-serif">{book.about_author}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button
            onClick={handleFavorite}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl tap-highlight transition-colors ${
              isFavorite ? "bg-red-500/10" : "bg-secondary"
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          </button>
          <Button
            className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold"
            onClick={() => navigate(`/book/${id}/read`)}
          >
            <BookOpen className="h-4 w-4" />
            Читать
          </Button>
          {book.listen_time_min && book.listen_time_min > 0 && (
            <Button
              variant="secondary"
              className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold"
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
