import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

const AdminBookList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

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
      // Delete key_ideas, summaries first, then book
      await supabase.from("key_ideas").delete().eq("book_id", bookId);
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

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="tap-highlight">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Управление книгами</h1>
        </div>
        <Button size="sm" onClick={() => navigate("/admin/book/new")} className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> Новая
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !books?.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Книг пока нет</p>
            <Button className="mt-4 rounded-xl" onClick={() => navigate("/admin/book/new")}>
              Добавить первую книгу
            </Button>
          </div>
        ) : (
          books.map((book) => (
            <div key={book.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
              {book.cover_url ? (
                <img src={book.cover_url} alt="" className="h-16 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-12 rounded-lg bg-secondary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  book.status === "published" 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-yellow-500/10 text-yellow-600"
                }`}>
                  {book.status === "published" ? "Опубликована" : "Черновик"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleStatusMutation.mutate({
                    id: book.id,
                    newStatus: book.status === "published" ? "draft" : "published"
                  })}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                >
                  {book.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => navigate(`/admin/book/${book.id}/edit`)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
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
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBookList;
