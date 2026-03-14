import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы", "Наука", "Саморазвитие"];

interface KeyIdeaInput {
  title: string;
  content: string;
}

const AdminBookForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [aboutAuthor, setAboutAuthor] = useState("");
  const [readTime, setReadTime] = useState("");
  const [listenTime, setListenTime] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [whyRead, setWhyRead] = useState<string[]>([""]);
  const [keyIdeas, setKeyIdeas] = useState<KeyIdeaInput[]>([{ title: "", content: "" }]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [publish, setPublish] = useState(false);

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let coverUrl: string | null = null;

      // Upload cover
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("book-covers")
          .upload(path, coverFile, { contentType: coverFile.type });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      // Insert book
      const { data: book, error: bookErr } = await supabase
        .from("books")
        .insert({
          title,
          author,
          description: description || null,
          about_author: aboutAuthor || null,
          read_time_min: readTime ? parseInt(readTime) : 0,
          listen_time_min: listenTime ? parseInt(listenTime) : 0,
          categories: selectedCategories,
          why_read: whyRead.filter((r) => r.trim()),
          cover_url: coverUrl,
          status: publish ? "published" : "draft",
        })
        .select("id")
        .single();
      if (bookErr) throw bookErr;

      // Insert key ideas
      const validIdeas = keyIdeas.filter((k) => k.title.trim() && k.content.trim());
      if (validIdeas.length > 0) {
        const { error: ideasErr } = await supabase.from("key_ideas").insert(
          validIdeas.map((idea, i) => ({
            book_id: book.id,
            title: idea.title,
            content: idea.content,
            order_index: i,
          }))
        );
        if (ideasErr) throw ideasErr;
      }

      return book.id;
    },
    onSuccess: (bookId) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Книга добавлена!", description: publish ? "Опубликована" : "Сохранена как черновик" });
      navigate(`/book/${bookId}`);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast({ title: "Заполните название и автора", variant: "destructive" });
      return;
    }
    mutation.mutate();
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
        <p className="text-sm text-muted-foreground">Эта страница только для администраторов</p>
        <Button variant="outline" onClick={() => navigate("/")}>На главную</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Добавить книгу</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-4 pb-8">
        {/* Cover upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Обложка</label>
          <div className="flex items-end gap-4">
            {coverPreview ? (
              <img src={coverPreview} alt="Preview" className="h-32 w-auto rounded-xl object-cover shadow-card" />
            ) : (
              <div className="flex h-32 w-24 items-center justify-center rounded-xl bg-secondary">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        {/* Title & Author */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Название *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Атомные привычки" className="rounded-xl bg-secondary border-0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Автор *</label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Джеймс Клир" className="rounded-xl bg-secondary border-0" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Описание</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="О чём эта книга..." rows={3} className="rounded-xl bg-secondary border-0 resize-none" />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Категории</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Read/Listen time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Чтение (мин)</label>
            <Input type="number" value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="15" className="rounded-xl bg-secondary border-0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Аудио (мин)</label>
            <Input type="number" value={listenTime} onChange={(e) => setListenTime(e.target.value)} placeholder="20" className="rounded-xl bg-secondary border-0" />
          </div>
        </div>

        {/* Why read */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Зачем читать</label>
          {whyRead.map((reason, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={reason}
                onChange={(e) => {
                  const updated = [...whyRead];
                  updated[i] = e.target.value;
                  setWhyRead(updated);
                }}
                placeholder={`Причина ${i + 1}`}
                className="rounded-xl bg-secondary border-0"
              />
              {whyRead.length > 1 && (
                <button type="button" onClick={() => setWhyRead(whyRead.filter((_, j) => j !== i))} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setWhyRead([...whyRead, ""])} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Добавить
          </Button>
        </div>

        {/* About author */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Об авторе</label>
          <Textarea value={aboutAuthor} onChange={(e) => setAboutAuthor(e.target.value)} placeholder="Биография автора..." rows={2} className="rounded-xl bg-secondary border-0 resize-none" />
        </div>

        {/* Key ideas */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Ключевые идеи</label>
          {keyIdeas.map((idea, i) => (
            <div key={i} className="space-y-2 rounded-xl bg-card p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">Идея {i + 1}</span>
                {keyIdeas.length > 1 && (
                  <button type="button" onClick={() => setKeyIdeas(keyIdeas.filter((_, j) => j !== i))} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Input
                value={idea.title}
                onChange={(e) => {
                  const updated = [...keyIdeas];
                  updated[i] = { ...updated[i], title: e.target.value };
                  setKeyIdeas(updated);
                }}
                placeholder="Заголовок идеи"
                className="rounded-lg bg-secondary border-0 text-sm"
              />
              <Textarea
                value={idea.content}
                onChange={(e) => {
                  const updated = [...keyIdeas];
                  updated[i] = { ...updated[i], content: e.target.value };
                  setKeyIdeas(updated);
                }}
                placeholder="Содержание идеи..."
                rows={3}
                className="rounded-lg bg-secondary border-0 resize-none text-sm"
              />
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setKeyIdeas([...keyIdeas, { title: "", content: "" }])} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Добавить идею
          </Button>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            variant="secondary"
            className="flex-1 rounded-xl"
            disabled={mutation.isPending}
            onClick={() => setPublish(false)}
          >
            {mutation.isPending && !publish ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Черновик
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-xl"
            disabled={mutation.isPending}
            onClick={() => setPublish(true)}
          >
            {mutation.isPending && publish ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Опубликовать
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminBookForm;
