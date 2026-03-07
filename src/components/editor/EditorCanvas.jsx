import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_ROW,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_TEXT,
} from './editorConstants'
import { useEditorStore } from './useEditorStore'

const INITIAL_UNITS_PER_PIXEL = 7
const MIN_UNITS_PER_PIXEL = 0.08
const MAX_UNITS_PER_PIXEL = 8
const MIN_SCALE = 1 / MAX_UNITS_PER_PIXEL
const MAX_SCALE = 1 / MIN_UNITS_PER_PIXEL
const GRID_SIZE = 40
const ROW_ANGLE_SNAP_DEGREES = 15
const DEGREES_PER_RADIAN = 180 / Math.PI
const RADIANS_PER_DEGREE = Math.PI / 180
const PAN_CLICK_TOLERANCE = 4
const PREVIEW_SEAT_RADIUS = 12
const MIN_ARC_COMMIT_RADIUS = PREVIEW_SEAT_RADIUS * 0.75
const MIN_ARC_COMMIT_SWEEP = 4 * RADIANS_PER_DEGREE

// ─── Pure Math Utilities ──────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildSelectionBounds(startPoint, endPoint) {
  const x = Math.min(startPoint.x, endPoint.x)
  const y = Math.min(startPoint.y, endPoint.y)
  const width = Math.abs(endPoint.x - startPoint.x)
  const height = Math.abs(endPoint.y - startPoint.y)

  return { x, y, width, height }
}

function isSeatInsideBounds(seat, bounds) {
  return (
    seat.x >= bounds.x &&
    seat.x <= bounds.x + bounds.width &&
    seat.y >= bounds.y &&
    seat.y <= bounds.y + bounds.height
  )
}

function resolveRowAngle(rawAngle, shiftKey) {
  const angleDeg = rawAngle * DEGREES_PER_RADIAN
  const finalAngleDeg = shiftKey
    ? angleDeg
    : Math.round(angleDeg / ROW_ANGLE_SNAP_DEGREES) * ROW_ANGLE_SNAP_DEGREES

  return finalAngleDeg * RADIANS_PER_DEGREE
}

function buildRowPoints(startPoint, endPoint, shiftKey) {
  const deltaX = endPoint.x - startPoint.x
  const deltaY = endPoint.y - startPoint.y
  const rawAngle = Math.atan2(deltaY, deltaX)
  const finalAngle = resolveRowAngle(rawAngle, shiftKey)
  const unitX = Math.cos(finalAngle)
  const unitY = Math.sin(finalAngle)
  const distance = Math.hypot(deltaX, deltaY)
  const seatCount = Math.floor(distance / GRID_SIZE)
  const points = []

  for (let step = 0; step <= seatCount; step += 1) {
    points.push({
      x: startPoint.x + unitX * (step * GRID_SIZE),
      y: startPoint.y + unitY * (step * GRID_SIZE),
    })
  }

  return points
}

function normalizeAngleDelta(angle) {
  let normalizedAngle = angle
  while (normalizedAngle <= -Math.PI) normalizedAngle += Math.PI * 2
  while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2
  return normalizedAngle
}

function buildArcPoints(centerPoint, radius, startAngle, totalSweep) {
  if (radius <= 0 || startAngle === null || totalSweep === null) return [centerPoint]

  const arcLength = Math.abs(totalSweep) * radius
  if (arcLength < 1) {
    return [{
      x: centerPoint.x + radius * Math.cos(startAngle + totalSweep),
      y: centerPoint.y + radius * Math.sin(startAngle + totalSweep),
    }]
  }

  const segmentCount = Math.max(1, Math.round(arcLength / GRID_SIZE))
  const points = []

  for (let step = 0; step <= segmentCount; step += 1) {
    const progress = step / segmentCount
    const angle = startAngle + totalSweep * progress
    points.push({
      x: centerPoint.x + radius * Math.cos(angle),
      y: centerPoint.y + radius * Math.sin(angle),
    })
  }

  return points
}

function canCommitArc(arcSession) {
  return (
    arcSession.startAngle !== null &&
    arcSession.radius >= MIN_ARC_COMMIT_RADIUS &&
    Math.abs(arcSession.totalSweep) >= MIN_ARC_COMMIT_SWEEP
  )
}

function screenToWorldPoint(screenPoint, camera) {
  return {
    x: (screenPoint.x - camera.position.x) / camera.scale,
    y: (screenPoint.y - camera.position.y) / camera.scale,
  }
}

// ─── SVG Elements Rendering Components ────────────────────────────────────────

const SeatSVG = React.memo(({ seat, isSelected, isEraseHovered, onSeatClick, onSeatDoubleClick, onSeatMouseDown, onSeatMouseEnter, onSeatMouseLeave }) => {
  return (
    <circle
      cx={seat.x}
      cy={seat.y}
      r={seat.radius}
      fill={isEraseHovered ? 'rgba(232, 98, 110, 0.45)' : isSelected ? '#81b8ff' : seat.fill}
      stroke={isEraseHovered ? '#ff7a87' : isSelected ? '#edf6ff' : seat.stroke}
      strokeWidth={isEraseHovered || isSelected ? 3 : 2}
      onClick={(e) => onSeatClick(e, seat.id)}
      onDoubleClick={(e) => onSeatDoubleClick(e, seat.id)}
      onMouseDown={(e) => onSeatMouseDown(e, seat)}
      onMouseEnter={() => onSeatMouseEnter(seat.id)}
      onMouseLeave={onSeatMouseLeave}
      className={isEraseHovered || isSelected ? 'cursor-pointer z-10' : ''}
    />
  )
})
SeatSVG.displayName = 'SeatSVG'

const TextSVG = React.memo(({ textItem, isSelected, isEraseHovered, onTextClick, onTextMouseDown, onTextMouseEnter, onTextMouseLeave }) => {
  const scale = textItem.scale || 1
  const fontSize = textItem.fontSize || 20

  return (
    <g transform={`translate(${textItem.x}, ${textItem.y}) scale(${scale})`}>
      <text
        x={0}
        y={0}
        fill={isEraseHovered ? '#ff7a87' : (textItem.fill || '#c9d6ea')}
        fontSize={fontSize}
        fontWeight={textItem.fontWeight || 'normal'}
        fontStyle={textItem.fontStyle || 'normal'}
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        onClick={(e) => onTextClick(e, textItem.id)}
        onMouseDown={(e) => onTextMouseDown(e, textItem)}
        onMouseEnter={() => onTextMouseEnter(textItem.id)}
        onMouseLeave={onTextMouseLeave}
        className={`select-none ${isEraseHovered || isSelected ? 'cursor-pointer' : ''}`}
      >
        {textItem.content}
      </text>
    </g>
  )
})
TextSVG.displayName = 'TextSVG'

// ─── Component ────────────────────────────────────────────────────────────────

function EditorCanvas() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const seats = useEditorStore((state) => state.seats)
  const texts = useEditorStore((state) => state.texts)
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds)
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)

  const handleWorldClick = useEditorStore((state) => state.handleWorldClick)
  const selectSeat = useEditorStore((state) => state.selectSeat)
  const selectText = useEditorStore((state) => state.selectText)
  const smartRowSelect = useEditorStore((state) => state.smartRowSelect)
  const moveSeats = useEditorStore((state) => state.moveSeats)
  const moveTexts = useEditorStore((state) => state.moveTexts)
  const marqueeSelect = useEditorStore((state) => state.marqueeSelect)
  const eraseSeat = useEditorStore((state) => state.eraseSeat)
  const eraseText = useEditorStore((state) => state.eraseText)
  const commitRow = useEditorStore((state) => state.commitRow)
  const commitArc = useEditorStore((state) => state.commitArc)

  const containerRef = useRef(null)
  const panSessionRef = useRef(null)
  const seatDragSessionRef = useRef(null)
  const rowSessionRef = useRef(null)
  const arcSessionRef = useRef(null)
  const marqueeSessionRef = useRef(null)
  const pendingSeatUpdatesRef = useRef(null)
  const seatUpdateRafRef = useRef(null)
  const suppressNextClickRef = useRef(false)
  const previousViewportRef = useRef({ width: 1, height: 1 })
  const isInitializedRef = useRef(false)

  const seatsRef = useRef(seats)
  const textsRef = useRef(texts)
  const commitArcRef = useRef(commitArc)
  const commitRowRef = useRef(commitRow)
  const marqueeSelectRef = useRef(marqueeSelect)
  const cameraRef = useRef({
    scale: 1 / INITIAL_UNITS_PER_PIXEL,
    position: { x: 0, y: 0 },
  })

  const [viewport, setViewport] = useState({ width: 1, height: 1 })
  const [camera, setCamera] = useState({
    scale: 1 / INITIAL_UNITS_PER_PIXEL,
    position: { x: 0, y: 0 },
  })
  const [isPanning, setIsPanning] = useState(false)
  const [isDraggingSeat, setIsDraggingSeat] = useState(false)
  const [hoveredSeatId, setHoveredSeatId] = useState(null)
  const [hoveredTextId, setHoveredTextId] = useState(null)
  const [marqueeRect, setMarqueeRect] = useState(null)
  const [rowPreviewPoints, setRowPreviewPoints] = useState([])
  const [arcPreviewPoints, setArcPreviewPoints] = useState([])

  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])
  const seatsById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats])
  const selectedTextIdSet = useMemo(() => new Set(selectedTextIds), [selectedTextIds])
  const textsById = useMemo(() => new Map(texts.map((textItem) => [textItem.id, textItem])), [texts])

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    seatsRef.current = seats
  }, [seats])

  useEffect(() => {
    textsRef.current = texts
  }, [texts])

  useEffect(() => {
    commitArcRef.current = commitArc
  }, [commitArc])

  useEffect(() => {
    commitRowRef.current = commitRow
  }, [commitRow])

  useEffect(() => {
    marqueeSelectRef.current = marqueeSelect
  }, [marqueeSelect])

  useEffect(() => {
    return () => {
      if (seatUpdateRafRef.current !== null) {
        window.cancelAnimationFrame(seatUpdateRafRef.current)
      }
    }
  }, [])

  // ── Viewport resize observer ──────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const width = Math.max(entry.contentRect.width, 1)
      const height = Math.max(entry.contentRect.height, 1)
      setViewport({ width, height })
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  // ── Camera: center on viewport resize ────────────────────────────────────

  useEffect(() => {
    if (viewport.width <= 0 || viewport.height <= 0) {
      return
    }

    setCamera((previousCamera) => {
      if (!isInitializedRef.current) {
        isInitializedRef.current = true
        previousViewportRef.current = viewport

        return {
          scale: 1 / INITIAL_UNITS_PER_PIXEL,
          position: {
            x: viewport.width / 2,
            y: viewport.height / 2,
          },
        }
      }

      const priorViewport = previousViewportRef.current
      const worldCenterX =
        (priorViewport.width / 2 - previousCamera.position.x) / previousCamera.scale
      const worldCenterY =
        (priorViewport.height / 2 - previousCamera.position.y) / previousCamera.scale

      previousViewportRef.current = viewport
      return {
        ...previousCamera,
        position: {
          x: viewport.width / 2 - worldCenterX * previousCamera.scale,
          y: viewport.height / 2 - worldCenterY * previousCamera.scale,
        },
      }
    })
  }, [viewport])

  // ── Session stop helpers ──────────────────────────────────────────────────

  const stopPanning = useCallback(() => {
    panSessionRef.current = null
    setIsPanning(false)
  }, [])

  const flushPendingSeatUpdates = useCallback(() => {
    if (seatUpdateRafRef.current !== null) {
      window.cancelAnimationFrame(seatUpdateRafRef.current)
      seatUpdateRafRef.current = null
    }

    const pendingSeatUpdates = pendingSeatUpdatesRef.current
    pendingSeatUpdatesRef.current = null

    if (pendingSeatUpdates) {
      moveSeats(pendingSeatUpdates)
    }
  }, [moveSeats])

  const queueSeatUpdates = useCallback(
    (seatUpdates) => {
      pendingSeatUpdatesRef.current = seatUpdates

      if (seatUpdateRafRef.current !== null) {
        return
      }

      seatUpdateRafRef.current = window.requestAnimationFrame(() => {
        seatUpdateRafRef.current = null
        const pendingSeatUpdates = pendingSeatUpdatesRef.current
        pendingSeatUpdatesRef.current = null

        if (pendingSeatUpdates) {
          moveSeats(pendingSeatUpdates)
        }
      })
    },
    [moveSeats],
  )

  const stopSeatDrag = useCallback(() => {
    flushPendingSeatUpdates()
    seatDragSessionRef.current = null
    setIsDraggingSeat(false)
  }, [flushPendingSeatUpdates])

  const stopMarqueeSelection = useCallback(() => {
    marqueeSessionRef.current = null
    setMarqueeRect(null)
  }, [])

  const stopRowBuilder = useCallback(() => {
    rowSessionRef.current = null
    setRowPreviewPoints([])
  }, [])

  const stopArcBuilder = useCallback(() => {
    arcSessionRef.current = null
    setArcPreviewPoints([])
  }, [])

  // ── Native SVG pointer calculation ────────────────────────────────────────

  const getPointerPosition = useCallback((clientX, clientY) => {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const getWorldPointFromStage = useCallback((clientX, clientY) => {
    const pointerPosition = getPointerPosition(clientX, clientY)
    if (!pointerPosition) return null
    return screenToWorldPoint(pointerPosition, cameraRef.current)
  }, [getPointerPosition])


  // ── Zoom ──────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((event) => {
    // Prevent default scroll
    event.preventDefault()

    const pointerPosition = getPointerPosition(event.clientX, event.clientY)
    if (!pointerPosition) {
      return
    }

    setCamera((previousCamera) => {
      const pointerWorld = screenToWorldPoint(pointerPosition, previousCamera)
      const zoomFactor = Math.exp(-event.deltaY * 0.0015)
      const nextScale = clamp(previousCamera.scale * zoomFactor, MIN_SCALE, MAX_SCALE)

      return {
        scale: nextScale,
        position: {
          x: pointerPosition.x - pointerWorld.x * nextScale,
          y: pointerPosition.y - pointerWorld.y * nextScale,
        },
      }
    })
  }, [getPointerPosition])

  // Attach wheel listener natively to prevent passive event warning
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // ── Mouse Down ────────────────────────────────────────────────────────────

  const handleStageMouseDown = useCallback(
    (event) => {
      if (event.button !== 0) {
        return
      }

      // If clicking inside SVG but not on the background, let element handle it.
      // E.g. seats and text will have their own mouseDowns which call stopPropagation

      suppressNextClickRef.current = false

      if (activeTool === TOOL_ROW) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        rowSessionRef.current = {
          startPoint: worldPoint,
          currentPoint: worldPoint,
          isShiftPressed: false,
        }

        setRowPreviewPoints([worldPoint])
        return
      }

      if (activeTool === TOOL_ARC) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        arcSessionRef.current = {
          centerPoint: worldPoint,
          radius: 0,
          startAngle: null,
          previousAngle: null,
          totalSweep: 0,
        }

        setArcPreviewPoints([worldPoint])
        return
      }

      if (activeTool === TOOL_SELECT) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        marqueeSessionRef.current = {
          startClientX: event.clientX,
          startClientY: event.clientY,
          startWorld: worldPoint,
          currentWorld: worldPoint,
          isShiftPressed: Boolean(event.shiftKey),
          hasMoved: false,
        }

        setMarqueeRect(buildSelectionBounds(worldPoint, worldPoint))
        return
      }

      const currentCamera = cameraRef.current
      panSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: currentCamera.position.x,
        startY: currentCamera.position.y,
        hasDragged: false,
      }

      setIsPanning(true)
    },
    [activeTool, getWorldPointFromStage],
  )

  // ── Mouse Move ────────────────────────────────────────────────────────────

  const handleStageMouseMove = useCallback(
    (event) => {
      // ── Seat drag ──────────────────────────────────────────────────────────
      const dragSession = seatDragSessionRef.current
      if (dragSession) {
        if (!dragSession.hasMoved) {
          const deltaClientX = event.clientX - dragSession.startClientX
          const deltaClientY = event.clientY - dragSession.startClientY
          const distanceSquared = deltaClientX * deltaClientX + deltaClientY * deltaClientY

          if (distanceSquared > PAN_CLICK_TOLERANCE * PAN_CLICK_TOLERANCE) {
            dragSession.hasMoved = true
            suppressNextClickRef.current = true
          }
        }

        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        const deltaWorldX = worldPoint.x - dragSession.startWorld.x
        const deltaWorldY = worldPoint.y - dragSession.startWorld.y
        const seatUpdates = []
        const textUpdates = []

        dragSession.baseSeatPositionsById.forEach((basePosition, seatId) => {
          seatUpdates.push({
            id: seatId,
            x: basePosition.x + deltaWorldX,
            y: basePosition.y + deltaWorldY,
          })
        })

        dragSession.baseTextPositionsById.forEach((basePosition, textId) => {
          textUpdates.push({
            id: textId,
            x: basePosition.x + deltaWorldX,
            y: basePosition.y + deltaWorldY,
          })
        })

        if (seatUpdates.length > 0) {
          queueSeatUpdates(seatUpdates)
        }

        if (textUpdates.length > 0) {
          moveTexts(textUpdates)
        }
        return
      }

      // ── Arc builder ────────────────────────────────────────────────────────
      const arcSession = arcSessionRef.current
      if (arcSession) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        const deltaX = worldPoint.x - arcSession.centerPoint.x
        const deltaY = worldPoint.y - arcSession.centerPoint.y
        const radius = Math.hypot(deltaX, deltaY)

        if (radius <= 0) {
          setArcPreviewPoints([arcSession.centerPoint])
          return
        }

        const currentAngle = Math.atan2(deltaY, deltaX)

        if (arcSession.startAngle === null) {
          arcSession.startAngle = currentAngle
          arcSession.previousAngle = currentAngle
        }

        const angleDelta = normalizeAngleDelta(currentAngle - arcSession.previousAngle)
        arcSession.totalSweep += angleDelta
        arcSession.previousAngle = currentAngle
        arcSession.radius = radius

        setArcPreviewPoints(
          buildArcPoints(
            arcSession.centerPoint,
            arcSession.radius,
            arcSession.startAngle,
            arcSession.totalSweep,
          ),
        )
        return
      }

      // ── Row builder ────────────────────────────────────────────────────────
      const rowSession = rowSessionRef.current
      if (rowSession) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        rowSession.currentPoint = worldPoint
        rowSession.isShiftPressed = Boolean(event.shiftKey)

        setRowPreviewPoints(
          buildRowPoints(
            rowSession.startPoint,
            rowSession.currentPoint,
            rowSession.isShiftPressed,
          ),
        )
        return
      }

      // ── Marquee selection ──────────────────────────────────────────────────
      const marqueeSession = marqueeSessionRef.current
      if (marqueeSession) {
        const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
        if (!worldPoint) {
          return
        }

        marqueeSession.currentWorld = worldPoint
        marqueeSession.isShiftPressed = Boolean(event.shiftKey)

        if (!marqueeSession.hasMoved) {
          const deltaX = event.clientX - marqueeSession.startClientX
          const deltaY = event.clientY - marqueeSession.startClientY
          const distanceSquared = deltaX * deltaX + deltaY * deltaY

          if (distanceSquared > PAN_CLICK_TOLERANCE * PAN_CLICK_TOLERANCE) {
            marqueeSession.hasMoved = true
            suppressNextClickRef.current = true
          }
        }

        setMarqueeRect(
          buildSelectionBounds(marqueeSession.startWorld, marqueeSession.currentWorld),
        )
        return
      }

      // ── Pan ────────────────────────────────────────────────────────────────
      const panSession = panSessionRef.current
      if (!panSession) {
        return
      }

      const deltaX = event.clientX - panSession.startClientX
      const deltaY = event.clientY - panSession.startClientY
      let shouldPan = panSession.hasDragged

      if (!panSession.hasDragged) {
        const distanceSquared = deltaX * deltaX + deltaY * deltaY
        if (distanceSquared > PAN_CLICK_TOLERANCE * PAN_CLICK_TOLERANCE) {
          panSession.hasDragged = true
          suppressNextClickRef.current = true
          shouldPan = true
        }
      }

      if (!shouldPan) {
        return
      }

      setCamera((previousCamera) => ({
        ...previousCamera,
        position: {
          x: panSession.startX + deltaX,
          y: panSession.startY + deltaY,
        },
      }))
    },
    [getWorldPointFromStage, moveTexts, queueSeatUpdates],
  )

  // ── Mouse Up ──────────────────────────────────────────────────────────────

  const handleStageMouseUp = useCallback(() => {
    const dragSession = seatDragSessionRef.current
    if (dragSession) {
      stopSeatDrag()
      return
    }

    const arcSession = arcSessionRef.current
    if (arcSession) {
      if (canCommitArc(arcSession)) {
        const resolvedArcPoints = buildArcPoints(
          arcSession.centerPoint,
          arcSession.radius,
          arcSession.startAngle,
          arcSession.totalSweep,
        )
        commitArcRef.current(resolvedArcPoints)
      }

      stopArcBuilder()
      return
    }

    const rowSession = rowSessionRef.current
    if (rowSession) {
      const resolvedRowPoints = buildRowPoints(
        rowSession.startPoint,
        rowSession.currentPoint,
        rowSession.isShiftPressed,
      )
      commitRowRef.current(resolvedRowPoints)
      stopRowBuilder()
      return
    }

    const marqueeSession = marqueeSessionRef.current
    if (marqueeSession) {
      if (marqueeSession.hasMoved) {
        const selectionBounds = buildSelectionBounds(
          marqueeSession.startWorld,
          marqueeSession.currentWorld,
        )
        const seatIdsInBounds = seatsRef.current
          .filter((seat) => isSeatInsideBounds(seat, selectionBounds))
          .map((seat) => seat.id)

        const textIdsInBounds = textsRef.current
          .filter((textItem) => isSeatInsideBounds(textItem, selectionBounds))
          .map((textItem) => textItem.id)

        marqueeSelectRef.current(
          seatIdsInBounds,
          textIdsInBounds,
          marqueeSession.isShiftPressed,
        )
      }

      stopMarqueeSelection()
      return
    }

    const panSession = panSessionRef.current
    if (!panSession) {
      return
    }

    stopPanning()
  }, [
    stopArcBuilder,
    stopMarqueeSelection,
    stopPanning,
    stopRowBuilder,
    stopSeatDrag,
  ])

  const handleStageMouseLeave = useCallback(() => {
    if (activeTool === TOOL_ERASER) {
      setHoveredSeatId(null)
      setHoveredTextId(null)
    }
  }, [activeTool])

  // ── Global window listeners (handle mouse leaving the canvas) ─────────────

  useEffect(() => {
    function hasActiveInteraction() {
      return Boolean(
        seatDragSessionRef.current ||
        arcSessionRef.current ||
        rowSessionRef.current ||
        marqueeSessionRef.current ||
        panSessionRef.current,
      )
    }

    function handleWindowMouseMove(nativeEvent) {
      if (!hasActiveInteraction()) return
      handleStageMouseMove(nativeEvent)
    }

    function handleWindowMouseUp(nativeEvent) {
      if (!hasActiveInteraction()) return
      handleStageMouseUp()
    }

    function handleWindowBlur() {
      if (seatDragSessionRef.current) stopSeatDrag()
      if (arcSessionRef.current) stopArcBuilder()
      if (rowSessionRef.current) stopRowBuilder()
      if (marqueeSessionRef.current) stopMarqueeSelection()
      if (panSessionRef.current) stopPanning()
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [
    handleStageMouseMove,
    handleStageMouseUp,
    stopArcBuilder,
    stopMarqueeSelection,
    stopPanning,
    stopRowBuilder,
    stopSeatDrag,
  ])

  // ── Click handlers ────────────────────────────────────────────────────────

  const handleStageClick = useCallback(
    (event) => {
      // Prevents clicks on shapes from triggering background click
      if (event.target.tagName !== 'svg' && event.target.tagName !== 'USE' && event.currentTarget.tagName !== 'SECTION') {
        return;
      }

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
      if (!worldPoint) {
        return
      }

      handleWorldClick(worldPoint)
    },
    [getWorldPointFromStage, handleWorldClick],
  )

  const handleSeatClick = useCallback(
    (event, seatId) => {
      event.stopPropagation()

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      if (activeTool === TOOL_SELECT) {
        selectSeat(seatId, Boolean(event.shiftKey))
        return
      }

      if (activeTool === TOOL_ERASER) {
        setHoveredSeatId(null)
        eraseSeat(seatId)
      }
    },
    [activeTool, eraseSeat, selectSeat],
  )

  const handleTextClick = useCallback(
    (event, textId) => {
      event.stopPropagation()

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      if (activeTool === TOOL_SELECT) {
        selectText(textId, Boolean(event.shiftKey))
        return
      }

      if (activeTool === TOOL_ERASER) {
        setHoveredTextId(null)
        eraseText(textId)
      }
    },
    [activeTool, eraseText, selectText],
  )

  const handleSeatDoubleClick = useCallback(
    (event, seatId) => {
      event.stopPropagation()

      if (activeTool !== TOOL_SELECT) {
        return
      }

      // We don't have event.evt natively, so we just pass standard React synthetic event
      smartRowSelect(seatId, event)
    },
    [activeTool, smartRowSelect],
  )

  const handleSeatMouseDown = useCallback(
    (event, seat) => {
      event.stopPropagation()

      if (activeTool === TOOL_ERASER) {
        return
      }

      if (activeTool !== TOOL_SELECT) {
        return
      }

      if (event.button !== 0 || !selectedSeatIdSet.has(seat.id)) {
        return
      }

      const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
      if (!worldPoint) {
        return
      }

      const baseSeatPositionsById = new Map()
      selectedSeatIds.forEach((seatId) => {
        const selectedSeat = seatsById.get(seatId)
        if (selectedSeat) {
          baseSeatPositionsById.set(seatId, { x: selectedSeat.x, y: selectedSeat.y })
        }
      })

      const baseTextPositionsById = new Map()
      selectedTextIds.forEach((textId) => {
        const selectedText = textsById.get(textId)
        if (selectedText) {
          baseTextPositionsById.set(textId, { x: selectedText.x, y: selectedText.y })
        }
      })

      if (baseSeatPositionsById.size === 0 && baseTextPositionsById.size === 0) {
        return
      }

      seatDragSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWorld: worldPoint,
        baseSeatPositionsById,
        baseTextPositionsById,
        hasMoved: false,
      }

      setIsDraggingSeat(true)
    },
    [
      activeTool,
      getWorldPointFromStage,
      seatsById,
      selectedTextIds,
      selectedSeatIdSet,
      selectedSeatIds,
      textsById,
    ],
  )

  const handleTextMouseDown = useCallback(
    (event, textItem) => {
      event.stopPropagation()

      if (activeTool === TOOL_ERASER) {
        return
      }

      if (activeTool !== TOOL_SELECT) {
        return
      }

      if (event.button !== 0 || !selectedTextIdSet.has(textItem.id)) {
        return
      }

      const worldPoint = getWorldPointFromStage(event.clientX, event.clientY)
      if (!worldPoint) {
        return
      }

      const baseSeatPositionsById = new Map()
      selectedSeatIds.forEach((seatId) => {
        const selectedSeat = seatsById.get(seatId)
        if (selectedSeat) {
          baseSeatPositionsById.set(seatId, { x: selectedSeat.x, y: selectedSeat.y })
        }
      })

      const baseTextPositionsById = new Map()
      selectedTextIds.forEach((textId) => {
        const selectedText = textsById.get(textId)
        if (selectedText) {
          baseTextPositionsById.set(textId, { x: selectedText.x, y: selectedText.y })
        }
      })

      if (baseSeatPositionsById.size === 0 && baseTextPositionsById.size === 0) {
        return
      }

      seatDragSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWorld: worldPoint,
        baseSeatPositionsById,
        baseTextPositionsById,
        hasMoved: false,
      }

      setIsDraggingSeat(true)
    },
    [
      activeTool,
      getWorldPointFromStage,
      seatsById,
      selectedSeatIds,
      selectedTextIdSet,
      selectedTextIds,
      textsById,
    ],
  )

  const handleSeatMouseEnter = useCallback(
    (seatId) => {
      if (activeTool !== TOOL_ERASER) return
      setHoveredSeatId(seatId)
    },
    [activeTool],
  )

  const handleSeatMouseLeave = useCallback(() => {
    if (activeTool !== TOOL_ERASER) return
    setHoveredSeatId(null)
  }, [activeTool])

  const handleTextMouseEnter = useCallback(
    (textId) => {
      if (activeTool !== TOOL_ERASER) return
      setHoveredTextId(textId)
    },
    [activeTool],
  )

  const handleTextMouseLeave = useCallback(() => {
    if (activeTool !== TOOL_ERASER) return
    setHoveredTextId(null)
  }, [activeTool])

  // ── Render seats (memoized) ───────────────────────────────────────────────

  const renderedSeats = useMemo(() => {
    return seats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id)
      const isEraseHovered = activeTool === TOOL_ERASER && seat.id === hoveredSeatId

      return (
        <SeatSVG
          key={seat.id}
          seat={seat}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
          onSeatClick={handleSeatClick}
          onSeatDoubleClick={handleSeatDoubleClick}
          onSeatMouseDown={handleSeatMouseDown}
          onSeatMouseEnter={handleSeatMouseEnter}
          onSeatMouseLeave={handleSeatMouseLeave}
        />
      )
    })
  }, [
    seats,
    selectedSeatIdSet,
    activeTool,
    hoveredSeatId,
    handleSeatClick,
    handleSeatDoubleClick,
    handleSeatMouseDown,
    handleSeatMouseEnter,
    handleSeatMouseLeave,
  ])

  const renderedTexts = useMemo(() => {
    return texts.map((textItem) => {
      const isSelected = selectedTextIdSet.has(textItem.id)
      const isEraseHovered = activeTool === TOOL_ERASER && textItem.id === hoveredTextId

      return (
        <TextSVG
          key={textItem.id}
          textItem={textItem}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
          onTextClick={handleTextClick}
          onTextMouseDown={handleTextMouseDown}
          onTextMouseEnter={handleTextMouseEnter}
          onTextMouseLeave={handleTextMouseLeave}
        />
      )
    })
  }, [
    activeTool,
    handleTextClick,
    handleTextMouseDown,
    handleTextMouseEnter,
    handleTextMouseLeave,
    hoveredTextId,
    selectedTextIdSet,
    texts,
  ])

  // ── Cursor ────────────────────────────────────────────────────────────────

  let idleCursor = 'default'
  if (activeTool === TOOL_TEXT) {
    idleCursor = 'text' 
  } else if (
    activeTool === TOOL_SEAT ||
    activeTool === TOOL_ROW ||
    activeTool === TOOL_ARC ||
    activeTool === TOOL_ERASER
  ) {
    idleCursor = 'crosshair'
  }

  const cursor = isPanning || isDraggingSeat ? 'grabbing' : idleCursor

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      ref={containerRef}
      className={`h-full w-full bg-[#0e1319] select-none ${cursor === 'grabbing' ? 'cursor-grabbing' : cursor === 'crosshair' ? 'cursor-crosshair' : cursor === 'text' ? 'cursor-text' : 'cursor-default'}`}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseLeave}
      onClick={handleStageClick}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        style={{ display: 'block' }}
      >
        <g transform={`translate(${camera.position.x}, ${camera.position.y}) scale(${camera.scale})`}>
          {renderedSeats}
          {renderedTexts}

          {activeTool === TOOL_ROW &&
            rowPreviewPoints.map((point, index) => (
              <circle
                key={`row-preview-${index}`}
                cx={point.x}
                cy={point.y}
                r={PREVIEW_SEAT_RADIUS}
                fill="rgba(129, 184, 255, 0.35)"
                stroke="rgba(230, 240, 255, 0.7)"
                strokeWidth={2}
                pointerEvents="none"
              />
            ))}

          {activeTool === TOOL_ARC &&
            arcPreviewPoints.map((point, index) => (
              <circle
                key={`arc-preview-${index}`}
                cx={point.x}
                cy={point.y}
                r={PREVIEW_SEAT_RADIUS}
                fill="rgba(111, 222, 198, 0.3)"
                stroke="rgba(192, 245, 232, 0.72)"
                strokeWidth={2}
                pointerEvents="none"
              />
            ))}

          {activeTool === TOOL_SELECT && marqueeRect && (
            <rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(115, 152, 206, 0.16)"
              stroke="rgba(160, 196, 245, 0.75)"
              strokeWidth={1.5}
              strokeDasharray="10,8"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </section>
  )
}

export default EditorCanvas
