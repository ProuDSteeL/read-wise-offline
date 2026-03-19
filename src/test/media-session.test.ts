import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Media Session integration", () => {
  const mockSetActionHandler = vi.fn();
  const mockSetPositionState = vi.fn();
  let mockAudio: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    volume: number;
    currentTime: number;
    duration: number;
    playbackRate: number;
    paused: boolean;
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      volume: 1,
      currentTime: 100,
      duration: 3600,
      playbackRate: 1,
      paused: false,
    };

    Object.defineProperty(navigator, "mediaSession", {
      writable: true,
      configurable: true,
      value: {
        metadata: null,
        playbackState: "none" as MediaSessionPlaybackState,
        setActionHandler: mockSetActionHandler,
        setPositionState: mockSetPositionState,
      },
    });

    // Ensure MediaMetadata is available in jsdom
    if (typeof globalThis.MediaMetadata === "undefined") {
      (globalThis as any).MediaMetadata = class MockMediaMetadata {
        title: string;
        artist: string;
        artwork: { src: string; sizes: string; type: string }[];
        constructor(init: {
          title: string;
          artist: string;
          artwork?: { src: string; sizes: string; type: string }[];
        }) {
          this.title = init.title;
          this.artist = init.artist;
          this.artwork = init.artwork || [];
        }
      };
    }
  });

  it("setupMediaSession sets navigator.mediaSession.metadata with title, artist, artwork", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");

    setupMediaSession(
      "Test Book",
      "Test Author",
      "https://example.com/cover.jpg",
      mockAudio as unknown as HTMLAudioElement,
      vi.fn(),
      vi.fn()
    );

    expect(navigator.mediaSession.metadata).not.toBeNull();
    expect(navigator.mediaSession.metadata!.title).toBe("Test Book");
    expect(navigator.mediaSession.metadata!.artist).toBe("Test Author");
    expect(navigator.mediaSession.metadata!.artwork.length).toBeGreaterThan(0);
  });

  it("Media Session action handler for 'play' calls audio.play()", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");
    const onPlay = vi.fn();

    setupMediaSession(
      "Test",
      "Author",
      null,
      mockAudio as unknown as HTMLAudioElement,
      onPlay,
      vi.fn()
    );

    // Find the play handler
    const playCall = mockSetActionHandler.mock.calls.find(
      (c: [string, () => void]) => c[0] === "play"
    );
    expect(playCall).toBeDefined();

    // Invoke it
    playCall![1]();
    expect(mockAudio.play).toHaveBeenCalled();
    expect(onPlay).toHaveBeenCalled();
  });

  it("Media Session action handler for 'pause' calls audio.pause()", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");
    const onPause = vi.fn();

    setupMediaSession(
      "Test",
      "Author",
      null,
      mockAudio as unknown as HTMLAudioElement,
      vi.fn(),
      onPause
    );

    const pauseCall = mockSetActionHandler.mock.calls.find(
      (c: [string, () => void]) => c[0] === "pause"
    );
    expect(pauseCall).toBeDefined();

    pauseCall![1]();
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(onPause).toHaveBeenCalled();
  });

  it("Media Session action handler for 'seekbackward' decrements currentTime by 15s", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");

    setupMediaSession(
      "Test",
      "Author",
      null,
      mockAudio as unknown as HTMLAudioElement,
      vi.fn(),
      vi.fn()
    );

    const seekBackCall = mockSetActionHandler.mock.calls.find(
      (c: [string, () => void]) => c[0] === "seekbackward"
    );
    expect(seekBackCall).toBeDefined();

    mockAudio.currentTime = 100;
    seekBackCall![1]();
    expect(mockAudio.currentTime).toBe(85);
  });

  it("Media Session action handler for 'seekforward' increments currentTime by 15s", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");

    setupMediaSession(
      "Test",
      "Author",
      null,
      mockAudio as unknown as HTMLAudioElement,
      vi.fn(),
      vi.fn()
    );

    const seekFwdCall = mockSetActionHandler.mock.calls.find(
      (c: [string, () => void]) => c[0] === "seekforward"
    );
    expect(seekFwdCall).toBeDefined();

    mockAudio.currentTime = 100;
    seekFwdCall![1]();
    expect(mockAudio.currentTime).toBe(115);
  });

  it("Media Session action handler for 'seekto' sets currentTime to details.seekTime", async () => {
    const { setupMediaSession } = await import("@/lib/mediaSessionManager");

    setupMediaSession(
      "Test",
      "Author",
      null,
      mockAudio as unknown as HTMLAudioElement,
      vi.fn(),
      vi.fn()
    );

    const seekToCall = mockSetActionHandler.mock.calls.find(
      (c: [string, () => void]) => c[0] === "seekto"
    );
    expect(seekToCall).toBeDefined();

    seekToCall![1]({ seekTime: 500 });
    expect(mockAudio.currentTime).toBe(500);
  });

  it("setPositionState is called with valid duration/position/playbackRate", async () => {
    const { updatePositionState } = await import("@/lib/mediaSessionManager");

    updatePositionState(
      mockAudio as unknown as HTMLAudioElement
    );

    expect(mockSetPositionState).toHaveBeenCalledWith({
      duration: 3600,
      playbackRate: 1,
      position: 100,
    });
  });

  it("setPositionState is NOT called when duration is NaN", async () => {
    const { updatePositionState } = await import("@/lib/mediaSessionManager");

    mockAudio.duration = NaN;
    updatePositionState(
      mockAudio as unknown as HTMLAudioElement
    );

    expect(mockSetPositionState).not.toHaveBeenCalled();
  });

  it("graceful no-op when navigator.mediaSession is undefined", async () => {
    const { setupMediaSession, updatePositionState } = await import(
      "@/lib/mediaSessionManager"
    );

    Object.defineProperty(navigator, "mediaSession", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    // Should not throw
    expect(() =>
      setupMediaSession(
        "Test",
        "Author",
        null,
        mockAudio as unknown as HTMLAudioElement,
        vi.fn(),
        vi.fn()
      )
    ).not.toThrow();

    expect(() =>
      updatePositionState(mockAudio as unknown as HTMLAudioElement)
    ).not.toThrow();
  });
});
