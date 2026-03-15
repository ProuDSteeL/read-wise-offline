import { useReducer, useEffect, useRef, type RefObject } from "react";

export interface HighlightData {
  id: string;
  text: string;
  note: string | null;
  color?: string;
}

interface MenuPos {
  top: number;
  left: number;
}

// ── State machine ──

export type SelectionState =
  | { phase: "idle" }
  | { phase: "selected"; text: string; menuPos: MenuPos }
  | { phase: "saving"; text: string; menuPos: MenuPos }
  | { phase: "editing"; highlight: HighlightData; menuPos: MenuPos };

export type SelectionAction =
  | { type: "TEXT_SELECTED"; text: string; menuPos: MenuPos }
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_COMPLETED"; highlight: HighlightData }
  | { type: "SAVE_FAILED" }
  | { type: "OPEN_EDIT"; highlight: HighlightData; menuPos: MenuPos }
  | { type: "UPDATE_EDITING"; highlight: HighlightData }
  | { type: "DISMISS" };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "TEXT_SELECTED":
      // Allow from idle or selected (new selection replaces old)
      if (state.phase !== "idle" && state.phase !== "selected") return state;
      return { phase: "selected", text: action.text, menuPos: action.menuPos };

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
      if (state.phase !== "editing") return state;
      return { ...state, highlight: action.highlight };

    case "DISMISS":
      return { phase: "idle" };

    default:
      return state;
  }
}

// ── Menu positioning ──

function computeMenuPos(rect: DOMRect, menuH = 160, menuW = 260): MenuPos {
  const above = rect.top > menuH;
  return {
    top: above ? rect.top - menuH - 4 : rect.bottom + 8,
    left: Math.max(12, Math.min(rect.left + rect.width / 2 - menuW / 2, window.innerWidth - menuW - 12)),
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
  // Keep highlights in a ref so pointerdown handler can read latest without re-registering
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // 1. selectionchange — single, debounced detector for all input methods
    const onSelectionChange = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (!text || text.length < 3 || !sel?.rangeCount) return;

        const range = sel.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) return;

        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const menuPos = computeMenuPos(rect);
        dispatch({ type: "TEXT_SELECTED", text, menuPos });
      }, 200);
    };

    // 2. pointerdown — unified dismiss / mark-click handler
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      // Clicking inside the menu — do nothing
      if (target.closest("[data-highlight-menu]")) return;

      // Clicking on an existing highlight mark — open edit
      const mark = target.closest("mark[data-highlight-id]");
      if (mark) {
        const hlId = mark.getAttribute("data-highlight-id");
        const hl = highlightsRef.current.find((h) => h.id === hlId);
        if (hl) {
          // Don't open edit if user is selecting text
          const sel = window.getSelection();
          if (sel?.toString().trim()) return;
          const rect = mark.getBoundingClientRect();
          dispatch({ type: "OPEN_EDIT", highlight: hl, menuPos: computeMenuPos(rect) });
          return;
        }
      }

      // Clicking anywhere else — dismiss
      dispatch({ type: "DISMISS" });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [containerRef, enabled]);

  return { state, dispatch };
}
