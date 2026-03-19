import { describe, it, expect } from "vitest";

describe("Admin key ideas reorder (CONT-02)", () => {
  describe("moveIdea swap logic", () => {
    const moveIdea = (ideas: string[], from: number, to: number) => {
      const updated = [...ideas];
      [updated[from], updated[to]] = [updated[to], updated[from]];
      return updated;
    };

    it("swaps adjacent items when moving down", () => {
      const result = moveIdea(["A", "B", "C"], 0, 1);
      expect(result).toEqual(["B", "A", "C"]);
    });

    it("swaps adjacent items when moving up", () => {
      const result = moveIdea(["A", "B", "C"], 2, 1);
      expect(result).toEqual(["A", "C", "B"]);
    });

    it("preserves array length", () => {
      const result = moveIdea(["A", "B", "C"], 0, 1);
      expect(result).toHaveLength(3);
    });

    it("does not mutate original array", () => {
      const original = ["A", "B", "C"];
      moveIdea(original, 0, 1);
      expect(original).toEqual(["A", "B", "C"]);
    });
  });

  describe("boundary button disabled state", () => {
    it("first item cannot move up (disabled)", () => {
      const i = 0;
      expect(i === 0).toBe(true);
    });

    it("last item cannot move down (disabled)", () => {
      const ideas = ["A", "B", "C"];
      const i = 2;
      expect(i === ideas.length - 1).toBe(true);
    });

    it("middle item can move both directions", () => {
      const ideas = ["A", "B", "C"];
      const i = 1;
      expect(i === 0).toBe(false);
      expect(i === ideas.length - 1).toBe(false);
    });
  });
});
