import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*, books(*)")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUserShelves = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_shelves", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_shelves")
        .select("*, books(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useShelfCounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shelf_counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_shelves")
        .select("shelf_type")
        .eq("user_id", user!.id);
      if (error) throw error;
      const counts = { favorite: 0, read: 0, want_to_read: 0 };
      data?.forEach((s) => {
        if (s.shelf_type in counts) counts[s.shelf_type as keyof typeof counts]++;
      });
      return counts;
    },
    enabled: !!user,
  });
};

export const useDownloadCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["download_count", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_downloads")
        .select("id", { count: "exact" })
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });
};
