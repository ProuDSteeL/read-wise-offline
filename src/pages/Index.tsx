import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/BookCard";
import { usePopularBooks, useNewBooks, useCollections, type Book } from "@/hooks/useBooks";
import { useUserProgress } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const useCollectionBooks = (bookIds: string[] | null) => {
  return useQuery({
    queryKey: ["collection_books", bookIds],
    queryFn: async () => {
      if (!bookIds?.length) return [];
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .in("id", bookIds);
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!bookIds?.length,
  });
};

const CollectionSection = ({ collection }: { collection: { id: string; title: string; description: string | null; book_ids: string[] | null } }) => {
  const navigate = useNavigate();
  const { data: books, isLoading } = useCollectionBooks(collection.book_ids);

  if (isLoading) return <BookRowSkeleton />;
  if (!books?.length) return null;

  return (
    <section className="space-y-3">
      <div className="px-4">
        <h2 className="text-lg font-semibold text-foreground">{collection.title}</h2>
        {collection.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{collection.description}</p>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {books.map((book) => (
          <BookCard
            key={book.id}
            title={book.title}
            author={book.author}
            coverUrl={book.cover_url || "/placeholder.svg"}
            readTimeMin={book.read_time_min ?? undefined}
            onClick={() => navigate(`/book/${book.id}`)}
          />
        ))}
      </div>
    </section>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { data: popular, isLoading: loadingPopular } = usePopularBooks();
  const { data: newest, isLoading: loadingNew } = useNewBooks();
  const { data: collections } = useCollections();
  const { user } = useAuth();
  const { data: progress } = useUserProgress();

  const continueBooks = progress?.filter(
    (p) => p.progress_percent && p.progress_percent > 0 && p.progress_percent < 100
  );

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

      {/* Continue reading */}
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

      {/* Collections */}
      {collections && collections.length > 0 && collections.map((col) => (
        <CollectionSection key={col.id} collection={col} />
      ))}

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
