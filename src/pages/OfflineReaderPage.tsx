import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, WifiOff, Play, Pause, SkipBack, SkipForward, Gauge, Moon, ChevronUp, ChevronDown } from "lucide-react";
import { getTextOffline, getBookMeta } from "@/lib/offlineStorage";
import { useAudio } from "@/contexts/AudioContext";
import { SLEEP_OPTIONS, SPEEDS } from "@/lib/audioConstants";
import { Slider } from "@/components/ui/slider";
import ReactMarkdown from "react-markdown";

type ReaderTheme = "light" | "dark" | "sepia";
const themeClasses: Record<ReaderTheme, string> = { light: "", dark: "dark", sepia: "sepia" };

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const OfflineReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const audio = useAudio();
  const [content, setContent] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; author: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Player UI
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showSleepPanel, setShowSleepPanel] = useState(false);

  // Reader settings
  const theme = (localStorage.getItem("reader-theme") as ReaderTheme) || "light";
  const fontFamily = localStorage.getItem("reader-font") || "serif";
  const fontSize = parseInt(localStorage.getItem("reader-font-size") || "18");
  const fontClass = fontFamily === "serif" ? "font-serif" : "font-sans";

  // Load offline data
  useEffect(() => {
    if (!id) return;
    Promise.all([getTextOffline(id), getBookMeta(id)]).then(
      ([text, bookMeta]) => {
        setContent(text);
        if (bookMeta) setMeta({ title: bookMeta.title, author: bookMeta.author });
        setLoading(false);

        // Load audio through AudioContext (it will try offline first via getAudioOffline)
        if (bookMeta?.hasAudio) {
          audio.load({
            bookId: id,
            bookTitle: bookMeta.title,
            author: bookMeta.author,
            coverUrl: bookMeta.coverUrl,
          });
        }
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
    <div className={`relative min-h-screen ${themeClasses[theme]} bg-background text-foreground transition-colors duration-300`}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate("/downloads")} className="tap-highlight">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="flex-1 truncate text-sm font-semibold text-foreground">{meta?.title || "Офлайн"}</span>
        <WifiOff className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <article
        className={`mx-auto max-w-md px-5 py-6 ${fontClass} leading-relaxed text-foreground`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8, paddingBottom: audio.isActive ? "10rem" : undefined }}
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
              p: ({ children }) => <p className="mb-4 text-muted-foreground">{children}</p>,
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              li: ({ children }) => <li className="mb-1 text-muted-foreground">{children}</li>,
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

      {/* Sticky bottom audio player */}
      {audio.isActive && (
        <div className="fixed bottom-0 inset-x-0 z-30 safe-bottom">
          <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl">
            {/* Mini bar */}
            <button
              onClick={() => setPlayerExpanded(!playerExpanded)}
              className="flex w-full items-center gap-3 px-4 py-2"
            >
              <button
                onClick={(e) => { e.stopPropagation(); audio.togglePlay(); }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                {audio.state.playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{meta?.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatTime(audio.state.currentTime)} / {formatTime(audio.state.duration)}
                </p>
              </div>
              {audio.sleepTimer && (
                <span className="text-[10px] text-primary font-medium">
                  <Moon className="inline h-3 w-3 mr-0.5" />
                  {formatTime(audio.sleepRemaining)}
                </span>
              )}
              {playerExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Expanded controls */}
            {playerExpanded && (
              <div className="animate-fade-in space-y-3 px-4 pb-4">
                <div className="space-y-1">
                  <Slider
                    value={[audio.state.currentTime]}
                    max={audio.state.duration || 100}
                    step={1}
                    onValueChange={(v) => audio.seek(v[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatTime(audio.state.currentTime)}</span>
                    <span>-{formatTime(Math.max(0, audio.state.duration - audio.state.currentTime))}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button onClick={() => audio.skip(-15)} className="relative tap-highlight text-foreground">
                    <SkipBack className="h-5 w-5" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold leading-none ml-0.5">15</span>
                  </button>
                  <button
                    onClick={audio.togglePlay}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated tap-highlight"
                  >
                    {audio.state.playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
                  </button>
                  <button onClick={() => audio.skip(15)} className="relative tap-highlight text-foreground">
                    <SkipForward className="h-5 w-5" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold leading-none mr-0.5">15</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => { setShowSpeedPanel(!showSpeedPanel); setShowSleepPanel(false); }}
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground tap-highlight"
                  >
                    <Gauge className="h-3.5 w-3.5" />
                    {audio.state.speed}x
                  </button>
                  <button
                    onClick={() => { setShowSleepPanel(!showSleepPanel); setShowSpeedPanel(false); }}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium tap-highlight ${
                      audio.sleepTimer ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    {audio.sleepTimer ? formatTime(audio.sleepRemaining) : "Сон"}
                  </button>
                </div>

                {showSpeedPanel && (
                  <div className="animate-fade-in flex flex-wrap justify-center gap-2 rounded-xl bg-card p-3 shadow-card">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { audio.setSpeed(s); setShowSpeedPanel(false); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          audio.state.speed === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}

                {showSleepPanel && (
                  <div className="animate-fade-in flex flex-wrap justify-center gap-2 rounded-xl bg-card p-3 shadow-card">
                    {SLEEP_OPTIONS.map(({ label, minutes }) => (
                      <button
                        key={minutes}
                        onClick={() => { audio.setSleepTimer(minutes); setShowSleepPanel(false); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          audio.sleepTimer && audio.sleepTimer.totalMinutes === minutes
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineReaderPage;
