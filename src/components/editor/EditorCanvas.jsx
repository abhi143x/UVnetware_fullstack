import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react'
import CanvasStage from './canvas/CanvasStage'
import { useCanvasEvents } from './hooks/useCanvasEvents'
import { useCursor } from './hooks/useCursor'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePreviewElements } from './hooks/usePreviewElements'
import { useRenderedElements } from './hooks/useRenderedElements'
import { useToolHandler } from './hooks/useToolHandler'
import { useViewport } from './hooks/useViewport'
import { useEditorStore } from './store/editorStore'
import { TOOL_ERASER } from './constants/tools'

function EditorCanvas() {
  const containerRef = useRef(null)
  const [hoveredSeatId, setHoveredSeatId] = useState(null)
  const [hoveredTextId, setHoveredTextId] = useState(null)

  const setEraseHover = useCallback((seatId, textId) => {
    setHoveredSeatId(seatId)
    setHoveredTextId(textId)
  }, [])

  // Store state
  const activeTool = useEditorStore((state) => state.activeTool)
  const seats = useEditorStore((state) => state.seats)
  const texts = useEditorStore((state) => state.texts)
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds)
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)
  const categories = useEditorStore((state) => state.categories)
  const nextRowIndex = useEditorStore((state) => state.nextRowIndex)

  // Store actions
  const {
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
  } = useEditorStore()

  const storeActions = useMemo(() => ({
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
  }), [
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
  ])

  useEffect(() => {
    if (activeTool !== TOOL_ERASER) {
      setHoveredSeatId(null)
      setHoveredTextId(null)
    }
  }, [activeTool])

  // Hooks
  const { viewport, camera, zoomToPoint, panCamera, getWorldPointFromStage } =
    useViewport(containerRef)
  const {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  } = useToolHandler(storeActions)
  const { renderedSeats, renderedTexts } = useRenderedElements(
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    activeTool,
    hoveredSeatId,
    hoveredTextId,
    categories,
  )
  const cursor = useCursor(activeTool, false, false) // isPanning and isDraggingSeat would need to be managed
  const { marqueeRect, rowPreviewPoints, arcPreviewPoints } =
    usePreviewElements(toolSession, activeTool)

  // Keyboard shortcuts
  useKeyboardShortcuts(
    () => storeActions.clearSelection(),
    () => {}, // escape handler
  )

  // Context for tool handlers
  const context = {
    activeTool,
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    seatsById: new Map(seats.map((seat) => [seat.id, seat])),
    textsById: new Map(texts.map((text) => [text.id, text])),
  }

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
  })

  const handleContainerMouseLeave = useCallback(
    (event) => {
      setEraseHover(null, null)
      handleStageMouseLeave(event)
    },
    [setEraseHover, handleStageMouseLeave],
  )

  return (
    <section
      ref={containerRef}
      className={`h-full w-full bg-[#0e1319] select-none ${
        cursor === 'grabbing'
          ? 'cursor-grabbing'
          : cursor === 'crosshair'
          ? 'cursor-crosshair'
          : cursor === 'text'
          ? 'cursor-text'
          : 'cursor-default'
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
    </section>
  )
}

export default EditorCanvas;
