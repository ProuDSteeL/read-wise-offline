import { useState, useRef, useCallback, useEffect, RefObject } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const LONG_PRESS_DELAY = 450;   // ms
const MOVE_THRESHOLD   = 8;     // px — drift allowed before long-press is cancelled

// Chars that stop word expansion on both sides
const WORD_BOUNDARY = /[\s\u00A0.,;:!?()[\]{}<>"'«»—–\-\/\\|]/;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CaretPoint {
  node: Text;
  offset: number;
}

export interface CustomRangeState {
  /** Earlier endpoint in document order */
  startPoint: CaretPoint;
  /** Later endpoint in document order */
  endPoint: CaretPoint;
  /** Valid Range: startPoint → endPoint */
  range: Range;
  text: string;
}

export type DragHandle = "start" | "end";

// ── DOM helpers ───────────────────────────────────────────────────────────────

/**
 * Cross-browser caret hit-test.
 * caretRangeFromPoint: Chrome (all) + Safari iOS → primary for Android PWA
 * caretPositionFromPoint: Firefox + Chrome ≥128 → fallback
 */
function getCaretAt(x: number, y: number): CaretPoint | null {
  if ("caretRangeFromPoint" in document) {
    const r = (document as any).caretRangeFromPoint(x, y) as Range | null;
    if (r?.startContainer.nodeType === Node.TEXT_NODE) {
      return { node: r.startContainer as Text, offset: r.startOffset };
    }
  }
  if ("caretPositionFromPoint" in document) {
    const p = (document as any).caretPositionFromPoint(x, y);
    if (p?.offsetNode?.nodeType === Node.TEXT_NODE) {
      return { node: p.offsetNode as Text, offset: p.offset as number };
    }
  }
  return null;
}

/** Expand offset inside a TextNode left/right to nearest word boundary. */
function expandToWord(node: Text, offset: number): { start: number; end: number } {
  const text = node.textContent ?? "";
  let start = offset;
  let end = offset;
  // If exactly on a boundary char, back one step to stay in the word
  if (start > 0 && WORD_BOUNDARY.test(text[start] ?? "")) start--;
  while (start > 0 && !WORD_BOUNDARY.test(text[start - 1])) start--;
  while (end < text.length && !WORD_BOUNDARY.test(text[end])) end++;
  return { start, end };
}

/** True if point a comes before point b in the document. */
function isBefore(a: CaretPoint, b: CaretPoint): boolean {
  if (a.node === b.node) return a.offset < b.offset;
  return !!(a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/** Build a properly-ordered Range from two arbitrary CaretPoints. */
function buildRange(a: CaretPoint, b: CaretPoint): Range {
  const range = document.createRange();
  const aFirst = a.node === b.node ? a.offset <= b.offset : isBefore(a, b);
  if (aFirst) {
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
  } else {
    range.setStart(b.node, b.offset);
    range.setEnd(a.node, a.offset);
  }
  return range;
}

/** Build a CustomRangeState from two CaretPoints; returns null if empty. */
function makeRangeState(a: CaretPoint, b: CaretPoint): CustomRangeState | null {
  try {
    const aFirst = a.node === b.node ? a.offset <= b.offset : isBefore(a, b);
    const startPoint = aFirst ? a : b;
    const endPoint   = aFirst ? b : a;
    const range = buildRange(startPoint, endPoint);
    const text = range.toString().trim();
    if (!text) return null;
    return { startPoint, endPoint, range, text };
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseCustomSelectionOptions {
  /** Fires after long-press word detection AND after every drag handle move */
  onSelected: (rs: CustomRangeState) => void;
  /** Fires when selection is dismissed */
  onCleared: () => void;
  /** Fires on a short tap over an existing highlight mark */
  onHighlightTap: (highlightId: string, element: HTMLElement) => void;
  enabled?: boolean;
}

export interface UseCustomSelectionResult {
  rangeState: CustomRangeState | null;
  draggingHandle: DragHandle | null;
  /** Call inside onPointerDown of a handle element */
  startHandleDrag: (handle: DragHandle) => (e: React.PointerEvent) => void;
  clearSelection: () => void;
}

export function useCustomSelection(
  containerRef: RefObject<HTMLElement | null>,
  { onSelected, onCleared, onHighlightTap, enabled = true }: UseCustomSelectionOptions,
): UseCustomSelectionResult {
  const [rangeState, setRangeState] = useState<CustomRangeState | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<DragHandle | null>(null);

  // Stable refs so event handlers always see the latest values
  const rangeStateRef    = useRef<CustomRangeState | null>(null);
  rangeStateRef.current  = rangeState;
  const onSelectedRef    = useRef(onSelected);
  onSelectedRef.current  = onSelected;
  const onClearedRef     = useRef(onCleared);
  onClearedRef.current   = onCleared;
  const onHighlightRef   = useRef(onHighlightTap);
  onHighlightRef.current = onHighlightTap;

  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef    = useRef<{ x: number; y: number } | null>(null);
  const didLongPress   = useRef(false);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const clearSelection = useCallback(() => {
    setRangeState(null);
    onClearedRef.current();
  }, []);

  // ── Long-press + initial word selection ───────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Handles handle their own drag via startHandleDrag — ignore here
      if ((e.target as HTMLElement).closest("[data-selection-handle]")) return;

      cancelTimer();
      startPosRef.current = { x: e.clientX, y: e.clientY };
      didLongPress.current = false;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!startPosRef.current) return;
        didLongPress.current = true;

        const { x, y } = startPosRef.current;
        const caret = getCaretAt(x, y);
        if (!caret || !containerRef.current?.contains(caret.node)) return;

        const { start, end } = expandToWord(caret.node, caret.offset);
        if (start === end) return;

        const rs = makeRangeState(
          { node: caret.node, offset: start },
          { node: caret.node, offset: end },
        );
        if (!rs) return;

        setRangeState(rs);
        onSelectedRef.current(rs);
        // Haptic feedback on devices that support it
        if ("vibrate" in navigator) navigator.vibrate(8);
      }, LONG_PRESS_DELAY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!startPosRef.current || didLongPress.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
        cancelTimer();
        startPosRef.current = null;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasTap = !didLongPress.current && startPosRef.current !== null;
      if (!didLongPress.current) cancelTimer();
      startPosRef.current = null;

      if (!wasTap) return;

      const target = e.target as HTMLElement;
      // Taps on the floating menu should never dismiss
      if (target.closest("[data-highlight-menu]")) return;

      // Short tap on saved highlight → open edit menu
      const mark = target.closest("mark[data-highlight-id]");
      if (mark && !rangeStateRef.current) {
        const hlId = mark.getAttribute("data-highlight-id");
        if (hlId) onHighlightRef.current(hlId, mark as HTMLElement);
        return;
      }

      // Short tap elsewhere → clear active selection
      if (rangeStateRef.current) clearSelection();
    };

    const onPointerCancel = () => {
      cancelTimer();
      startPosRef.current = null;
      didLongPress.current = false;
    };

    // Block OS context menu triggered by long-press (Android Chrome)
    const blockCtxMenu = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown",   onPointerDown);
    el.addEventListener("pointermove",   onPointerMove);
    el.addEventListener("pointerup",     onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("contextmenu",   blockCtxMenu);

    return () => {
      cancelTimer();
      el.removeEventListener("pointerdown",   onPointerDown);
      el.removeEventListener("pointermove",   onPointerMove);
      el.removeEventListener("pointerup",     onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("contextmenu",   blockCtxMenu);
    };
  }, [containerRef, enabled, cancelTimer, clearSelection]);

  // ── Taps outside the article should also dismiss ───────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const onDocDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-highlight-menu]")) return;
      if (containerRef.current?.contains(target)) return; // handled above
      if (rangeStateRef.current) clearSelection();
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [containerRef, enabled, clearSelection]);

  // ── Drag handle movement ──────────────────────────────────────────────────
  useEffect(() => {
    if (!draggingHandle) return;

    const onMove = (e: PointerEvent) => {
      const current = rangeStateRef.current;
      if (!current) return;
      const caret = getCaretAt(e.clientX, e.clientY);
      if (!caret || !containerRef.current?.contains(caret.node)) return;

      const newPoint: CaretPoint = { node: caret.node, offset: caret.offset };

      // The dragged handle moves; the opposite end stays fixed
      const rs = draggingHandle === "start"
        ? makeRangeState(newPoint, current.endPoint)
        : makeRangeState(current.startPoint, newPoint);

      if (!rs) return;
      setRangeState(rs);
      onSelectedRef.current(rs);
    };

    const onUp = () => setDraggingHandle(null);

    document.addEventListener("pointermove",   onMove);
    document.addEventListener("pointerup",     onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointermove",   onMove);
      document.removeEventListener("pointerup",     onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, [draggingHandle, containerRef]);

  const startHandleDrag = useCallback(
    (handle: DragHandle) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDraggingHandle(handle);
    },
    [],
  );

  return { rangeState, draggingHandle, startHandleDrag, clearSelection };
}
