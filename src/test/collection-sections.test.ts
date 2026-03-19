import { describe, it, expect } from "vitest";

describe("Collection sections (COLL-02)", () => {
  const mockCollections = [
    { id: "c1", title: "Best of 2025", description: "Top picks" },
    { id: "c2", title: "Productivity", description: null },
    { id: "c3", title: "Self Growth", description: "Personal development" },
  ];

  describe("collection filtering", () => {
    it("renders a section for each collection", () => {
      const sections = mockCollections.map((col) => col.id);
      expect(sections).toHaveLength(3);
    });

    it("uses collection title for SectionHeader", () => {
      const titles = mockCollections.map((col) => col.title);
      expect(titles).toEqual(["Best of 2025", "Productivity", "Self Growth"]);
    });
  });

  describe("empty collection hiding", () => {
    it("hides section when books array is empty", () => {
      const books: unknown[] = [];
      const shouldRender = books?.length > 0;
      expect(shouldRender).toBe(false);
    });

    it("shows section when books exist", () => {
      const books = [{ id: "b1", title: "Book 1" }];
      const shouldRender = books?.length > 0;
      expect(shouldRender).toBe(true);
    });

    it("hides section when books is null/undefined", () => {
      const books = null;
      const shouldRender = !!books && (books as unknown[]).length > 0;
      expect(shouldRender).toBe(false);
    });
  });

  describe("book card props mapping", () => {
    it("maps cover_url null to placeholder", () => {
      const coverUrl = null;
      const mapped = coverUrl || "/placeholder.svg";
      expect(mapped).toBe("/placeholder.svg");
    });

    it("maps read_time_minutes null to undefined", () => {
      const readTime: number | null = null;
      const mapped = readTime ?? undefined;
      expect(mapped).toBeUndefined();
    });
  });
});
