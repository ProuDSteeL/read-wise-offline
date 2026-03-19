# Phase 3: Audio Player Polish - Research

**Researched:** 2026-03-19
**Domain:** Media Session API, background audio, sleep timer, audio context consolidation
**Confidence:** HIGH

## Summary

This phase extends the existing `AudioContext.tsx` with three capabilities: (1) Media Session API integration for lock screen / notification bar controls, (2) a centralized sleep timer with fade-out, and (3) consolidation of the OfflineReaderPage's duplicate audio system into AudioContext. The Media Session API is a well-supported web standard (Chrome 73+, Safari 15+, Firefox 82+) that requires no additional libraries -- it is purely `navigator.mediaSession` calls. The sleep timer moves from component-local state into AudioContext, gaining fade-out via the HTML5 audio `volume` property with `setInterval`-based linear ramp. The OfflineReaderPage refactor eliminates ~120 lines of duplicated audio logic.

**Primary recommendation:** No new dependencies needed. All features use built-in browser APIs. The implementation is pure AudioContext extension + UI updates.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Media Session API for lock screen / notification bar integration
- Controls: Play/Pause (center), Skip back 15s (left), Skip forward 15s (right) -- matches in-app controls
- Metadata: Book cover as artwork, book title as track name, author as artist
- Show position state (current time, duration, progress bar) on supported devices
- Media Session handlers must sync with AudioContext state bidirectionally
- Audio always continues playing when user navigates away, switches tabs, or locks phone
- No conditional background playback (always on when audio is playing)
- Headphone disconnect pauses playback (prevent unexpected speaker output)
- On audio interruption (incoming call, other app): pause playback, user must manually resume (no auto-resume)
- Preset options: 15 / 30 / 45 / 60 minutes + custom duration input
- Remove existing 5-minute option, add 45-minute option per AUDIO-04 requirements
- Gradual fade-out over 10-15 seconds before stopping (volume ramp down, not hard stop)
- Timer countdown visible in both full AudioPlayerPage AND MiniAudioPlayer bar
- Timer is in-app only -- not exposed through lock screen controls
- Timer set before locking phone continues to work in background
- Move sleep timer logic from AudioPlayerPage and OfflineReaderPage INTO AudioContext -- single source of truth
- Timer survives page navigation (persisted in context, not component state)
- Unify OfflineReaderPage audio: switch from standalone audio handling to AudioContext
- AudioContext gains ability to load audio from IndexedDB (offline) through same interface
- One audio system for the entire app -- online and offline use same context

### Claude's Discretion
- Fade-out curve (linear vs exponential volume decrease)
- Custom duration input UI design (number picker, slider, or text input)
- Sleep timer indicator design on MiniAudioPlayer (icon, text, or both)
- How to detect headphone disconnect in PWA context
- Whether to use Web Audio API for fade-out or HTML5 audio volume property
- Error handling for Media Session API on unsupported browsers

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-03 | Background playback via Media Session API with lock screen controls (play/pause/skip) | Media Session API is well-supported (Chrome 73+, Safari 15+, Firefox 82+). `navigator.mediaSession.setActionHandler` for play/pause/seekbackward/seekforward, `MediaMetadata` for artwork/title/artist, `setPositionState` for progress. No libraries needed. |
| AUDIO-04 | Sleep timer with configurable duration (15/30/45/60 min) auto-stops playback | Centralize existing timer logic in AudioContext. Use `setInterval` countdown + HTML5 audio `volume` property for fade-out. Update SLEEP_OPTIONS constant to match requirements. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Media Session API | Browser built-in | Lock screen controls, metadata, position | W3C standard, no npm package needed |
| HTML5 Audio `volume` | Browser built-in | Fade-out volume control | Simpler than Web Audio API GainNode for this use case |
| `navigator.mediaDevices` | Browser built-in | Device change detection (headphone disconnect) | Standard web API for audio device events |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localforage | 1.10.0 (already installed) | IndexedDB audio blob retrieval for offline | When AudioContext needs to load offline audio |
| lucide-react | 0.462.0 (already installed) | Moon icon for sleep timer indicator | Sleep timer UI in MiniAudioPlayer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 Audio volume for fade | Web Audio API GainNode | GainNode offers exponential ramp but requires rewiring entire audio pipeline through AudioContext/GainNode chain. HTML5 volume with setInterval is sufficient for 10-15s fade. |
| setInterval for countdown | requestAnimationFrame | setInterval is adequate for 1-second tick resolution. rAF would be overkill and doesn't run when tab is backgrounded. |

**Installation:**
```bash
# No new packages needed -- all features use browser built-in APIs
```

## Architecture Patterns

### Recommended Changes to AudioContext.tsx

```
src/contexts/AudioContext.tsx    # Extended with: sleepTimer, Media Session, offline loading
src/components/MiniAudioPlayer.tsx  # Add sleep timer countdown indicator
src/pages/AudioPlayerPage.tsx    # Remove local sleep timer state, use context
src/pages/OfflineReaderPage.tsx  # Remove duplicate audio system, use AudioContext
src/lib/audioConstants.ts        # NEW: shared SLEEP_OPTIONS, SPEEDS constants
```

### Pattern 1: Media Session Setup in AudioContext
**What:** Register Media Session handlers once when audio starts playing, update metadata when track changes
**When to use:** Every time a new book audio is loaded or playback state changes
**Example:**
```typescript
// Source: https://web.dev/articles/media-session
// Set up in AudioContext when audio loads
const setupMediaSession = (bookTitle: string, author: string, coverUrl: string) => {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: bookTitle,
    artist: author,
    artwork: [
      { src: coverUrl, sizes: "256x256", type: "image/jpeg" },
      { src: coverUrl, sizes: "512x512", type: "image/jpeg" },
    ],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audioRef.current?.play();
    setState(s => ({ ...s, playing: true }));
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    audioRef.current?.pause();
    setState(s => ({ ...s, playing: false }));
  });
  navigator.mediaSession.setActionHandler("seekbackward", () => {
    skip(-15);
  });
  navigator.mediaSession.setActionHandler("seekforward", () => {
    skip(15);
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (audioRef.current && details.seekTime != null) {
      audioRef.current.currentTime = details.seekTime;
    }
  });
};

// Update position state on timeupdate
const updatePositionState = () => {
  if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
};
```

### Pattern 2: Sleep Timer with Fade-Out in AudioContext
**What:** Centralized sleep timer with countdown and gradual volume reduction
**When to use:** User sets sleep timer from any page; timer persists across navigation
**Example:**
```typescript
// Sleep timer state in AudioContext
const [sleepTimer, setSleepTimer] = useState<{
  remaining: number;   // seconds remaining
  total: number;       // total seconds set
} | null>(null);

// Fade-out: reduce volume over last 15 seconds
useEffect(() => {
  if (!sleepTimer || sleepTimer.remaining <= 0) return;
  const interval = setInterval(() => {
    setSleepTimer(prev => {
      if (!prev || prev.remaining <= 1) {
        // Timer expired
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.volume = 1; // Reset volume for next play
        }
        clearInterval(interval);
        return null;
      }
      // Fade-out in last 15 seconds
      if (prev.remaining <= 15 && audioRef.current) {
        audioRef.current.volume = prev.remaining / 15;
      }
      return { ...prev, remaining: prev.remaining - 1 };
    });
  }, 1000);
  return () => clearInterval(interval);
}, [sleepTimer?.total]); // Only re-run when a new timer is set
```

### Pattern 3: Offline Audio Loading in AudioContext
**What:** AudioContext detects offline audio and loads from IndexedDB instead of fetching signed URL
**When to use:** When playing audio for a book that has been downloaded for offline use
**Example:**
```typescript
// In the play() function, try offline first
import { getAudioOffline } from "@/lib/offlineStorage";

const getAudioSource = async (bookId: string): Promise<string> => {
  // Try offline first
  const offlineUrl = await getAudioOffline(bookId);
  if (offlineUrl) return offlineUrl;
  // Fall back to signed URL
  return getSignedAudioUrl(bookId);
};
```

### Anti-Patterns to Avoid
- **Duplicate audio elements:** OfflineReaderPage currently creates its own `new Audio()`. This MUST be removed and replaced with AudioContext's single `<audio>` element.
- **Component-local timers:** Sleep timer in useState of AudioPlayerPage/OfflineReaderPage dies on navigation. MUST live in AudioContext.
- **Forgetting to reset volume:** After fade-out, `audio.volume` stays at 0. Must reset to 1 before next playback.
- **Calling setPositionState with invalid values:** Duration must be positive, position must be < duration. Guard against NaN/0 values.
- **Not syncing playbackState:** `navigator.mediaSession.playbackState` must be set to "playing"/"paused" to keep lock screen controls in sync.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lock screen controls | Custom notification system | `navigator.mediaSession` API | Browser handles all platform-specific UI |
| Audio metadata display | Custom overlay | `MediaMetadata` constructor | Integrates with OS notification center |
| Position tracking on lock screen | Polling/sending updates | `setPositionState()` | Browser extrapolates position between updates |
| Volume fade-out | Web Audio API GainNode pipeline | HTML5 `audio.volume` + setInterval | Rewiring to Web Audio API requires AudioContext/GainNode/MediaElementSource chain; `audio.volume` is simpler for a 15s linear ramp |

**Key insight:** The Media Session API does all the heavy lifting for lock screen integration. There is zero custom platform code needed.

## Common Pitfalls

### Pitfall 1: Media Session Not Showing on Lock Screen
**What goes wrong:** Lock screen controls don't appear after setting up Media Session
**Why it happens:** Chrome requires audio duration >= 5 seconds to show media notifications. Also, metadata must be set AFTER `audio.play()` resolves, not before.
**How to avoid:** Set metadata after the play promise resolves. Ensure audio is actually playing (not just loaded).
**Warning signs:** Controls work on Android Chrome but not on iOS Safari, or vice versa.

### Pitfall 2: setPositionState Throws on Invalid State
**What goes wrong:** Error: "The provided value is negative" or "position exceeds duration"
**Why it happens:** Calling setPositionState before duration is loaded (duration = NaN or 0), or when currentTime somehow exceeds duration.
**How to avoid:** Guard with: `if (!audio.duration || isNaN(audio.duration) || audio.currentTime > audio.duration) return;`
**Warning signs:** Console errors on track load or seek operations.

### Pitfall 3: Sleep Timer Stops When Tab is Backgrounded
**What goes wrong:** setInterval stops firing when browser throttles background tab
**Why it happens:** Browsers throttle setInterval in background tabs to ~1 per second (some even less).
**How to avoid:** Use absolute timestamps instead of decrementing a counter. Calculate remaining = targetEndTime - Date.now(). setInterval at 1s is fine since browsers guarantee at least 1/sec for pages with active audio.
**Warning signs:** Timer seems to freeze or jump when user returns to app.

### Pitfall 4: Volume Not Reset After Fade-Out
**What goes wrong:** Next time user plays audio, volume is 0 or very low
**Why it happens:** `audio.volume` was ramped to 0 during fade-out and never restored
**How to avoid:** Always reset `audio.volume = 1` when: (a) timer completes, (b) timer is cancelled, (c) new audio starts playing
**Warning signs:** Silent playback after sleep timer has fired.

### Pitfall 5: Headphone Disconnect Detection Unreliable
**What goes wrong:** Audio continues on speaker after headphones disconnected
**Why it happens:** `navigator.mediaDevices.ondevicechange` fires but doesn't specify WHICH device changed. On iOS Safari, this event may not fire at all.
**How to avoid:** On devicechange, enumerate devices and check if audio output count decreased. Accept this is best-effort in PWA context -- native apps have better support. Add a fallback: if audio is playing and device list changes, pause as a precaution.
**Warning signs:** Works on desktop Chrome but fails on mobile Safari.

### Pitfall 6: Object URL Memory Leak from Offline Audio
**What goes wrong:** Blob URLs from `URL.createObjectURL` accumulate in memory
**Why it happens:** `getAudioOffline()` creates a new blob URL each call, and OfflineReaderPage already calls `URL.revokeObjectURL` on cleanup, but AudioContext might not.
**How to avoid:** Track the current blob URL in AudioContext and revoke it when switching tracks or stopping. Only call `getAudioOffline` once per book load.
**Warning signs:** Memory usage grows with each offline track switch.

## Code Examples

### Media Session Metadata with Book Info
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
// Called in AudioContext when a new book starts playing
const setMediaSessionMetadata = (title: string, author: string, coverUrl: string | null) => {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: author,
    artwork: coverUrl
      ? [
          { src: coverUrl, sizes: "96x96", type: "image/jpeg" },
          { src: coverUrl, sizes: "256x256", type: "image/jpeg" },
          { src: coverUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
};
```

### Sleep Timer with Absolute Timestamps (Pitfall-Resistant)
```typescript
// Use absolute end time to survive background throttling
const startSleepTimer = (minutes: number) => {
  const endTime = Date.now() + minutes * 60 * 1000;
  const fadeStartTime = endTime - 15 * 1000; // 15s before end
  setSleepTimer({ endTime, totalMinutes: minutes });
  // The useEffect with setInterval reads endTime, not a decrementing counter
};

// In the interval callback:
const now = Date.now();
const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
if (remaining <= 15 && audioRef.current) {
  audioRef.current.volume = remaining / 15; // Linear fade
}
if (remaining <= 0) {
  audioRef.current?.pause();
  audioRef.current!.volume = 1;
  setSleepTimer(null);
}
```

### Headphone Disconnect (Best-Effort)
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/devicechange_event
useEffect(() => {
  if (!navigator.mediaDevices?.addEventListener) return;

  let previousDeviceCount = 0;

  const checkDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputDevices = devices.filter(d => d.kind === "audiooutput");
      const currentCount = outputDevices.length;

      // If output devices decreased and audio is playing, pause
      if (previousDeviceCount > 0 && currentCount < previousDeviceCount) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setState(s => ({ ...s, playing: false }));
        }
      }
      previousDeviceCount = currentCount;
    } catch {
      // enumerateDevices may require permission or be unavailable
    }
  };

  // Get initial count
  checkDevices();

  navigator.mediaDevices.addEventListener("devicechange", checkDevices);
  return () => navigator.mediaDevices.removeEventListener("devicechange", checkDevices);
}, []);
```

### AudioContext Interface Extensions
```typescript
// New additions to AudioContextType interface
interface AudioContextType {
  // ... existing methods ...

  // Sleep timer
  sleepTimer: { remaining: number; totalMinutes: number } | null;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;

  // Offline support
  playOffline: (bookId: string, bookTitle?: string) => void;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No lock screen controls in PWA | Media Session API | Chrome 73 (2019), Safari 15 (2021) | Full platform media integration without native app |
| Manual Web Audio API for volume | HTML5 audio.volume property | Always available | Simpler for basic fade; Web Audio API for complex DSP |
| polling for device changes | navigator.mediaDevices.ondevicechange | Chrome 57+, Firefox 52+ | Event-driven headphone detection |

**Deprecated/outdated:**
- The `mozSetup()` and related Mozilla audio APIs are long deprecated. Use standard HTML5 Audio + Media Session.
- `audio.mozCurrentSampleOffset()` -- removed, use `currentTime`.

## Open Questions

1. **iOS Safari headphone disconnect behavior**
   - What we know: `navigator.mediaDevices.ondevicechange` is supported in Safari 15+ but behavior with Bluetooth headphones on iOS is inconsistent.
   - What's unclear: Whether iOS PWAs actually fire this event when AirPods disconnect.
   - Recommendation: Implement best-effort detection. Accept that on some iOS devices it may not work. This is explicitly "Claude's Discretion" per CONTEXT.md.

2. **Custom duration input for sleep timer**
   - What we know: User wants custom duration beyond presets (15/30/45/60).
   - What's unclear: Best mobile UX for entering arbitrary minutes.
   - Recommendation: Use a simple number input with stepper (+/-) buttons. Min 5 min, max 120 min, step 5 min. Avoid a slider (imprecise on mobile).

3. **AudioContext needs book metadata (author, coverUrl) for Media Session**
   - What we know: Current `play()` accepts only `bookId` and `bookTitle`. Media Session needs author and artwork.
   - What's unclear: Whether to expand `play()` signature or fetch metadata internally.
   - Recommendation: Expand the `play()` and `load()` signature to accept `{ bookId, bookTitle, author, coverUrl }` as an options object. Callers already have this data from `useBook()`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIO-03 | Media Session metadata set on play | unit | `npx vitest run src/test/media-session.test.ts -x` | Wave 0 |
| AUDIO-03 | Media Session action handlers sync with AudioContext | unit | `npx vitest run src/test/media-session.test.ts -x` | Wave 0 |
| AUDIO-03 | Position state updated on timeupdate | unit | `npx vitest run src/test/media-session.test.ts -x` | Wave 0 |
| AUDIO-04 | Sleep timer countdown decrements correctly | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | Wave 0 |
| AUDIO-04 | Sleep timer fade-out reduces volume in last 15s | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | Wave 0 |
| AUDIO-04 | Sleep timer stops playback when expired | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | Wave 0 |
| AUDIO-04 | Volume resets to 1 after timer completes | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | Wave 0 |
| AUDIO-03 | Background playback continues when tab backgrounded | manual-only | N/A -- requires real browser | N/A |
| AUDIO-03 | Lock screen controls visible and functional | manual-only | N/A -- requires real device | N/A |
| AUDIO-03 | Headphone disconnect pauses playback | manual-only | N/A -- requires hardware | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/sleep-timer.test.ts` -- covers AUDIO-04 timer logic
- [ ] `src/test/media-session.test.ts` -- covers AUDIO-03 Media Session setup
- [ ] Mock for `navigator.mediaSession` in jsdom (jsdom does not implement Media Session API)

## Sources

### Primary (HIGH confidence)
- [MDN: MediaSession API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession) -- setActionHandler, metadata, playbackState
- [MDN: MediaSession.setPositionState](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/setPositionState) -- position state requirements
- [web.dev: Media Session](https://web.dev/articles/media-session) -- comprehensive examples, browser support notes
- [MDN: MediaDevices devicechange event](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/devicechange_event) -- headphone disconnect detection

### Secondary (MEDIUM confidence)
- [WebAudio/web-audio-api #2407](https://github.com/WebAudio/web-audio-api/issues/2407) -- headphone detection limitations confirmed as open issue
- [MDN: AudioParam.exponentialRampToValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime) -- Web Audio fade alternatives

### Tertiary (LOW confidence)
- iOS PWA headphone disconnect behavior -- no authoritative source confirms consistent behavior across iOS versions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all browser built-in APIs, well-documented on MDN
- Architecture: HIGH -- extending existing AudioContext pattern, clear refactoring path from existing code
- Pitfalls: HIGH -- based on MDN documentation constraints (duration > 0, position < duration) and known browser throttling behavior
- Headphone disconnect: LOW -- unreliable in PWA context, best-effort only

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable browser APIs, unlikely to change)
