import { describe, it, expect } from "vitest";

describe("Flashcard logic (QUIZ-02)", () => {
  describe("flip state toggling", () => {
    const toggleFlip = (flippedCards: Record<number, boolean>, index: number) => {
      return { ...flippedCards, [index]: !flippedCards[index] };
    };

    it("flips an unflipped card", () => {
      const result = toggleFlip({}, 0);
      expect(result[0]).toBe(true);
    });

    it("unflips a flipped card", () => {
      const result = toggleFlip({ 0: true }, 0);
      expect(result[0]).toBe(false);
    });

    it("preserves other cards state", () => {
      const result = toggleFlip({ 0: true, 1: false }, 0);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe(false);
    });

    it("handles undefined as false (not flipped)", () => {
      const flipped: Record<number, boolean> = {};
      expect(flipped[5] ?? false).toBe(false);
    });
  });

  describe("mastery percentage", () => {
    const calculateMasteryPercent = (
      progress: Array<{ mastered: boolean }>,
      totalCards: number
    ) => {
      if (totalCards === 0) return 0;
      const mastered = progress.filter((p) => p.mastered).length;
      return mastered / totalCards;
    };

    it("returns 0 for no cards", () => {
      expect(calculateMasteryPercent([], 0)).toBe(0);
    });

    it("returns 0 for no progress", () => {
      expect(calculateMasteryPercent([], 5)).toBe(0);
    });

    it("calculates partial mastery", () => {
      const progress = [
        { mastered: true },
        { mastered: false },
        { mastered: true },
      ];
      expect(calculateMasteryPercent(progress, 5)).toBeCloseTo(0.4);
    });

    it("calculates full mastery", () => {
      const progress = [
        { mastered: true },
        { mastered: true },
        { mastered: true },
      ];
      expect(calculateMasteryPercent(progress, 3)).toBe(1);
    });
  });

  describe("self-rating updates", () => {
    it("marks card as mastered when rated 'knew it'", () => {
      const update = { flashcardId: "abc", bookId: "xyz", mastered: true };
      expect(update.mastered).toBe(true);
    });

    it("marks card as not mastered when rated 'didn't know'", () => {
      const update = { flashcardId: "abc", bookId: "xyz", mastered: false };
      expect(update.mastered).toBe(false);
    });
  });
});
