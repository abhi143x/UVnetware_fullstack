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
import { TOOL_ARC, TOOL_ERASER } from "./constants/tools";
import { screenToWorldPoint } from "./utils/mathUtils";

function EditorCanvas({ centerOnSeatsRef }) {
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
  const seats = useEditorStore((state) => state.seats);
  const texts = useEditorStore((state) => state.texts);
  const shapes = useEditorStore((state) => state.shapes);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const selectedShapeIds = useEditorStore((state) => state.selectedShapeIds);
  const selectedShapeType = useEditorStore((state) => state.selectedShapeType);
  const categories = useEditorStore((state) => state.categories);
  const nextRowIndex = useEditorStore((state) => state.nextRowIndex);

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
  const copySelection = useEditorStore((state) => state.copySelection);
  const pasteClipboard = useEditorStore((state) => state.pasteClipboard);
  const deleteSelection = useEditorStore((state) => state.deleteSelection);
  const cutSelection = useEditorStore((state) => state.cutSelection);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setArcGeneratorCenter = useEditorStore(
    (state) => state.setArcGeneratorCenter,
  );

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

  useEffect(() => {
    if (activeTool !== TOOL_ARC) return;

    const centerPoint = screenToWorldPoint(
      {
        x: viewport.width / 2,
        y: viewport.height / 2,
      },
      camera,
    );
    setArcGeneratorCenter(centerPoint);
  }, [
    activeTool,
    viewport.width,
    viewport.height,
    camera,
    setArcGeneratorCenter,
  ]);

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
  );
  const cursor = useCursor(activeTool, false, false);
  const { marqueeRect, rowPreviewPoints, arcPreviewPoints, polygonPreview } =
    usePreviewElements(toolSession, activeTool);

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
    seatsById: new Map(seats.map((seat) => [seat.id, seat])),
    textsById: new Map(texts.map((text) => [text.id, text])),
    shapesById: new Map(shapes.map((shape) => [shape.id, shape])),
  }), [activeTool, seats, texts, shapes, selectedSeatIds, selectedTextIds, selectedShapeIds, selectedShapeType]);

  // Custom mouse handlers that detect resize
  const handleEditorMouseDown = useCallback((e, wp) => {
    handleMouseDown(e, wp, context);
  }, [handleMouseDown, context]);

  const handleEditorMouseMove = useCallback((e, wp) => {
    handleMouseMove(e, wp, context);
  }, [handleMouseMove, context]);

  const handleEditorMouseUp = useCallback((e, wp) => {
    handleMouseUp(e, wp, context);
  }, [handleMouseUp, context]);

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

  return (
    <section
      ref={containerRef}
      className="h-full w-full bg-[#0e1319] select-none relative"
      style={{ cursor: resolvedCursor }}
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
        renderedShapes={renderedShapes}
        renderedSeats={renderedSeats}
        renderedTexts={renderedTexts}
        activeTool={activeTool}
        rowPreviewPoints={rowPreviewPoints}
        arcPreviewPoints={arcPreviewPoints}
        polygonPreview={polygonPreview}
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
