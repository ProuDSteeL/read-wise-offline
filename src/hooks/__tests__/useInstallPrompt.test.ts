import { describe, it, expect } from "vitest";
import { shouldShowInstallPrompt, incrementVisitCount, VISIT_THRESHOLD, DISMISS_DAYS } from "../useInstallPrompt";

describe("shouldShowInstallPrompt", () => {
  const now = Date.now();

  it("returns false when isLoggedIn is false regardless of visit count", () => {
    expect(shouldShowInstallPrompt(false, 10, null, now)).toBe(false);
    expect(shouldShowInstallPrompt(false, 0, null, now)).toBe(false);
    expect(shouldShowInstallPrompt(false, VISIT_THRESHOLD, null, now)).toBe(false);
  });

  it("returns false when visitCount < 3 regardless of login state", () => {
    expect(shouldShowInstallPrompt(true, 0, null, now)).toBe(false);
    expect(shouldShowInstallPrompt(true, 1, null, now)).toBe(false);
    expect(shouldShowInstallPrompt(true, 2, null, now)).toBe(false);
  });

  it("returns true when isLoggedIn=true AND visitCount >= 3 AND not dismissed", () => {
    expect(shouldShowInstallPrompt(true, 3, null, now)).toBe(true);
    expect(shouldShowInstallPrompt(true, 5, null, now)).toBe(true);
    expect(shouldShowInstallPrompt(true, 100, null, now)).toBe(true);
  });

  it("returns false when dismissed less than 7 days ago", () => {
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, 5, sixDaysAgo, now)).toBe(false);

    const oneHourAgo = now - 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, 5, oneHourAgo, now)).toBe(false);
  });

  it("returns true when dismissed more than 7 days ago (dismiss expired)", () => {
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    expect(shouldShowInstallPrompt(true, 5, eightDaysAgo, now)).toBe(true);
  });

  it("VISIT_THRESHOLD is 3", () => {
    expect(VISIT_THRESHOLD).toBe(3);
  });

  it("DISMISS_DAYS is 7", () => {
    expect(DISMISS_DAYS).toBe(7);
  });
});

describe("incrementVisitCount", () => {
  it("returns previous + 1", () => {
    expect(incrementVisitCount(0)).toBe(1);
    expect(incrementVisitCount(2)).toBe(3);
    expect(incrementVisitCount(99)).toBe(100);
  });
});
