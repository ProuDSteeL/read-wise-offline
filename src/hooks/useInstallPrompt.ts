import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const DISMISS_KEY = "pwa-install-dismissed-at";
export const DISMISS_DAYS = 7;

export function shouldShowInstallPrompt(
  isLoggedIn: boolean,
  dismissedAt: number | null,
  now: number = Date.now()
): boolean {
  if (!isLoggedIn) return false;
  if (dismissedAt !== null) {
    const daysSince = (now - dismissedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < DISMISS_DAYS) return false;
  }
  return true;
}

export const useInstallPrompt = (isLoggedIn: boolean) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualBanner, setShowManualBanner] = useState(false);
  const nativeFired = useRef(false);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone || !isLoggedIn) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!shouldShowInstallPrompt(isLoggedIn, dismissedAt ? Number(dismissedAt) : null)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      nativeFired.current = true;
      setShowManualBanner(false);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if beforeinstallprompt doesn't fire after 4s, show manual banner
    const fallbackTimer = setTimeout(() => {
      if (!nativeFired.current) {
        setShowManualBanner(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, [isLoggedIn, isStandalone]);

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
    setShowManualBanner(false);
  }, []);

  return {
    canInstall: !!deferredPrompt || (showManualBanner && !isStandalone),
    isNativePrompt: !!deferredPrompt,
    isStandalone,
    promptInstall,
    dismiss,
  };
};
