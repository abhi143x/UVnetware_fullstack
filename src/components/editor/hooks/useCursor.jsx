import { useMemo } from 'react'
import { TOOL_TEXT, TOOL_SEAT, TOOL_ROW, TOOL_ARC, TOOL_ERASER } from '../constants/tools'

export function useCursor(activeTool, isPanning, isDraggingSeat) {
  const cursor = useMemo(() => {
    if (isPanning || isDraggingSeat) {
      return 'grabbing'
    }

    switch (activeTool) {
      case TOOL_TEXT:
        return 'text'
      case TOOL_SEAT:
      case TOOL_ROW:
      case TOOL_ARC:
      case TOOL_ERASER:
        return 'crosshair'
      default:
        return 'default'
    }
  }, [activeTool, isPanning, isDraggingSeat])

  return cursor
}