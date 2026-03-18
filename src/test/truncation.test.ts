import { describe, it, expect } from "vitest";
import { truncateSummary } from "@/lib/truncateSummary";

describe("truncateSummary", () => {
  it("returns approximately first 25% of content at paragraph boundary", () => {
    const content = "First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.\n\nFourth paragraph here.";
    const result = truncateSummary(content, 0.25);
    // Should return at least the first paragraph
    expect(result).toContain("First paragraph here.");
    // Should NOT contain all paragraphs
    expect(result).not.toBe(content);
    // Should be roughly 25% of content
    expect(result.length).toBeLessThanOrEqual(content.length * 0.6);
  });

  it("returns the whole paragraph for short content (1 paragraph)", () => {
    const content = "This is a single paragraph with no double newlines.";
    const result = truncateSummary(content, 0.25);
    expect(result).toBe(content);
  });

  it("returns empty string for empty input", () => {
    expect(truncateSummary("", 0.25)).toBe("");
  });

  it("always returns at least 1 paragraph", () => {
    const content = "Short first.\n\nVery long second paragraph that goes on and on and on and on and is much longer than the first one by a significant amount to ensure the percentage calculation works correctly.";
    const result = truncateSummary(content, 0.01); // Very small percentage
    expect(result).toBe("Short first.");
    expect(result.length).toBeGreaterThan(0);
  });

  it("splits on double-newline boundaries only (not single newlines)", () => {
    const content = "Line one\nLine two\nLine three\n\nSecond paragraph\n\nThird paragraph";
    const result = truncateSummary(content, 0.25);
    // First 'paragraph' includes lines joined by single newlines
    expect(result).toContain("Line one\nLine two\nLine three");
  });
});
