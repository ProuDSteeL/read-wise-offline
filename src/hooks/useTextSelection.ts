import { useReducer, useEffect, useRef, type RefObject, type Dispatch } from "react";

export interface HighlightData {
  id: string;
  text: string;
  note: string | null;
  color?: string;
}

export interface MenuPos {
  top: number;
  left: number;
  arrowBelow: boolean;
}

// ── State machine ──

export type SelectionState =
  | { phase: "idle" }
  | { phase: "selected";      text: string;             menuPos: MenuPos }
  | { phase: "saving";        text: string;             menuPos: MenuPos }
  | { phase: "editing";       highlight: HighlightData; menuPos: MenuPos }
  | { phase: "editing-note";  highlight: HighlightData; menuPos: MenuPos };

export type SelectionAction =
  | { type: "TEXT_SELECTED"; text: string; menuPos: MenuPos }
  | { type: "SHOW_BACK" }
  | { type: "OPEN_NOTE" }
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_COMPLETED"; highlight: HighlightData }
  | { type: "SAVE_FAILED" }
  | { type: "OPEN_EDIT"; highlight: HighlightData; menuPos: MenuPos }
  | { type: "UPDATE_EDITING"; highlight: HighlightData }
  | { type: "DISMISS" };

export type { Dispatch };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "TEXT_SELECTED":
      if (state.phase !== "idle" && state.phase !== "selected") return state;
      return { phase: "selected", text: action.text, menuPos: action.menuPos };

    case "SHOW_BACK":
      if (state.phase === "editing-note") return { phase: "editing", highlight: state.highlight, menuPos: state.menuPos };
      return state;

    case "OPEN_NOTE":
      if (state.phase === "editing") return { phase: "editing-note", highlight: state.highlight, menuPos: state.menuPos };
      return state;

    case "SAVE_STARTED":
      if (state.phase !== "selected") return state;
      return { phase: "saving", text: state.text, menuPos: state.menuPos };

    case "SAVE_COMPLETED":
      if (state.phase !== "saving") return state;
      return { phase: "editing", highlight: action.highlight, menuPos: state.menuPos };

    case "SAVE_FAILED":
      if (state.phase !== "saving") return state;
      return { phase: "idle" };

    case "OPEN_EDIT":
      return { phase: "editing", highlight: action.highlight, menuPos: action.menuPos };

    case "UPDATE_EDITING":
      if (state.phase === "editing") return { ...state, highlight: action.highlight };
      if (state.phase === "editing-note") return { ...state, highlight: action.highlight };
      return state;

    case "DISMISS":
      return { phase: "idle" };

    default:
      return state;
  }
}

// ── Menu positioning ──

export function computeMenuPos(rect: DOMRect, menuH = 64, menuW = 310): MenuPos {
  const above = rect.top > menuH + 16;
  return {
    top: above ? rect.top - menuH - 8 : rect.bottom + 12,
    left: Math.max(12, Math.min(rect.left + rect.width / 2 - menuW / 2, window.innerWidth - menuW - 12)),
    arrowBelow: !above,
  };
}

// ── Hook ──

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  highlights: HighlightData[],
  enabled = true,
) {
  const [state, dispatch] = useReducer(selectionReducer, { phase: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const isTouchActiveRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const readAndDispatchSelection = () => {
      const sel = window.getSelection();
      const text = sel?.toString()
        .replace(/[\r\n]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (!text || text.length < 3 || text.length > 400 || !sel?.rangeCount) return;

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const menuPos = computeMenuPos(rect);
      dispatch({ type: "TEXT_SELECTED", text, menuPos });
    };

    const onSelectionChange = () => {
      // On touch: suppress menu during active drag — touchend will trigger it
      if (isTouchActiveRef.current) return;

      // Desktop/mouse: debounce at 100ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        readAndDispatchSelection();
      }, 100);
    };

    const onTouchStart = () => {
      isTouchActiveRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const onTouchEnd = () => {
      isTouchActiveRef.current = false;
      // Small delay so browser finalizes the selection range after finger lift
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        readAndDispatchSelection();
      }, 50);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("[data-highlight-menu]")) return;

      const mark = target.closest("mark[data-highlight-id]");
      if (mark) {
        const hlId = mark.getAttribute("data-highlight-id");
        const hl = highlightsRef.current.find((h) => h.id === hlId);
        if (hl) {
          const sel = window.getSelection();
          if (sel?.toString().trim()) return;
          const rect = (mark as HTMLElement).getBoundingClientRect();
          dispatch({ type: "OPEN_EDIT", highlight: hl, menuPos: computeMenuPos(rect) });
          return;
        }
      }

      dispatch({ type: "DISMISS" });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, enabled]);

  return { state, dispatch };
}
