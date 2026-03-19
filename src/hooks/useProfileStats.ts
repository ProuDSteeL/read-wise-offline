import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProfileStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile_stats", user?.id],
    queryFn: async () => {
      // Read count
      const { data: readShelves } = await supabase
        .from("user_shelves")
        .select("id", { count: "exact" })
        .eq("user_id", user!.id)
        .eq("shelf_type", "read");

      const readCount = readShelves?.length ?? 0;

      // Total reading time from books marked as read
      const { data: readBooks } = await supabase
        .from("user_shelves")
        .select("books(read_time_minutes)")
        .eq("user_id", user!.id)
        .eq("shelf_type", "read");

      let totalMinutes = 0;
      readBooks?.forEach((r: any) => {
        totalMinutes += r.books?.read_time_minutes ?? 0;
      });
      const totalHours = Math.round(totalMinutes / 60);

      // Streak: consecutive days with progress updates
      const { data: progressDates } = await supabase
        .from("user_progress")
        .select("updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      let streak = 0;
      if (progressDates?.length) {
        const uniqueDays = new Set(
          progressDates.map((p) =>
            new Date(p.updated_at).toISOString().slice(0, 10)
          )
        );
        const days = Array.from(uniqueDays).sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        // Streak starts from today or yesterday
        if (days[0] === today || days[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < days.length; i++) {
            const prev = new Date(days[i - 1]);
            const curr = new Date(days[i]);
            const diff = (prev.getTime() - curr.getTime()) / 86400000;
            if (Math.round(diff) === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      return { readCount, totalHours, streak };
    },
    enabled: !!user,
  });
};
