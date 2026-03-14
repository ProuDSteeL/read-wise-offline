import { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

interface MiniAudioPlayerProps {
  onClose?: () => void;
  onExpand?: () => void;
}

const MiniAudioPlayer = ({ onClose, onExpand }: MiniAudioPlayerProps) => {
  const { state, togglePlay, skip, setSpeed, stop } = useAudio();
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
          <button onClick={() => skip(-15)} className="tap-highlight text-muted-foreground">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={() => skip(15)} className="tap-highlight text-muted-foreground">
            <SkipForward className="h-4 w-4" />
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
