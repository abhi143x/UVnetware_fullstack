// ─── Tool Slice ───────────────────────────────────────────────────────────────
// Manages active tool selection and transient text tool state.

import { TOOL_SEAT } from "../../constants/tools";

export function createToolSlice(set) {
    return {
        // State
        activeTool: TOOL_SEAT,
        textPrompt: null,
        textDraft: "",

        // Actions
        setActiveTool: (tool) =>
            set((state) => {
                if (state.activeTool !== tool) {
                    return { activeTool: tool };
                }
                return state;
            }),
    };
}
