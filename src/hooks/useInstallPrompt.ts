import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const DISMISS_KEY = "pwa-install-dismissed-at";
export const DISMISS_DAYS = 7;
export const VISIT_COUNT_KEY = "pwa-visit-count";
export const VISIT_THRESHOLD = 3;

export function shouldShowInstallPrompt(
  isLoggedIn: boolean,
  visitCount: number,
  dismissedAt: number | null,
  now: number = Date.now()
): boolean {
  if (!isLoggedIn) return false;
  if (visitCount < VISIT_THRESHOLD) return false;
  if (dismissedAt !== null) {
    const daysSince = (now - dismissedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < DISMISS_DAYS) return false;
  }
  return true;
}

export function incrementVisitCount(currentCount: number): number {
  return currentCount + 1;
}

export const useInstallPrompt = (isLoggedIn: boolean) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Increment visit count on mount
  useEffect(() => {
    const count = incrementVisitCount(
      Number(localStorage.getItem(VISIT_COUNT_KEY) || "0")
    );
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      const visitCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
      if (!shouldShowInstallPrompt(
        isLoggedIn,
        visitCount,
        dismissedAt ? Number(dismissedAt) : null
      )) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isLoggedIn]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferredPrompt(null);
  }, []);

  return {
    canInstall: !!deferredPrompt,
    promptInstall,
    dismiss,
  };
};
