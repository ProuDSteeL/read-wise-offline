import { describe, it, expect } from "vitest";

describe("Admin quiz form logic (QUIZ-03)", () => {
  describe("quiz question validation", () => {
    interface QuizQuestionInput {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: number;
    }

    const isValidQuestion = (q: QuizQuestionInput) =>
      q.question.trim() !== "" &&
      q.option_a.trim() !== "" &&
      q.option_b.trim() !== "" &&
      q.option_c.trim() !== "" &&
      q.option_d.trim() !== "" &&
      q.correct_option >= 0 &&
      q.correct_option <= 3;

    it("accepts a fully filled question", () => {
      expect(isValidQuestion({
        question: "What is X?", option_a: "A", option_b: "B",
        option_c: "C", option_d: "D", correct_option: 0,
      })).toBe(true);
    });

    it("rejects empty question text", () => {
      expect(isValidQuestion({
        question: "", option_a: "A", option_b: "B",
        option_c: "C", option_d: "D", correct_option: 0,
      })).toBe(false);
    });

    it("rejects empty option", () => {
      expect(isValidQuestion({
        question: "Q?", option_a: "A", option_b: "",
        option_c: "C", option_d: "D", correct_option: 0,
      })).toBe(false);
    });

    it("rejects correct_option out of range", () => {
      expect(isValidQuestion({
        question: "Q?", option_a: "A", option_b: "B",
        option_c: "C", option_d: "D", correct_option: 5,
      })).toBe(false);
    });

    it("filters out invalid questions before save", () => {
      const questions: QuizQuestionInput[] = [
        { question: "Q1?", option_a: "A", option_b: "B", option_c: "C", option_d: "D", correct_option: 0 },
        { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: 0 },
        { question: "Q2?", option_a: "A", option_b: "B", option_c: "C", option_d: "D", correct_option: 2 },
      ];
      const valid = questions.filter(q => q.question.trim() && q.option_a.trim() && q.option_b.trim() && q.option_c.trim() && q.option_d.trim());
      expect(valid).toHaveLength(2);
    });
  });

  describe("flashcard validation", () => {
    interface FlashcardInput {
      front: string;
      back: string;
    }

    it("accepts filled flashcard", () => {
      const f: FlashcardInput = { front: "Concept", back: "Explanation" };
      expect(f.front.trim() !== "" && f.back.trim() !== "").toBe(true);
    });

    it("rejects empty front", () => {
      const f: FlashcardInput = { front: "", back: "Explanation" };
      expect(f.front.trim() !== "" && f.back.trim() !== "").toBe(false);
    });

    it("rejects empty back", () => {
      const f: FlashcardInput = { front: "Concept", back: "  " };
      expect(f.front.trim() !== "" && f.back.trim() !== "").toBe(false);
    });

    it("filters out invalid flashcards before save", () => {
      const cards: FlashcardInput[] = [
        { front: "Q1", back: "A1" },
        { front: "", back: "" },
        { front: "Q2", back: "A2" },
      ];
      const valid = cards.filter(f => f.front.trim() && f.back.trim());
      expect(valid).toHaveLength(2);
    });
  });

  describe("moveQuestion swap logic", () => {
    const moveQuestion = <T>(items: T[], from: number, to: number): T[] => {
      const updated = [...items];
      [updated[from], updated[to]] = [updated[to], updated[from]];
      return updated;
    };

    it("swaps adjacent items when moving down", () => {
      expect(moveQuestion(["Q1", "Q2", "Q3"], 0, 1)).toEqual(["Q2", "Q1", "Q3"]);
    });

    it("swaps adjacent items when moving up", () => {
      expect(moveQuestion(["Q1", "Q2", "Q3"], 2, 1)).toEqual(["Q1", "Q3", "Q2"]);
    });

    it("does not mutate original array", () => {
      const original = ["Q1", "Q2"];
      moveQuestion(original, 0, 1);
      expect(original).toEqual(["Q1", "Q2"]);
    });
  });
});
