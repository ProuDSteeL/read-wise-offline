import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAudioOffline } from "@/lib/offlineStorage";
import { setupMediaSession, updatePositionState, setMediaSessionPlaybackState } from "@/lib/mediaSessionManager";
import type { SleepTimerState } from "@/lib/sleepTimerManager";

interface AudioState {
  bookId: string | null;
  bookTitle: string;
  author: string;
  coverUrl: string | null;
  audioUrl: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

interface AudioPlayOptions {
  bookId: string;
  bookTitle?: string;
  author?: string;
  coverUrl?: string | null;
  position?: number;
  speed?: number;
}

interface AudioContextType {
  state: AudioState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: (bookIdOrOpts: string | AudioPlayOptions, bookTitle?: string, position?: number, speed?: number) => void;
  load: (bookIdOrOpts: string | AudioPlayOptions, bookTitle?: string, position?: number) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  stop: () => void;
  isActive: boolean;
  sleepTimer: SleepTimerState | null;
  sleepRemaining: number;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Helper to fetch signed audio URL from Edge Function
const getSignedAudioUrl = async (bookId: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("get-audio-url", {
    body: { bookId },
  });
  if (error) throw new Error(error.message || "Failed to get audio URL");
  if (!data?.signedUrl) throw new Error("No signed URL returned");
  return data.signedUrl;
};

// Try offline first, then fall back to signed URL
const getAudioSource = async (bookId: string): Promise<string> => {
  const offlineUrl = await getAudioOffline(bookId);
  if (offlineUrl) return offlineUrl;
  return getSignedAudioUrl(bookId);
};

// Parse play/load arguments for backward compatibility
function parsePlayArgs(
  bookIdOrOpts: string | AudioPlayOptions,
  bookTitle?: string,
  position?: number,
  speed?: number
): AudioPlayOptions {
  if (typeof bookIdOrOpts === "string") {
    return { bookId: bookIdOrOpts, bookTitle, position, speed };
  }
  return bookIdOrOpts;
}

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const fetchingRef = useRef<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Sleep timer state
  const [sleepTimer, setSleepTimerState] = useState<SleepTimerState | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [state, setState] = useState<AudioState>({
    bookId: null,
    bookTitle: "",
    author: "",
    coverUrl: null,
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

  // Sleep timer methods
  const cancelSleepTimer = useCallback(() => {
    clearInterval(sleepIntervalRef.current);
    setSleepTimerState(null);
    setSleepRemaining(0);
    if (audioRef.current) {
      audioRef.current.volume = 1;
    }
  }, []);

  const setSleepTimer = useCallback((minutes: number) => {
    if (minutes <= 0) {
      cancelSleepTimer();
      return;
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerState({ endTime, totalMinutes: minutes });
    setSleepRemaining(minutes * 60);
  }, [cancelSleepTimer]);

  // Sleep timer tick effect with fade-out
  useEffect(() => {
    clearInterval(sleepIntervalRef.current);
    if (!sleepTimer) return;

    sleepIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((sleepTimer.endTime - now) / 1000));
      setSleepRemaining(remaining);

      // Fade-out in last 15 seconds (linear volume ramp)
      if (remaining <= 15 && remaining > 0 && audioRef.current) {
        audioRef.current.volume = remaining / 15;
      }

      if (remaining <= 0) {
        clearInterval(sleepIntervalRef.current);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.volume = 1; // Reset volume for next play
        }
        setState((s) => ({ ...s, playing: false }));
        setSleepTimerState(null);
        setSleepRemaining(0);
        setMediaSessionPlaybackState("paused");
      }
    }, 1000);

    return () => clearInterval(sleepIntervalRef.current);
  }, [sleepTimer?.endTime]);

  // Save position debounced
  const savePosition = useCallback(
    (time: number, bookId: string) => {
      if (!user || !bookId) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase.from("user_progress").upsert(
          { user_id: user.id, book_id: bookId, audio_position_ms: time },
          { onConflict: "user_id,book_id" }
        );
      }, 3000);
    },
    [user]
  );

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  }, []);

  // Play a book's audio (or resume if same book)
  const play = useCallback(
    async (bookIdOrOpts: string | AudioPlayOptions, bookTitle?: string, position?: number, speed?: number) => {
      const opts = parsePlayArgs(bookIdOrOpts, bookTitle, position, speed);
      const audio = audioRef.current;
      if (!audio) return;

      // Reset volume in case previous fade-out left it low
      audio.volume = 1;

      const newSpeed = opts.speed ?? state.speed;

      // Same book already loaded -- just resume
      if (state.bookId === opts.bookId && state.audioUrl) {
        if (opts.position != null && opts.position > 0) {
          audio.currentTime = opts.position;
        }
        audio.playbackRate = newSpeed;
        audio.play().catch(() => {});
        setState((s) => ({ ...s, playing: true, speed: newSpeed }));
        setMediaSessionPlaybackState("playing");
        return;
      }

      // Prevent duplicate fetches
      if (fetchingRef.current === opts.bookId) return;
      fetchingRef.current = opts.bookId;

      try {
        // Revoke previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }

        const url = await getAudioSource(opts.bookId);
        // Check we're still relevant (user didn't switch)
        if (fetchingRef.current !== opts.bookId) return;

        // Track blob URL for cleanup
        if (url.startsWith("blob:")) {
          blobUrlRef.current = url;
        }

        audio.src = url;
        audio.playbackRate = newSpeed;
        audio.load();

        const onLoaded = () => {
          if (opts.position != null && opts.position > 0) {
            audio.currentTime = opts.position;
          }
          audio.play().then(() => {
            // Set up Media Session after play resolves (per pitfall 1)
            setupMediaSession(
              opts.bookTitle || "",
              opts.author || "",
              opts.coverUrl || null,
              audio,
              () => {
                audio.play().catch(() => {});
                setState((s) => ({ ...s, playing: true }));
                setMediaSessionPlaybackState("playing");
              },
              () => {
                audio.pause();
                setState((s) => ({ ...s, playing: false }));
                setMediaSessionPlaybackState("paused");
              }
            );
            setMediaSessionPlaybackState("playing");
          }).catch(() => {});
          audio.removeEventListener("loadedmetadata", onLoaded);
        };
        audio.addEventListener("loadedmetadata", onLoaded);

        // If no position provided, load from DB
        if (opts.position == null && user) {
          supabase
            .from("user_progress")
            .select("audio_position_ms")
            .eq("user_id", user.id)
            .eq("book_id", opts.bookId)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.audio_position_ms && audio.src.includes(url)) {
                audio.currentTime = Number(data.audio_position_ms);
              }
            });
        }

        setState({
          bookId: opts.bookId,
          bookTitle: opts.bookTitle || "",
          author: opts.author || "",
          coverUrl: opts.coverUrl ?? null,
          audioUrl: url,
          playing: true,
          currentTime: opts.position || 0,
          duration: 0,
          speed: newSpeed,
        });
        localStorage.setItem("audio-speed", String(newSpeed));
      } catch (err) {
        console.error("[AudioContext] play() failed:", err);
      } finally {
        if (fetchingRef.current === opts.bookId) {
          fetchingRef.current = null;
        }
      }
    },
    [state.bookId, state.audioUrl, state.speed, user]
  );

  // Load without auto-playing
  const load = useCallback(
    async (bookIdOrOpts: string | AudioPlayOptions, bookTitle?: string, position?: number) => {
      const opts = parsePlayArgs(bookIdOrOpts, bookTitle, position);
      const audio = audioRef.current;
      if (!audio) return;
      if (state.bookId === opts.bookId && state.audioUrl) return;

      // Prevent duplicate fetches
      if (fetchingRef.current === opts.bookId) return;
      fetchingRef.current = opts.bookId;

      try {
        // Revoke previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }

        const url = await getAudioSource(opts.bookId);
        if (fetchingRef.current !== opts.bookId) return;

        // Track blob URL for cleanup
        if (url.startsWith("blob:")) {
          blobUrlRef.current = url;
        }

        audio.src = url;
        audio.playbackRate = state.speed;
        audio.load();

        const onLoaded = () => {
          if (opts.position != null && opts.position > 0) {
            audio.currentTime = opts.position;
          }
          // Set up Media Session even on load (for metadata)
          setupMediaSession(
            opts.bookTitle || "",
            opts.author || "",
            opts.coverUrl || null,
            audio,
            () => {
              audio.play().catch(() => {});
              setState((s) => ({ ...s, playing: true }));
              setMediaSessionPlaybackState("playing");
            },
            () => {
              audio.pause();
              setState((s) => ({ ...s, playing: false }));
              setMediaSessionPlaybackState("paused");
            }
          );
          audio.removeEventListener("loadedmetadata", onLoaded);
        };
        audio.addEventListener("loadedmetadata", onLoaded);

        if (opts.position == null && user) {
          supabase
            .from("user_progress")
            .select("audio_position_ms")
            .eq("user_id", user.id)
            .eq("book_id", opts.bookId)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.audio_position_ms && audio.src.includes(url)) {
                audio.currentTime = Number(data.audio_position_ms);
              }
            });
        }

        setState({
          bookId: opts.bookId,
          bookTitle: opts.bookTitle || "",
          author: opts.author || "",
          coverUrl: opts.coverUrl ?? null,
          audioUrl: url,
          playing: false,
          currentTime: opts.position || 0,
          duration: 0,
          speed: state.speed,
        });
      } catch (err) {
        console.error("[AudioContext] load() failed:", err);
      } finally {
        if (fetchingRef.current === opts.bookId) {
          fetchingRef.current = null;
        }
      }
    },
    [state.bookId, state.audioUrl, state.speed, user]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isActive) return;
    if (state.playing) {
      audio.pause();
      setState((s) => ({ ...s, playing: false }));
      setMediaSessionPlaybackState("paused");
    } else {
      audio.play().catch(() => {});
      setState((s) => ({ ...s, playing: true }));
      setMediaSessionPlaybackState("playing");
    }
  }, [state.playing, isActive]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setState((s) => ({ ...s, currentTime: time }));
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
          { user_id: user.id, book_id: state.bookId, audio_position_ms: audio.currentTime },
          { onConflict: "user_id,book_id" }
        );
      }
      audio.pause();
    }
    cancelSleepTimer();
    setMediaSessionPlaybackState("paused");
    setState((s) => ({ ...s, bookId: null, audioUrl: "", playing: false, bookTitle: "", author: "", coverUrl: null }));
  }, [user, state.bookId, cancelSleepTimer]);

  // Headphone disconnect detection (best-effort)
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    let previousOutputCount = 0;

    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        const currentCount = outputs.length;
        if (previousOutputCount > 0 && currentCount < previousOutputCount) {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            setState((s) => ({ ...s, playing: false }));
            setMediaSessionPlaybackState("paused");
          }
        }
        previousOutputCount = currentCount;
      } catch {
        /* enumerateDevices may be unavailable */
      }
    };

    checkDevices();
    navigator.mediaDevices.addEventListener("devicechange", checkDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", checkDevices);
  }, []);

  // Audio element event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
      if (state.bookId) savePosition(audio.currentTime, state.bookId);
      updatePositionState(audio);
    }
  }, [state.bookId, savePosition]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setState((s) => ({ ...s, duration: audio.duration }));
      audio.playbackRate = state.speed;
    }
  }, [state.speed]);

  const handleEnded = useCallback(() => {
    setState((s) => ({ ...s, playing: false }));
    cancelSleepTimer();
    setMediaSessionPlaybackState("paused");
  }, [cancelSleepTimer]);

  // Audio interruption handling: sync state when OS pauses audio (incoming call, other app)
  const handlePause = useCallback(() => {
    // Sync state when audio is paused -- covers both user-initiated and system-triggered pauses
    setState((s) => ({ ...s, playing: false }));
    setMediaSessionPlaybackState("paused");
  }, []);

  const handlePlay = useCallback(() => {
    setState((s) => ({ ...s, playing: true }));
    setMediaSessionPlaybackState("playing");
  }, []);

  return (
    <AudioContext.Provider
      value={{
        state,
        audioRef,
        play,
        load,
        togglePlay,
        seek,
        skip,
        setSpeed,
        stop,
        isActive,
        sleepTimer,
        sleepRemaining,
        setSleepTimer,
        cancelSleepTimer,
      }}
    >
      {children}
      {/* Single persistent audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={handlePlay}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};
