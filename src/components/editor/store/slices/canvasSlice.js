// ─── Canvas Slice ─────────────────────────────────────────────────────────────
// Manages template versioning, persistence (save/export/clear), and layout load.

const STORAGE_KEY = "uvnetware-layout";

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { seats: [], texts: [], categories: [], nextRowIndex: 0, customSpacing: 48 };
    const parsed = JSON.parse(raw);
    const seats = Array.isArray(parsed.seats) ? parsed.seats : [];
    return {
      seats: seats,
      texts: Array.isArray(parsed.texts) ? parsed.texts : [],
      shapes: Array.isArray(parsed.shapes) ? parsed.shapes : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      nextRowIndex: seats.length > 0 ? (typeof parsed.nextRowIndex === "number" ? parsed.nextRowIndex : 0) : 0,
      customSpacing: typeof parsed.customSpacing === "number" ? parsed.customSpacing : 48,
    };
  } catch {
    return { seats: [], texts: [], categories: [], nextRowIndex: 0, customSpacing: 48 };
  }
}

export function clearStorageCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
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
      const { seats, texts, categories, nextRowIndex, customSpacing } = get();
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ seats, texts, categories, nextRowIndex, customSpacing }),
        );
        set({ lastSavedAt: Date.now() });
        return true;
      } catch {
        return false;
      }
    },

    exportJSON: () => {
      const { seats, texts, categories, nextRowIndex, customSpacing } = get();
      const data = JSON.stringify(
        { seats, texts, categories, nextRowIndex, customSpacing },
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
      localStorage.removeItem(STORAGE_KEY);
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
