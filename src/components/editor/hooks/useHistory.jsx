// ─── Undo / Redo history helper ───────────────────────────────────────────────
// Keeps a bounded past/future stack of layout snapshots and exposes a
// `trackedSet` wrapper that automatically records history for every
// state-changing Zustand `set()` call that touches tracked fields.

const MAX_HISTORY = 30;

/** Fields that form a "layout snapshot". */
const TRACKED_KEYS = ["seats", "texts", "shapes", "categories", "nextRowIndex", "selectedSeatIds", "selectedTextIds", "selectedShapeIds"];

/** Pull only the tracked fields out of the full store state. */
export function createSnapshot(state) {
  const snap = {};
  for (const k of TRACKED_KEYS) snap[k] = state[k];
  return snap;
}

/** Shallow-compare only the tracked fields. */
function snapshotsEqual(a, b) {
  for (const k of TRACKED_KEYS) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/** Initial history state to spread into the Zustand store. */
export const HISTORY_INITIAL_STATE = {
  _history: { past: [], future: [] },
};

/**
 * Returns a `trackedSet` function that wraps Zustand's `set` and
 * automatically pushes a snapshot before any layout-changing mutation.
 *
 * Usage inside `create((set, get) => { const trackedSet = makeTrackedSet(set); ... })`
 */
export function makeTrackedSet(set) {
  return (updater) =>
    set((state) => {
      const partial = typeof updater === "function" ? updater(state) : updater;

      // If the updater bailed (returned state itself or falsy), pass through.
      if (!partial || partial === state) return partial;

      const prevSnap = createSnapshot(state);
      const nextSnap = createSnapshot({ ...state, ...partial });

      // If layout didn't actually change, skip snapshot.
      if (snapshotsEqual(prevSnap, nextSnap)) return partial;

      return {
        ...partial,
        _history: {
          past: [...state._history.past, prevSnap].slice(-MAX_HISTORY),
          future: [], // new mutation clears redo stack
        },
      };
    });
}

/** Undo action — call with raw Zustand `set`. */
export function undoAction(set) {
  return () =>
    set((state) => {
      const { past, future } = state._history;
      if (past.length === 0) return state;

      const prev = past[past.length - 1];
      return {
        ...prev,
        _history: {
          past: past.slice(0, -1),
          future: [createSnapshot(state), ...future],
        },
      };
    });
}

/** Redo action — call with raw Zustand `set`. */
export function redoAction(set) {
  return () =>
    set((state) => {
      const { past, future } = state._history;
      if (future.length === 0) return state;

      const [next, ...rest] = future;
      return {
        ...next,
        _history: {
          past: [...past, createSnapshot(state)].slice(-MAX_HISTORY),
          future: rest,
        },
      };
    });
}

/**
 * Pushes a single history checkpoint for the current state.
 * Useful for gesture tools (drag/rotate) that apply many intermediate updates.
 */
export function pushHistoryCheckpointAction(set) {
  return () =>
    set((state) => {
      const current = createSnapshot(state);
      const last = state._history.past[state._history.past.length - 1];

      // Avoid duplicate checkpoints when no tracked state changed.
      if (last && snapshotsEqual(last, current)) return state;

      return {
        _history: {
          past: [...state._history.past, current].slice(-MAX_HISTORY),
          future: [],
        },
      };
    });
}
