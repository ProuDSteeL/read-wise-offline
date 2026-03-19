import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SLEEP_OPTIONS } from "@/lib/audioConstants";

describe("SLEEP_OPTIONS constant", () => {
  it("contains 0, 15, 30, 45, 60 minute values", () => {
    const minutes = SLEEP_OPTIONS.map((o) => o.minutes);
    expect(minutes).toEqual([0, 15, 30, 45, 60]);
  });

  it("does not contain 5-minute option", () => {
    const minutes = SLEEP_OPTIONS.map((o) => o.minutes);
    expect(minutes).not.toContain(5);
  });
});

describe("Sleep timer logic", () => {
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
    vi.useFakeTimers();
    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      volume: 1,
      currentTime: 0,
      duration: 3600,
      playbackRate: 1,
      paused: false,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("setSleepTimer(30) sets endTime ~30 minutes in the future", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    const before = Date.now();
    manager.set(30);
    const after = Date.now();

    const timerState = manager.getState();
    expect(timerState).not.toBeNull();
    expect(timerState!.endTime).toBeGreaterThanOrEqual(before + 30 * 60 * 1000);
    expect(timerState!.endTime).toBeLessThanOrEqual(after + 30 * 60 * 1000);
  });

  it("sleepRemaining decrements each second", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(1); // 1 minute
    const initialRemaining = manager.getRemaining();

    vi.advanceTimersByTime(5000); // 5 seconds
    manager.tick();

    const afterRemaining = manager.getRemaining();
    expect(afterRemaining).toBeLessThan(initialRemaining);
    expect(initialRemaining - afterRemaining).toBeGreaterThanOrEqual(4);
  });

  it("when remaining <= 15, audio volume decreases linearly (remaining/15)", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    // Set a very short timer so we can advance into fade zone
    manager.set(1); // 1 minute = 60 seconds

    // Advance to 50 seconds (10 seconds remaining)
    vi.advanceTimersByTime(50 * 1000);
    manager.tick();

    const remaining = manager.getRemaining();
    expect(remaining).toBeLessThanOrEqual(15);

    // Apply fade
    manager.applyFade();
    expect(mockAudio.volume).toBeCloseTo(remaining / 15, 1);
  });

  it("when remaining reaches 0, audio.pause() is called", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(1); // 1 minute

    // Advance past the full timer
    vi.advanceTimersByTime(61 * 1000);
    manager.tick();
    const expired = manager.checkExpired();

    expect(expired).toBe(true);
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("when remaining reaches 0, audio volume is reset to 1", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(1);
    mockAudio.volume = 0.5; // Simulate faded volume

    vi.advanceTimersByTime(61 * 1000);
    manager.tick();
    manager.checkExpired();

    expect(mockAudio.volume).toBe(1);
  });

  it("when remaining reaches 0, sleepTimer state becomes null", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(1);
    vi.advanceTimersByTime(61 * 1000);
    manager.tick();
    manager.checkExpired();

    expect(manager.getState()).toBeNull();
  });

  it("cancelSleepTimer clears timer and resets volume to 1", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(30);
    mockAudio.volume = 0.5;

    manager.cancel();

    expect(manager.getState()).toBeNull();
    expect(manager.getRemaining()).toBe(0);
    expect(mockAudio.volume).toBe(1);
  });

  it("setSleepTimer(0) calls cancel behavior", async () => {
    const { createSleepTimerManager } = await import(
      "@/lib/sleepTimerManager"
    );
    const manager = createSleepTimerManager(
      mockAudio as unknown as HTMLAudioElement
    );

    manager.set(30);
    manager.set(0); // should cancel

    expect(manager.getState()).toBeNull();
    expect(manager.getRemaining()).toBe(0);
  });
});
