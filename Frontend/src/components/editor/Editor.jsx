import { useCallback, useState } from 'react'
import EditorCanvas from './EditorCanvas'
import Toolbar from './Toolbar'

const DEFAULT_SEAT_RADIUS = 12
const DEFAULT_SEAT_FILL = '#5fa7ff'
const DEFAULT_SEAT_STROKE = '#cfe4ff'

const TOOL_SELECT = 'select'
const TOOL_SEAT = 'seat'
const TOOL_ROW = 'row'
const TOOL_ARC = 'arc'
const TOOL_ERASER = 'eraser'

function createSeatId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `seat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function Editor() {
  const [activeTool, setActiveTool] = useState(TOOL_SEAT)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [seats, setSeats] = useState([])

  const handleWorldClick = useCallback(
    (worldPoint) => {
      if (activeTool === TOOL_SELECT) {
        setSelectedSeatIds([])
        return
      }

      if (activeTool !== TOOL_SEAT) {
        return
      }

      setSeats((currentSeats) => [
        ...currentSeats,
        {
          id: createSeatId(),
          x: worldPoint.x,
          y: worldPoint.y,
          radius: DEFAULT_SEAT_RADIUS,
          fill: DEFAULT_SEAT_FILL,
          stroke: DEFAULT_SEAT_STROKE,
        },
      ])
    },
    [activeTool],
  )

  const handleSeatSelect = useCallback(
    (seatId, shiftKey) => {
      if (activeTool !== TOOL_SELECT) {
        return
      }

      setSelectedSeatIds((currentSelectedSeatIds) => {
        if (!shiftKey) {
          return [seatId]
        }

        const isAlreadySelected = currentSelectedSeatIds.includes(seatId)
        if (isAlreadySelected) {
          return currentSelectedSeatIds.filter((id) => id !== seatId)
        }

        return [...currentSelectedSeatIds, seatId]
      })
    },
    [activeTool],
  )

  const handleSeatsMove = useCallback((seatUpdates) => {
    if (!seatUpdates.length) {
      return
    }

    const seatUpdatesById = new Map(seatUpdates.map((update) => [update.id, update]))

    setSeats((currentSeats) =>
      currentSeats.map((seat) =>
        seatUpdatesById.has(seat.id)
          ? {
              ...seat,
              x: seatUpdatesById.get(seat.id).x,
              y: seatUpdatesById.get(seat.id).y,
            }
          : seat,
      ),
    )
  }, [])

  const handleMarqueeSelect = useCallback(
    (seatIds) => {
      if (activeTool !== TOOL_SELECT || seatIds.length === 0) {
        return
      }

      setSelectedSeatIds((currentSelectedSeatIds) => [
        ...new Set([...currentSelectedSeatIds, ...seatIds]),
      ])
    },
    [activeTool],
  )

  const handleSeatErase = useCallback(
    (seatId) => {
      if (activeTool !== TOOL_ERASER) {
        return
      }

      setSeats((currentSeats) => currentSeats.filter((seat) => seat.id !== seatId))
      setSelectedSeatIds((currentSelectedSeatIds) =>
        currentSelectedSeatIds.filter((id) => id !== seatId),
      )
    },
    [activeTool],
  )

  const handleRowCommit = useCallback(
    (rowPoints) => {
      if (activeTool !== TOOL_ROW || rowPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => [
        ...currentSeats,
        ...rowPoints.map((point) => ({
          id: createSeatId(),
          x: point.x,
          y: point.y,
          radius: DEFAULT_SEAT_RADIUS,
          fill: DEFAULT_SEAT_FILL,
          stroke: DEFAULT_SEAT_STROKE,
        })),
      ])
    },
    [activeTool],
  )

  const handleArcCommit = useCallback(
    (arcPoints) => {
      if (activeTool !== TOOL_ARC || arcPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => [
        ...currentSeats,
        ...arcPoints.map((point) => ({
          id: createSeatId(),
          x: point.x,
          y: point.y,
          radius: DEFAULT_SEAT_RADIUS,
          fill: DEFAULT_SEAT_FILL,
          stroke: DEFAULT_SEAT_STROKE,
        })),
      ])
    },
    [activeTool],
  )

  return (
    <section className="flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="min-w-0 flex-1">
        <EditorCanvas
          activeTool={activeTool}
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onWorldClick={handleWorldClick}
          onSeatSelect={handleSeatSelect}
          onSeatsMove={handleSeatsMove}
          onMarqueeSelect={handleMarqueeSelect}
          onSeatErase={handleSeatErase}
          onRowCommit={handleRowCommit}
          onArcCommit={handleArcCommit}
        />
      </div>
    </section>
  )
}

export default Editor
