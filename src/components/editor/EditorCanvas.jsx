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
import { TOOL_ERASER, TOOL_TEXT } from "./constants/tools";
import ArcFloatingEditor from "./ArcFloatingEditor";

function EditorCanvas({ centerOnSeatsRef, zoomControlRef }) {
  const containerRef = useRef(null);
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [hoveredTextId, setHoveredTextId] = useState(null);
  const [hoveredShapeId, setHoveredShapeId] = useState(null);
  const [canvasCursor, setCanvasCursor] = useState(null);

  const setEraseHover = useCallback((seatId, textId, shapeId) => {
    setHoveredSeatId(seatId);
    setHoveredTextId(textId);
    setHoveredShapeId(shapeId);
  }, []);

  // Store state
  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const seats = useEditorStore((state) => state.seats);
  const texts = useEditorStore((state) => state.texts);
  const shapes = useEditorStore((state) => state.shapes);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const selectedShapeIds = useEditorStore((state) => state.selectedShapeIds);
  const selectedShapeType = useEditorStore((state) => state.selectedShapeType);
  const selectedSeatType = useEditorStore((state) => state.selectedSeatType);
  const categories = useEditorStore((state) => state.categories);
  const nextRowIndex = useEditorStore((state) => state.nextRowIndex);
  const snapEnabled = useEditorStore((state) => state.snapEnabled);
  const gridSize = useEditorStore((state) => state.gridSize);
  const toggleSnap = useEditorStore((state) => state.toggleSnap);

  // Store actions
  const handleWorldClick = useEditorStore((state) => state.handleWorldClick);
  const selectSeat = useEditorStore((state) => state.selectSeat);
  const selectText = useEditorStore((state) => state.selectText);
  const selectShape = useEditorStore((state) => state.selectShape);
  const smartRowSelect = useEditorStore((state) => state.smartRowSelect);
  const moveSeats = useEditorStore((state) => state.moveSeats);
  const moveSeatsPreview = useEditorStore((state) => state.moveSeatsPreview);
  const moveTexts = useEditorStore((state) => state.moveTexts);
  const moveTextsPreview = useEditorStore((state) => state.moveTextsPreview);
  const moveShapes = useEditorStore((state) => state.moveShapes);
  const moveShapesPreview = useEditorStore((state) => state.moveShapesPreview);
  const resizeSeats = useEditorStore((state) => state.resizeSeats);
  const updateShapePreview = useEditorStore(
    (state) => state.updateShapePreview,
  );
  const addPolygonShape = useEditorStore((state) => state.addPolygonShape);
  const marqueeSelect = useEditorStore((state) => state.marqueeSelect);
  const eraseSeat = useEditorStore((state) => state.eraseSeat);
  const eraseText = useEditorStore((state) => state.eraseText);
  const eraseShape = useEditorStore((state) => state.eraseShape);
  const commitRow = useEditorStore((state) => state.commitRow);
  const commitArc = useEditorStore((state) => state.commitArc);
  const rotateSelection = useEditorStore((state) => state.rotateSelection);
  const rotateSelectionPreview = useEditorStore(
    (state) => state.rotateSelectionPreview,
  );
  const pushHistoryCheckpoint = useEditorStore(
    (state) => state.pushHistoryCheckpoint,
  );
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const selectAll = useEditorStore((state) => state.selectAll);
  const copySelection = useEditorStore((state) => state.copySelection);
  const pasteClipboard = useEditorStore((state) => state.pasteClipboard);
  const deleteSelection = useEditorStore((state) => state.deleteSelection);
  const cutSelection = useEditorStore((state) => state.cutSelection);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  const storeActions = useMemo(
    () => ({
      handleWorldClick,
      selectSeat,
      selectText,
      selectShape,
      smartRowSelect,
      moveSeats,
      moveSeatsPreview,
      moveTexts,
      moveTextsPreview,
      moveShapes,
      moveShapesPreview,
      resizeSeats,
      updateShapePreview,
      addPolygonShape,
      marqueeSelect,
      eraseSeat,
      eraseText,
      eraseShape,
      commitRow,
      commitArc,
      rotateSelection,
      rotateSelectionPreview,
      pushHistoryCheckpoint,
      clearSelection,
      setEraseHover,
      setCanvasCursor,
    }),
    [
      handleWorldClick,
      selectSeat,
      selectText,
      selectShape,
      smartRowSelect,
      moveSeats,
      moveSeatsPreview,
      moveTexts,
      moveTextsPreview,
      moveShapes,
      moveShapesPreview,
      resizeSeats,
      updateShapePreview,
      addPolygonShape,
      marqueeSelect,
      eraseSeat,
      eraseText,
      eraseShape,
      commitRow,
      commitArc,
      rotateSelection,
      rotateSelectionPreview,
      pushHistoryCheckpoint,
      clearSelection,
      setEraseHover,
      setCanvasCursor,
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

  // U-03: Expose zoom controls + current scale so Editor can show zoom UI
  useEffect(() => {
    if (!zoomControlRef) return;
    zoomControlRef.current = {
      zoomIn:  () => zoomToPoint({ x: viewport.width / 2, y: viewport.height / 2 }, camera.scale * 1.2),
      zoomOut: () => zoomToPoint({ x: viewport.width / 2, y: viewport.height / 2 }, camera.scale / 1.2),
      zoomPercent: Math.round(camera.scale * 100),
    };
  }, [camera.scale, viewport, zoomToPoint, zoomControlRef]);

  // Auto-center on template load (when templateVersion changes)
  const templateVersion = useEditorStore((state) => state.templateVersion);
  useEffect(() => {
    if (templateVersion > 0 && seats.length > 0) {
      // Delay to let viewport sizing settle after navigation/load
      const timer = setTimeout(() => centerOnSeats(seats), 250);
      return () => clearTimeout(timer);
    }
  }, [templateVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleContextMenu,
    handleKeyDown,
  } = useToolHandler(storeActions);

  const { renderedShapes, renderedSeats, renderedTexts } = useRenderedElements(
    seats,
    texts,
    shapes,
    selectedSeatIds,
    selectedTextIds,
    selectedShapeIds,
    activeTool,
    activeTool === TOOL_ERASER ? hoveredSeatId : null,
    activeTool === TOOL_ERASER ? hoveredTextId : null,
    activeTool === TOOL_ERASER ? hoveredShapeId : null,
    categories,
    camera,
    viewport,
  );
  const cursor = useCursor(activeTool, false, false);
  const {
    marqueeRect,
    rowPreviewPoints,
    arcPreviewPoints,
    polygonPreview,
  } = usePreviewElements(
    toolSession,
    activeTool,
  );

  // Keyboard shortcuts
  useKeyboardShortcuts(
    deleteSelection,
    () => { }, // escape handler
    {
      onCopy: copySelection,
      onPaste: pasteClipboard,
      onCut: cutSelection,
      onUndo: undo,
      onRedo: redo,
      onToolChange: setActiveTool,
      onSelectAll: selectAll,
      onFitView: () => centerOnSeats(seats),
      onToggleSnap: toggleSnap,
    },
  );

  // Context for tool handlers - create early so callbacks can use it
  const context = useMemo(() => ({
    activeTool,
    seats,
    texts,
    shapes,
    selectedSeatIds,
    selectedTextIds,
    selectedShapeIds,
    selectedShapeType,
    selectedSeatType,
    seatsById: new Map(seats.map((seat) => [seat.id, seat])),
    textsById: new Map(texts.map((text) => [text.id, text])),
    shapesById: new Map(shapes.map((shape) => [shape.id, shape])),
  }), [activeTool, seats, texts, shapes, selectedSeatIds, selectedTextIds, selectedShapeIds, selectedShapeType, selectedSeatType]);

  // Custom mouse handlers that detect resize
  const handleEditorMouseDown = useCallback((e, wp) => {
    handleMouseDown(e, wp, context);
  }, [handleMouseDown, context]);

  const handleEditorMouseMove = useCallback((e, wp) => {
    handleMouseMove(e, wp, context);
  }, [handleMouseMove, context]);

  const handleEditorClick = useCallback((e, wp) => {
    handleMouseDown(e, wp, context);
  }, [handleMouseDown, context]);

  const handleEditorMouseUp = useCallback((e, wp) => {
    handleMouseUp(e, wp, context);
  }, [handleMouseUp, context]);

  const handleToolKeyDown = useCallback(
    (event) => handleKeyDown(event, context),
    [handleKeyDown, context],
  );

  // Keyboard shortcuts
  useKeyboardShortcuts(
    (event) => {
      const handledByTool = handleToolKeyDown(event);
      if (handledByTool) return true;
      deleteSelection();
      return true;
    },
    (event) => handleToolKeyDown(event),
    {
      onCopy: copySelection,
      onPaste: pasteClipboard,
      onCut: cutSelection,
      onUndo: undo,
      onRedo: redo,
    },
  );

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
    onToolMouseDown: handleEditorMouseDown,
    onToolMouseMove: handleEditorMouseMove,
    onToolMouseUp: handleEditorMouseUp,
    onToolClick: (e, wp) => handleClick(e, wp, context),
    snapEnabled,
    gridSize,
  });

  const handleContainerMouseLeave = useCallback(
    (event) => {
      setEraseHover(null, null, null);
      setCanvasCursor(null);
      handleStageMouseLeave(event);
    },
    [setEraseHover, setCanvasCursor, handleStageMouseLeave],
  );

  const resolvedCursor =
    canvasCursor ||
    (cursor === "grabbing"
      ? "grabbing"
      : cursor === "crosshair"
        ? "crosshair"
        : cursor === "text"
          ? "text"
          : "default");
  const isArcEditorTarget = (target) =>
    target instanceof Element && Boolean(target.closest("[data-arc-editor='true']"));

  return (
    <section
      ref={containerRef}
      className="h-full w-full bg-[#0e1319] select-none relative"
      style={{ cursor: resolvedCursor }}
      onMouseDown={(event) => {
        if (isArcEditorTarget(event.target)) return;
        handleStageMouseDown(event);
      }}
      onMouseMove={handleStageMouseMove}
      onMouseUp={(event) => {
        if (isArcEditorTarget(event.target)) return;
        handleStageMouseUp(event);
      }}
      onMouseLeave={handleContainerMouseLeave}
      onClick={(e) => {
        if (isArcEditorTarget(e.target)) return;
        if (e.target.closest("[data-type='text']")) return;
        // Allow canvas clicks for text tool to create new text
        handleStageClick(e);
      }}
      onContextMenu={(event) => {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY);
        const handledByTool = worldPoint
          ? handleContextMenu(event, worldPoint, context)
          : false;
        if (!handledByTool) {
          event.preventDefault();
        }
      }}
    >
      <CanvasStage
        viewport={viewport}
        camera={camera}
        renderedShapes={renderedShapes}
        renderedSeats={renderedSeats}
        renderedTexts={renderedTexts}
        activeTool={activeTool}
        rowPreviewPoints={rowPreviewPoints}
        arcPreviewPoints={arcPreviewPoints}
        polygonPreview={polygonPreview}
        marqueeRect={marqueeRect}
        nextRowIndex={nextRowIndex}
        snapEnabled={snapEnabled}
        gridSize={gridSize}
      />
      <ArcFloatingEditor camera={camera} viewport={viewport} />
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
