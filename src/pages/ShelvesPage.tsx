import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, BookMarked, Download, LogIn, ArrowLeft, Trash2, Highlighter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useShelfCounts, useDownloadCount } from "@/hooks/useUserData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

type ShelfKey = "favorite" | "read" | "want_to_read" | "downloads" | "highlights";

const SHELF_META: Record<ShelfKey, { icon: typeof Heart; label: string }> = {
  favorite: { icon: Heart, label: "Избранное" },
  read: { icon: BookOpen, label: "Прочитано" },
  want_to_read: { icon: BookMarked, label: "Хочу прочитать" },
  downloads: { icon: Download, label: "Мои загрузки" },
  highlights: { icon: Highlighter, label: "Заметки и цитаты" },
};

const ShelvesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: counts } = useShelfCounts();
  const { data: downloadCount } = useDownloadCount();
  const [activeShelf, setActiveShelf] = useState<ShelfKey | null>(null);

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
      toast({ title: "Удалено с полки" });
    },
  });

  if (!user) {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-5 px-4 pt-32 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-light">
          <BookOpen className="h-8 w-8 text-sage" />
        </div>
        <p className="text-sm text-muted-foreground">Войдите, чтобы сохранять<br/>книги на полки</p>
        <Button className="rounded-full h-11 px-8" onClick={() => navigate("/auth")}>
          <LogIn className="mr-2 h-4 w-4" /> Войти
        </Button>
      </div>
    );
  }

  if (!activeShelf) {
    const shelves = [
      { key: "favorite" as const, count: counts?.favorite ?? 0 },
      { key: "read" as const, count: counts?.read ?? 0 },
      { key: "want_to_read" as const, count: counts?.want_to_read ?? 0 },
      { key: "downloads" as const, count: downloadCount ?? 0 },
    ];

    return (
      <div className="animate-fade-in space-y-6 px-4 pt-14">
        <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">Мои полки</h1>
        <div className="space-y-2">
          {shelves.map(({ key, count }) => {
            const { icon: Icon, label } = SHELF_META[key];
            return (
              <button
                key={key}
                onClick={() => setActiveShelf(key)}
                className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-all tap-highlight"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light">
                  <Icon className="h-5 w-5 text-sage" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{count} книг</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const { icon: ShelfIcon, label: shelfLabel } = SHELF_META[activeShelf];
  const table = activeShelf === "downloads" ? "user_downloads" : "user_shelves";

  return (
    <div className="animate-fade-in space-y-4 px-4 pt-14">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveShelf(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-card tap-highlight">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{shelfLabel}</h1>
      </div>

      {loadingBooks ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !shelfBooks?.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShelfIcon className="h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Здесь пока пусто</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shelfBooks.map((book) => (
            <div key={book._join_id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
              <button
                onClick={() => navigate(`/book/${book.id}`)}
                className="flex flex-1 items-center gap-3 text-left tap-highlight"
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="h-16 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-xl bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                </div>
              </button>
              <button
                onClick={() => removeFromShelf.mutate({ joinId: book._join_id, table })}
                className="shrink-0 rounded-xl p-2.5 text-muted-foreground/30 hover:text-destructive tap-highlight"
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
