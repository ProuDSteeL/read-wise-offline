import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, SkipBack, SkipForward, X, Moon, Gauge, BookOpen } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useBook } from "@/hooks/useBooks";
import { useAudio } from "@/contexts/AudioContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import PaywallPrompt from "@/components/PaywallPrompt";
import { Slider } from "@/components/ui/slider";
import { SLEEP_OPTIONS, SPEEDS } from "@/lib/audioConstants";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const AudioPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);
  const { state, togglePlay, seek, skip, setSpeed, load, sleepTimer, sleepRemaining, setSleepTimer, cancelSleepTimer } = useAudio();
  const { canListenAudio } = useAccessControl();

  // Panels
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showSleepPanel, setShowSleepPanel] = useState(false);

  // Custom duration input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);

  // Load audio source when page loads (don't auto-play unless already playing)
  useEffect(() => {
    if (!summary?.audio_url || !id) return;
    if (state.bookId !== id) {
      // Different book -- load it but don't auto-play, pass metadata for Media Session
      load({ bookId: id, bookTitle: book?.title, author: book?.author, coverUrl: book?.cover_url });
    }
  }, [summary?.audio_url, id, book?.title, book?.author, book?.cover_url]);

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  // Freemium guard (after all hooks)
  if (!canListenAudio) {
    return <PaywallPrompt message="Аудио доступно в подписке Pro" />;
  }

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

  const { playing, currentTime, duration, speed } = state;

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
          <button onClick={() => skip(-15)} className="tap-highlight text-foreground">
            <SkipBack className="h-6 w-6" />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated tap-highlight"
          >
            {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
          </button>
          <button onClick={() => skip(15)} className="tap-highlight text-foreground">
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
            {speed}x
          </button>
          <button
            onClick={() => { setShowSleepPanel(!showSleepPanel); setShowSpeedPanel(false); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium tap-highlight ${
              sleepTimer
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-foreground"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            {sleepTimer ? formatTime(sleepRemaining) : "Сон"}
          </button>
        </div>

        {/* Speed panel */}
        {showSpeedPanel && (
          <div className="animate-fade-in flex flex-wrap justify-center gap-2 rounded-xl bg-card p-3 shadow-card">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => { setSpeed(s); setShowSpeedPanel(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}x
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
                onClick={() => {
                  setSleepTimer(minutes);
                  setShowSleepPanel(false);
                  setShowCustomInput(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  sleepTimer && sleepTimer.totalMinutes === minutes
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            {/* Custom duration button */}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                showCustomInput ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Другое
            </button>
            {/* Custom input with stepper */}
            {showCustomInput && (
              <div className="flex w-full items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setCustomMinutes((m) => Math.max(5, m - 5))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground tap-highlight"
                >
                  -
                </button>
                <span className="min-w-[4rem] text-center text-sm font-medium text-foreground">
                  {customMinutes} мин
                </span>
                <button
                  onClick={() => setCustomMinutes((m) => Math.min(120, m + 5))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground tap-highlight"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setSleepTimer(customMinutes);
                    setShowSleepPanel(false);
                    setShowCustomInput(false);
                  }}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Старт
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayerPage;
