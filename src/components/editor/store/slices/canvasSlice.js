// ─── Canvas Slice ─────────────────────────────────────────────────────────────
// Manages template versioning, persistence (save/export/clear), and layout load.

const STORAGE_KEY = "uvnetware-layout";

export function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { seats: [], texts: [], categories: [], nextRowIndex: 0 };
        const parsed = JSON.parse(raw);
        return {
            seats: Array.isArray(parsed.seats) ? parsed.seats : [],
            texts: Array.isArray(parsed.texts) ? parsed.texts : [],
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            nextRowIndex:
                typeof parsed.nextRowIndex === "number" ? parsed.nextRowIndex : 0,
        };
    } catch {
        return { seats: [], texts: [], categories: [], nextRowIndex: 0 };
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
            trackedSet((state) => ({
                seats: templateData.seats || [],
                texts: templateData.texts || [],
                selectedSeatIds: [],
                selectedTextIds: [],
                nextRowIndex: templateData.nextRowIndex || 0,
                templateVersion: state.templateVersion + 1,
            })),

        saveLayout: () => {
            const { seats, texts, categories, nextRowIndex } = get();
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ seats, texts, categories, nextRowIndex }),
                );
                set({ lastSavedAt: Date.now() });
                return true;
            } catch {
                return false;
            }
        },

        exportJSON: () => {
            const { seats, texts, categories, nextRowIndex } = get();
            const data = JSON.stringify(
                { seats, texts, categories, nextRowIndex },
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
                selectedSeatIds: [],
                selectedTextIds: [],
                lastSavedAt: null,
                nextRowIndex: 0,
            });
        },
    };
}
