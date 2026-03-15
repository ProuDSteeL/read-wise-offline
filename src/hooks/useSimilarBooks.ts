import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Book } from "@/hooks/useBooks";

export const useSimilarBooks = (book: Book | undefined) => {
  return useQuery({
    queryKey: ["similar_books", book?.id],
    queryFn: async () => {
      if (!book?.categories?.length) {
        // Fallback: return popular books excluding current
        const { data } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .neq("id", book!.id)
          .order("views_count", { ascending: false })
          .limit(6);
        return (data as Book[]) || [];
      }

      // Find books sharing categories
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .neq("id", book!.id)
        .overlaps("categories", book.categories)
        .order("rating", { ascending: false })
        .limit(10);

      const results = (data as Book[]) || [];

      // If too few, backfill with popular
      if (results.length < 4) {
        const existingIds = new Set([book!.id, ...results.map((b) => b.id)]);
        const { data: popular } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .order("views_count", { ascending: false })
          .limit(10);
        const backfill = (popular as Book[] || []).filter((b) => !existingIds.has(b.id));
        return [...results, ...backfill].slice(0, 6);
      }

      return results.slice(0, 6);
    },
    enabled: !!book?.id,
    staleTime: 5 * 60 * 1000,
  });
};
