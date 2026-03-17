// ─── Canvas Slice ─────────────────────────────────────────────────────────────
// Manages template versioning, persistence (save/export/clear), and layout load.

export const EDITOR_PERSISTENCE_KEY = "uvnet_editor_draft";

const EMPTY_PERSISTED_LAYOUT = Object.freeze({
  seats: [],
  texts: [],
  shapes: [],
  categories: [],
  nextRowIndex: 0,
  customSpacing: 48,
});

export function buildPersistedLayoutSnapshot(state, metadata = {}) {
  const seats = Array.isArray(state?.seats) ? state.seats : [];

  return {
    seats,
    texts: Array.isArray(state?.texts) ? state.texts : [],
    shapes: Array.isArray(state?.shapes) ? state.shapes : [],
    categories: Array.isArray(state?.categories) ? state.categories : [],
    nextRowIndex:
      typeof state?.nextRowIndex === "number" ? state.nextRowIndex : 0,
    customSpacing:
      typeof state?.customSpacing === "number" ? state.customSpacing : 48,
    currentLayoutId: metadata.currentLayoutId ?? null,
    currentLayoutName: metadata.currentLayoutName ?? "",
  };
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(EDITOR_PERSISTENCE_KEY);
    if (!raw) return { ...EMPTY_PERSISTED_LAYOUT };
    const parsed = JSON.parse(raw);
    return buildPersistedLayoutSnapshot(parsed);
  } catch {
    return { ...EMPTY_PERSISTED_LAYOUT };
  }
}

export function clearStorageCache() {
  try {
    localStorage.removeItem(EDITOR_PERSISTENCE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createCanvasSlice(set, get, { trackedSet, persisted }) {
  return {
    // State
    templateVersion: 0,
    lastSavedAt:
      persisted.seats.length > 0 || persisted.texts.length > 0
        ? Date.now()
        : null,

    // Actions
    loadTemplate: (templateData) =>
      // Loading a predefined venue should not create an undo entry.
      set((state) => ({
        seats: templateData.seats || [],
        texts: templateData.texts || [],
        shapes: templateData.shapes || [],
        selectedSeatIds: [],
        selectedTextIds: [],
        selectedShapeIds: [],
        nextRowIndex: templateData.nextRowIndex || 0,
        templateVersion: state.templateVersion + 1,
        _history: { past: [], future: [] },
      })),

    saveLayout: () => {
      const state = get();
      try {
        localStorage.setItem(
          EDITOR_PERSISTENCE_KEY,
          JSON.stringify(buildPersistedLayoutSnapshot(state)),
        );
        set({ lastSavedAt: Date.now() });
        return true;
      } catch {
        return false;
      }
    },

    exportJSON: () => {
      const { seats, texts, shapes, categories, nextRowIndex, customSpacing } =
        get();
      const data = JSON.stringify(
        { seats, texts, shapes, categories, nextRowIndex, customSpacing },
        null,
        2,
      );
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "layout.json";
      anchor.click();
      URL.revokeObjectURL(url);
    },

    clearLayout: () => {
      localStorage.removeItem(EDITOR_PERSISTENCE_KEY);
      trackedSet({
        seats: [],
        texts: [],
        shapes: [],
        selectedSeatIds: [],
        selectedTextIds: [],
        selectedShapeIds: [],
        lastSavedAt: null,
        nextRowIndex: 0,
        customSpacing: 48,
      });
    },
  };
}
