// ─── History Slice ────────────────────────────────────────────────────────────
// Thin wrapper around useHistory.jsx helpers.

import {
  HISTORY_INITIAL_STATE,
  undoAction,
  redoAction,
  pushHistoryCheckpointAction,
} from "../../hooks/useHistory";

export function createHistorySlice(set) {
  return {
    ...HISTORY_INITIAL_STATE,
    undo: undoAction(set),
    redo: redoAction(set),
    pushHistoryCheckpoint: pushHistoryCheckpointAction(set),
  };
}
