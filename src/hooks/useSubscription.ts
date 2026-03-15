import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscription = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_type, subscription_expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const subscriptionType = query.data?.subscription_type ?? "free";
  const expiresAt = query.data?.subscription_expires_at
    ? new Date(query.data.subscription_expires_at)
    : null;

  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const isPro =
    subscriptionType !== "free" && !isExpired;

  return {
    subscriptionType,
    expiresAt,
    isPro,
    isExpired,
    isLoading: query.isLoading,
  };
};
