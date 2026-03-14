import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncOfflineProgress } from "@/lib/offlineSync";
import { toast } from "@/hooks/use-toast";

/**
 * Watches online status and syncs offline progress when reconnected.
 */
export const useOfflineSync = () => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Just came back online
    if (wasOffline.current && user) {
      wasOffline.current = false;
      syncOfflineProgress(user.id).then(() => {
        toast({ title: "Прогресс синхронизирован", description: "Офлайн-данные сохранены в облако" });
      }).catch(() => {});
    }
  }, [isOnline, user]);
};
