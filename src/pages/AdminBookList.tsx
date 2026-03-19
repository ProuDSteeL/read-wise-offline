import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Library, Tag, X, Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortKey = "newest" | "oldest" | "title" | "author";

const AdminBookList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const [showTags, setShowTags] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
    enabled: !!isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await supabase.from("key_ideas").delete().eq("book_id", bookId);
      await supabase.from("quiz_questions").delete().eq("book_id", bookId);
      await supabase.from("flashcards").delete().eq("book_id", bookId);
      await supabase.from("summaries").delete().eq("book_id", bookId);
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Книга удалена" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    },
  });

  // Collect all unique tags
  const allTags = useMemo(
    () =>
      Array.from(new Set((books ?? []).flatMap((b) => b.tags ?? []))).sort((a, b) =>
        a.localeCompare(b, "ru")
      ),
    [books]
  );

  const deleteTagMutation = useMutation({
    mutationFn: async (tag: string) => {
      const booksWithTag = (books ?? []).filter((b) => b.tags?.includes(tag));
      for (const book of booksWithTag) {
        const newTags = (book.tags ?? []).filter((t) => t !== tag);
        const { error } = await supabase.from("books").update({ tags: newTags }).eq("id", book.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Тег удалён из всех книг" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("books").update({ status: newStatus as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  // Filter & sort
  const filteredBooks = useMemo(() => {
    let list = books ?? [];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    // Tag filter
    if (tagFilter) {
      list = list.filter((b) => b.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title, "ru");
        case "author":
          return a.author.localeCompare(b.author, "ru");
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [books, statusFilter, tagFilter, search, sortBy]);

  // Counts
  const counts = useMemo(() => {
    const all = books ?? [];
    return {
      all: all.length,
      published: all.filter((b) => b.status === "published").length,
      draft: all.filter((b) => b.status === "draft").length,
      archived: all.filter((b) => b.status === "archived").length,
    };
  }, [books]);

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-foreground">Доступ запрещён</p>
        <Button variant="outline" onClick={() => navigate("/")}>На главную</Button>
      </div>
    );
  }

  const statusLabel = (s: string) =>
    s === "published" ? "Опубликована" : s === "archived" ? "Архив" : "Черновик";

  const statusColor = (s: string) =>
    s === "published"
      ? "bg-green-500/10 text-green-600"
      : s === "archived"
      ? "bg-muted text-muted-foreground"
      : "bg-yellow-500/10 text-yellow-600";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/90 px-4 py-3 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")} className="tap-highlight">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Книги</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {counts.all}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" onClick={() => setShowFilters(!showFilters)} className={`h-8 w-8 rounded-lg ${showFilters ? "bg-primary/10 text-primary" : ""}`}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setShowTags(!showTags)} className={`h-8 w-8 rounded-lg ${showTags ? "bg-primary/10 text-primary" : ""}`}>
              <Tag className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => navigate("/admin/collections")} className="h-8 w-8 rounded-lg">
              <Library className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/book/new")} className="gap-1 rounded-lg h-8">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Поиск по названию или автору..."
            className="h-9 pl-9 rounded-lg bg-secondary border-0 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5">
          {(
            [
              { key: "all" as StatusFilter, label: "Все", count: counts.all },
              { key: "published" as StatusFilter, label: "Опубл.", count: counts.published },
              { key: "draft" as StatusFilter, label: "Черновики", count: counts.draft },
              { key: "archived" as StatusFilter, label: "Архив", count: counts.archived },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {label} {count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mx-4 mt-3 rounded-xl bg-card p-3 shadow-card space-y-3 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground">Сортировка</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "newest" as SortKey, label: "Новые" },
                { key: "oldest" as SortKey, label: "Старые" },
                { key: "title" as SortKey, label: "По названию" },
                { key: "author" as SortKey, label: "По автору" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground">По тегу</p>
              <div className="flex flex-wrap gap-1.5">
                {tagFilter && (
                  <button
                    onClick={() => setTagFilter(null)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-destructive/10 text-destructive"
                  >
                    Сбросить ×
                  </button>
                )}
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      tagFilter === tag
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tags management panel */}
      {showTags && (
        <div className="mx-4 mt-3 rounded-xl bg-card p-4 shadow-card space-y-3 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground">
            Управление тегами ({allTags.length})
          </p>
          {allTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">Тегов пока нет</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const count = (books ?? []).filter((b) => b.tags?.includes(tag)).length;
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {tag}
                    <span className="text-muted-foreground">({count})</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Удалить тег «${tag}» из всех книг (${count})?`)) {
                          deleteTagMutation.mutate(tag);
                        }
                      }}
                      className="rounded-full p-0.5 text-destructive hover:bg-destructive/10"
                      aria-label={`Удалить тег ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Book list */}
      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {(books ?? []).length === 0
                ? "Книг пока нет"
                : "Ничего не найдено"}
            </p>
            {(books ?? []).length === 0 && (
              <Button className="mt-4 rounded-xl" onClick={() => navigate("/admin/book/new")}>
                Добавить первую книгу
              </Button>
            )}
            {search || statusFilter !== "all" || tagFilter ? (
              <Button
                variant="ghost"
                className="mt-2 text-xs"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTagFilter(null);
                }}
              >
                Сбросить фильтры
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground pb-1">
              {filteredBooks.length === (books ?? []).length
                ? `${filteredBooks.length} книг`
                : `${filteredBooks.length} из ${(books ?? []).length}`}
            </p>
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-12 shrink-0 rounded-lg bg-secondary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(book.status)}`}
                    >
                      {statusLabel(book.status)}
                    </span>
                    {book.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="inline-block rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    {(book.tags?.length ?? 0) > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{(book.tags?.length ?? 0) - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: book.id,
                        newStatus: book.status === "published" ? "draft" : "published",
                      })
                    }
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                    title={book.status === "published" ? "Снять с публикации" : "Опубликовать"}
                  >
                    {book.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/book/${book.id}/edit`)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                    title="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Удалить книгу «" + book.title + "»?")) {
                        deleteMutation.mutate(book.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBookList;
