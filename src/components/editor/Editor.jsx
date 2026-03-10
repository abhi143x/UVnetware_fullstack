import { useRef, useState } from "react";
import EditorCanvas from "./EditorCanvas";
import Toolbar from "./Toolbar";
import UndoRedoControls from "./history/UndoRedoControls";
import PropertiesPanel from "./PropertiesPanel";
import TemplatesPanel from "./TemplatesPanel";
import { useEditorStore } from "./store/editorStore";

function Editor() {
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saved'
  const centerOnSeatsRef = useRef(null);

  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const seatCount = useEditorStore((state) => state.seats.length);
  const saveLayout = useEditorStore((state) => state.saveLayout);
  const clearLayout = useEditorStore((state) => state.clearLayout);

  function handleSave() {
    saveLayout();
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function handleClear() {
    if (seatCount === 0) return;
    if (
      window.confirm(`Clear all ${seatCount} seat(s)? This cannot be undone.`)
    ) {
      clearLayout();
    }
  }

  function handleTemplateLoad(seats) {
    // Auto-center camera on newly loaded template after a short delay for state to settle
    setTimeout(() => {
      centerOnSeatsRef.current?.(seats);
    }, 50);
  }

  return (
    <section className="relative flex h-full w-full bg-[#0e1319] overflow-hidden">
      {/* ── Left Sidebar (Tools + Templates) ────────────────────────────── */}
      <aside className="w-65 shrink-0 flex flex-col border-r border-white/5 bg-[#11161c] overflow-hidden">
        {/* Tools Section */}
        <div className="shrink-0 p-4 border-b border-white/5">
          <h3 className="text-[10px] font-semibold text-[#5a6a7e] uppercase tracking-wider mb-3 px-1">
            Editor Tools
          </h3>
          <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
          <UndoRedoControls />
        </div>

        {/* Templates Section (Scrollable) */}
        <div className="flex-1 min-h-0 flex flex-col">
          <TemplatesPanel onTemplateLoad={handleTemplateLoad} />
        </div>

        {/* Footer Actions in Sidebar */}
        <div className="p-4 border-t border-white/5 bg-[#0e1319]/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-[#5a6a7e] uppercase">
              Stats
            </span>
            <span className="text-[11px] text-[#7a8a9e]">
              {seatCount} seat{seatCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full rounded-lg py-2 text-xs font-semibold transition-all duration-200 border ${
                saveStatus === "saved"
                  ? "bg-green-600/20 border-green-500/40 text-green-400"
                  : "bg-[#587cb3]/10 border-[#587cb3]/30 text-[#c9d6ea] hover:bg-[#587cb3]/20 hover:border-[#587cb3]/50"
              }`}
            >
              {saveStatus === "saved" ? "Saved ✓" : "Save Layout"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-lg border border-red-500/20 py-2 text-xs font-semibold text-red-400/80 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/40"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Canvas Area ────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 flex flex-col bg-[#0e1319]">
        <div className="relative min-h-0 flex-1">
          <EditorCanvas centerOnSeatsRef={centerOnSeatsRef} />
        </div>
      </div>

      {/* Properties Panel (Right side, absolute) */}
      {(selectedSeatIds.length > 0 || selectedTextIds.length > 0) && (
        <PropertiesPanel />
      )}
    </section>
  );
}

export default Editor;
