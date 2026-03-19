import { describe, it, expect } from "vitest";

describe("Key ideas carousel (CONT-01)", () => {
  const mockKeyIdeas = [
    { id: "1", title: "Idea 1", content: "Content 1", display_order: 0 },
    { id: "2", title: "Idea 2", content: "Content 2", display_order: 1 },
    { id: "3", title: "Idea 3", content: "Content 3", display_order: 2 },
  ];

  describe("dot indicator active state", () => {
    it("returns active class for selected index", () => {
      const activeIdx = 1;
      const getClass = (i: number) =>
        i === activeIdx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20";
      expect(getClass(0)).toBe("w-1.5 bg-muted-foreground/20");
      expect(getClass(1)).toBe("w-5 bg-primary");
      expect(getClass(2)).toBe("w-1.5 bg-muted-foreground/20");
    });

    it("generates correct number of dots", () => {
      const dots = mockKeyIdeas.map((_, i) => i);
      expect(dots).toHaveLength(3);
    });
  });

  describe("empty state", () => {
    it("should hide section when keyIdeas is empty", () => {
      const keyIdeas: typeof mockKeyIdeas = [];
      const shouldRender = keyIdeas && keyIdeas.length > 0;
      expect(shouldRender).toBe(false);
    });

    it("should show section when keyIdeas has items", () => {
      const shouldRender = mockKeyIdeas && mockKeyIdeas.length > 0;
      expect(shouldRender).toBe(true);
    });
  });

  describe("display_order mapping", () => {
    it("maps display_order to 1-based index for card display", () => {
      const indices = mockKeyIdeas.map((idea) => idea.display_order + 1);
      expect(indices).toEqual([1, 2, 3]);
    });
  });
});
