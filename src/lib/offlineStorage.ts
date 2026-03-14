import localforage from "localforage";

// IndexedDB store for audio blobs
const audioStore = localforage.createInstance({
  name: "buks-offline",
  storeName: "audio",
});

// IndexedDB store for text content
const textStore = localforage.createInstance({
  name: "buks-offline",
  storeName: "text",
});

// IndexedDB store for metadata (cover, title, etc.)
const metaStore = localforage.createInstance({
  name: "buks-offline",
  storeName: "meta",
});

const STORAGE_LIMIT_KEY = "offline-storage-limit-mb";
const DEFAULT_LIMIT_MB = 500;

export interface OfflineBookMeta {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  hasText: boolean;
  hasAudio: boolean;
  textSizeBytes: number;
  audioSizeBytes: number;
  downloadedAt: string;
}

// Get storage limit in bytes
export const getStorageLimit = (): number => {
  const saved = localStorage.getItem(STORAGE_LIMIT_KEY);
  return (saved ? parseInt(saved) : DEFAULT_LIMIT_MB) * 1024 * 1024;
};

export const getStorageLimitMB = (): number => {
  const saved = localStorage.getItem(STORAGE_LIMIT_KEY);
  return saved ? parseInt(saved) : DEFAULT_LIMIT_MB;
};

export const setStorageLimitMB = (mb: number) => {
  localStorage.setItem(STORAGE_LIMIT_KEY, String(mb));
};

// Save text content offline
export const saveTextOffline = async (bookId: string, content: string): Promise<number> => {
  const blob = new Blob([content], { type: "text/plain" });
  await textStore.setItem(bookId, content);
  return blob.size;
};

// Get offline text
export const getTextOffline = async (bookId: string): Promise<string | null> => {
  return textStore.getItem<string>(bookId);
};

// Delete offline text
export const deleteTextOffline = async (bookId: string) => {
  await textStore.removeItem(bookId);
};

// Save audio offline (fetch and store as blob)
export const saveAudioOffline = async (
  bookId: string,
  audioUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<number> => {
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error("Failed to fetch audio");

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength) : 0;

  if (!response.body) {
    // Fallback: no streaming
    const blob = await response.blob();
    await audioStore.setItem(bookId, blob);
    return blob.size;
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as unknown as BlobPart);
    loaded += value.length;
    onProgress?.(loaded, total);
  }

  const blob = new Blob(chunks, { type: "audio/mpeg" });
  await audioStore.setItem(bookId, blob);
  return blob.size;
};

// Get offline audio as blob URL
export const getAudioOffline = async (bookId: string): Promise<string | null> => {
  const blob = await audioStore.getItem<Blob>(bookId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

// Delete offline audio
export const deleteAudioOffline = async (bookId: string) => {
  await audioStore.removeItem(bookId);
};

// Save book metadata
export const saveBookMeta = async (meta: OfflineBookMeta) => {
  await metaStore.setItem(meta.bookId, meta);
};

// Get book metadata
export const getBookMeta = async (bookId: string): Promise<OfflineBookMeta | null> => {
  return metaStore.getItem<OfflineBookMeta>(bookId);
};

// Delete book metadata
export const deleteBookMeta = async (bookId: string) => {
  await metaStore.removeItem(bookId);
};

// Get all downloaded books metadata
export const getAllDownloadedBooks = async (): Promise<OfflineBookMeta[]> => {
  const items: OfflineBookMeta[] = [];
  await metaStore.iterate<OfflineBookMeta, void>((value) => {
    items.push(value);
  });
  return items.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
};

// Calculate total storage used
export const getTotalStorageUsed = async (): Promise<number> => {
  const books = await getAllDownloadedBooks();
  return books.reduce((sum, b) => sum + b.textSizeBytes + b.audioSizeBytes, 0);
};

// Delete all offline data for a book
export const deleteBookOffline = async (bookId: string) => {
  await Promise.all([
    textStore.removeItem(bookId),
    audioStore.removeItem(bookId),
    metaStore.removeItem(bookId),
  ]);
};

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
