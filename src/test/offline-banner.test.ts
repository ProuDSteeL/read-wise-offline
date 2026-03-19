import { describe, it, expect } from "vitest";

/**
 * Pure logic for offline banner visibility.
 */
export function shouldShowBanner(isOnline: boolean): boolean {
  return !isOnline;
}

export const OFFLINE_BANNER_TEXT = "Нет подключения к интернету";

describe("shouldShowBanner", () => {
  it("returns true when offline", () => {
    expect(shouldShowBanner(false)).toBe(true);
  });

  it("returns false when online", () => {
    expect(shouldShowBanner(true)).toBe(false);
  });
});

describe("OFFLINE_BANNER_TEXT", () => {
  it("contains the Russian offline message", () => {
    expect(OFFLINE_BANNER_TEXT).toBe("Нет подключения к интернету");
  });
});
