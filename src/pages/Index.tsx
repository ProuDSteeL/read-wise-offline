import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/BookCard";
import { usePopularBooks, useNewBooks } from "@/hooks/useBooks";
import { useUserProgress } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";

const categories = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы"];

const BookRowSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-[140px] shrink-0 space-y-2">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { data: popular, isLoading: loadingPopular } = usePopularBooks();
  const { data: newest, isLoading: loadingNew } = useNewBooks();
  const { user } = useAuth();
  const { data: progress } = useUserProgress();

  const continueBooks = progress?.filter(
    (p) => p.progress_percent && p.progress_percent > 0 && p.progress_percent < 100
  );

  // Build a map of bookId -> progress for showing on cards
  const progressMap = new Map<string, number>();
  progress?.forEach((p: any) => {
    if (p.progress_percent && p.progress_percent > 0) {
      progressMap.set(p.book_id, Number(p.progress_percent));
    }
  });

  return (
    <div className="animate-fade-in space-y-6 pb-4">
      <div className="px-4 pt-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Букс</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ключевые идеи лучших книг за 15 минут
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => navigate(`/search?category=${encodeURIComponent(cat)}`)}
            className="shrink-0 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground tap-highlight"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Continue reading — shown first */}
      {user && continueBooks && continueBooks.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-4 text-lg font-semibold text-foreground">Продолжить</h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {continueBooks.map((p: any) => (
              <BookCard
                key={p.book_id}
                title={p.books?.title ?? ""}
                author={p.books?.author ?? ""}
                coverUrl={p.books?.cover_url || "/placeholder.svg"}
                readTimeMin={p.books?.read_time_min ?? undefined}
                progress={Number(p.progress_percent)}
                onClick={() => navigate(`/book/${p.book_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      <section className="space-y-3">
        <h2 className="px-4 text-lg font-semibold text-foreground">Популярное</h2>
        {loadingPopular ? (
          <BookRowSkeleton />
        ) : popular && popular.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {popular.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url || "/placeholder.svg"}
                readTimeMin={book.read_time_min ?? undefined}
                progress={progressMap.get(book.id)}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">Каталог пока пуст</p>
        )}
      </section>

      {/* New */}
      <section className="space-y-3">
        <h2 className="px-4 text-lg font-semibold text-foreground">Новинки</h2>
        {loadingNew ? (
          <BookRowSkeleton />
        ) : newest && newest.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {newest.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url || "/placeholder.svg"}
                readTimeMin={book.read_time_min ?? undefined}
                progress={progressMap.get(book.id)}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">Каталог пока пуст</p>
        )}
      </section>
    </div>
  );
};

export default Index;
