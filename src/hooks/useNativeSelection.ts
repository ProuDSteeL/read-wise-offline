import { useState, useEffect, useCallback, useRef, type RefObject } from "react";

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

/**
 * Tracks native browser text selection within a container.
 * Uses a short debounce on `selectionchange` so the toolbar appears
 * only after the selection stabilises (user stops dragging).
 */
export function useNativeSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSelection = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const readSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container) return;

      if (
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }

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

      setSelection({ text, rect: new DOMRect(left, top, right - left, bottom - top) });
    };

    const onSelectionChange = () => {
      // Quick check: if selection collapsed, hide immediately
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setSelection(null);
        return;
      }

      // Debounce: wait for selection to stabilise before showing the menu
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(readSelection, 200);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [containerRef, enabled]);

  return { selection, clearSelection };
}
