import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, WifiOff } from "lucide-react";
import { getTextOffline, getAudioOffline, getBookMeta } from "@/lib/offlineStorage";
import ReactMarkdown from "react-markdown";

const OfflineReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; author: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTextOffline(id), getBookMeta(id), getAudioOffline(id)]).then(
      ([text, bookMeta, audio]) => {
        setContent(text);
        if (bookMeta) setMeta({ title: bookMeta.title, author: bookMeta.author });
        setAudioUrl(audio);
        setLoading(false);
      }
    );
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate("/downloads")} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="flex-1 truncate text-sm font-semibold">{meta?.title || "Офлайн"}</span>
        <WifiOff className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <article className="prose prose-sm max-w-none px-5 py-6 dark:prose-invert" style={{ fontFamily: "'Literata', serif", fontSize: 18 }}>
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className="text-center text-muted-foreground">Текст не был загружен для офлайн-доступа</p>
        )}
      </article>

      {/* Audio player for offline */}
      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-4 pb-4">
          <audio controls src={audioUrl} className="w-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

export default OfflineReaderPage;
