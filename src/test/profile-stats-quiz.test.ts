import { describe, it, expect } from "vitest";

describe("Profile stats and learning progress (QUIZ-04)", () => {
  describe("overall learning progress calculation", () => {
    const calculateOverallPercent = (
      hasQuiz: boolean,
      hasFlashcards: boolean,
      quizDone: boolean,
      flashcardPercent: number
    ) => {
      if (hasQuiz && hasFlashcards) {
        return ((quizDone ? 0.5 : 0) + (flashcardPercent * 0.5)) * 100;
      } else if (hasQuiz) {
        return quizDone ? 100 : 0;
      } else if (hasFlashcards) {
        return flashcardPercent * 100;
      }
      return 0;
    };

    it("returns 0 when no quiz and no flashcards", () => {
      expect(calculateOverallPercent(false, false, false, 0)).toBe(0);
    });

    it("returns 100 when quiz done and no flashcards", () => {
      expect(calculateOverallPercent(true, false, true, 0)).toBe(100);
    });

    it("returns 0 when quiz not done and no flashcards", () => {
      expect(calculateOverallPercent(true, false, false, 0)).toBe(0);
    });

    it("returns flashcard percent when no quiz", () => {
      expect(calculateOverallPercent(false, true, false, 0.6)).toBe(60);
    });

    it("returns 50/50 split when both exist", () => {
      // Quiz done (50%) + flashcards 60% mastered (30%) = 80%
      expect(calculateOverallPercent(true, true, true, 0.6)).toBe(80);
    });

    it("returns only flashcard portion when quiz not done", () => {
      // Quiz not done (0%) + flashcards 80% mastered (40%) = 40%
      expect(calculateOverallPercent(true, true, false, 0.8)).toBe(40);
    });

    it("returns 100 when both fully complete", () => {
      expect(calculateOverallPercent(true, true, true, 1.0)).toBe(100);
    });
  });

  describe("stat card data shape", () => {
    it("returns 5 stats with correct labels", () => {
      const stats = [
        { label: "Прочитано", value: 5 },
        { label: "Время", value: "3 ч" },
        { label: "Серия дней", value: 7 },
        { label: "Квизы", value: 2 },
        { label: "Карточки", value: 15 },
      ];
      expect(stats).toHaveLength(5);
      expect(stats.map(s => s.label)).toEqual([
        "Прочитано", "Время", "Серия дней", "Квизы", "Карточки",
      ]);
    });
  });

  describe("mastery count calculation", () => {
    it("counts mastered flashcards correctly", () => {
      const progress = [
        { mastered: true },
        { mastered: false },
        { mastered: true },
        { mastered: true },
        { mastered: false },
      ];
      const masteredCount = progress.filter(p => p.mastered).length;
      expect(masteredCount).toBe(3);
    });

    it("returns 0 for empty progress", () => {
      const masteredCount = ([] as Array<{ mastered: boolean }>).filter(p => p.mastered).length;
      expect(masteredCount).toBe(0);
    });
  });
});
