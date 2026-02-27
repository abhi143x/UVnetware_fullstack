import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Layer, Line, Rect, Stage, Text } from 'react-konva'

const INITIAL_UNITS_PER_PIXEL = 7
const MIN_UNITS_PER_PIXEL = 0.08
const MAX_UNITS_PER_PIXEL = 8
const MIN_SCALE = 1 / MAX_UNITS_PER_PIXEL
const MAX_SCALE = 1 / MIN_UNITS_PER_PIXEL
const GRID_SIZE = 40
const MAJOR_GRID_STEP = GRID_SIZE * 5
const PAN_CLICK_TOLERANCE = 4
const TOOL_SELECT = 'select'
const TOOL_SEAT = 'seat'
const TOOL_ROW = 'row'
const TOOL_ARC = 'arc'
const TOOL_ERASER = 'eraser'
const TOOL_TEXT = 'text'
const EDITOR_BACKGROUND =
  'radial-gradient(circle at 15% 20%, rgba(88, 124, 179, 0.08), transparent 32%), radial-gradient(circle at 85% 75%, rgba(46, 82, 132, 0.08), transparent 30%), #0d1218'
const PREVIEW_SEAT_RADIUS = 12

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function snap(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

function snapPoint(point) {
  return {
    x: snap(point.x),
    y: snap(point.y),
  }
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

function buildRowPoints(startPoint, endPoint) {
  const deltaX = endPoint.x - startPoint.x
  const deltaY = endPoint.y - startPoint.y
  const angle = Math.atan2(deltaY, deltaX)
  const unitX = Math.cos(angle)
  const unitY = Math.sin(angle)
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

  while (normalizedAngle <= -Math.PI) {
    normalizedAngle += Math.PI * 2
  }

  while (normalizedAngle > Math.PI) {
    normalizedAngle -= Math.PI * 2
  }

  return normalizedAngle
}

function buildArcPoints(centerPoint, radius, startAngle, endAngle) {
  if (radius <= 0 || startAngle === null || endAngle === null) {
    return [centerPoint]
  }

  const angularSpan = normalizeAngleDelta(endAngle - startAngle)
  const arcLength = Math.abs(angularSpan) * radius

  if (arcLength < 1) {
    return [
      {
        x: centerPoint.x + radius * Math.cos(endAngle),
        y: centerPoint.y + radius * Math.sin(endAngle),
      },
    ]
  }

  const segmentCount = Math.max(1, Math.round(arcLength / GRID_SIZE))
  const points = []

  for (let step = 0; step <= segmentCount; step += 1) {
    const progress = step / segmentCount
    const angle = startAngle + angularSpan * progress

    points.push({
      x: centerPoint.x + radius * Math.cos(angle),
      y: centerPoint.y + radius * Math.sin(angle),
    })
  }

  return points
}

function buildGridLines(bounds, step) {
  const lines = []
  const startX = Math.floor(bounds.x / step) * step
  const endX = Math.ceil((bounds.x + bounds.width) / step) * step
  const startY = Math.floor(bounds.y / step) * step
  const endY = Math.ceil((bounds.y + bounds.height) / step) * step

  for (let x = startX; x <= endX; x += step) {
    lines.push([x, startY, x, endY])
  }

  for (let y = startY; y <= endY; y += step) {
    lines.push([startX, y, endX, y])
  }

  return lines
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

function EditorCanvas({
  activeTool,
  seats,
  texts = [],
  selectedSeatIds,
  onWorldClick,
  onSeatSelect,
  onSeatsMove,
  onMarqueeSelect,
  onSeatErase,
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
  const suppressNextClickRef = useRef(false)
  const previousViewportRef = useRef({ width: 1, height: 1 })
  const isInitializedRef = useRef(false)
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
  const [marqueeRect, setMarqueeRect] = useState(null)
  const [rowPreviewPoints, setRowPreviewPoints] = useState([])
  const [arcPreviewPoints, setArcPreviewPoints] = useState([])

  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])
  const seatsById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats])

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

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

  const stopPanning = useCallback(() => {
    panSessionRef.current = null
    setIsPanning(false)
  }, [])

  const stopSeatDrag = useCallback(() => {
    seatDragSessionRef.current = null
    setIsDraggingSeat(false)
  }, [])

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

        const snappedStartPoint = snapPoint(worldPoint)
        rowSessionRef.current = {
          startPoint: snappedStartPoint,
          currentPoint: snappedStartPoint,
        }

        setRowPreviewPoints([snappedStartPoint])
        return
      }

      if (activeTool === TOOL_ARC) {
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        const centerPoint = snapPoint(worldPoint)
        arcSessionRef.current = {
          centerPoint,
          radius: 0,
          startAngle: null,
          endAngle: null,
        }

        setArcPreviewPoints([centerPoint])
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

  const handleStageMouseMove = useCallback(
    (event) => {
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

        dragSession.basePositionsById.forEach((basePosition, seatId) => {
          const nextPosition = snapPoint({
            x: basePosition.x + deltaWorldX,
            y: basePosition.y + deltaWorldY,
          })

          seatUpdates.push({
            id: seatId,
            x: nextPosition.x,
            y: nextPosition.y,
          })
        })

        onSeatsMove(seatUpdates)
        return
      }

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
          arcSession.startAngle = currentAngle
        }

        arcSession.endAngle = currentAngle
        arcSession.radius = radius

        setArcPreviewPoints(
          buildArcPoints(
            arcSession.centerPoint,
            arcSession.radius,
            arcSession.startAngle,
            arcSession.endAngle,
          ),
        )
        return
      }

      const rowSession = rowSessionRef.current
      if (rowSession) {
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        rowSession.currentPoint = worldPoint

        setRowPreviewPoints(
          buildRowPoints(rowSession.startPoint, rowSession.currentPoint),
        )
        return
      }

      const marqueeSession = marqueeSessionRef.current
      if (marqueeSession) {
        const worldPoint = getWorldPointFromStage()
        if (!worldPoint) {
          return
        }

        marqueeSession.currentWorld = worldPoint

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
    [getWorldPointFromStage, onSeatsMove],
  )

  const handleStageMouseUp = useCallback(() => {
    const dragSession = seatDragSessionRef.current
    if (dragSession) {
      stopSeatDrag()
      return
    }

    const arcSession = arcSessionRef.current
    if (arcSession) {
      const resolvedArcPoints = buildArcPoints(
        arcSession.centerPoint,
        arcSession.radius,
        arcSession.startAngle,
        arcSession.endAngle,
      )
      onArcCommit(resolvedArcPoints)
      stopArcBuilder()
      return
    }

    const rowSession = rowSessionRef.current
    if (rowSession) {
      const resolvedRowPoints = buildRowPoints(rowSession.startPoint, rowSession.currentPoint)
      onRowCommit(resolvedRowPoints)
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
        const seatIdsInBounds = seats
          .filter((seat) => isSeatInsideBounds(seat, selectionBounds))
          .map((seat) => seat.id)

        onMarqueeSelect(seatIdsInBounds)
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
    onArcCommit,
    onMarqueeSelect,
    onRowCommit,
    seats,
    stopArcBuilder,
    stopMarqueeSelection,
    stopPanning,
    stopRowBuilder,
    stopSeatDrag,
  ])

  const handleStageMouseLeave = useCallback(() => {
    if (activeTool === TOOL_ERASER) {
      setHoveredSeatId(null)
    }
  }, [activeTool])

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

      if (activeTool === TOOL_SEAT) {
        onWorldClick(snapPoint(worldPoint))
        return
      }

      onWorldClick(worldPoint)
    },
    [activeTool, getWorldPointFromStage, onWorldClick],
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

      const basePositionsById = new Map()
      selectedSeatIds.forEach((seatId) => {
        const selectedSeat = seatsById.get(seatId)
        if (selectedSeat) {
          basePositionsById.set(seatId, { x: selectedSeat.x, y: selectedSeat.y })
        }
      })

      if (basePositionsById.size === 0) {
        return
      }

      seatDragSessionRef.current = {
        startClientX: event.evt.clientX,
        startClientY: event.evt.clientY,
        startWorld: worldPoint,
        basePositionsById,
        hasMoved: false,
      }

      setIsDraggingSeat(true)
    },
    [
      activeTool,
      getWorldPointFromStage,
      seatsById,
      selectedSeatIdSet,
      selectedSeatIds,
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

  const visibleBounds = useMemo(() => {
    const scale = Math.max(camera.scale, Number.EPSILON)
    return {
      x: -camera.position.x / scale,
      y: -camera.position.y / scale,
      width: viewport.width / scale,
      height: viewport.height / scale,
    }
  }, [camera.position.x, camera.position.y, camera.scale, viewport.height, viewport.width])

  const gridBounds = useMemo(() => {
    const paddingX = visibleBounds.width
    const paddingY = visibleBounds.height

    return {
      x: visibleBounds.x - paddingX,
      y: visibleBounds.y - paddingY,
      width: visibleBounds.width + paddingX * 2,
      height: visibleBounds.height + paddingY * 2,
    }
  }, [visibleBounds.height, visibleBounds.width, visibleBounds.x, visibleBounds.y])

  const minorGridLines = useMemo(
    () => buildGridLines(gridBounds, GRID_SIZE),
    [gridBounds],
  )
  const majorGridLines = useMemo(
    () => buildGridLines(gridBounds, MAJOR_GRID_STEP),
    [gridBounds],
  )

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

  return (
    <section
      ref={containerRef}
      className="h-full w-full"
      style={{ background: EDITOR_BACKGROUND }}
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
        <Layer listening={false}>
          <Rect
            x={gridBounds.x}
            y={gridBounds.y}
            width={gridBounds.width}
            height={gridBounds.height}
            fill="#0d1218"
          />
          {minorGridLines.map((points, index) => (
            <Line
              key={`minor-grid-${index}`}
              points={points}
              stroke="rgba(193, 211, 236, 0.11)"
              strokeWidth={1}
              listening={false}
            />
          ))}
          {majorGridLines.map((points, index) => (
            <Line
              key={`major-grid-${index}`}
              points={points}
              stroke="rgba(193, 211, 236, 0.19)"
              strokeWidth={1.2}
              listening={false}
            />
          ))}
        </Layer>

        <Layer>
          {seats.map((seat) => {
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
                onMouseDown={(event) => handleSeatMouseDown(event, seat)}
                onMouseEnter={() => handleSeatMouseEnter(seat.id)}
                onMouseLeave={handleSeatMouseLeave}
              />
            )
          })}

          {/* <-- Render Text Layer loop here */}
          {texts.map((t) => (
            <Text
              key={t.id}
              x={t.x}
              y={t.y}
              text={t.content}
              fill="#c9d6ea"
              fontSize={18}
              fontFamily="system-ui, sans-serif"
              align="center"
              offsetX={t.content.length * 4.5} 
              offsetY={9}
            />
          ))}

          {activeTool === TOOL_ROW &&
            rowPreviewPoints.map((point) => (
              <Circle
                key={`row-preview-${point.x}-${point.y}`}
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
            arcPreviewPoints.map((point) => (
              <Circle
                key={`arc-preview-${point.x}-${point.y}`}
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
