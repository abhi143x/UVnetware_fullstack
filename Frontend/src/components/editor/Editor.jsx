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
const TOOL_TEXT = 'text'

function createSeatId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `seat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isOverlapping(x, y, seats) {
  for (const seat of seats) {
    const deltaX = x - seat.x
    const deltaY = y - seat.y
    const distance = Math.hypot(deltaX, deltaY)
    const seatDiameter = (seat.radius ?? DEFAULT_SEAT_RADIUS) * 2

    if (distance < seatDiameter) {
      return true
    }
  }

  return false
}

function Editor() {
  const [activeTool, setActiveTool] = useState(TOOL_SEAT)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [seats, setSeats] = useState([])
  const [texts, setTexts] = useState([]) 
  const [textPrompt, setTextPrompt] = useState(null)

  const handleWorldClick = useCallback(
    (worldPoint) => {
      if (activeTool === TOOL_SELECT) {
        setSelectedSeatIds([])
        return
      }

      if (activeTool === TOOL_TEXT) {
         setTextPrompt({ x: worldPoint.x, y: worldPoint.y })
         return
        }

      if (activeTool !== TOOL_SEAT) {
        return
      }

      setSeats((currentSeats) => {
        if (isOverlapping(worldPoint.x, worldPoint.y, currentSeats)) {
          return currentSeats
        }

        return [
          ...currentSeats,
          {
            id: createSeatId(),
            x: worldPoint.x,
            y: worldPoint.y,
            radius: DEFAULT_SEAT_RADIUS,
            fill: DEFAULT_SEAT_FILL,
            stroke: DEFAULT_SEAT_STROKE,
          },
        ]
      })
    },
    [activeTool],
  )

  const handleTextSubmit = (content) => {
     if (content.trim() && textPrompt) {
      setTexts((currentTexts) => [
        ...currentTexts,
        {
          id: createSeatId(),
          x: textPrompt.x,
          y: textPrompt.y,
          content: content.trim(),
         },
      ])
    }
     setTextPrompt(null)
  }

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

    setSeats((currentSeats) => {
      const seatById = new Map(currentSeats.map((seat) => [seat.id, seat]))
      const movedSeatIds = new Set(seatUpdates.map((update) => update.id))
      const staticSeats = currentSeats.filter((seat) => !movedSeatIds.has(seat.id))
      const acceptedMovedSeats = new Map()

      seatUpdates.forEach((update) => {
        const currentSeat = seatById.get(update.id)
        if (!currentSeat) {
          return
        }

        const seatsToCheck = [...staticSeats, ...acceptedMovedSeats.values()]
        if (isOverlapping(update.x, update.y, seatsToCheck)) {
          return
        }

        acceptedMovedSeats.set(update.id, {
          ...currentSeat,
          x: update.x,
          y: update.y,
        })
      })

      return currentSeats.map((seat) => acceptedMovedSeats.get(seat.id) ?? seat)
    })
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

      const isClickedSeatSelected = selectedSeatIds.includes(seatId)

      if (isClickedSeatSelected) {
        const selectedSeatIdSet = new Set(selectedSeatIds)
        setSeats((currentSeats) =>
          currentSeats.filter((seat) => !selectedSeatIdSet.has(seat.id)),
        )
        setSelectedSeatIds([])
        return
      }

      setSeats((currentSeats) => currentSeats.filter((seat) => seat.id !== seatId))
    },
    [activeTool, selectedSeatIds],
  )

  const handleRowCommit = useCallback(
    (rowPoints) => {
      if (activeTool !== TOOL_ROW || rowPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => {
        const nextSeats = [...currentSeats]

        rowPoints.forEach((point) => {
          if (isOverlapping(point.x, point.y, nextSeats)) {
            return
          }

          nextSeats.push({
            id: createSeatId(),
            x: point.x,
            y: point.y,
            radius: DEFAULT_SEAT_RADIUS,
            fill: DEFAULT_SEAT_FILL,
            stroke: DEFAULT_SEAT_STROKE,
          })
        })

        return nextSeats
      })
    },
    [activeTool],
  )

  const handleArcCommit = useCallback(
    (arcPoints) => {
      if (activeTool !== TOOL_ARC || arcPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => {
        const nextSeats = [...currentSeats]

        arcPoints.forEach((point) => {
          if (isOverlapping(point.x, point.y, nextSeats)) {
            return
          }

          nextSeats.push({
            id: createSeatId(),
            x: point.x,
            y: point.y,
            radius: DEFAULT_SEAT_RADIUS,
            fill: DEFAULT_SEAT_FILL,
            stroke: DEFAULT_SEAT_STROKE,
          })
        })

        return nextSeats
      })
    },
    [activeTool],
  )

  return (
    <section className="relative flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="min-w-0 flex-1">
        <EditorCanvas
          activeTool={activeTool}
          seats={seats}
          texts={texts}
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

      {/*  New Text Input Dialog  */}
     {textPrompt && (
       <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#00000066]">
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#11161c] p-5 shadow-2xl">
            <h3 className="text-sm font-medium text-[#c9d6ea]">Add Label</h3>
            <input
              autoFocus
              type="text"
              placeholder="Enter text..."
              className="rounded border border-white/10 bg-[#0e1319] px-3 py-2 text-white outline-none focus:border-[#587cb3]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit(e.currentTarget.value)
                if (e.key === 'Escape') setTextPrompt(null)
              }}
            />
            <div className="mt-2 flex justify-end gap-2 text-sm">
              <button onClick={() => setTextPrompt(null)} className="px-3 py-1 text-[#c9d6ea] hover:text-white">Cancel</button>
              <button 
                onClick={(e) => handleTextSubmit(e.currentTarget.parentElement.previousElementSibling.value)} 
                className="rounded bg-[#587cb3] px-3 py-1 text-white hover:bg-[#688cc3]"
              >
                Add
            </button>
            </div>
          </div>
        </div>
       )}
    </section>
  )
}

export default Editor
