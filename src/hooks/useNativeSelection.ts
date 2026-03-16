import { useState, useEffect, useCallback, useRef, type RefObject } from "react";

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

/**
 * Tracks native browser text selection within a container.
 * Shows selection only after the user lifts their finger/mouse (pointerup).
 */
export function useNativeSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  // Track pending selection during drag (not yet committed)
  const pendingRef = useRef<SelectionInfo | null>(null);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    pendingRef.current = null;
    setSelection(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        pendingRef.current = null;
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container) return;

      if (
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        pendingRef.current = null;
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        pendingRef.current = null;
        return;
      }

      // Compute bounding rect from all client rects
      const rects = range.getClientRects();
      if (!rects.length) return;

      let top = Infinity, left = Infinity, bottom = -Infinity, right = -Infinity;
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width === 0 && r.height === 0) continue;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        bottom = Math.max(bottom, r.bottom);
        right = Math.max(right, r.right);
      }

      pendingRef.current = { text, rect: new DOMRect(left, top, right - left, bottom - top) };
    };

    const onPointerUp = (e: PointerEvent) => {
      // Don't dismiss when tapping the quote menu
      if ((e.target as HTMLElement).closest("[data-highlight-menu]")) return;

      if (pendingRef.current) {
        // User finished selecting — show the toolbar
        setSelection({ ...pendingRef.current });
      } else {
        // Tap with no selection — clear
        setSelection(null);
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerup", onPointerUp);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [containerRef, enabled]);

  return { selection, clearSelection };
}
