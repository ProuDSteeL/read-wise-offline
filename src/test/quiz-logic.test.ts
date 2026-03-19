import { describe, it, expect } from "vitest";

describe("Quiz logic (QUIZ-01)", () => {
  describe("score calculation", () => {
    const calculateScore = (
      answers: Record<number, number>,
      questions: Array<{ correct_option: number }>
    ) => {
      return questions.reduce(
        (score, q, i) => score + (answers[i] === q.correct_option ? 1 : 0),
        0
      );
    };

    it("scores all correct answers", () => {
      const questions = [
        { correct_option: 0 },
        { correct_option: 2 },
        { correct_option: 1 },
      ];
      const answers = { 0: 0, 1: 2, 2: 1 };
      expect(calculateScore(answers, questions)).toBe(3);
    });

    it("scores zero for all wrong answers", () => {
      const questions = [
        { correct_option: 0 },
        { correct_option: 2 },
      ];
      const answers = { 0: 1, 1: 0 };
      expect(calculateScore(answers, questions)).toBe(0);
    });

    it("scores partial correctness", () => {
      const questions = [
        { correct_option: 0 },
        { correct_option: 2 },
        { correct_option: 3 },
      ];
      const answers = { 0: 0, 1: 1, 2: 3 };
      expect(calculateScore(answers, questions)).toBe(2);
    });

    it("handles empty quiz", () => {
      expect(calculateScore({}, [])).toBe(0);
    });
  });

  describe("best-score comparison", () => {
    const shouldSaveScore = (newScore: number, existingScore: number | null) => {
      if (existingScore === null) return true;
      return newScore > existingScore;
    };

    it("saves when no existing score", () => {
      expect(shouldSaveScore(3, null)).toBe(true);
    });

    it("saves when new score is higher", () => {
      expect(shouldSaveScore(4, 3)).toBe(true);
    });

    it("does not save when new score is lower", () => {
      expect(shouldSaveScore(2, 3)).toBe(false);
    });

    it("does not save when scores are equal", () => {
      expect(shouldSaveScore(3, 3)).toBe(false);
    });
  });

  describe("quiz state transitions", () => {
    type QuizState =
      | { phase: "ready" }
      | { phase: "in-progress"; currentIndex: number; answers: Record<number, number> }
      | { phase: "completed"; score: number; answers: Record<number, number> };

    it("starts in ready state", () => {
      const state: QuizState = { phase: "ready" };
      expect(state.phase).toBe("ready");
    });

    it("transitions to in-progress with index 0", () => {
      const state: QuizState = { phase: "in-progress", currentIndex: 0, answers: {} };
      expect(state.phase).toBe("in-progress");
      expect(state.currentIndex).toBe(0);
    });

    it("advances index on answer", () => {
      const current: QuizState = { phase: "in-progress", currentIndex: 0, answers: {} };
      const next: QuizState = {
        phase: "in-progress",
        currentIndex: current.currentIndex + 1,
        answers: { ...current.answers, [current.currentIndex]: 2 },
      };
      expect(next.currentIndex).toBe(1);
      expect(next.answers[0]).toBe(2);
    });

    it("transitions to completed on last answer", () => {
      const totalQuestions = 3;
      const currentIndex = 2; // last question
      const answers = { 0: 1, 1: 2, 2: 0 };
      const isLast = currentIndex >= totalQuestions - 1;
      expect(isLast).toBe(true);
      const state: QuizState = { phase: "completed", score: 2, answers };
      expect(state.phase).toBe("completed");
    });
  });
});
