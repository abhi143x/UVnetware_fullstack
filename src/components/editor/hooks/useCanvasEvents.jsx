import { useCallback, useEffect, useRef } from 'react'
import { PAN_CLICK_TOLERANCE } from '../utils/mathUtils'

export function useCanvasEvents({
  containerRef,
  camera,
  _activeTool,
  getWorldPointFromStage,
  panCamera,
  zoomToPoint,
  onToolMouseDown,
  onToolMouseMove,
  onToolMouseUp,
  onToolClick,
  snapEnabled,
  gridSize,
}) {
  const panSessionRef = useRef(null)
  const isSpacePressedRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  const getSnappedWorldPoint = useCallback((event) => {
    const wp = getWorldPointFromStage(event.clientX, event.clientY);
    if (!wp) return null;
    if (!snapEnabled || event.altKey) return wp;
    return {
      x: Math.round(wp.x / gridSize) * gridSize,
      y: Math.round(wp.y / gridSize) * gridSize
    };
  }, [getWorldPointFromStage, snapEnabled, gridSize]);

  const getCanvasRelativePoint = useCallback((clientX, clientY) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [containerRef])

  const handleWheel = useCallback((event) => {
    event.preventDefault()

    const screenPoint = getCanvasRelativePoint(event.clientX, event.clientY)

    if (event.ctrlKey) {
      // Zoom towards cursor
      const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08
      const newScale = camera.scale * zoomFactor
      zoomToPoint(screenPoint, newScale)
    } else {
      // Professional pan with wheel (standard scroll behavior)
      panCamera(-event.deltaX, -event.deltaY)
    }
  }, [getCanvasRelativePoint, zoomToPoint, panCamera, camera.scale])

  const handleMouseDown = useCallback((event) => {
    const worldPoint = getSnappedWorldPoint(event)
    if (!worldPoint) return

    // Handle panning with middle mouse (button 1) or space (handled via isSpacePressedRef)
    const isPanning = event.button === 1 || event.button === 2 || isSpacePressedRef.current

    if (isPanning) {
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
  }, [getSnappedWorldPoint, onToolMouseDown])

  const handleMouseMove = useCallback((event) => {
    if (panSessionRef.current) {
      const deltaX = event.clientX - panSessionRef.current.startClientX
      const deltaY = event.clientY - panSessionRef.current.startClientY

      panCamera(deltaX, deltaY)

      panSessionRef.current.startClientX = event.clientX
      panSessionRef.current.startClientY = event.clientY
      return
    }

    const worldPoint = getSnappedWorldPoint(event)
    if (!worldPoint) return

    onToolMouseMove(event, worldPoint)
  }, [getSnappedWorldPoint, panCamera, onToolMouseMove])

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

    const worldPoint = getSnappedWorldPoint(event)
    if (!worldPoint) return

    onToolMouseUp(event, worldPoint)
  }, [getSnappedWorldPoint, onToolMouseUp])

  const handleMouseLeave = useCallback((event) => {
    panSessionRef.current = null

    const worldPoint = getSnappedWorldPoint(event)
    if (!worldPoint) return

    onToolMouseUp(event, worldPoint)
  }, [getSnappedWorldPoint, onToolMouseUp])

  const handleClick = useCallback((event) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const worldPoint = getSnappedWorldPoint(event)
    if (!worldPoint) return

    onToolClick(event, worldPoint)
  }, [getSnappedWorldPoint, onToolClick])

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = true
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [containerRef, handleWheel])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
  }
}
