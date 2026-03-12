import { useEffect, useRef, useState } from "react";
import EditorCanvas from "./EditorCanvas";
import Toolbar from "./Toolbar";
import UndoRedoControls from "./history/UndoRedoControls";
import PropertiesPanel from "./PropertiesPanel";
import TemplatesPanel from "./TemplatesPanel";
import { useEditorStore } from "./store/editorStore";
import { TOOL_SELECT } from "./constants/tools";
import { TOOL_TEXT } from "./constants/tools";

function Editor() {
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saved'
  const [showTemplates, setShowTemplates] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(72);
  const centerOnSeatsRef = useRef(null);

  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const seatCount = useEditorStore((state) => state.seats.length);
  const saveLayout = useEditorStore((state) => state.saveLayout);
  const clearLayout = useEditorStore((state) => state.clearLayout);
  const alignSelection = useEditorStore((state) => state.alignSelection);
  const hasSelection = selectedSeatIds.length > 0 || selectedTextIds.length > 0;
  const hasTextSelection = selectedTextIds.length > 0;
  const hasSeatSelection = selectedSeatIds.length > 0;
  const showProperties =
    (hasSeatSelection && activeTool === TOOL_SELECT) ||
    (hasTextSelection && activeTool === TOOL_TEXT);
  const isOverCapacity = seatCount > 500;

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const updateNavbarHeight = () => {
      setNavbarHeight(Math.max(nav.getBoundingClientRect().height, 0));
    };

    updateNavbarHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateNavbarHeight();
    });

    resizeObserver.observe(nav);
    window.addEventListener("resize", updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, []);

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
    setShowTemplates(false);
    // Auto-center camera on newly loaded template after a short delay for state to settle
    setTimeout(() => {
      centerOnSeatsRef.current?.(seats);
    }, 50);
  }

  function handleAlign() {
    if (selectedSeatIds.length === 0) {
      // Show a subtle message that no seats are selected
      return;
    }
    alignSelection();
  }

  return (
    <section
      className="relative flex w-full overflow-auto bg-[#0e1319]"
      style={{
        height: `calc(100dvh - ${navbarHeight}px)`,
        maxHeight: `calc(100dvh - ${navbarHeight}px)`,
      }}
    >
      <div
        className={`relative flex-1 ${
          isOverCapacity ? "min-h-240 min-w-400" : "min-h-full min-w-full"
        }`}
      >
        <EditorCanvas centerOnSeatsRef={centerOnSeatsRef} />

        {/* Top strip below navbar: primary actions */}
        <div className="absolute left-3 right-3 top-3 z-20">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a1018]/88 px-3 py-2 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/10 bg-[#0f1621] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#95a8c3]">
                Seats {seatCount} / 500
              </span>
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  showTemplates
                    ? "border-[#587cb3]/45 bg-[#587cb3]/20 text-[#d6e5fb]"
                    : "border-white/15 bg-[#11161c]/75 text-[#9fb0c8] hover:border-white/25"
                }`}
              >
                Templates
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                  saveStatus === "saved"
                    ? "border-green-500/50 bg-green-600/20 text-green-300"
                    : "border-[#587cb3]/35 bg-[#587cb3]/15 text-[#c9d6ea] hover:bg-[#587cb3]/25"
                }`}
              >
                {saveStatus === "saved" ? "Saved" : "Save Layout"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/18"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>

        {/* Left tools in a single vertical line */}
        <aside className="absolute bottom-3 left-3 top-18 z-20 w-16 rounded-xl border border-white/10 bg-[#0a1018]/88 p-2 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.38)]">
          <div className="flex h-full flex-col">
            <Toolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onAlign={handleAlign}
              compact
            />
            <div className="mt-2 border-t border-white/10 pt-2">
              <UndoRedoControls compact />
            </div>
          </div>
        </aside>

        {/* Templates drawer */}
        <aside
          className={`absolute bottom-3 left-22 top-18 z-20 w-[min(320px,calc(100vw-7rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0d141e]/96 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-all duration-200 ${
            showTemplates
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "-translate-x-6 opacity-0 pointer-events-none"
          }`}
        >
          <TemplatesPanel onTemplateLoad={handleTemplateLoad} />
        </aside>

        {/* Crisp inspector panel overlay */}
        {showProperties && (
          <div className="absolute bottom-3 right-3 top-18 z-20 overflow-hidden rounded-xl border border-white/12 bg-[#0b1118]/96 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <PropertiesPanel />
          </div>
        )}
      </div>
    </section>
  );
}

export default Editor;
