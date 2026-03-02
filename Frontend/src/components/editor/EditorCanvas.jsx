import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Layer, Rect, Stage, Text } from 'react-konva'
import {
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_ROW,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_TEXT,
} from './editorConstants'

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

/**
 * Normalizes an angle delta into the range (-π, π].
 * Used for small frame-to-frame angle deltas so they correctly
 * wrap at the ±180° boundary without accumulating drift.
 */
function normalizeAngleDelta(angle) {
  let normalizedAngle = angle

  while (normalizedAngle <= -Math.PI) {
    normalizedAngle += Math.PI * 2
  }

  while (normalizedAngle > Math.PI) {
    normalizedAngle -= Math.PI * 2
  }

  return normalizedAngle
}

/**
 * Builds evenly-spaced points along a circular arc.
 *
 * @param centerPoint  Arc origin in world coords
 * @param radius       Arc radius in world units
 * @param startAngle   Angle (radians) where the arc begins
 * @param totalSweep   Signed total angular sweep (radians).
 *                     Positive = counter-clockwise, negative = clockwise.
 *                     Supports any magnitude — arcs > 180° and full circles work.
 */
function buildArcPoints(centerPoint, radius, startAngle, totalSweep) {
  if (radius <= 0 || startAngle === null || totalSweep === null) {
    return [centerPoint]
  }

  const arcLength = Math.abs(totalSweep) * radius

  if (arcLength < 1) {
    return [
      {
        x: centerPoint.x + radius * Math.cos(startAngle + totalSweep),
        y: centerPoint.y + radius * Math.sin(startAngle + totalSweep),
      },
    ]
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

function isPointInsideRect(clientX, clientY, rect) {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function EditorCanvas({
  activeTool,
  seats,
  texts = [],
  selectedSeatIds,
  selectedTextIds = [],
  onWorldClick,
  onSeatSelect,
  onTextSelect,
  onSmartRowSelect,
  onSeatsMove,
  onTextsMove,
  onMarqueeSelect,
  onSeatErase,
  onTextErase,
  onRowCommit,
  onArcCommit,
}) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
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
  const onArcCommitRef = useRef(onArcCommit)
  const onRowCommitRef = useRef(onRowCommit)
  const onMarqueeSelectRef = useRef(onMarqueeSelect)
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
    onArcCommitRef.current = onArcCommit
  }, [onArcCommit])

  useEffect(() => {
    onRowCommitRef.current = onRowCommit
  }, [onRowCommit])

  useEffect(() => {
    onMarqueeSelectRef.current = onMarqueeSelect
  }, [onMarqueeSelect])

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
      onSeatsMove(pendingSeatUpdates)
    }
  }, [onSeatsMove])

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
          onSeatsMove(pendingSeatUpdates)
        }
      })
    },
    [onSeatsMove],
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

  const getWorldPointFromStage = useCallback(() => {
    const stage = stageRef.current
    if (!stage) {
      return null
    }

    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) {
      return null
    }

    return screenToWorldPoint(pointerPosition, cameraRef.current)
  }, [])

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((event) => {
    event.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) {
      return
    }

    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) {
      return
    }

    setCamera((previousCamera) => {
      const pointerWorld = screenToWorldPoint(pointerPosition, previousCamera)
      const zoomFactor = Math.exp(-event.evt.deltaY * 0.0015)
      const nextScale = clamp(previousCamera.scale * zoomFactor, MIN_SCALE, MAX_SCALE)

      return {
        scale: nextScale,
        position: {
          x: pointerPosition.x - pointerWorld.x * nextScale,
          y: pointerPosition.y - pointerWorld.y * nextScale,
        },
      }
    })
  }, [])

  // ── Mouse Down ────────────────────────────────────────────────────────────

  const handleStageMouseDown = useCallback(
    (event) => {
      if (event.evt.button !== 0) {
        return
      }

      const stage = stageRef.current
      if (!stage || event.target !== stage) {
        return
      }

      suppressNextClickRef.current = false

      if (activeTool === TOOL_ROW) {
        const worldPoint = getWorldPointFromStage()
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
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        // Arc session tracks cumulative sweep so arcs > 180° work correctly.
        // previousAngle + totalSweep: frame-to-frame delta is always small
        // so normalizeAngleDelta wraps it safely; the running sum is unbounded.
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
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        marqueeSessionRef.current = {
          startClientX: event.evt.clientX,
          startClientY: event.evt.clientY,
          startWorld: worldPoint,
          currentWorld: worldPoint,
          isShiftPressed: Boolean(event.evt.shiftKey),
          hasMoved: false,
        }

        setMarqueeRect(buildSelectionBounds(worldPoint, worldPoint))
        return
      }

      const currentCamera = cameraRef.current
      panSessionRef.current = {
        startClientX: event.evt.clientX,
        startClientY: event.evt.clientY,
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
          const deltaClientX = event.evt.clientX - dragSession.startClientX
          const deltaClientY = event.evt.clientY - dragSession.startClientY
          const distanceSquared = deltaClientX * deltaClientX + deltaClientY * deltaClientY

          if (distanceSquared > PAN_CLICK_TOLERANCE * PAN_CLICK_TOLERANCE) {
            dragSession.hasMoved = true
            suppressNextClickRef.current = true
          }
        }

        const worldPoint = getWorldPointFromStage()
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
          onTextsMove(textUpdates)
        }
        return
      }

      // ── Arc builder ────────────────────────────────────────────────────────
      const arcSession = arcSessionRef.current
      if (arcSession) {
        const worldPoint = getWorldPointFromStage()
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
          // First move after mousedown: anchor the start
          arcSession.startAngle = currentAngle
          arcSession.previousAngle = currentAngle
        }

        // Accumulate the angle delta frame-by-frame.
        // Using normalizeAngleDelta on each tiny delta (always < π) means
        // crossing the ±180° line works correctly and the running totalSweep
        // is unbounded — enabling arcs larger than a semicircle or full circles.
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
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        rowSession.currentPoint = worldPoint
        rowSession.isShiftPressed = Boolean(event.evt.shiftKey)

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
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        marqueeSession.currentWorld = worldPoint
        marqueeSession.isShiftPressed = Boolean(event.evt.shiftKey)

        if (!marqueeSession.hasMoved) {
          const deltaX = event.evt.clientX - marqueeSession.startClientX
          const deltaY = event.evt.clientY - marqueeSession.startClientY
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

      const deltaX = event.evt.clientX - panSession.startClientX
      const deltaY = event.evt.clientY - panSession.startClientY
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
    [getWorldPointFromStage, onTextsMove, queueSeatUpdates],
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
        onArcCommitRef.current(resolvedArcPoints)
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
      onRowCommitRef.current(resolvedRowPoints)
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

        onMarqueeSelectRef.current(
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
      if (!hasActiveInteraction()) {
        return
      }

      const container = containerRef.current
      const stage = stageRef.current
      if (!container || !stage) {
        return
      }

      const rect = container.getBoundingClientRect()
      if (isPointInsideRect(nativeEvent.clientX, nativeEvent.clientY, rect)) {
        return
      }

      stage.setPointersPositions(nativeEvent)
      handleStageMouseMove({ evt: nativeEvent })
    }

    function handleWindowMouseUp(nativeEvent) {
      if (!hasActiveInteraction()) {
        return
      }

      const container = containerRef.current
      const stage = stageRef.current
      if (!container || !stage) {
        return
      }

      const rect = container.getBoundingClientRect()
      if (isPointInsideRect(nativeEvent.clientX, nativeEvent.clientY, rect)) {
        return
      }

      stage.setPointersPositions(nativeEvent)
      handleStageMouseUp()
    }

    function handleWindowBlur() {
      if (seatDragSessionRef.current) {
        stopSeatDrag()
      }

      if (arcSessionRef.current) {
        stopArcBuilder()
      }

      if (rowSessionRef.current) {
        stopRowBuilder()
      }

      if (marqueeSessionRef.current) {
        stopMarqueeSelection()
      }

      if (panSessionRef.current) {
        stopPanning()
      }
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
      const stage = stageRef.current
      if (!stage || event.target !== stage) {
        return
      }

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      const worldPoint = getWorldPointFromStage()
      if (!worldPoint) {
        return
      }

      onWorldClick(worldPoint)
    },
    [getWorldPointFromStage, onWorldClick],
  )

  const handleSeatClick = useCallback(
    (event, seatId) => {
      event.cancelBubble = true

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      if (activeTool === TOOL_SELECT) {
        onSeatSelect(seatId, Boolean(event.evt.shiftKey))
        return
      }

      if (activeTool === TOOL_ERASER) {
        setHoveredSeatId(null)
        onSeatErase(seatId)
      }
    },
    [activeTool, onSeatErase, onSeatSelect],
  )

  const handleTextClick = useCallback(
    (event, textId) => {
      event.cancelBubble = true

      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      if (activeTool === TOOL_SELECT) {
        onTextSelect(textId, Boolean(event.evt.shiftKey))
        return
      }

      if (activeTool === TOOL_ERASER) {
        setHoveredTextId(null)
        onTextErase(textId)
      }
    },
    [activeTool, onTextErase, onTextSelect],
  )

  const handleSeatDoubleClick = useCallback(
    (event, seatId) => {
      event.cancelBubble = true

      if (activeTool !== TOOL_SELECT) {
        return
      }

      onSmartRowSelect(seatId, event)
    },
    [activeTool, onSmartRowSelect],
  )

  const handleSeatMouseDown = useCallback(
    (event, seat) => {
      event.cancelBubble = true

      if (activeTool === TOOL_ERASER) {
        return
      }

      if (activeTool !== TOOL_SELECT) {
        return
      }

      if (event.evt.button !== 0 || !selectedSeatIdSet.has(seat.id)) {
        return
      }

      const worldPoint = getWorldPointFromStage()
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
        startClientX: event.evt.clientX,
        startClientY: event.evt.clientY,
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
      event.cancelBubble = true

      if (activeTool === TOOL_ERASER) {
        return
      }

      if (activeTool !== TOOL_SELECT) {
        return
      }

      if (event.evt.button !== 0 || !selectedTextIdSet.has(textItem.id)) {
        return
      }

      const worldPoint = getWorldPointFromStage()
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
        startClientX: event.evt.clientX,
        startClientY: event.evt.clientY,
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
      if (activeTool !== TOOL_ERASER) {
        return
      }

      setHoveredSeatId(seatId)
    },
    [activeTool],
  )

  const handleSeatMouseLeave = useCallback(() => {
    if (activeTool !== TOOL_ERASER) {
      return
    }

    setHoveredSeatId(null)
  }, [activeTool])

  const handleTextMouseEnter = useCallback(
    (textId) => {
      if (activeTool !== TOOL_ERASER) {
        return
      }

      setHoveredTextId(textId)
    },
    [activeTool],
  )

  const handleTextMouseLeave = useCallback(() => {
    if (activeTool !== TOOL_ERASER) {
      return
    }

    setHoveredTextId(null)
  }, [activeTool])

  // ── Render seats (memoized) ───────────────────────────────────────────────

  const renderedSeats = useMemo(() => {
    return seats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id)
      const isEraseHovered = activeTool === TOOL_ERASER && seat.id === hoveredSeatId

      return (
        <Circle
          key={seat.id}
          x={seat.x}
          y={seat.y}
          radius={seat.radius}
          fill={
            isEraseHovered
              ? 'rgba(232, 98, 110, 0.45)'
              : isSelected
                ? '#81b8ff'
                : seat.fill
          }
          stroke={
            isEraseHovered
              ? '#ff7a87'
              : isSelected
                ? '#edf6ff'
                : seat.stroke
          }
          strokeWidth={isEraseHovered || isSelected ? 3 : 2}
          onClick={(event) => handleSeatClick(event, seat.id)}
          onDblClick={(event) => handleSeatDoubleClick(event, seat.id)}
          onMouseDown={(event) => handleSeatMouseDown(event, seat)}
          onMouseEnter={() => handleSeatMouseEnter(seat.id)}
          onMouseLeave={handleSeatMouseLeave}
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
        <Text
          key={textItem.id}
          x={textItem.x}
          y={textItem.y}
          text={textItem.content}
          fill={isEraseHovered ? '#ff7a87' : isSelected ? '#81b8ff' : '#c9d6ea'}
          fontSize={18}
          fontFamily="system-ui, sans-serif"
          align="center"
          offsetX={textItem.content.length * 4.5}
          offsetY={9}
          onClick={(event) => handleTextClick(event, textItem.id)}
          onMouseDown={(event) => handleTextMouseDown(event, textItem)}
          onMouseEnter={() => handleTextMouseEnter(textItem.id)}
          onMouseLeave={handleTextMouseLeave}
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
  if (
    activeTool === TOOL_SEAT ||
    activeTool === TOOL_ROW ||
    activeTool === TOOL_ARC ||
    activeTool === TOOL_ERASER ||
    activeTool === TOOL_TEXT
  ) {
    idleCursor = 'crosshair'
  }

  const cursor = isPanning || isDraggingSeat ? 'grabbing' : idleCursor

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      ref={containerRef}
      className="h-full w-full"
      style={{ background: '#ffffff' }}
    >
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        x={camera.position.x}
        y={camera.position.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseLeave}
        onClick={handleStageClick}
        style={{ cursor }}
      >
        <Layer>
          {renderedSeats}
          {renderedTexts}

          {activeTool === TOOL_ROW &&
            rowPreviewPoints.map((point, index) => (
              <Circle
                key={`row-preview-${index}`}
                x={point.x}
                y={point.y}
                radius={PREVIEW_SEAT_RADIUS}
                fill="rgba(129, 184, 255, 0.35)"
                stroke="rgba(230, 240, 255, 0.7)"
                strokeWidth={2}
                listening={false}
              />
            ))}

          {activeTool === TOOL_ARC &&
            arcPreviewPoints.map((point, index) => (
              <Circle
                key={`arc-preview-${index}`}
                x={point.x}
                y={point.y}
                radius={PREVIEW_SEAT_RADIUS}
                fill="rgba(111, 222, 198, 0.3)"
                stroke="rgba(192, 245, 232, 0.72)"
                strokeWidth={2}
                listening={false}
              />
            ))}

          {activeTool === TOOL_SELECT && marqueeRect && (
            <Rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(115, 152, 206, 0.16)"
              stroke="rgba(160, 196, 245, 0.75)"
              strokeWidth={1.5}
              dash={[10, 8]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </section>
  )
}

export default EditorCanvas
