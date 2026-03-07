import React, { useRef, useMemo } from 'react'
import { useEditorStore } from './store/editorStore'
import { useViewport } from './hooks/useViewport'
import { useToolHandler } from './hooks/useToolHandler'
import { useRenderedElements } from './hooks/useRenderedElements'
import { useCursor } from './hooks/useCursor'
import { usePreviewElements } from './hooks/usePreviewElements'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import CanvasStage from './canvas/CanvasStage'
import { useCanvasEvents } from './hooks/useCanvasEvents'

function EditorCanvas() {
  const containerRef = useRef(null)

  // Store state
  const activeTool = useEditorStore((state) => state.activeTool)
  const seats = useEditorStore((state) => state.seats)
  const texts = useEditorStore((state) => state.texts)
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds)
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)

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
    clearSelection,
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
    clearSelection,
  ])

  // Hooks
  const { viewport, camera, zoomToPoint, panCamera, getWorldPointFromStage } = useViewport(containerRef)
  const { toolSession, handleMouseDown, handleMouseMove, handleMouseUp, handleClick } = useToolHandler(storeActions)
  const { renderedSeats, renderedTexts } = useRenderedElements(
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    activeTool,
    null, // hoveredSeatId - would need to be managed
    null // hoveredTextId - would need to be managed
  )
  const cursor = useCursor(activeTool, false, false) // isPanning and isDraggingSeat would need to be managed
  const { marqueeRect, rowPreviewPoints, arcPreviewPoints } = usePreviewElements(toolSession, activeTool)

  // Keyboard shortcuts
  useKeyboardShortcuts(
    () => storeActions.clearSelection(),
    () => { } // escape handler
  )

  // Context for tool handlers
  const context = {
    activeTool,
    seats,
    texts,
    selectedSeatIds,
    selectedTextIds,
    seatsById: new Map(seats.map(seat => [seat.id, seat])),
    textsById: new Map(texts.map(text => [text.id, text])),
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

  return (
    <section
      ref={containerRef}
      className={`h-full w-full bg-[#0e1319] select-none ${cursor === 'grabbing' ? 'cursor-grabbing' : cursor === 'crosshair' ? 'cursor-crosshair' : cursor === 'text' ? 'cursor-text' : 'cursor-default'}`}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseLeave}
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
      />
    </section>
  )
}

export default EditorCanvas
