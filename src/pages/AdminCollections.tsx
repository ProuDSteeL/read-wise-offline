import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePublishedBooks } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  book_ids: string[] | null;
  is_featured: boolean | null;
  order_index: number | null;
}

const AdminCollections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const { data: allBooks } = usePublishedBooks();

  const [editing, setEditing] = useState<Collection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(true);

  const { data: collections, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Collection[];
    },
    enabled: !!isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || null,
        book_ids: selectedBookIds,
        is_featured: isFeatured,
      };
      if (isNew) {
        const { error } = await supabase.from("collections").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collections").update(payload).eq("id", editing!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast({ title: isNew ? "Коллекция создана" : "Коллекция обновлена" });
      closeEditor();
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast({ title: "Коллекция удалена" });
    },
  });

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: "", title: "", description: null, book_ids: [], is_featured: true, order_index: 0 });
    setTitle("");
    setDescription("");
    setSelectedBookIds([]);
    setIsFeatured(true);
  };

  const openEdit = (col: Collection) => {
    setIsNew(false);
    setEditing(col);
    setTitle(col.title);
    setDescription(col.description || "");
    setSelectedBookIds(col.book_ids || []);
    setIsFeatured(col.is_featured ?? true);
  };

  const closeEditor = () => {
    setEditing(null);
    setIsNew(false);
  };

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

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

  // Editor view
  if (editing) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-background">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={closeEditor} className="tap-highlight">
              <X className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {isNew ? "Новая коллекция" : "Редактирование"}
            </h1>
          </div>
          <Button
            size="sm"
            className="rounded-xl"
            disabled={!title.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Название</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
              placeholder="Лучшие книги по продуктивности"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Описание</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
              placeholder="Необязательно"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Показывать на главной</span>
          </label>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Книги ({selectedBookIds.length} выбрано)
            </label>
            <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-xl border p-2">
              {allBooks?.map((book) => (
                <button
                  key={book.id}
                  onClick={() => toggleBook(book.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors tap-highlight ${
                    selectedBookIds.includes(book.id)
                      ? "bg-primary/10"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    selectedBookIds.includes(book.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}>
                    {selectedBookIds.includes(book.id) && <Check className="h-3 w-3" />}
                  </div>
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" className="h-10 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-8 rounded bg-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/books")} className="tap-highlight">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Коллекции</h1>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> Новая
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !collections?.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Коллекций пока нет</p>
            <Button className="mt-4 rounded-xl" onClick={openNew}>
              Создать первую
            </Button>
          </div>
        ) : (
          collections.map((col) => (
            <div key={col.id} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                <p className="text-xs text-muted-foreground">
                  {col.book_ids?.length ?? 0} книг
                  {col.is_featured ? " · На главной" : ""}
                </p>
              </div>
              <button
                onClick={() => openEdit(col)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm("Удалить коллекцию «" + col.title + "»?")) {
                    deleteMutation.mutate(col.id);
                  }
                }}
                className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCollections;
