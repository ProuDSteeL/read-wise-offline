import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, X, Moon, Gauge, ChevronDown } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { Slider } from "@/components/ui/slider";
import { SLEEP_OPTIONS, SPEEDS } from "@/lib/audioConstants";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

interface AudioPlayerSheetProps {
  open: boolean;
  onClose: () => void;
}

const AudioPlayerSheet = ({ open, onClose }: AudioPlayerSheetProps) => {
  const { state, togglePlay, seek, skip, setSpeed, sleepTimer, sleepRemaining, setSleepTimer } = useAudio();
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showSleepPanel, setShowSleepPanel] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);

  if (!open) return null;

  const { playing, currentTime, duration, speed, bookTitle } = state;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md animate-slide-up">
        <div className="rounded-t-3xl bg-background shadow-elevated">
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-3 pb-2 px-4">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30 mb-3" />
            <div className="flex w-full items-center justify-between">
              <button onClick={onClose} className="tap-highlight">
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="text-center flex-1 min-w-0 px-4">
                <p className="truncate text-sm font-semibold text-foreground">{bookTitle || "Аудио"}</p>
                <p className="text-[11px] text-muted-foreground">{state.author}</p>
              </div>
              <div className="w-5" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 px-6 pb-6 safe-bottom">
            {/* Seek bar */}
            <div className="space-y-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(v) => seek(v[0])}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => skip(-15)} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-secondary tap-highlight text-foreground">
                <SkipBack className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">15</span>
              </button>
              <button
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated tap-highlight"
              >
                {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
              </button>
              <button onClick={() => skip(15)} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-secondary tap-highlight text-foreground">
                <SkipForward className="h-5 w-5" />
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">15</span>
              </button>
            </div>

            {/* Secondary controls */}
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
                  sleepTimer ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
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
                      speed === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
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
                    onClick={() => { setSleepTimer(minutes); setShowSleepPanel(false); setShowCustomInput(false); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      sleepTimer && sleepTimer.totalMinutes === minutes
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    showCustomInput ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  Другое
                </button>
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
                      onClick={() => { setSleepTimer(customMinutes); setShowSleepPanel(false); setShowCustomInput(false); }}
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
      </div>
    </>
  );
};

export default AudioPlayerSheet;
