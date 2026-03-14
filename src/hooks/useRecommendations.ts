import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Book } from "@/hooks/useBooks";

export const useRecommendations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      // Get user's read/favorite books to extract preferred categories
      const { data: userShelves } = await supabase
        .from("user_shelves")
        .select("books(categories)")
        .eq("user_id", user!.id);

      const categoryCounts = new Map<string, number>();
      userShelves?.forEach((s: any) => {
        s.books?.categories?.forEach((cat: string) => {
          categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        });
      });

      if (categoryCounts.size === 0) return [];

      // Sort categories by frequency
      const topCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // Get user's already-interacted book IDs
      const { data: seenShelves } = await supabase
        .from("user_shelves")
        .select("book_id")
        .eq("user_id", user!.id);

      const { data: seenProgress } = await supabase
        .from("user_progress")
        .select("book_id")
        .eq("user_id", user!.id);

      const seenIds = new Set([
        ...(seenShelves?.map((s) => s.book_id) || []),
        ...(seenProgress?.map((p) => p.book_id) || []),
      ]);

      // Fetch published books that overlap with top categories
      const { data: books } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .overlaps("categories", topCategories)
        .order("rating", { ascending: false })
        .limit(20);

      // Filter out already seen and return top 10
      return (books as Book[] || [])
        .filter((b) => !seenIds.has(b.id))
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
