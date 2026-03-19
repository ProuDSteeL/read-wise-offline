/**
 * Sleep timer logic extracted from AudioContext for testability.
 * Uses absolute timestamps (Date.now()) so timer survives browser background throttling.
 */

export interface SleepTimerState {
  endTime: number; // Date.now() timestamp when timer expires
  totalMinutes: number; // original minutes set
}

export interface SleepTimerManager {
  set: (minutes: number) => void;
  cancel: () => void;
  tick: () => void;
  applyFade: () => void;
  checkExpired: () => boolean;
  getState: () => SleepTimerState | null;
  getRemaining: () => number;
}

export function createSleepTimerManager(
  audio: HTMLAudioElement
): SleepTimerManager {
  let state: SleepTimerState | null = null;
  let remaining = 0;

  function set(minutes: number): void {
    if (minutes <= 0) {
      cancel();
      return;
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    state = { endTime, totalMinutes: minutes };
    remaining = minutes * 60;
  }

  function cancel(): void {
    state = null;
    remaining = 0;
    audio.volume = 1;
  }

  function tick(): void {
    if (!state) return;
    const now = Date.now();
    remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
  }

  function applyFade(): void {
    if (!state) return;
    if (remaining <= 15 && remaining > 0) {
      audio.volume = remaining / 15;
    }
  }

  function checkExpired(): boolean {
    if (!state) return false;
    if (remaining <= 0) {
      audio.pause();
      audio.volume = 1;
      state = null;
      remaining = 0;
      return true;
    }
    return false;
  }

  function getState(): SleepTimerState | null {
    return state;
  }

  function getRemaining(): number {
    return remaining;
  }

  return { set, cancel, tick, applyFade, checkExpired, getState, getRemaining };
}
