import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, WifiOff, Play, Pause } from "lucide-react";
import { getTextOffline, getAudioOffline, getBookMeta } from "@/lib/offlineStorage";
import ReactMarkdown from "react-markdown";

type ReaderTheme = "light" | "dark" | "sepia";
const themeClasses: Record<ReaderTheme, string> = { light: "", dark: "dark", sepia: "sepia" };

const OfflineReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; author: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioEl] = useState(() => typeof Audio !== "undefined" ? new Audio() : null);

  const theme = (localStorage.getItem("reader-theme") as ReaderTheme) || "light";
  const fontFamily = localStorage.getItem("reader-font") || "serif";
  const fontSize = parseInt(localStorage.getItem("reader-font-size") || "18");
  const fontClass = fontFamily === "serif" ? "font-serif" : "font-sans";

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
    return () => { audioEl?.pause(); };
  }, [id]);

  const toggleAudio = () => {
    if (!audioEl || !audioUrl) return;
    if (playing) {
      audioEl.pause();
      setPlaying(false);
    } else {
      audioEl.src = audioUrl;
      audioEl.play().then(() => setPlaying(true)).catch(() => {});
      audioEl.onended = () => setPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${themeClasses[theme]} bg-background text-foreground transition-colors duration-300`}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate("/downloads")} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="flex-1 truncate text-sm font-semibold text-foreground">{meta?.title || "Офлайн"}</span>
        <div className="flex items-center gap-2">
          {audioUrl && (
            <button onClick={toggleAudio} className="tap-highlight">
              {playing
                ? <Pause className="h-5 w-5 text-primary" />
                : <Play className="h-5 w-5 text-muted-foreground" />}
            </button>
          )}
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Content */}
      <article
        className={`mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
      >
        {content ? (
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-8 text-[1.4em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-6 text-[1.2em] font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-5 text-[1.1em] font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 text-muted-foreground">{children}</p>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              li: ({ children }) => (
                <li className="mb-1 text-muted-foreground">{children}</li>
              ),
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              hr: () => <hr className="my-6 border-border" />,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <WifiOff className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Текст не был загружен для офлайн-доступа</p>
          </div>
        )}
      </article>
    </div>
  );
};

export default OfflineReaderPage;
