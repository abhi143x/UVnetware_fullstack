import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_UNITS_PER_PIXEL, MIN_SCALE, MAX_SCALE, clamp } from '../utils/mathUtils'

export function useCanvasZoom(containerRef) {
  const [camera, setCamera] = useState({
    scale: 1 / INITIAL_UNITS_PER_PIXEL,
    position: { x: 0, y: 0 },
  })

  const cameraRef = useRef(camera)

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  const zoomToPoint = useCallback((screenPoint, newScale) => {
    const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE)
    const worldPoint = {
      x: (screenPoint.x - camera.position.x) / camera.scale,
      y: (screenPoint.y - camera.position.y) / camera.scale,
    }

    const newPosition = {
      x: screenPoint.x - worldPoint.x * clampedScale,
      y: screenPoint.y - worldPoint.y * clampedScale,
    }

    setCamera({
      scale: clampedScale,
      position: newPosition,
    })
  }, [camera])

  const handleWheel = useCallback((event) => {
    event.preventDefault()

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const newScale = camera.scale * zoomFactor
    zoomToPoint({ x: event.clientX, y: event.clientY }, newScale)
  }, [camera.scale, zoomToPoint])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [containerRef, handleWheel])

  return { camera, setCamera, zoomToPoint }
}