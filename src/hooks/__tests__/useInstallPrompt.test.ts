import { describe, it, expect } from "vitest";
import { shouldShowInstallPrompt, DISMISS_DAYS } from "../useInstallPrompt";

describe("shouldShowInstallPrompt", () => {
  const now = Date.now();

  it("returns false when isLoggedIn is false", () => {
    expect(shouldShowInstallPrompt(false, null, now)).toBe(false);
  });

  it("returns true when isLoggedIn=true AND not dismissed", () => {
    expect(shouldShowInstallPrompt(true, null, now)).toBe(true);
  });

  it("returns false when dismissed less than 7 days ago", () => {
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, sixDaysAgo, now)).toBe(false);

    const oneHourAgo = now - 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, oneHourAgo, now)).toBe(false);
  });

  it("returns true when dismissed more than 7 days ago", () => {
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, eightDaysAgo, now)).toBe(true);
  });

  it("DISMISS_DAYS is 7", () => {
    expect(DISMISS_DAYS).toBe(7);
  });
});
