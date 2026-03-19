import { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, X, Moon } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { MINI_SPEEDS } from "@/lib/audioConstants";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = MINI_SPEEDS;

interface MiniAudioPlayerProps {
  onClose?: () => void;
  onExpand?: () => void;
}

const MiniAudioPlayer = ({ onClose, onExpand }: MiniAudioPlayerProps) => {
  const { state, togglePlay, skip, setSpeed, stop, sleepTimer, sleepRemaining } = useAudio();
  const [expanded, setExpanded] = useState(false);

  const { playing, currentTime, duration, speed, bookTitle } = state;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClose = () => {
    stop();
    onClose?.();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md">
      {/* Expanded speed picker */}
      {expanded && (
        <div className="animate-fade-in mx-4 mb-2 flex items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-elevated">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => { setSpeed(s); setExpanded(false); }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
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

      {/* Mini player bar */}
      <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-card shadow-elevated">
        {/* Progress bar */}
        <div className="h-[3px] w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground tap-highlight"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>

          {/* Skip buttons */}
          <button onClick={() => skip(-15)} className="relative tap-highlight text-muted-foreground">
            <SkipBack className="h-4 w-4" />
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold leading-none ml-0.5">15</span>
          </button>
          <button onClick={() => skip(15)} className="relative tap-highlight text-muted-foreground">
            <SkipForward className="h-4 w-4" />
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold leading-none mr-0.5">15</span>
          </button>

          {/* Title & time — tap to open full player */}
          <button
            onClick={() => onExpand?.()}
            className="flex min-w-0 flex-1 flex-col text-left tap-highlight"
          >
            {bookTitle && (
              <p className="truncate text-[11px] font-medium text-foreground">{bookTitle}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
              {sleepTimer && (
                <span className="ml-1 text-primary">
                  <Moon className="mr-0.5 inline h-2.5 w-2.5" />
                  {formatTime(sleepRemaining)}
                </span>
              )}
            </p>
          </button>

          {/* Speed */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold text-foreground tap-highlight"
          >
            {speed}×
          </button>

          {/* Close */}
          <button onClick={handleClose} className="shrink-0 tap-highlight text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniAudioPlayer;
