import { useCallback, useState } from 'react'
import EditorCanvas from './EditorCanvas'
import Toolbar from './Toolbar'
import {
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_ROW,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_TEXT,
} from './editorConstants'

const DEFAULT_SEAT_RADIUS = 12
const DEFAULT_SEAT_FILL = '#5fa7ff'
const DEFAULT_SEAT_STROKE = '#cfe4ff'

const SMART_ROW_ANGLE_TOLERANCE = 5
const SMART_ROW_MIN_DISTANCE_SQUARED = 0.0001
const COLLISION_INDEX_CELL_SIZE = DEFAULT_SEAT_RADIUS * 4

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createSeatId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `seat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Returns true if a new seat at (x, y) overlaps any existing seat.
 * Uses sum-of-radii for correct circle-circle collision — works even if
 * seats have different sizes in the future.
 *
 * @param {number} x        New seat X position
 * @param {number} y        New seat Y position
 * @param {Array}  seats    Existing seats to check against
 * @param {number} newRadius Radius of the new seat (defaults to DEFAULT_SEAT_RADIUS)
 */
function areCirclesOverlapping(x1, y1, radius1, x2, y2, radius2) {
  const deltaX = x1 - x2
  const deltaY = y1 - y2
  const minDistance = radius1 + radius2

  return deltaX * deltaX + deltaY * deltaY < minDistance * minDistance
}

function isOverlapping(x, y, seats, newRadius = DEFAULT_SEAT_RADIUS) {
  for (const seat of seats) {
    if (
      areCirclesOverlapping(
        x,
        y,
        newRadius,
        seat.x,
        seat.y,
        seat.radius ?? DEFAULT_SEAT_RADIUS,
      )
    ) {
      return true
    }
  }

  return false
}

/**
 * Selects all seat IDs that lie along the line segment between anchorSeat and targetSeat.
 * Uses perpendicular distance from the line + dot-product projection to stay within bounds.
 */
function buildLineRangeSeatIds(anchorSeat, targetSeat, seats) {
  const dx1 = targetSeat.x - anchorSeat.x
  const dy1 = targetSeat.y - anchorSeat.y
  const lengthSquared = dx1 * dx1 + dy1 * dy1

  if (lengthSquared === 0) {
    return [anchorSeat.id]
  }

  const lineLength = Math.sqrt(lengthSquared)
  const selectedIds = []

  for (const seat of seats) {
    const dx2 = seat.x - anchorSeat.x
    const dy2 = seat.y - anchorSeat.y
    const area = Math.abs(dx1 * dy2 - dx2 * dy1)
    const distance = area / lineLength
    const tolerance = seat.radius ?? DEFAULT_SEAT_RADIUS

    if (distance > tolerance) {
      continue
    }

    const dot = dx2 * dx1 + dy2 * dy1
    if (dot < 0 || dot > lengthSquared) {
      continue
    }

    selectedIds.push(seat.id)
  }

  return selectedIds
}

function getCollisionCellKey(cellX, cellY) {
  return `${cellX}:${cellY}`
}

function getCollisionCellCoordinate(value, cellSize) {
  return Math.floor(value / cellSize)
}

function addSeatToCollisionIndex(collisionIndex, seat, cellSize) {
  const cellX = getCollisionCellCoordinate(seat.x, cellSize)
  const cellY = getCollisionCellCoordinate(seat.y, cellSize)
  const cellKey = getCollisionCellKey(cellX, cellY)
  const seatsInCell = collisionIndex.get(cellKey)

  if (seatsInCell) {
    seatsInCell.push(seat)
    return
  }

  collisionIndex.set(cellKey, [seat])
}

function buildCollisionIndex(seats, cellSize) {
  const collisionIndex = new Map()

  seats.forEach((seat) => {
    addSeatToCollisionIndex(collisionIndex, seat, cellSize)
  })

  return collisionIndex
}

function getNearbySeatsFromCollisionIndex(collisionIndex, x, y, searchRadius, cellSize) {
  const centerCellX = getCollisionCellCoordinate(x, cellSize)
  const centerCellY = getCollisionCellCoordinate(y, cellSize)
  const searchRange = Math.max(1, Math.ceil(searchRadius / cellSize))
  const nearbySeats = []

  for (let offsetX = -searchRange; offsetX <= searchRange; offsetX += 1) {
    for (let offsetY = -searchRange; offsetY <= searchRange; offsetY += 1) {
      const cellKey = getCollisionCellKey(centerCellX + offsetX, centerCellY + offsetY)
      const seatsInCell = collisionIndex.get(cellKey)

      if (!seatsInCell) {
        continue
      }

      nearbySeats.push(...seatsInCell)
    }
  }

  return nearbySeats
}

function isOverlappingWithCollisionIndex(
  x,
  y,
  newRadius,
  collisionIndex,
  cellSize,
  maxSeatRadius,
) {
  const nearbySeats = getNearbySeatsFromCollisionIndex(
    collisionIndex,
    x,
    y,
    newRadius + maxSeatRadius,
    cellSize,
  )

  for (const seat of nearbySeats) {
    if (
      areCirclesOverlapping(
        x,
        y,
        newRadius,
        seat.x,
        seat.y,
        seat.radius ?? DEFAULT_SEAT_RADIUS,
      )
    ) {
      return true
    }
  }

  return false
}

function getMaxSeatRadius(seats) {
  return seats.reduce(
    (maxRadius, seat) => Math.max(maxRadius, seat.radius ?? DEFAULT_SEAT_RADIUS),
    DEFAULT_SEAT_RADIUS,
  )
}

function createSeat(point) {
  return {
    id: createSeatId(),
    x: point.x,
    y: point.y,
    radius: DEFAULT_SEAT_RADIUS,
    fill: DEFAULT_SEAT_FILL,
    stroke: DEFAULT_SEAT_STROKE,
  }
}

function appendNonOverlappingSeats(currentSeats, candidatePoints) {
  if (candidatePoints.length === 0) {
    return currentSeats
  }

  const nextSeats = [...currentSeats]
  const collisionIndex = buildCollisionIndex(nextSeats, COLLISION_INDEX_CELL_SIZE)
  let maxSeatRadius = getMaxSeatRadius(nextSeats)
  let addedSeatCount = 0

  candidatePoints.forEach((point) => {
    if (
      isOverlappingWithCollisionIndex(
        point.x,
        point.y,
        DEFAULT_SEAT_RADIUS,
        collisionIndex,
        COLLISION_INDEX_CELL_SIZE,
        maxSeatRadius,
      )
    ) {
      return
    }

    const newSeat = createSeat(point)
    nextSeats.push(newSeat)
    addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE)
    maxSeatRadius = Math.max(maxSeatRadius, newSeat.radius ?? DEFAULT_SEAT_RADIUS)
    addedSeatCount += 1
  })

  if (addedSeatCount === 0) {
    return currentSeats
  }

  return nextSeats
}

// ─── Component ────────────────────────────────────────────────────────────────

function Editor() {
  const [activeTool, setActiveTool] = useState(TOOL_SEAT)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [selectedTextIds, setSelectedTextIds] = useState([])
  const [seats, setSeats] = useState([])
  const [texts, setTexts] = useState([])
  const [textPrompt, setTextPrompt] = useState(null)
  const [textDraft, setTextDraft] = useState('')

  // ── World / canvas click (place a seat) ───────────────────────────────────

  const handleWorldClick = useCallback(
    (worldPoint) => {
      if (activeTool === TOOL_SELECT) {
        setSelectedSeatIds([])
        setSelectedTextIds([])
        return
      }

      if (activeTool === TOOL_TEXT) {
        setTextPrompt({ x: worldPoint.x, y: worldPoint.y })
        setTextDraft('')
        return
      }

      if (activeTool !== TOOL_SEAT) {
        return
      }

      setSeats((currentSeats) => {
        if (isOverlapping(worldPoint.x, worldPoint.y, currentSeats)) {
          return currentSeats
        }

        return [...currentSeats, createSeat(worldPoint)]
      })
    },
    [activeTool],
  )

  const handleTextSubmit = useCallback(
    (content) => {
      const trimmedContent = content.trim()

      if (trimmedContent && textPrompt) {
        setTexts((currentTexts) => [
          ...currentTexts,
          {
            id: createSeatId(),
            x: textPrompt.x,
            y: textPrompt.y,
            content: trimmedContent,
          },
        ])
      }

      setTextDraft('')
      setTextPrompt(null)
    },
    [textPrompt],
  )

  // ── Seat selection (click / shift+click line range) ───────────────────────

  const handleSeatSelect = useCallback(
    (seatId, shiftKey) => {
      if (activeTool !== TOOL_SELECT) {
        return
      }

      setSelectedSeatIds((currentSelectedSeatIds) => {
        if (!shiftKey) {
          return [seatId]
        }

        if (currentSelectedSeatIds.length === 1) {
          const anchorSeatId = currentSelectedSeatIds[0]
          const seatById = new Map(seats.map((seat) => [seat.id, seat]))
          const anchorSeat = seatById.get(anchorSeatId)
          const targetSeat = seatById.get(seatId)

          if (anchorSeat && targetSeat) {
            return buildLineRangeSeatIds(anchorSeat, targetSeat, seats)
          }
        }

        const isAlreadySelected = currentSelectedSeatIds.includes(seatId)
        if (isAlreadySelected) {
          return currentSelectedSeatIds.filter((id) => id !== seatId)
        }

        return [...currentSelectedSeatIds, seatId]
      })
    },
    [activeTool, seats],
  )

  const handleTextSelect = useCallback(
    (textId, shiftKey) => {
      if (activeTool !== TOOL_SELECT) {
        return
      }

      setSelectedTextIds((currentSelectedTextIds) => {
        if (!shiftKey) {
          return [textId]
        }

        const isAlreadySelected = currentSelectedTextIds.includes(textId)
        if (isAlreadySelected) {
          return currentSelectedTextIds.filter((id) => id !== textId)
        }

        return [...currentSelectedTextIds, textId]
      })
    },
    [activeTool],
  )

  // ── Smart row select (double-click) ───────────────────────────────────────

  const handleSmartRowSelect = useCallback(
    (seatId, event) => {
      if (activeTool !== TOOL_SELECT) {
        return
      }

      const clickedSeat = seats.find((seat) => seat.id === seatId)
      if (!clickedSeat) {
        return
      }

      // Bucket all neighbor angles into 5° bins to find the dominant alignment.
      // Math.atan2 always returns (-π, π], so we fold into [0°, 180°) to make
      // the axis direction-agnostic.
      const bucketCounts = new Map()
      let dominantBucketKey = null
      let dominantBucketCount = 0

      for (const seat of seats) {
        if (seat.id === seatId) {
          continue
        }

        const dx = seat.x - clickedSeat.x
        const dy = seat.y - clickedSeat.y
        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared <= SMART_ROW_MIN_DISTANCE_SQUARED) {
          continue
        }

        // atan2 returns (-180°, 180°]. Fold into [0°, 180°).
        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)

        if (angleDeg < 0) {
          angleDeg += 180
        } else if (angleDeg >= 180) {
          angleDeg -= 180
        }

        const bucketKey =
          Math.round(angleDeg / SMART_ROW_ANGLE_TOLERANCE) * SMART_ROW_ANGLE_TOLERANCE
        const nextCount = (bucketCounts.get(bucketKey) ?? 0) + 1
        bucketCounts.set(bucketKey, nextCount)

        if (nextCount > dominantBucketCount) {
          dominantBucketCount = nextCount
          dominantBucketKey = bucketKey
        }
      }

      if (dominantBucketKey === null || dominantBucketCount < 2) {
        return
      }

      const angleRad = dominantBucketKey * (Math.PI / 180)
      const ux = Math.cos(angleRad)
      const uy = Math.sin(angleRad)
      const rowSeats = []

      for (const seat of seats) {
        const dx = seat.x - clickedSeat.x
        const dy = seat.y - clickedSeat.y
        const distance = Math.abs(dx * uy - dy * ux)
        const seatRadius = seat.radius ?? DEFAULT_SEAT_RADIUS

        if (distance < seatRadius * 1.2) {
          rowSeats.push({
            id: seat.id,
            projection: dx * ux + dy * uy,
          })
        }
      }

      if (rowSeats.length === 0) {
        return
      }

      rowSeats.sort((leftSeat, rightSeat) => leftSeat.projection - rightSeat.projection)
      const rowSeatIds = rowSeats.map((seat) => seat.id)

      if (event.evt.shiftKey) {
        setSelectedSeatIds((currentSelectedSeatIds) => [
          ...new Set([...currentSelectedSeatIds, ...rowSeatIds]),
        ])
        return
      }

      setSelectedSeatIds(rowSeatIds)
    },
    [activeTool, seats],
  )

  // ── Seat move (drag selected seats with collision detection) ──────────────

  const handleSeatsMove = useCallback((seatUpdates) => {
    if (!seatUpdates.length) {
      return
    }

    setSeats((currentSeats) => {
      const seatById = new Map(currentSeats.map((seat) => [seat.id, seat]))
      const movedSeatIds = new Set(seatUpdates.map((update) => update.id))
      const staticSeats = currentSeats.filter((seat) => !movedSeatIds.has(seat.id))
      const acceptedMovedSeats = new Map()
      const collisionIndex = buildCollisionIndex(staticSeats, COLLISION_INDEX_CELL_SIZE)
      const maxSeatRadius = getMaxSeatRadius(currentSeats)
      let hasAnyPositionChange = false

      for (const update of seatUpdates) {
        const currentSeat = seatById.get(update.id)
        if (!currentSeat) {
          continue
        }

        const seatRadius = currentSeat.radius ?? DEFAULT_SEAT_RADIUS

        if (
          isOverlappingWithCollisionIndex(
            update.x,
            update.y,
            seatRadius,
            collisionIndex,
            COLLISION_INDEX_CELL_SIZE,
            maxSeatRadius,
          )
        ) {
          continue
        }

        const newSeat = {
          ...currentSeat,
          x: update.x,
          y: update.y,
        }

        if (newSeat.x !== currentSeat.x || newSeat.y !== currentSeat.y) {
          hasAnyPositionChange = true
        }

        acceptedMovedSeats.set(update.id, newSeat)
        addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE)
      }

      if (!hasAnyPositionChange || acceptedMovedSeats.size === 0) {
        return currentSeats
      }

      return currentSeats.map((seat) => acceptedMovedSeats.get(seat.id) ?? seat)
    })
  }, [])

  const handleTextsMove = useCallback((textUpdates) => {
    if (!textUpdates.length) {
      return
    }

    setTexts((currentTexts) => {
      const updatesById = new Map(textUpdates.map((textUpdate) => [textUpdate.id, textUpdate]))

      return currentTexts.map((textItem) => {
        const textUpdate = updatesById.get(textItem.id)
        if (!textUpdate) {
          return textItem
        }

        return {
          ...textItem,
          x: textUpdate.x,
          y: textUpdate.y,
        }
      })
    })
  }, [])

  // ── Marquee selection ─────────────────────────────────────────────────────

  const handleMarqueeSelect = useCallback(
    (seatIds, textIds, shiftKey) => {
      if (activeTool !== TOOL_SELECT) {
        return
      }

      if (!shiftKey) {
        setSelectedSeatIds(seatIds)
        setSelectedTextIds(textIds)
        return
      }

      if (seatIds.length > 0) {
        setSelectedSeatIds((currentSelectedSeatIds) => [
          ...new Set([...currentSelectedSeatIds, ...seatIds]),
        ])
      }

      if (textIds.length > 0) {
        setSelectedTextIds((currentSelectedTextIds) => [
          ...new Set([...currentSelectedTextIds, ...textIds]),
        ])
      }
    },
    [activeTool],
  )

  // ── Erase ─────────────────────────────────────────────────────────────────

  const handleSeatErase = useCallback(
    (seatId) => {
      if (activeTool !== TOOL_ERASER) {
        return
      }

      const selectedSeatIdSet = new Set(selectedSeatIds)
      const isClickedSeatSelected = selectedSeatIdSet.has(seatId)

      if (isClickedSeatSelected) {
        // Erase the entire selection at once
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

  const handleTextErase = useCallback(
    (textId) => {
      if (activeTool !== TOOL_ERASER) {
        return
      }

      const selectedTextIdSet = new Set(selectedTextIds)
      const isClickedTextSelected = selectedTextIdSet.has(textId)

      if (isClickedTextSelected) {
        setTexts((currentTexts) =>
          currentTexts.filter((textItem) => !selectedTextIdSet.has(textItem.id)),
        )
        setSelectedTextIds([])
        return
      }

      setTexts((currentTexts) => currentTexts.filter((textItem) => textItem.id !== textId))
    },
    [activeTool, selectedTextIds],
  )

  // ── Row commit ───────────────────────────────────────────────────────────

  const handleRowCommit = useCallback(
    (rowPoints) => {
      if (activeTool !== TOOL_ROW || rowPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => appendNonOverlappingSeats(currentSeats, rowPoints))
    },
    [activeTool],
  )

  // ── Arc commit ────────────────────────────────────────────────────────────

  const handleArcCommit = useCallback(
    (arcPoints) => {
      if (activeTool !== TOOL_ARC || arcPoints.length === 0) {
        return
      }

      setSeats((currentSeats) => appendNonOverlappingSeats(currentSeats, arcPoints))
    },
    [activeTool],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="relative flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="min-w-0 flex-1">
        <EditorCanvas
          activeTool={activeTool}
          seats={seats}
          texts={texts}
          selectedSeatIds={selectedSeatIds}
          selectedTextIds={selectedTextIds}
          onWorldClick={handleWorldClick}
          onSeatSelect={handleSeatSelect}
          onTextSelect={handleTextSelect}
          onSmartRowSelect={handleSmartRowSelect}
          onSeatsMove={handleSeatsMove}
          onTextsMove={handleTextsMove}
          onMarqueeSelect={handleMarqueeSelect}
          onSeatErase={handleSeatErase}
          onTextErase={handleTextErase}
          onRowCommit={handleRowCommit}
          onArcCommit={handleArcCommit}
        />
      </div>

      {textPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#00000066]">
          <div className="flex w-[320px] flex-col gap-3 rounded-xl border border-white/10 bg-[#11161c] p-5 shadow-2xl">
            <h3 className="text-sm font-medium text-[#c9d6ea]">Add Label</h3>
            <input
              autoFocus
              type="text"
              value={textDraft}
              placeholder="Enter text..."
              className="rounded border border-white/10 bg-[#0e1319] px-3 py-2 text-white outline-none focus:border-[#587cb3]"
              onChange={(event) => setTextDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleTextSubmit(textDraft)
                }

                if (event.key === 'Escape') {
                  setTextDraft('')
                  setTextPrompt(null)
                }
              }}
            />
            <div className="mt-2 flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setTextDraft('')
                  setTextPrompt(null)
                }}
                className="px-3 py-1 text-[#c9d6ea] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTextSubmit(textDraft)}
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
