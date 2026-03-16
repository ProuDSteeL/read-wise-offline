import { useState, useEffect, useCallback, useRef, type RefObject } from "react";

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

/**
 * Listens to native browser `selectionchange` events and reports
 * the selected text + bounding rect when the selection is within
 * the given container element.
 */
export function useNativeSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const selRef = useRef(selection);
  selRef.current = selection;

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        // Only clear if we had a selection before
        if (selRef.current) setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container) return;

      // Check if selection is within our container
      if (
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        if (selRef.current) setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        if (selRef.current) setSelection(null);
        return;
      }

      // Get the bounding rect of the selection
      const rects = range.getClientRects();
      if (!rects.length) return;

      // Use the union of all rects
      let top = Infinity, left = Infinity, bottom = -Infinity, right = -Infinity;
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width === 0 && r.height === 0) continue;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        bottom = Math.max(bottom, r.bottom);
        right = Math.max(right, r.right);
      }

      const rect = new DOMRect(left, top, right - left, bottom - top);
      setSelection({ text, rect });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [containerRef, enabled]);

  return { selection, clearSelection };
}
