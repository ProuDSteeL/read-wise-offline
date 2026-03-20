import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Book = Tables<"books">;

export const usePublishedBooks = (limit?: number) => {
  return useQuery({
    queryKey: ["books", "published", limit],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data as Book[];
    },
  });
};

export const usePopularBooks = () => {
  return useQuery({
    queryKey: ["books", "popular"],
    queryFn: async () => {
      // Get book IDs with ratings, ordered by average rating desc
      const { data: ratings, error: ratingsError } = await supabase
        .from("user_ratings")
        .select("book_id, rating");
      if (ratingsError) throw ratingsError;

      // Calculate average ratings per book
      const bookRatings = new Map<string, { sum: number; count: number }>();
      for (const r of ratings || []) {
        const existing = bookRatings.get(r.book_id) || { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        bookRatings.set(r.book_id, existing);
      }

      // Sort by average rating descending, then by count as tiebreaker
      const sortedIds = [...bookRatings.entries()]
        .map(([id, { sum, count }]) => ({ id, avg: sum / count, count }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 10)
        .map((r) => r.id);

      if (sortedIds.length === 0) {
        // Fallback: if no ratings exist, show newest books
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        return data as Book[];
      }

      // Fetch the books by ID
      const { data: books, error: booksError } = await supabase
        .from("books")
        .select("*")
        .in("id", sortedIds)
        .eq("status", "published");
      if (booksError) throw booksError;

      // Re-sort to match the rating order
      const bookMap = new Map((books || []).map((b) => [b.id, b]));
      return sortedIds.map((id) => bookMap.get(id)).filter(Boolean) as Book[];
    },
  });
};

export const useNewBooks = () => {
  return useQuery({
    queryKey: ["books", "new"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Book[];
    },
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Book;
    },
    enabled: !!id,
  });
};

export const useKeyIdeas = (bookId: string) => {
  return useQuery({
    queryKey: ["key_ideas", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_ideas")
        .select("*")
        .eq("book_id", bookId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
};

export const useSearchBooks = (query: string) => {
  return useQuery({
    queryKey: ["books", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return data as Book[];
    },
    enabled: query.length >= 2,
  });
};

export const useCollections = () => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("is_featured", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};
