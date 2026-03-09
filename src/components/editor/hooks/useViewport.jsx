import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_UNITS_PER_PIXEL, MIN_SCALE, MAX_SCALE, clamp, screenToWorldPoint } from '../utils/mathUtils'

export function useViewport(containerRef) {
  const [viewport, setViewport] = useState({ width: 1, height: 1 })
  const [camera, setCamera] = useState({
    scale: 1 / INITIAL_UNITS_PER_PIXEL,
    position: { x: 0, y: 0 },
  })

  const cameraRef = useRef(camera)
  const previousViewportRef = useRef({ width: 1, height: 1 })
  const isInitializedRef = useRef(false)

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  // Viewport resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const width = Math.max(entry.contentRect.width, 1)
      const height = Math.max(entry.contentRect.height, 1)
      setViewport({ width, height })
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [containerRef])

  // Center camera on viewport resize
  useEffect(() => {
    if (viewport.width <= 0 || viewport.height <= 0) return

    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      return
    }

    const prevViewport = previousViewportRef.current
    const deltaX = (viewport.width - prevViewport.width) / 2
    const deltaY = (viewport.height - prevViewport.height) / 2

    setCamera(prevCamera => ({
      ...prevCamera,
      position: {
        x: prevCamera.position.x + deltaX,
        y: prevCamera.position.y + deltaY,
      },
    }))

    previousViewportRef.current = viewport
  }, [viewport])

  const zoomToPoint = useCallback((screenPoint, newScale) => {
    const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE)
    const worldPoint = screenToWorldPoint(screenPoint, camera)

    const newPosition = {
      x: screenPoint.x - worldPoint.x * clampedScale,
      y: screenPoint.y - worldPoint.y * clampedScale,
    }

    setCamera({
      scale: clampedScale,
      position: newPosition,
    })
  }, [camera])

  const panCamera = useCallback((deltaX, deltaY) => {
    setCamera(prevCamera => ({
      ...prevCamera,
      position: {
        x: prevCamera.position.x + deltaX,
        y: prevCamera.position.y + deltaY,
      },
    }))
  }, [])

  const getWorldPointFromStage = useCallback((clientX, clientY) => {
    const container = containerRef.current
    if (!container) return null

    const rect = container.getBoundingClientRect()
    const screenPoint = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }

    return screenToWorldPoint(screenPoint, camera)
  }, [containerRef, camera])

  const centerOnSeats = useCallback((seats) => {
    if (!seats || seats.length === 0) return
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const s of seats) {
      if (s.x < minX) minX = s.x
      if (s.x > maxX) maxX = s.x
      if (s.y < minY) minY = s.y
      if (s.y > maxY) maxY = s.y
    }
    const padW = 80
    const padH = 80
    const worldW = (maxX - minX) + padW * 2 || 1
    const worldH = (maxY - minY) + padH * 2 || 1
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const scaleX = viewport.width / worldW
    const scaleY = viewport.height / worldH
    const newScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE)

    setCamera({
      scale: newScale,
      position: {
        x: viewport.width / 2 - cx * newScale,
        y: viewport.height / 2 - cy * newScale,
      },
    })
  }, [viewport, setCamera])

  return {
    viewport,
    camera,
    setCamera,
    zoomToPoint,
    panCamera,
    getWorldPointFromStage,
    centerOnSeats,
  }
}