import { Play, Pause, SkipForward, SkipBack, X, Moon } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

interface MiniAudioPlayerProps {
  onExpand: () => void;
}

const MiniAudioPlayer = ({ onExpand }: MiniAudioPlayerProps) => {
  const { state, togglePlay, skip, stop, sleepTimer, sleepRemaining, isActive } = useAudio();

  if (!isActive) return null;

  const { playing, currentTime, duration, bookTitle } = state;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-2">
      <div className="overflow-hidden rounded-2xl bg-card shadow-elevated">
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
          <button onClick={() => skip(-15)} className="relative flex h-7 w-7 items-center justify-center rounded-full bg-secondary tap-highlight text-muted-foreground">
            <SkipBack className="h-3 w-3" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">15</span>
          </button>
          <button onClick={() => skip(15)} className="relative flex h-7 w-7 items-center justify-center rounded-full bg-secondary tap-highlight text-muted-foreground">
            <SkipForward className="h-3 w-3" />
            <span className="absolute -top-0.5 -left-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">15</span>
          </button>

          {/* Title & time — tap to open full player */}
          <button
            onClick={onExpand}
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

          {/* Close */}
          <button onClick={stop} className="shrink-0 tap-highlight text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniAudioPlayer;
