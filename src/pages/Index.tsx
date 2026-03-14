import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ChevronRight } from "lucide-react";
import BookCard from "@/components/BookCard";
import ContinueCard from "@/components/ContinueCard";
import SectionHeader from "@/components/SectionHeader";
import { usePopularBooks, useNewBooks, useCollections, type Book } from "@/hooks/useBooks";
import { useUserProgress } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRecommendations } from "@/hooks/useRecommendations";

const categories = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы"];

const BookRowSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-[140px] shrink-0 space-y-2">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
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
      <SectionHeader title={collection.title} subtitle={collection.description ?? undefined} />
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
  const { data: recommendations } = useRecommendations();
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
    <div className="animate-fade-in space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14">
        <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">Главная</h1>
      </div>

      {/* Continue reading — SmartReading-style horizontal cards */}
      {user && continueBooks && continueBooks.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Продолжить" onSeeAll={() => navigate("/shelves")} />
          <div className="space-y-2 px-4">
            {continueBooks.slice(0, 3).map((p: any) => (
              <ContinueCard
                key={p.book_id}
                title={p.books?.title ?? ""}
                author={p.books?.author ?? ""}
                coverUrl={p.books?.cover_url || "/placeholder.svg"}
                progress={Number(p.progress_percent)}
                onClick={() => navigate(`/book/${p.book_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured collection banner */}
      {collections && collections.length > 0 && collections[0] && (
        <FeaturedBanner collection={collections[0]} />
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => navigate(`/search?category=${encodeURIComponent(cat)}`)}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/30 tap-highlight"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Popular */}
      <section className="space-y-3">
        <SectionHeader title="Популярное" onSeeAll={() => navigate("/search")} />
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
          <div className="mx-4 flex flex-col items-center gap-2 rounded-2xl bg-card py-12 shadow-card">
            <p className="text-sm text-muted-foreground">Каталог пока пуст</p>
          </div>
        )}
      </section>

      {/* Remaining collections */}
      {collections && collections.slice(1).map((col) => (
        <CollectionSection key={col.id} collection={col} />
      ))}

      {/* Recommendations */}
      {user && recommendations && recommendations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-4">
            <Sparkles className="h-4 w-4 text-sage" />
            <h2 className="text-[17px] font-bold tracking-tight text-foreground">Для вас</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {recommendations.map((book) => (
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
      )}

      {/* New */}
      <section className="space-y-3">
        <SectionHeader title="Новинки" onSeeAll={() => navigate("/search")} />
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
          <div className="mx-4 flex flex-col items-center gap-2 rounded-2xl bg-card py-12 shadow-card">
            <p className="text-sm text-muted-foreground">Каталог пока пуст</p>
          </div>
        )}
      </section>
    </div>
  );
};

/* Featured banner like SmartReading promo cards */
const FeaturedBanner = ({ collection }: { collection: { id: string; title: string; description: string | null; book_ids: string[] | null } }) => {
  const navigate = useNavigate();
  const { data: books } = useCollectionBooks(collection.book_ids);
  const firstBook = books?.[0];

  return (
    <button
      onClick={() => firstBook ? navigate(`/book/${firstBook.id}`) : undefined}
      className="mx-4 flex items-center gap-4 rounded-2xl bg-sage-light p-4 shadow-card tap-highlight text-left"
    >
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium text-sage">Подборка</p>
        <p className="text-sm font-bold text-foreground leading-snug">{collection.title}</p>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{collection.description}</p>
        )}
        <div className="mt-2 inline-flex items-center gap-1 rounded-full gradient-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          К саммари <ChevronRight className="h-3 w-3" />
        </div>
      </div>
      {firstBook?.cover_url && (
        <img src={firstBook.cover_url} alt="" className="h-24 w-auto rounded-xl shadow-card object-cover" />
      )}
    </button>
  );
};

export default Index;
