// ─── Tool Slice ───────────────────────────────────────────────────────────────
// Manages active tool selection and transient text tool state.

import { TOOL_SEAT } from "../../constants/tools";

export function createToolSlice(set) {
  return {
    // State
    activeTool: TOOL_SEAT,
    textPrompt: null,
    textDraft: "",
    selectedShapeType: "rectangle",
    arcGeneratorCenter: { x: 0, y: 0 },

    // Actions
    setActiveTool: (tool) =>
      set((state) => {
        if (state.activeTool !== tool) {
          return { activeTool: tool };
        }
        return state;
      }),

    setSelectedShapeType: (shapeType) =>
      set((state) => {
        if (state.selectedShapeType !== shapeType) {
          return { selectedShapeType: shapeType };
        }
        return state;
      }),

    setArcGeneratorCenter: (point) =>
      set((state) => {
        if (
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y)
        ) {
          return state;
        }

        const currentPoint = state.arcGeneratorCenter;
        if (
          currentPoint &&
          currentPoint.x === point.x &&
          currentPoint.y === point.y
        ) {
          return state;
        }

        return {
          arcGeneratorCenter: {
            x: point.x,
            y: point.y,
          },
        };
      }),
  };
}
