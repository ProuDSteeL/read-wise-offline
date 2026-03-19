import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCard from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchBooks, usePublishedBooks } from "@/hooks/useBooks";
import { useTags } from "@/hooks/useTags";

type SortKey = "newest" | "fastest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Новые" },
  { key: "fastest", label: "Быстрые" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFromUrl);
  useEffect(() => {
    setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const { data: results, isLoading } = useSearchBooks(query);
  const { data: allBooks } = usePublishedBooks();
  const allTags = useTags();

  const isSearching = query.length >= 2;
  let displayBooks = isSearching ? results : allBooks;

  if (activeCategory && displayBooks) {
    const catLower = activeCategory.toLowerCase();
    displayBooks = displayBooks.filter((b) =>
      b.tags?.some((t) => t.toLowerCase() === catLower)
    );
  }

  if (displayBooks) {
    displayBooks = [...displayBooks].sort((a, b) => {
      switch (sortBy) {
        case "fastest": return (a.read_time_minutes ?? 999) - (b.read_time_minutes ?? 999);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  const handleCategoryClick = (cat: string) => {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    if (next) {
      setSearchParams({ category: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="animate-fade-in space-y-4 px-4 pt-14 pb-6">
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-[26px] font-extrabold tracking-tight text-foreground">Поиск</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors tap-highlight ${
            showFilters ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground shadow-card"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder="Название, автор или тема..."
          className="h-11 pl-10 rounded-xl bg-card border-0 shadow-card text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {allTags.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all tap-highlight ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="flex gap-2 animate-fade-in">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all tap-highlight ${
                sortBy === key
                  ? "gradient-accent text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading && isSearching ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
            </div>
          ))}
        </div>
      ) : displayBooks && displayBooks.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            {activeCategory ? `${activeCategory} · ` : ""}{displayBooks.length} книг
          </p>
          <div className="grid grid-cols-2 gap-4 pb-4">
            {displayBooks.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url || "/placeholder.svg"}
                readTimeMin={book.read_time_minutes ?? undefined}
                className="w-full"
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-light mb-4">
            <Search className="h-7 w-7 text-sage/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isSearching || activeCategory ? "Ничего не найдено" : "Введите запрос, чтобы найти саммари"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
