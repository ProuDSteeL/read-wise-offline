/**
 * Pure logic helpers for download display state.
 * Used by DownloadDialog to determine what to show.
 */

export function getDownloadDisplayState(
  progress: number | undefined,
  status: string | undefined
): "idle" | "downloading" | "done" {
  if (status === "done" || progress === 100) return "done";
  if (status === "downloading" && progress != null) return "downloading";
  return "idle";
}

export function roundProgress(progress: number | undefined): number {
  if (progress == null) return 0;
  return Math.round(progress);
}
