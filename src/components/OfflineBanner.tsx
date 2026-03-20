import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-[60] flex items-center justify-center gap-2 rounded-full bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground shadow-elevated">
      <WifiOff className="h-3.5 w-3.5" />
      Нет подключения к интернету
    </div>
  );
};

export default OfflineBanner;
