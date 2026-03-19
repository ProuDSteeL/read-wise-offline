import { describe, it, expect } from "vitest";
import { getDownloadDisplayState, roundProgress } from "@/lib/downloadDisplayState";

describe("getDownloadDisplayState", () => {
  it("returns 'idle' when progress is undefined", () => {
    expect(getDownloadDisplayState(undefined, undefined)).toBe("idle");
  });

  it("returns 'downloading' when progress is 0-99 with status 'downloading'", () => {
    expect(getDownloadDisplayState(0, "downloading")).toBe("downloading");
    expect(getDownloadDisplayState(50, "downloading")).toBe("downloading");
    expect(getDownloadDisplayState(99, "downloading")).toBe("downloading");
  });

  it("returns 'done' when progress is 100", () => {
    expect(getDownloadDisplayState(100, "downloading")).toBe("done");
    expect(getDownloadDisplayState(100, "done")).toBe("done");
  });

  it("returns 'done' when status is 'done'", () => {
    expect(getDownloadDisplayState(80, "done")).toBe("done");
    expect(getDownloadDisplayState(undefined, "done")).toBe("done");
  });

  it("returns 'idle' when status is undefined even with progress", () => {
    expect(getDownloadDisplayState(50, undefined)).toBe("idle");
  });
});

describe("roundProgress", () => {
  it("returns 0 when progress is undefined", () => {
    expect(roundProgress(undefined)).toBe(0);
  });

  it("rounds 45.7 to 46", () => {
    expect(roundProgress(45.7)).toBe(46);
  });

  it("rounds 45.3 to 45", () => {
    expect(roundProgress(45.3)).toBe(45);
  });

  it("keeps integer values unchanged", () => {
    expect(roundProgress(0)).toBe(0);
    expect(roundProgress(50)).toBe(50);
    expect(roundProgress(100)).toBe(100);
  });
});
