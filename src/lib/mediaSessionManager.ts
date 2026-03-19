/**
 * Media Session API integration helpers.
 * Extracted from AudioContext for testability.
 */

export function setupMediaSession(
  title: string,
  artist: string,
  coverUrl: string | null,
  audio: HTMLAudioElement,
  onPlay: () => void,
  onPause: () => void
): void {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: artist || "",
    artwork: coverUrl
      ? [
          { src: coverUrl, sizes: "96x96", type: "image/jpeg" },
          { src: coverUrl, sizes: "256x256", type: "image/jpeg" },
          { src: coverUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audio.play();
    onPlay();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audio.pause();
    onPause();
  });

  navigator.mediaSession.setActionHandler("seekbackward", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 15);
  });

  navigator.mediaSession.setActionHandler("seekforward", () => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
  });

  // Android shows previoustrack/nexttrack buttons in notification widget
  // instead of seekbackward/seekforward — map them to ±15s skip
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 15);
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
  });

  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) {
      audio.currentTime = details.seekTime;
    }
  });
}

export function updatePositionState(audio: HTMLAudioElement): void {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;
  if (!("setPositionState" in navigator.mediaSession)) return;

  if (
    audio.duration &&
    !isNaN(audio.duration) &&
    audio.currentTime <= audio.duration
  ) {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
}

export function setMediaSessionPlaybackState(
  state: MediaSessionPlaybackState
): void {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;
  navigator.mediaSession.playbackState = state;
}
