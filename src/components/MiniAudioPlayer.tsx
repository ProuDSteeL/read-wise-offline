import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, X, Gauge } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

interface MiniAudioPlayerProps {
  audioUrl: string;
  bookId: string;
  bookTitle?: string;
  onClose?: () => void;
  onExpand?: () => void;
  initialPosition?: number;
  initialSpeed?: number;
  autoPlay?: boolean;
}

const MiniAudioPlayer = ({ audioUrl, bookId, bookTitle, onClose, onExpand, initialPosition, initialSpeed, autoPlay }: MiniAudioPlayerProps) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(() => {
    if (initialSpeed) return initialSpeed;
    const saved = localStorage.getItem("audio-speed");
    return saved ? parseFloat(saved) : 1;
  });

  // Load saved position
  useEffect(() => {
    if (!user || !bookId) return;
    supabase
      .from("user_progress")
      .select("audio_position")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.audio_position && audioRef.current) {
          audioRef.current.currentTime = Number(data.audio_position);
        }
      });
  }, [user, bookId]);

  // Apply speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    localStorage.setItem("audio-speed", String(speed));
  }, [speed]);

  const savePosition = useCallback(
    (time: number) => {
      if (!user || !bookId) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase.from("user_progress").upsert(
          { user_id: user.id, book_id: bookId, audio_position: time },
          { onConflict: "user_id,book_id" }
        );
      }, 3000);
    },
    [user, bookId]
  );

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const handleClose = () => {
    audioRef.current?.pause();
    setPlaying(false);
    onClose?.();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
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
              onClick={() => {
                // Save current position before navigating
                if (audioRef.current && user) {
                  supabase.from("user_progress").upsert(
                    { user_id: user.id, book_id: bookId, audio_position: audioRef.current.currentTime },
                    { onConflict: "user_id,book_id" }
                  );
                }
                audioRef.current?.pause();
                setPlaying(false);
                onExpand?.();
              }}
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

      {/* Hidden audio */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            savePosition(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.playbackRate = speed;
          }
        }}
        onEnded={() => setPlaying(false)}
      />
    </>
  );
};

export default MiniAudioPlayer;
