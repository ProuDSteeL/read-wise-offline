export const HIGHLIGHT_COLORS = [
  { key: "yellow", hex: "#F59E0B", bg: "bg-yellow-400/15", ring: "ring-yellow-400" },
  { key: "green",  hex: "#10B981", bg: "bg-emerald-400/15", ring: "ring-emerald-400" },
  { key: "blue",   hex: "#3B82F6", bg: "bg-blue-400/15",   ring: "ring-blue-400" },
  { key: "pink",   hex: "#EC4899", bg: "bg-pink-400/15",   ring: "ring-pink-400" },
  { key: "purple", hex: "#8B5CF6", bg: "bg-violet-400/15", ring: "ring-violet-400" },
] as const;

export type HighlightColorKey = typeof HIGHLIGHT_COLORS[number]["key"];

export const DEFAULT_COLOR = "yellow";

export function getColor(key?: string | null) {
  return HIGHLIGHT_COLORS.find((c) => c.key === key) ?? HIGHLIGHT_COLORS[0];
}
