import { useReducer, useEffect } from "react";
import type { CustomRangeState, DragHandle } from "@/hooks/useCustomSelection";

interface Props {
  rangeState: CustomRangeState;
  /** onPointerDown handler for the start (left) drag handle */
  onStartHandleDrag: (e: React.PointerEvent) => void;
  /** onPointerDown handler for the end (right) drag handle */
  onEndHandleDrag:   (e: React.PointerEvent) => void;
  dragging: DragHandle | null;
}

// Visual constants
const HANDLE_R     = 6;          // circle radius in px
const HANDLE_W     = 2;          // cursor line width in px
const ACCENT       = "#3B82F6";  // blue-500
const FILL_COLOR   = "rgba(59, 130, 246, 0.22)"; // semi-transparent blue

export default function SelectionOverlay({
  rangeState,
  onStartHandleDrag,
  onEndHandleDrag,
  dragging,
}: Props) {
  // Force re-render on scroll so viewport-relative rects stay correct
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener("scroll", tick, { passive: true });
    return () => window.removeEventListener("scroll", tick);
  }, []);

  const rects = Array.from(rangeState.range.getClientRects()).filter(
    (r) => r.width > 0 && r.height > 0,
  );
  if (!rects.length) return null;

  const first = rects[0];
  const last  = rects[rects.length - 1];

  return (
    <>
      {/* ── Highlight fill rectangles ──────────────────────────────────── */}
      {rects.map((r, i) => (
        <div
          key={i}
          className="pointer-events-none fixed z-40"
          style={{
            top:             r.top,
            left:            r.left,
            width:           r.width,
            height:          r.height,
            backgroundColor: FILL_COLOR,
          }}
        />
      ))}

      {/* ── Start handle (top of first rect, line goes down) ──────────── */}
      {/*   Touch target is larger than the visual for easy grab           */}
      <div
        data-selection-handle
        className="fixed z-50 touch-none"
        style={{
          // Extend tap area: 2× radius left + above
          top:    first.top - HANDLE_R * 2,
          left:   first.left - HANDLE_R * 2,
          width:  HANDLE_R * 4 + HANDLE_W,
          height: first.height + HANDLE_R * 2,
          cursor: "col-resize",
          opacity: dragging === "end" ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}
        onPointerDown={onStartHandleDrag}
      >
        {/* Inner visual — pinned to the right edge of the touch target */}
        <div
          className="absolute right-0 top-0 flex flex-col items-center"
          style={{ width: HANDLE_R * 2 }}
        >
          {/* Circle above the line */}
          <div
            style={{
              width:           HANDLE_R * 2,
              height:          HANDLE_R * 2,
              borderRadius:    "50%",
              backgroundColor: ACCENT,
              boxShadow:       "0 1px 4px rgba(0,0,0,0.25)",
            }}
          />
          {/* Vertical cursor line */}
          <div
            style={{
              width:           HANDLE_W,
              height:          first.height,
              backgroundColor: ACCENT,
            }}
          />
        </div>
      </div>

      {/* ── End handle (bottom of last rect, line goes up) ────────────── */}
      <div
        data-selection-handle
        className="fixed z-50 touch-none"
        style={{
          top:    last.bottom - last.height,
          left:   last.right - HANDLE_R * 2,
          width:  HANDLE_R * 4 + HANDLE_W,
          height: last.height + HANDLE_R * 2,
          cursor: "col-resize",
          opacity: dragging === "start" ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}
        onPointerDown={onEndHandleDrag}
      >
        {/* Inner visual — pinned to the left edge of the touch target */}
        <div
          className="absolute left-0 top-0 flex flex-col items-center"
          style={{ width: HANDLE_R * 2 }}
        >
          {/* Vertical cursor line */}
          <div
            style={{
              width:           HANDLE_W,
              height:          last.height,
              backgroundColor: ACCENT,
            }}
          />
          {/* Circle below the line */}
          <div
            style={{
              width:           HANDLE_R * 2,
              height:          HANDLE_R * 2,
              borderRadius:    "50%",
              backgroundColor: ACCENT,
              boxShadow:       "0 1px 4px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      </div>
    </>
  );
}
