import { useMemo } from 'react'
import { buildRowPoints, buildArcPoints, PREVIEW_SEAT_RADIUS } from '../utils/mathUtils'

export function usePreviewElements(toolSession, activeTool) {
  const marqueeRect = useMemo(() => {
    if (toolSession?.type === 'marquee') {
      const { startPoint, endPoint } = toolSession
      return {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      }
    }
    return null
  }, [toolSession])

  const rowPreviewPoints = useMemo(() => {
    if (toolSession?.type === 'row_preview') {
      return toolSession.previewPoints || []
    }
    return []
  }, [toolSession])

  const arcPreviewPoints = useMemo(() => {
    if (toolSession?.type === 'arc_drawing') {
      return toolSession.previewPoints || []
    }
    return []
  }, [toolSession])

  return {
    marqueeRect,
    rowPreviewPoints,
    arcPreviewPoints,
  }
}