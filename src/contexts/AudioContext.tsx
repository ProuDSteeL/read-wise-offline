import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AudioState {
  bookId: string | null;
  bookTitle: string;
  audioUrl: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

interface AudioContextType {
  state: AudioState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: (bookId: string, audioUrl: string, bookTitle?: string, position?: number, speed?: number) => void;
  load: (bookId: string, audioUrl: string, bookTitle?: string, position?: number) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  stop: () => void;
  isActive: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [state, setState] = useState<AudioState>({
    bookId: null,
    bookTitle: "",
    audioUrl: "",
    playing: false,
    currentTime: 0,
    duration: 0,
    speed: (() => {
      const saved = localStorage.getItem("audio-speed");
      return saved ? parseFloat(saved) : 1;
    })(),
  });

  const isActive = !!state.bookId && !!state.audioUrl;

  // Save position debounced
  const savePosition = useCallback(
    (time: number, bookId: string) => {
      if (!user || !bookId) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase.from("user_progress").upsert(
          { user_id: user.id, book_id: bookId, audio_position: time },
          { onConflict: "user_id,book_id" }
        );
      }, 3000);
    },
    [user]
  );

  // Play a book's audio (or resume if same book)
  const play = useCallback(
    (bookId: string, audioUrl: string, bookTitle?: string, position?: number, speed?: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const newSpeed = speed ?? state.speed;

      if (state.bookId === bookId && state.audioUrl === audioUrl) {
        // Same book — just seek if needed and play
        if (position != null && position > 0) {
          audio.currentTime = position;
        }
        audio.playbackRate = newSpeed;
        audio.play().catch(() => {});
        setState((s) => ({ ...s, playing: true, speed: newSpeed }));
        return;
      }

      // Different book — change source
      audio.src = audioUrl;
      audio.playbackRate = newSpeed;
      audio.load();

      const onLoaded = () => {
        if (position != null && position > 0) {
          audio.currentTime = position;
        }
        audio.play().catch(() => {});
        audio.removeEventListener("loadedmetadata", onLoaded);
      };
      audio.addEventListener("loadedmetadata", onLoaded);

      // If no position provided, load from DB
      if (position == null && user) {
        supabase
          .from("user_progress")
          .select("audio_position")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.audio_position && audio.src.includes(audioUrl)) {
              audio.currentTime = Number(data.audio_position);
            }
          });
      }

      setState({
        bookId,
        bookTitle: bookTitle || "",
        audioUrl,
        playing: true,
        currentTime: position || 0,
        duration: 0,
        speed: newSpeed,
      });
      localStorage.setItem("audio-speed", String(newSpeed));
    },
    [state.bookId, state.audioUrl, state.speed, user]
  );

  // Load without auto-playing
  const load = useCallback(
    (bookId: string, audioUrl: string, bookTitle?: string, position?: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (state.bookId === bookId && state.audioUrl === audioUrl) return;

      audio.src = audioUrl;
      audio.playbackRate = state.speed;
      audio.load();

      const onLoaded = () => {
        if (position != null && position > 0) {
          audio.currentTime = position;
        }
        audio.removeEventListener("loadedmetadata", onLoaded);
      };
      audio.addEventListener("loadedmetadata", onLoaded);

      if (position == null && user) {
        supabase
          .from("user_progress")
          .select("audio_position")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.audio_position && audio.src.includes(audioUrl)) {
              audio.currentTime = Number(data.audio_position);
            }
          });
      }

      setState({
        bookId,
        bookTitle: bookTitle || "",
        audioUrl,
        playing: false,
        currentTime: position || 0,
        duration: 0,
        speed: state.speed,
      });
    },
    [state.bookId, state.audioUrl, state.speed, user]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isActive) return;
    if (state.playing) {
      audio.pause();
      setState((s) => ({ ...s, playing: false }));
    } else {
      audio.play().catch(() => {});
      setState((s) => ({ ...s, playing: true }));
    }
  }, [state.playing, isActive]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setState((s) => ({ ...s, currentTime: time }));
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
    localStorage.setItem("audio-speed", String(speed));
    setState((s) => ({ ...s, speed }));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      // Save final position
      if (user && state.bookId) {
        supabase.from("user_progress").upsert(
          { user_id: user.id, book_id: state.bookId, audio_position: audio.currentTime },
          { onConflict: "user_id,book_id" }
        );
      }
      audio.pause();
    }
    setState((s) => ({ ...s, bookId: null, audioUrl: "", playing: false, bookTitle: "" }));
  }, [user, state.bookId]);

  return (
    <AudioContext.Provider value={{ state, audioRef, play, togglePlay, seek, skip, setSpeed, stop, isActive }}>
      {children}
      {/* Single persistent audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio) {
            setState((s) => ({ ...s, currentTime: audio.currentTime }));
            if (state.bookId) savePosition(audio.currentTime, state.bookId);
          }
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio) {
            setState((s) => ({ ...s, duration: audio.duration }));
            audio.playbackRate = state.speed;
          }
        }}
        onEnded={() => setState((s) => ({ ...s, playing: false }))}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};
