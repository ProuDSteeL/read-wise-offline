import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  saveTextOffline,
  saveAudioOffline,
  saveBookMeta,
  getBookMeta,
  getAllDownloadedBooks,
  deleteBookOffline,
  getTotalStorageUsed,
  getStorageLimit,
  getStorageLimitMB,
  setStorageLimitMB,
  formatBytes,
  OfflineBookMeta,
} from "@/lib/offlineStorage";

type DownloadType = "text" | "audio" | "both";

interface DownloadProgress {
  bookId: string;
  type: DownloadType;
  progress: number; // 0-100
  status: "downloading" | "done" | "error";
}

export const useDownloads = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<OfflineBookMeta[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [books, used] = await Promise.all([getAllDownloadedBooks(), getTotalStorageUsed()]);
    setDownloads(books);
    setTotalUsed(used);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isDownloaded = useCallback(
    (bookId: string): OfflineBookMeta | undefined => {
      return downloads.find((d) => d.bookId === bookId);
    },
    [downloads]
  );

  const download = useCallback(
    async (
      bookId: string,
      type: DownloadType,
      bookData: { title: string; author: string; coverUrl: string | null },
      textContent?: string | null,
      audioUrl?: string | null,
      audioSizeHint?: number
    ) => {
      // Check storage limit
      const limit = getStorageLimit();
      const currentUsed = await getTotalStorageUsed();
      const estimatedSize =
        (type !== "audio" && textContent ? new Blob([textContent]).size : 0) +
        (type !== "text" && audioSizeHint ? audioSizeHint : 0);

      if (currentUsed + estimatedSize > limit) {
        toast({
          title: "Недостаточно места",
          description: `Занято ${formatBytes(currentUsed)} из ${formatBytes(limit)}. Удалите загрузки или увеличьте лимит.`,
          variant: "destructive",
        });
        return false;
      }

      const progress: DownloadProgress = { bookId, type, progress: 0, status: "downloading" };
      setActiveDownloads((prev) => new Map(prev).set(bookId, progress));

      try {
        let textSize = 0;
        let audioSize = 0;
        const existing = await getBookMeta(bookId);

        // Download text
        if ((type === "text" || type === "both") && textContent) {
          textSize = await saveTextOffline(bookId, textContent);
          setActiveDownloads((prev) => {
            const m = new Map(prev);
            m.set(bookId, { ...progress, progress: type === "text" ? 90 : 40 });
            return m;
          });
        }

        // Download audio (need signed URL since bucket is private)
        if ((type === "audio" || type === "both") && audioUrl) {
          const { data: audioData } = await supabase.functions.invoke("get-audio-url", {
            body: { bookId },
          });
          const signedAudioUrl = audioData?.signedUrl || audioUrl;
          audioSize = await saveAudioOffline(bookId, signedAudioUrl, (loaded, total) => {
            const base = type === "both" ? 40 : 0;
            const range = type === "both" ? 55 : 90;
            const pct = total > 0 ? base + (loaded / total) * range : base + 50;
            setActiveDownloads((prev) => {
              const m = new Map(prev);
              m.set(bookId, { ...progress, progress: Math.min(pct, 95) });
              return m;
            });
          });
        }

        // Save metadata
        const meta: OfflineBookMeta = {
          bookId,
          title: bookData.title,
          author: bookData.author,
          coverUrl: bookData.coverUrl,
          hasText: (type === "text" || type === "both") ? !!textContent : existing?.hasText || false,
          hasAudio: (type === "audio" || type === "both") ? !!audioUrl : existing?.hasAudio || false,
          textSizeBytes: (type === "text" || type === "both") ? textSize : existing?.textSizeBytes || 0,
          audioSizeBytes: (type === "audio" || type === "both") ? audioSize : existing?.audioSizeBytes || 0,
          downloadedAt: new Date().toISOString(),
        };
        await saveBookMeta(meta);

        // Track in DB
        if (user) {
          await supabase.from("user_downloads").upsert(
            {
              user_id: user.id,
              book_id: bookId,
              file_size_bytes: meta.textSizeBytes + meta.audioSizeBytes,
            },
            { onConflict: "user_id,book_id" }
          );
        }

        setActiveDownloads((prev) => {
          const m = new Map(prev);
          m.set(bookId, { ...progress, progress: 100, status: "done" });
          setTimeout(() => {
            setActiveDownloads((p) => {
              const n = new Map(p);
              n.delete(bookId);
              return n;
            });
          }, 1500);
          return m;
        });

        await refresh();
        toast({ title: "Загружено", description: `${bookData.title} сохранено офлайн` });
        return true;
      } catch (err) {
        console.error("Download error:", err);
        setActiveDownloads((prev) => {
          const m = new Map(prev);
          m.set(bookId, { ...progress, status: "error" });
          return m;
        });
        setTimeout(() => {
          setActiveDownloads((p) => {
            const n = new Map(p);
            n.delete(bookId);
            return n;
          });
        }, 3000);
        toast({ title: "Ошибка загрузки", variant: "destructive" });
        return false;
      }
    },
    [user, refresh]
  );

  const remove = useCallback(
    async (bookId: string) => {
      await deleteBookOffline(bookId);
      if (user) {
        await supabase.from("user_downloads").delete().eq("user_id", user.id).eq("book_id", bookId);
      }
      await refresh();
      toast({ title: "Загрузка удалена" });
    },
    [user, refresh]
  );

  return {
    downloads,
    totalUsed,
    loading,
    activeDownloads,
    isDownloaded,
    download,
    remove,
    refresh,
    storageLimitMB: getStorageLimitMB(),
    setStorageLimitMB: (mb: number) => {
      setStorageLimitMB(mb);
    },
  };
};
