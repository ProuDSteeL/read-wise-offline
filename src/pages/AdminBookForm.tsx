import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Music, ChevronUp, ChevronDown, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const CATEGORIES = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы", "Наука", "Саморазвитие"];

interface KeyIdeaInput {
  title: string;
  content: string;
}

const AdminBookForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
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
  const [summaryContent, setSummaryContent] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [readTimeAuto, setReadTimeAuto] = useState(false);
  const mdFileRef = useRef<HTMLInputElement>(null);

  // Load existing book data for edit mode
  const { data: existingBook, isLoading: loadingBook } = useQuery({
    queryKey: ["admin-book", editId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("id", editId!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  const { data: existingIdeas } = useQuery({
    queryKey: ["admin-key-ideas", editId],
    queryFn: async () => {
      const { data, error } = await supabase.from("key_ideas").select("*").eq("book_id", editId!).order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  const { data: existingSummary } = useQuery({
    queryKey: ["admin-summary", editId],
    queryFn: async () => {
      const { data, error } = await supabase.from("summaries").select("*").eq("book_id", editId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  // Populate form when edit data loads
  useEffect(() => {
    if (existingBook) {
      setTitle(existingBook.title);
      setAuthor(existingBook.author);
      setDescription(existingBook.description || "");
      setAboutAuthor(existingBook.about_author || "");
      setReadTime(existingBook.read_time_min?.toString() || "");
      setListenTime(existingBook.listen_time_min?.toString() || "");
      setSelectedCategories(existingBook.categories || []);
      const why = existingBook.why_read as string[] | null;
      setWhyRead(why?.length ? why : [""]);
      setCoverPreview(existingBook.cover_url || null);
      setStatus(existingBook.status as "draft" | "published" | "archived");
    }
  }, [existingBook]);

  // Auto-calculate read time from word count
  useEffect(() => {
    if (summaryContent.trim() && !readTimeAuto) {
      const wordCount = summaryContent.trim().split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200);
      setReadTime(String(minutes));
    }
  }, [summaryContent, readTimeAuto]);

  useEffect(() => {
    if (existingIdeas?.length) {
      setKeyIdeas(existingIdeas.map((i) => ({ title: i.title, content: i.content })));
    }
  }, [existingIdeas]);

  useEffect(() => {
    if (existingSummary) {
      setSummaryContent(existingSummary.content || "");
      if (existingSummary.audio_url) setAudioFileName("Загружено ранее");
    }
  }, [existingSummary]);

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAudioChange = (file: File | null) => {
    setAudioFile(file);
    setAudioFileName(file?.name || null);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const moveIdea = (from: number, to: number) => {
    const updated = [...keyIdeas];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    setKeyIdeas(updated);
  };

  const handleMdUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) setSummaryContent(text);
    };
    reader.readAsText(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let coverUrl: string | null = isEditMode ? existingBook?.cover_url || null : null;
      let audioUrl: string | null = isEditMode ? existingSummary?.audio_url || null : null;
      let audioSize: number | null = isEditMode ? existingSummary?.audio_size_bytes || null : null;

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

      // Upload audio
      if (audioFile) {
        const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
        if (audioFile.size > MAX_AUDIO_SIZE) {
          throw new Error("Файл слишком большой. Максимум 100 МБ.");
        }

        const ext = audioFile.name.split(".").pop() || "mp3";
        const path = `${crypto.randomUUID()}.${ext}`;

        const uploadWithRetry = async (attempt = 1): Promise<void> => {
          const { error: uploadErr } = await supabase.storage
            .from("audio-files")
            .upload(path, audioFile, {
              contentType: audioFile.type || "audio/mpeg",
              upsert: false,
            });

          if (!uploadErr) return;

          if (uploadErr.message?.toLowerCase().includes("failed to fetch") && attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
            return uploadWithRetry(attempt + 1);
          }

          throw uploadErr;
        };

        try {
          await uploadWithRetry();
        } catch (error: any) {
          const message = (error?.message || "").toLowerCase();
          if (message.includes("failed to fetch")) {
            throw new Error("Сетевая ошибка при загрузке аудио. Проверьте интернет и попробуйте файл до 20–50 МБ.");
          }
          throw new Error(`Ошибка загрузки аудио: ${error?.message || "неизвестная ошибка"}`);
        }

        audioUrl = path;
        audioSize = audioFile.size;
      }

      const bookPayload = {
        title,
        author,
        description: description || null,
        about_author: aboutAuthor || null,
        read_time_min: readTime ? parseInt(readTime) : 0,
        listen_time_min: listenTime ? parseInt(listenTime) : 0,
        categories: selectedCategories,
        why_read: whyRead.filter((r) => r.trim()),
        cover_url: coverUrl,
        status,
      };

      let bookId: string;

      if (isEditMode) {
        const { error } = await supabase.from("books").update(bookPayload).eq("id", editId!);
        if (error) throw error;
        bookId = editId!;

        // Replace key ideas
        await supabase.from("key_ideas").delete().eq("book_id", bookId);
      } else {
        const { data: book, error } = await supabase
          .from("books")
          .insert(bookPayload)
          .select("id")
          .single();
        if (error) throw error;
        bookId = book.id;
      }

      // Insert key ideas
      const validIdeas = keyIdeas.filter((k) => k.title.trim() && k.content.trim());
      if (validIdeas.length > 0) {
        const { error: ideasErr } = await supabase.from("key_ideas").insert(
          validIdeas.map((idea, i) => ({
            book_id: bookId,
            title: idea.title,
            content: idea.content,
            order_index: i,
          }))
        );
        if (ideasErr) throw ideasErr;
      }

      // Upsert summary
      if (summaryContent.trim() || audioUrl) {
        const summaryPayload = {
          book_id: bookId,
          content: summaryContent || null,
          audio_url: audioUrl,
          audio_size_bytes: audioSize,
          published_at: status === "published" ? new Date().toISOString() : null,
        };

        if (isEditMode && existingSummary) {
          const { error } = await supabase.from("summaries").update(summaryPayload).eq("id", existingSummary.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("summaries").insert(summaryPayload);
          if (error) throw error;
        }
      }

      return bookId;
    },
    onSuccess: (bookId) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({
        title: isEditMode ? "Книга обновлена!" : "Книга добавлена!",
        description: status === "published" ? "Опубликована" : status === "archived" ? "В архиве" : "Сохранена как черновик",
      });
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

  if (checkingAdmin || (isEditMode && loadingBook)) {
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
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {isEditMode ? "Редактировать книгу" : "Добавить книгу"}
        </h1>
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
            <Input
              type="file"
              accept="image/*"
              className="text-xs"
              onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
            />
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
            <Input type="number" value={readTime} onChange={(e) => { setReadTime(e.target.value); setReadTimeAuto(true); }} placeholder="15" className="rounded-xl bg-secondary border-0" />
            <p className="text-[10px] text-muted-foreground">Авто: ~200 слов/мин</p>
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

        {/* Summary (Markdown) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Саммари (Markdown)</label>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => mdFileRef.current?.click()}>
              <FileUp className="h-3 w-3" /> Загрузить .md
            </Button>
            <input
              ref={mdFileRef}
              type="file"
              accept=".md,.txt,.markdown"
              className="hidden"
              onChange={(e) => handleMdUpload(e.target.files?.[0] || null)}
            />
          </div>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Редактор</TabsTrigger>
              <TabsTrigger value="preview">Превью</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <Textarea
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                placeholder="# Введение&#10;&#10;Текст саммари в формате Markdown..."
                rows={12}
                className="rounded-xl bg-secondary border-0 resize-none font-mono text-xs"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[200px] rounded-xl bg-secondary p-4 text-sm leading-relaxed font-serif">
                {summaryContent.trim() ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="mb-3 mt-6 text-xl font-bold">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-muted-foreground">{children}</p>,
                      blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    }}
                  >
                    {summaryContent}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">Введите текст саммари для предпросмотра</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Audio upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Аудио саммари</label>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept="audio/*"
                className="text-xs"
                onChange={(e) => handleAudioChange(e.target.files?.[0] || null)}
              />
              {audioFileName && (
                <p className="mt-1 text-xs text-muted-foreground">{audioFileName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Key ideas */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Ключевые идеи</label>
          {keyIdeas.map((idea, i) => (
            <div key={i} className="space-y-2 rounded-xl bg-card p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">Идея {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => moveIdea(i, i - 1)} className="text-muted-foreground disabled:opacity-30">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={i === keyIdeas.length - 1} onClick={() => moveIdea(i, i + 1)} className="text-muted-foreground disabled:opacity-30">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {keyIdeas.length > 1 && (
                    <button type="button" onClick={() => setKeyIdeas(keyIdeas.filter((_, j) => j !== i))} className="text-destructive ml-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            {(["draft", "published", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  status === s ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {s === "draft" ? "Черновик" : s === "published" ? "Публикация" : "Архив"}
              </button>
            ))}
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl h-12"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminBookForm;
