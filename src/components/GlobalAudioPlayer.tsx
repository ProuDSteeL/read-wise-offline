import { useState } from "react";
import { useLocation } from "react-router-dom";
import MiniAudioPlayer from "./MiniAudioPlayer";
import AudioPlayerSheet from "./AudioPlayerSheet";
import { useAudio } from "@/contexts/AudioContext";

const GlobalAudioPlayer = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isActive } = useAudio();
  const location = useLocation();

  // Hide on admin and auth pages
  const hiddenPaths = ["/auth", "/reset-password", "/admin"];
  const isHidden = hiddenPaths.some((p) => location.pathname.startsWith(p));

  if (!isActive || isHidden) return null;

  return (
    <>
      {/* Mini player — fixed above bottom nav */}
      {!sheetOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-40">
          <MiniAudioPlayer onExpand={() => setSheetOpen(true)} />
        </div>
      )}
      {/* Full player bottom sheet */}
      <AudioPlayerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
};

export default GlobalAudioPlayer;
