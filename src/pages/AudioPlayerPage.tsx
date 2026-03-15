import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, SkipBack, SkipForward, X, Moon, Gauge, BookOpen } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useBook } from "@/hooks/useBooks";
import { useAudio } from "@/contexts/AudioContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import PaywallPrompt from "@/components/PaywallPrompt";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [
  { label: "Выкл", minutes: 0 },
  { label: "5 мин", minutes: 5 },
  { label: "15 мин", minutes: 15 },
  { label: "30 мин", minutes: 30 },
  { label: "60 мин", minutes: 60 },
];

const AudioPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);
  const audio = useAudio();
  const { canListenAudio } = useAccessControl();

  // Freemium guard
  if (!canListenAudio) {
    return <PaywallPrompt message="Аудио доступно в подписке Pro" />;
  }

  // Sleep timer
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const sleepInterval = useRef<ReturnType<typeof setInterval>>();

  // Panels
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showSleepPanel, setShowSleepPanel] = useState(false);

  // Load audio source when page loads (don't auto-play unless already playing)
  useEffect(() => {
    if (!summary?.audio_url || !id) return;
    if (audio.state.bookId !== id) {
      // Different book — load it but don't auto-play
      audio.load(id, summary.audio_url, book?.title);
    }
  }, [summary?.audio_url, id, book?.title]);

  // Sleep timer logic
  useEffect(() => {
    clearInterval(sleepInterval.current);
    if (sleepMinutes <= 0) {
      setSleepRemaining(0);
      return;
    }
    setSleepRemaining(sleepMinutes * 60);
    sleepInterval.current = setInterval(() => {
      setSleepRemaining((prev) => {
        if (prev <= 1) {
          audio.togglePlay();
          setSleepMinutes(0);
          clearInterval(sleepInterval.current);
          toast({ title: "Таймер сна сработал", description: "Воспроизведение остановлено" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sleepInterval.current);
  }, [sleepMinutes]);

  const handleSeek = (value: number[]) => {
    audio.seek(value[0]);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!summary?.audio_url) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-muted-foreground">Аудио пока не добавлено</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary">Назад</button>
      </div>
    );
  }

  const { playing, currentTime, duration, speed } = audio.state;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">Аудио</span>
        <button
          onClick={() => navigate(`/book/${id}/read`, { state: { autoPlayAudio: true } })}
          className="tap-highlight"
          title="Читать"
        >
          <BookOpen className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Cover + info */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <img
          src={book?.cover_url || "/placeholder.svg"}
          alt={book?.title}
          className="h-56 w-auto rounded-2xl shadow-elevated object-cover"
        />
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{book?.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{book?.author}</p>
        </div>
      </div>

      {/* Player controls */}
      <div className="space-y-4 px-6 pb-8 safe-bottom">
        {/* Seek bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => audio.skip(-15)} className="tap-highlight text-foreground">
            <SkipBack className="h-6 w-6" />
          </button>
          <button
            onClick={audio.togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated tap-highlight"
          >
            {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
          </button>
          <button onClick={() => audio.skip(15)} className="tap-highlight text-foreground">
            <SkipForward className="h-6 w-6" />
          </button>
        </div>

        {/* Secondary controls: speed + sleep */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => { setShowSpeedPanel(!showSpeedPanel); setShowSleepPanel(false); }}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground tap-highlight"
          >
            <Gauge className="h-3.5 w-3.5" />
            {speed}×
          </button>
          <button
            onClick={() => { setShowSleepPanel(!showSleepPanel); setShowSpeedPanel(false); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium tap-highlight ${
              sleepMinutes > 0
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-foreground"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            {sleepMinutes > 0 ? formatTime(sleepRemaining) : "Сон"}
          </button>
        </div>

        {/* Speed panel */}
        {showSpeedPanel && (
          <div className="animate-fade-in flex flex-wrap justify-center gap-2 rounded-xl bg-card p-3 shadow-card">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => { audio.setSpeed(s); setShowSpeedPanel(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}

        {/* Sleep timer panel */}
        {showSleepPanel && (
          <div className="animate-fade-in flex flex-wrap justify-center gap-2 rounded-xl bg-card p-3 shadow-card">
            {SLEEP_OPTIONS.map(({ label, minutes }) => (
              <button
                key={minutes}
                onClick={() => { setSleepMinutes(minutes); setShowSleepPanel(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  sleepMinutes === minutes
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
    </div>
  );
};

export default AudioPlayerPage;
