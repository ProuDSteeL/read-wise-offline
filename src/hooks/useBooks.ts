import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Book = Tables<"books">;

export const usePublishedBooks = () => {
  return useQuery({
    queryKey: ["books", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });
};

export const usePopularBooks = () => {
  return useQuery({
    queryKey: ["books", "popular"],
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
