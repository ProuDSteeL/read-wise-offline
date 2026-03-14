import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useBook } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const AudioPlayerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book } = useBook(id!);
  const { data: summary, isLoading } = useSummary(id!);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load saved position
  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("user_progress")
      .select("audio_position")
      .eq("user_id", user.id)
      .eq("book_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.audio_position && audioRef.current) {
          audioRef.current.currentTime = Number(data.audio_position);
        }
      });
  }, [user, id, summary]);

  const savePosition = useCallback(
    (time: number) => {
      if (!user || !id) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            book_id: id,
            audio_position: time,
          },
          { onConflict: "user_id,book_id" }
        );
      }, 2000);
    },
    [user, id]
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

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">Аудио</span>
        <div className="w-5" />
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
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
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
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={summary.audio_url}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            savePosition(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
};

export default AudioPlayerPage;
