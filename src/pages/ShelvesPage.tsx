import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, BookMarked, Download, LogIn, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useShelfCounts, useDownloadCount, useUserShelves } from "@/hooks/useUserData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

type ShelfKey = "favorite" | "read" | "want_to_read" | "downloads";

const SHELF_META: Record<ShelfKey, { icon: typeof Heart; label: string }> = {
  favorite: { icon: Heart, label: "Избранное" },
  read: { icon: BookOpen, label: "Прочитано" },
  want_to_read: { icon: BookMarked, label: "Хочу прочитать" },
  downloads: { icon: Download, label: "Мои загрузки" },
};

const ShelvesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: counts } = useShelfCounts();
  const { data: downloadCount } = useDownloadCount();
  const [activeShelf, setActiveShelf] = useState<ShelfKey | null>(null);

  // Fetch books for active shelf
  const { data: shelfBooks, isLoading: loadingBooks } = useQuery({
    queryKey: ["shelf_books", user?.id, activeShelf],
    queryFn: async () => {
      if (activeShelf === "downloads") {
        const { data, error } = await supabase
          .from("user_downloads")
          .select("*, books(*)")
          .eq("user_id", user!.id)
          .order("downloaded_at", { ascending: false });
        if (error) throw error;
        return data.map((d: any) => ({ ...d.books, _join_id: d.id })) as (Book & { _join_id: string })[];
      }
      const { data, error } = await supabase
        .from("user_shelves")
        .select("*, books(*)")
        .eq("user_id", user!.id)
        .eq("shelf", activeShelf!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((d: any) => ({ ...d.books, _join_id: d.id })) as (Book & { _join_id: string })[];
    },
    enabled: !!user && !!activeShelf,
  });

  const removeFromShelf = useMutation({
    mutationFn: async ({ joinId, table }: { joinId: string; table: "user_downloads" | "user_shelves" }) => {
      const { error } = await supabase.from(table).delete().eq("id", joinId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf_books", user?.id, activeShelf] });
      queryClient.invalidateQueries({ queryKey: ["shelf_counts"] });
      queryClient.invalidateQueries({ queryKey: ["download_count"] });
      queryClient.invalidateQueries({ queryKey: ["is_favorite"] });
      queryClient.invalidateQueries({ queryKey: ["is_bookmarked"] });
      toast({ title: "Удалено с полки" });
    },
  });

  if (!user) {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 px-4 pt-32 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Войдите, чтобы сохранять книги на полки</p>
        <Button className="rounded-xl" onClick={() => navigate("/auth")}>
          <LogIn className="mr-2 h-4 w-4" /> Войти
        </Button>
      </div>
    );
  }

  // Shelf list view
  if (!activeShelf) {
    const shelves = [
      { key: "favorite" as const, count: counts?.favorite ?? 0 },
      { key: "read" as const, count: counts?.read ?? 0 },
      { key: "want_to_read" as const, count: counts?.want_to_read ?? 0 },
      { key: "downloads" as const, count: downloadCount ?? 0 },
    ];

    return (
      <div className="animate-fade-in space-y-6 px-4 pt-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Мои полки</h1>
        <div className="space-y-2">
          {shelves.map(({ key, count }) => {
            const { icon: Icon, label } = SHELF_META[key];
            return (
              <button
                key={key}
                onClick={() => setActiveShelf(key)}
                className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-colors tap-highlight hover:bg-secondary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{count} книг</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Shelf detail view
  const { icon: ShelfIcon, label: shelfLabel } = SHELF_META[activeShelf];
  const table = activeShelf === "downloads" ? "user_downloads" : "user_shelves";

  return (
    <div className="animate-fade-in space-y-4 px-4 pt-12">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveShelf(null)} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{shelfLabel}</h1>
      </div>

      {loadingBooks ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !shelfBooks?.length ? (
        <div className="py-12 text-center">
          <ShelfIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Здесь пока пусто</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shelfBooks.map((book) => (
            <div
              key={book._join_id}
              className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
            >
              <button
                onClick={() => navigate(`/book/${book.id}`)}
                className="flex flex-1 items-center gap-3 text-left tap-highlight"
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="h-16 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-lg bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                </div>
              </button>
              <button
                onClick={() => removeFromShelf.mutate({ joinId: book._join_id, table })}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive tap-highlight"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShelvesPage;
