import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCard from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchBooks, usePublishedBooks } from "@/hooks/useBooks";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [query, setQuery] = useState(categoryFilter || "");
  const navigate = useNavigate();

  const { data: results, isLoading } = useSearchBooks(query);
  const { data: allBooks } = usePublishedBooks();

  const filteredByCategory = categoryFilter && allBooks
    ? allBooks.filter((b) => b.categories?.includes(categoryFilter))
    : null;

  const displayBooks = query.length >= 2 ? results : filteredByCategory;

  return (
    <div className="animate-fade-in space-y-6 px-4 pt-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Поиск</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Название, автор или тема..."
          className="pl-10 rounded-xl bg-secondary border-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && query.length >= 2 ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : displayBooks && displayBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 pb-4">
          {displayBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.cover_url || "/placeholder.svg"}
              readTimeMin={book.read_time_min ?? undefined}
              className="w-full"
              onClick={() => navigate(`/book/${book.id}`)}
            />
          ))}
        </div>
      ) : query.length >= 2 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Ничего не найдено</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Введите запрос, чтобы найти саммари
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
