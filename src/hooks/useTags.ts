import { useMemo } from "react";
import { usePublishedBooks } from "./useBooks";

export const useTags = () => {
  const { data: books } = usePublishedBooks();

  const tags = useMemo(() => {
    if (!books) return [];
    const tagSet = new Map<string, string>(); // lowercase -> original
    books.forEach((b) => {
      b.tags?.forEach((t) => {
        const lower = t.toLowerCase();
        if (!tagSet.has(lower)) tagSet.set(lower, t);
      });
    });
    return Array.from(tagSet.values()).sort((a, b) => a.localeCompare(b, "ru"));
  }, [books]);

  return tags;
};
