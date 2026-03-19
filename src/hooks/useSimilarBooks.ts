import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Book } from "@/hooks/useBooks";

export const useSimilarBooks = (book: Book | undefined) => {
  return useQuery({
    queryKey: ["similar_books", book?.id],
    queryFn: async () => {
      if (!book?.tags?.length) {
        // Fallback: return recent books excluding current
        const { data } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .neq("id", book!.id)
          .order("created_at", { ascending: false })
          .limit(6);
        return (data as Book[]) || [];
      }

      // Find books sharing tags
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .neq("id", book!.id)
        .overlaps("tags", book.tags)
        .order("created_at", { ascending: false })
        .limit(10);

      const results = (data as Book[]) || [];

      // If too few, backfill with recent
      if (results.length < 4) {
        const existingIds = new Set([book!.id, ...results.map((b) => b.id)]);
        const { data: recent } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(10);
        const backfill = (recent as Book[] || []).filter((b) => !existingIds.has(b.id));
        return [...results, ...backfill].slice(0, 6);
      }

      return results.slice(0, 6);
    },
    enabled: !!book?.id,
    staleTime: 5 * 60 * 1000,
  });
};
