import { useCallback, useEffect, useRef } from 'react'
import { PAN_CLICK_TOLERANCE } from '../utils/mathUtils'

export function useCanvasEvents({
  containerRef,
  camera,
  activeTool,
  getWorldPointFromStage,
  panCamera,
  zoomToPoint,
  onToolMouseDown,
  onToolMouseMove,
  onToolMouseUp,
  onToolClick,
}) {
  const panSessionRef = useRef(null)
  const suppressNextClickRef = useRef(false)

  const handleWheel = useCallback((event) => {
    event.preventDefault()

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const newScale = camera.scale * zoomFactor

    zoomToPoint(
      { x: event.clientX, y: event.clientY },
      newScale
    )
  }, [zoomToPoint, camera.scale])

  const handleMouseDown = useCallback((event) => {
    const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
    if (!worldPoint) return

    // Handle panning with right mouse button, middle mouse, or space+click
    if (event.button === 2 || event.button === 1 || (event.button === 0 && event.altKey)) {
      panSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        originalClientX: event.clientX,
        originalClientY: event.clientY,
      }
      return
    }

    if (event.button !== 0) return

    // Delegate to tool handler
    onToolMouseDown(event, worldPoint)
  }, [getWorldPointFromStage, onToolMouseDown])

  const handleMouseMove = useCallback((event) => {
    if (panSessionRef.current) {
      const deltaX = event.clientX - panSessionRef.current.startClientX
      const deltaY = event.clientY - panSessionRef.current.startClientY

      panCamera(deltaX, deltaY)

      panSessionRef.current.startClientX = event.clientX
      panSessionRef.current.startClientY = event.clientY
      return
    }

    const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
    if (!worldPoint) return

    onToolMouseMove(event, worldPoint)
  }, [getWorldPointFromStage, panCamera, onToolMouseMove])

  const handleMouseUp = useCallback((event) => {
    const wasPanning = !!panSessionRef.current

    if (wasPanning) {
      const distance = Math.hypot(
        event.clientX - panSessionRef.current.originalClientX,
        event.clientY - panSessionRef.current.originalClientY
      )

      if (distance > PAN_CLICK_TOLERANCE) {
        suppressNextClickRef.current = true
      }

      panSessionRef.current = null
      return
    }

    panSessionRef.current = null

    const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
    if (!worldPoint) return

    onToolMouseUp(event, worldPoint)
  }, [getWorldPointFromStage, onToolMouseUp])

  const handleMouseLeave = useCallback((event) => {
    panSessionRef.current = null

    const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
    if (!worldPoint) return

    onToolMouseUp(event, worldPoint)
  }, [getWorldPointFromStage, onToolMouseUp])

  const handleClick = useCallback((event) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
    if (!worldPoint) return

    onToolClick(event, worldPoint)
  }, [getWorldPointFromStage, onToolClick])

  // Attach wheel event
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [containerRef, handleWheel])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
  }
}