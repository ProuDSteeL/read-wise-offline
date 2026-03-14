import { supabase } from "@/integrations/supabase/client";

const OFFLINE_PROGRESS_KEY = "offline-audio-pos-";

/**
 * Syncs all offline audio positions saved in localStorage
 * back to the database when coming online.
 */
export const syncOfflineProgress = async (userId: string) => {
  const keysToSync: { bookId: string; position: number }[] = [];

  // Collect all offline audio positions from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(OFFLINE_PROGRESS_KEY)) {
      const bookId = key.replace(OFFLINE_PROGRESS_KEY, "");
      const position = parseFloat(localStorage.getItem(key) || "0");
      if (bookId && position > 0) {
        keysToSync.push({ bookId, position });
      }
    }
  }

  if (keysToSync.length === 0) return;

  // Upsert each position to the database
  const results = await Promise.allSettled(
    keysToSync.map(({ bookId, position }) =>
      supabase.from("user_progress").upsert(
        { user_id: userId, book_id: bookId, audio_position: position },
        { onConflict: "user_id,book_id" }
      )
    )
  );

  // Clear synced keys
  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && !result.value.error) {
      localStorage.removeItem(OFFLINE_PROGRESS_KEY + keysToSync[idx].bookId);
    }
  });

  console.log(`[OfflineSync] Synced ${keysToSync.filter((_, i) => results[i].status === "fulfilled").length}/${keysToSync.length} positions`);
};
