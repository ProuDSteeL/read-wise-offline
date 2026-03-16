/**
 * Pure state machine for the highlight/notes UI.
 * All pointer-event handling has moved to useCustomSelection.ts.
 */
import { useReducer, type Dispatch } from "react";

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

// ── State union ───────────────────────────────────────────────────────────────

export type SelectionState =
  | { phase: "idle" }
  | { phase: "selected";     text: string;             menuPos: MenuPos }
  | { phase: "saving";       text: string;             menuPos: MenuPos }
  | { phase: "editing";      highlight: HighlightData; menuPos: MenuPos }
  | { phase: "editing-note"; highlight: HighlightData; menuPos: MenuPos };

// ── Action union ──────────────────────────────────────────────────────────────

export type SelectionAction =
  | { type: "TEXT_SELECTED";  text: string; menuPos: MenuPos }
  | { type: "SHOW_BACK" }
  | { type: "OPEN_NOTE" }
  | { type: "SAVE_STARTED" }
  | { type: "SAVE_COMPLETED"; highlight: HighlightData }
  | { type: "SAVE_FAILED" }
  | { type: "OPEN_EDIT";      highlight: HighlightData; menuPos: MenuPos }
  | { type: "UPDATE_EDITING"; highlight: HighlightData }
  | { type: "DISMISS" };

export type { Dispatch };

// ── Reducer ───────────────────────────────────────────────────────────────────

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "TEXT_SELECTED":
      // Allow update while already in "selected" (drag handle repositioning)
      if (state.phase !== "idle" && state.phase !== "selected") return state;
      return { phase: "selected", text: action.text, menuPos: action.menuPos };

    case "SHOW_BACK":
      if (state.phase === "editing-note")
        return { phase: "editing", highlight: state.highlight, menuPos: state.menuPos };
      return state;

    case "OPEN_NOTE":
      if (state.phase === "editing")
        return { phase: "editing-note", highlight: state.highlight, menuPos: state.menuPos };
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
      if (state.phase === "editing")
        return { ...state, highlight: action.highlight };
      if (state.phase === "editing-note")
        return { ...state, highlight: action.highlight };
      return state;

    case "DISMISS":
      return { phase: "idle" };

    default:
      return state;
  }
}

// ── Menu position helper ──────────────────────────────────────────────────────

export function computeMenuPos(rect: DOMRect, menuH = 64, menuW = 310): MenuPos {
  const above = rect.top > menuH + 16;
  return {
    top:        above ? rect.top - menuH - 8 : rect.bottom + 12,
    left:       Math.max(12, Math.min(rect.left + rect.width / 2 - menuW / 2, window.innerWidth - menuW - 12)),
    arrowBelow: !above,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTextSelection() {
  return useReducer(selectionReducer, { phase: "idle" });
}
