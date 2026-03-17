import { useEffect, useRef, useState } from "react";
import EditorCanvas from "./EditorCanvas";
import Toolbar from "./Toolbar";
import UndoRedoControls from "./history/UndoRedoControls";
import PropertiesPanel from "./PropertiesPanel";
import TemplatesPanel from "./TemplatesPanel";
import SelectedSeatSpacingControl from "./SelectedSeatSpacingControl";
import { useEditorStore } from "./store/editorStore";
import { TOOL_SELECT, TOOL_SEAT } from "./constants/tools";
import { TOOL_TEXT } from "./constants/tools";
import { SeatTypeSelector } from "./components/SeatTypeSelector";
import { ELEMENT_TYPES } from "./domain/elementTypes";

function parseStoredJSON(key, fallback = null) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function Editor() {
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saved'
  const [showTemplates, setShowTemplates] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(72);
  const centerOnSeatsRef = useRef(null);

  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const seats = useEditorStore((state) => state.seats);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const selectedShapeIds = useEditorStore((state) => state.selectedShapeIds);
  const selectedShapeType = useEditorStore((state) => state.selectedShapeType);
  const selectedSeatType = useEditorStore((state) => state.selectedSeatType);
  const setSelectedShapeType = useEditorStore(
    (state) => state.setSelectedShapeType,
  );
  const setSelectedSeatType = useEditorStore(
    (state) => state.setSelectedSeatType,
  );
  const seatCount = useEditorStore((state) => state.seats.length);

  const clearLayout = useEditorStore((state) => state.clearLayout);
  const alignSelection = useEditorStore((state) => state.alignSelection);
  const hasTextSelection = selectedTextIds.length > 0;
  const hasSeatSelection = selectedSeatIds.length > 0;
  const hasShapeSelection = selectedShapeIds.length > 0;
  const selectedSeats = hasSeatSelection
    ? seats.filter((seat) => selectedSeatIds.includes(seat.id))
    : [];
  const selectedArcGroupId =
    hasSeatSelection &&
    selectedSeats.every(
      (seat) =>
        seat.groupType === ELEMENT_TYPES.ARC &&
        seat.groupId === selectedSeats[0]?.groupId,
    )
      ? selectedSeats[0]?.groupId
      : null;
  const selectedArcGroupSeats = selectedArcGroupId
    ? seats.filter(
        (seat) =>
          seat.groupType === ELEMENT_TYPES.ARC &&
          seat.groupId === selectedArcGroupId,
      )
    : [];
  const isCompleteArcSelection =
    Boolean(selectedArcGroupId) &&
    selectedArcGroupSeats.length === selectedSeats.length &&
    selectedArcGroupSeats.length > 0;
  const showProperties =
    (hasSeatSelection && activeTool === TOOL_SELECT && !isCompleteArcSelection) ||
    (hasTextSelection &&
      (activeTool === TOOL_TEXT || activeTool === TOOL_SELECT)) ||
    (hasShapeSelection && activeTool === TOOL_SELECT);
  const isOverCapacity = seatCount > 500;
  const currentUser = parseStoredJSON("uvnet_auth_user");
  const canSaveLayouts = Boolean(currentUser?.email);

  const [currentLayoutId, setCurrentLayoutId] = useState(null);
  const [currentLayoutName, setCurrentLayoutName] = useState("");
  const layoutMetaRef = useRef({
    currentLayoutId: null,
    currentLayoutName: "",
  });

  const [showRestoreMsg, setShowRestoreMsg] = useState(false);

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

  useEffect(() => {
    // 1️⃣ FIRST: check draft (refresh recovery)
    const draft = parseStoredJSON("uvnet_editor_draft");

    if (draft) {
      useEditorStore.setState({
        seats: draft.seats || [],
        texts: draft.texts || [],
        shapes: draft.shapes || [],
      });

      queueMicrotask(() => {
        setCurrentLayoutId(draft.currentLayoutId || null);
        setCurrentLayoutName(draft.currentLayoutName || "");
        setShowRestoreMsg(true);
      });

      return;
    }
    // 2️⃣ Otherwise: load from MyLayouts
    const saved = parseStoredJSON("uvnet_load_layout");

    if (saved) {
      useEditorStore.setState({
        seats: saved.seats || [],
        texts: saved.texts || [],
        shapes: saved.shapes || [],
      });

      queueMicrotask(() => {
        setCurrentLayoutId(saved.id || null);
        setCurrentLayoutName(saved.name || "");
      });

      localStorage.removeItem("uvnet_load_layout");
    }
  }, []);

  useEffect(() => {
    if (showRestoreMsg) {
      const timer = setTimeout(() => {
        setShowRestoreMsg(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showRestoreMsg]);

  useEffect(() => {
    layoutMetaRef.current = {
      currentLayoutId,
      currentLayoutName,
    };
  }, [currentLayoutId, currentLayoutName]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state) => {
      const draft = {
        seats: state.seats,
        texts: state.texts,
        shapes: state.shapes,
        currentLayoutId: layoutMetaRef.current.currentLayoutId,
        currentLayoutName: layoutMetaRef.current.currentLayoutName,
      };

      localStorage.setItem("uvnet_editor_draft", JSON.stringify(draft));
    });

    return () => unsubscribe();
  }, []);

  function handleSave() {
    const user = parseStoredJSON("uvnet_auth_user");

    if (!user) {
      alert("Please login first to save layouts.");
      return;
    }

    const layouts = parseStoredJSON("uvnet_saved_layouts", []);

    const seats = useEditorStore.getState().seats;
    const texts = useEditorStore.getState().texts;
    const shapes = useEditorStore.getState().shapes;

    // CASE 1: Updating existing layout
    if (currentLayoutId) {
      const newName = prompt(
        "Update layout name:",
        currentLayoutName || "My Layout",
      );

      if (!newName) return;

      const updatedLayouts = layouts.map((layout) =>
        layout.id === currentLayoutId
          ? {
            ...layout,
            name: newName,
            seats,
            texts,
            shapes,
            updatedAt: new Date().toISOString(),
          }
          : layout,
      );

      localStorage.setItem(
        "uvnet_saved_layouts",
        JSON.stringify(updatedLayouts),
      );

      setCurrentLayoutName(newName);
    }

    // CASE 2: Creating new layout
    else {
      const layoutName = prompt("Enter layout name:");

      if (!layoutName) return;

      const newLayout = {
        id: crypto.randomUUID(),
        name: layoutName,
        user: user.email,
        seats,
        texts,
        shapes,
        createdAt: new Date().toISOString(),
      };

      layouts.push(newLayout);

      localStorage.setItem("uvnet_saved_layouts", JSON.stringify(layouts));

      setCurrentLayoutId(newLayout.id);
      setCurrentLayoutName(layoutName);
    }

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);

    localStorage.removeItem("uvnet_editor_draft");
  }

  function handleClear() {
    if (seatCount === 0) return;
    if (
      window.confirm(`Clear all ${seatCount} seat(s)? This cannot be undone.`)
    ) {
      clearLayout();
      setCurrentLayoutId(null);
      setCurrentLayoutName("");
      localStorage.removeItem("uvnet_editor_draft"); // ✅ clear draft
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
        className={`relative flex-1 ${isOverCapacity ? "min-h-240 min-w-400" : "min-h-full min-w-full"
          }`}
      >
        <EditorCanvas centerOnSeatsRef={centerOnSeatsRef} />

        {showRestoreMsg && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="px-8 py-2 rounded-md bg-blue-500 text-white text-sm shadow-lg">
              Layout Restored
            </div>
          </div>
        )}

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
                className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${showTemplates
                    ? "border-[#587cb3]/45 bg-[#587cb3]/20 text-[#d6e5fb]"
                    : "border-white/15 bg-[#11161c]/75 text-[#9fb0c8] hover:border-white/25"
                  }`}
              >
                Templates
              </button>
            </div>

            <div className="flex items-center gap-2">
              {canSaveLayouts && (
                <button
                  type="button"
                  onClick={handleSave}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${saveStatus === "saved"
                      ? "border-green-500/50 bg-green-600/20 text-green-300"
                      : "border-[#587cb3]/35 bg-[#587cb3]/15 text-[#c9d6ea] hover:bg-[#587cb3]/25"
                    }`}
                >
                  {saveStatus === "saved" ? "Saved" : "Save Layout"}
                </button>
              )}
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
              selectedShapeType={selectedShapeType}
              onShapeTypeChange={setSelectedShapeType}
              onAlign={handleAlign}
              compact
            />
            <div className="mt-2 border-t border-white/10 pt-2">
              <UndoRedoControls compact />
            </div>
          </div>
        </aside>

        {/* Seat Type Selector Panel */}
        {activeTool === TOOL_SEAT && (
          <aside className="absolute bottom-3 left-22 top-18 z-20 w-[260px] overflow-hidden rounded-xl border border-white/10 bg-[#0d141e]/96 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
            <div className="h-full flex flex-col p-4">
              <SeatTypeSelector
                selectedType={selectedSeatType}
                onSelectType={setSelectedSeatType}
              />
            </div>
          </aside>
        )}

        {/* Templates drawer */}
        <aside
          className={`absolute bottom-3 left-22 top-18 z-20 w-[min(320px,calc(100vw-7rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0d141e]/96 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-all duration-200 ${showTemplates
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "-translate-x-6 opacity-0 pointer-events-none"
            }`}
        >
          <TemplatesPanel onTemplateLoad={handleTemplateLoad} />
        </aside>

        {/* Crisp inspector panel overlay */}
        {showProperties && (
          <div className="absolute bottom-3 right-3 top-18 z-20 overflow-hidden rounded-xl border border-white/12 bg-[#0b1118]/96 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex h-full flex-col">
              <>
                <SelectedSeatSpacingControl />
                <div className="flex-1 min-h-0">
                  <PropertiesPanel />
                </div>
              </>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Editor;
