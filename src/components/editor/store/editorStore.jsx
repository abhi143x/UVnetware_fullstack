// ─── Editor Store ─────────────────────────────────────────────────────────────
// Composes all domain slices into a single flat Zustand store.
// Each slice owns its own state and actions — this file is intentionally thin.

import { create } from "zustand";
import { makeTrackedSet } from "../hooks/useHistory";
import { loadFromStorage } from "./slices/canvasSlice";
import { createHistorySlice } from "./slices/historySlice";
import { createToolSlice } from "./slices/toolSlice";
import { createCanvasSlice } from "./slices/canvasSlice";
import { createElementSlice } from "./slices/elementSlice";
import { createSelectionSlice } from "./slices/selectionSlice";

export const useEditorStore = create((set, get) => {
  const persisted = loadFromStorage();
  const trackedSet = makeTrackedSet(set);
  const ctx = { trackedSet, persisted };

  return {
    ...createHistorySlice(set),
    ...createToolSlice(set),
    ...createCanvasSlice(set, get, ctx),
    ...createElementSlice(set, get, ctx),
    ...createSelectionSlice(set, get, ctx),
  };
});

// ─── Re-export template generators for existing consumers ─────────────────────
// TemplatesPanel.jsx and other components import these directly from this file.
export {
  generateSmallTheater,
  generateMediumHall,
  generateLargeArena,
  generateConferenceRoom,
  generateAmphitheater,
  generateBus,
  generateTrain,
  generateMovieTheatre,
  VENUE_TEMPLATES,
} from "./slices/templateGenerators";
