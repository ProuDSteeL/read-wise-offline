import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCard from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchBooks, usePublishedBooks } from "@/hooks/useBooks";

const ALL_CATEGORIES = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы", "Наука", "Саморазвитие"];

type SortKey = "newest" | "popular" | "rating" | "fastest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Новые" },
  { key: "popular", label: "Популярные" },
  { key: "rating", label: "По рейтингу" },
  { key: "fastest", label: "Быстрые" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [query, setQuery] = useState(categoryFromUrl || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFromUrl);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const { data: results, isLoading } = useSearchBooks(query);
  const { data: allBooks } = usePublishedBooks();

  const isSearching = query.length >= 2;

  // Apply category filter
  let displayBooks = isSearching ? results : allBooks;

  if (activeCategory && displayBooks) {
    displayBooks = displayBooks.filter((b) => b.categories?.includes(activeCategory));
  }

  // Sort
  if (displayBooks) {
    displayBooks = [...displayBooks].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.views_count ?? 0) - (a.views_count ?? 0);
        case "rating":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "fastest":
          return (a.read_time_min ?? 999) - (b.read_time_min ?? 999);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
    } else {
      setActiveCategory(cat);
      if (!isSearching) setQuery("");
    }
  };

  return (
    <div className="animate-fade-in space-y-4 px-4 pt-12 pb-4">
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-2xl font-bold tracking-tight text-foreground">Поиск</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors tap-highlight ${
            showFilters ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Название, автор или тема..."
          className="pl-10 rounded-xl bg-secondary border-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors tap-highlight ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort options */}
      {showFilters && (
        <div className="flex gap-2 animate-fade-in">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors tap-highlight ${
                sortBy === key
                  ? "bg-primary text-primary-foreground"
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
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
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
                readTimeMin={book.read_time_min ?? undefined}
                className="w-full"
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>
        </>
      ) : isSearching || activeCategory ? (
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
