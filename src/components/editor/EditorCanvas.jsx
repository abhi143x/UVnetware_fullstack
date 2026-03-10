import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import CanvasStage from "./canvas/CanvasStage";
import Minimap from "./canvas/Minimap";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useCursor } from "./hooks/useCursor";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePreviewElements } from "./hooks/usePreviewElements";
import { useRenderedElements } from "./hooks/useRenderedElements";
import { useToolHandler } from "./hooks/useToolHandler";
import { useViewport } from "./hooks/useViewport";
import { useEditorStore } from "./store/editorStore";
import { TOOL_ERASER } from "./constants/tools";

function EditorCanvas({ centerOnSeatsRef }) {
  const containerRef = useRef(null);
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [hoveredTextId, setHoveredTextId] = useState(null);

  const setEraseHover = useCallback((seatId, textId) => {
    setHoveredSeatId(seatId);
    setHoveredTextId(textId);
  }, []);

  // Store state
  const activeTool = useEditorStore((state) => state.activeTool);
  const seats = useEditorStore((state) => state.seats);
  const texts = useEditorStore((state) => state.texts);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const categories = useEditorStore((state) => state.categories);
  const nextRowIndex = useEditorStore((state) => state.nextRowIndex);

  // Store actions
  const handleWorldClick = useEditorStore((state) => state.handleWorldClick);
  const selectSeat = useEditorStore((state) => state.selectSeat);
  const selectText = useEditorStore((state) => state.selectText);
  const smartRowSelect = useEditorStore((state) => state.smartRowSelect);
  const moveSeats = useEditorStore((state) => state.moveSeats);
  const moveTexts = useEditorStore((state) => state.moveTexts);
  const marqueeSelect = useEditorStore((state) => state.marqueeSelect);
  const eraseSeat = useEditorStore((state) => state.eraseSeat);
  const eraseText = useEditorStore((state) => state.eraseText);
  const commitRow = useEditorStore((state) => state.commitRow);
  const commitArc = useEditorStore((state) => state.commitArc);
  const rotateSelection = useEditorStore((state) => state.rotateSelection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const copySelection = useEditorStore((state) => state.copySelection);
  const pasteClipboard = useEditorStore((state) => state.pasteClipboard);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  const storeActions = useMemo(
    () => ({
      handleWorldClick,
      selectSeat,
      selectText,
      smartRowSelect,
      moveSeats,
      moveTexts,
      marqueeSelect,
      eraseSeat,
      eraseText,
      commitRow,
      commitArc,
      rotateSelection,
      clearSelection,
      setEraseHover,
    }),
    [
      handleWorldClick,
      selectSeat,
      selectText,
      smartRowSelect,
      moveSeats,
      moveTexts,
      marqueeSelect,
      eraseSeat,
      eraseText,
      commitRow,
      commitArc,
      rotateSelection,
      clearSelection,
      setEraseHover,
    ],
  );

  // Hooks
  const {
    viewport,
    camera,
    setCamera,
    zoomToPoint,
    panCamera,
    getWorldPointFromStage,
    centerOnSeats,
  } = useViewport(containerRef);

  // Expose centerOnSeats via ref so Editor.jsx can call it
  useEffect(() => {
    if (centerOnSeatsRef) {
      centerOnSeatsRef.current = centerOnSeats;
    }
  }, [centerOnSeats, centerOnSeatsRef]);

  // Auto-center on template load (when templateVersion changes)
  const templateVersion = useEditorStore((state) => state.templateVersion);
  useEffect(() => {
    if (templateVersion > 0 && seats.length > 0) {
      // Delay to let viewport sizing settle after navigation
      const timer = setTimeout(() => centerOnSeats(seats), 120);
      return () => clearTimeout(timer);
    }
  }, [templateVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  } = useToolHandler(storeActions);
  const { renderedSeats, renderedTexts } = useRenderedElements(
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    activeTool,
    activeTool === TOOL_ERASER ? hoveredSeatId : null,
    activeTool === TOOL_ERASER ? hoveredTextId : null,
    categories,
  );
  const cursor = useCursor(activeTool, false, false);
  const { marqueeRect, rowPreviewPoints, arcPreviewPoints } =
    usePreviewElements(toolSession, activeTool);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    () => storeActions.clearSelection(),
    () => {}, // escape handler
    {
      onCopy: copySelection,
      onPaste: pasteClipboard,
      onUndo: undo,
      onRedo: redo,
    },
  );

  // Context for tool handlers
  const context = {
    activeTool,
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    seatsById: new Map(seats.map((seat) => [seat.id, seat])),
    textsById: new Map(texts.map((text) => [text.id, text])),
  };

  const {
    handleMouseDown: handleStageMouseDown,
    handleMouseMove: handleStageMouseMove,
    handleMouseUp: handleStageMouseUp,
    handleMouseLeave: handleStageMouseLeave,
    handleClick: handleStageClick,
  } = useCanvasEvents({
    containerRef,
    camera,
    activeTool,
    getWorldPointFromStage,
    panCamera,
    zoomToPoint,
    onToolMouseDown: (e, wp) => handleMouseDown(e, wp, context),
    onToolMouseMove: (e, wp) => handleMouseMove(e, wp, context),
    onToolMouseUp: (e, wp) => handleMouseUp(e, wp, context),
    onToolClick: (e, wp) => handleClick(e, wp, context),
  });

  const handleContainerMouseLeave = useCallback(
    (event) => {
      setEraseHover(null, null);
      handleStageMouseLeave(event);
    },
    [setEraseHover, handleStageMouseLeave],
  );

  return (
    <section
      ref={containerRef}
      className={`h-full w-full bg-[#0e1319] select-none relative ${
        cursor === "grabbing"
          ? "cursor-grabbing"
          : cursor === "crosshair"
            ? "cursor-crosshair"
            : cursor === "text"
              ? "cursor-text"
              : "cursor-default"
      }`}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleContainerMouseLeave}
      onClick={handleStageClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CanvasStage
        viewport={viewport}
        camera={camera}
        renderedSeats={renderedSeats}
        renderedTexts={renderedTexts}
        activeTool={activeTool}
        rowPreviewPoints={rowPreviewPoints}
        arcPreviewPoints={arcPreviewPoints}
        marqueeRect={marqueeRect}
        nextRowIndex={nextRowIndex}
      />
      {/* Minimap in bottom-right */}
      <Minimap
        seats={seats}
        camera={camera}
        viewport={viewport}
        setCamera={setCamera}
      />
    </section>
  );
}

export default EditorCanvas;
