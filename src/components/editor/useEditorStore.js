import { create } from 'zustand'
import { TOOL_SEAT, TOOL_SELECT, TOOL_ERASER, TOOL_ROW, TOOL_ARC, TOOL_TEXT } from './editorConstants'

const DEFAULT_SEAT_RADIUS = 12
const DEFAULT_SEAT_FILL = '#5fa7ff'
const DEFAULT_SEAT_STROKE = '#cfe4ff'

const SMART_ROW_ANGLE_TOLERANCE = 5
const SMART_ROW_MIN_DISTANCE_SQUARED = 0.0001
const COLLISION_INDEX_CELL_SIZE = DEFAULT_SEAT_RADIUS * 4

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createId(prefix = 'item') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function areCirclesOverlapping(x1, y1, radius1, x2, y2, radius2) {
    const deltaX = x1 - x2
    const deltaY = y1 - y2
    const minDistance = radius1 + radius2
    return deltaX * deltaX + deltaY * deltaY < minDistance * minDistance
}

function isOverlapping(x, y, seats, newRadius = DEFAULT_SEAT_RADIUS) {
    for (const seat of seats) {
        if (areCirclesOverlapping(x, y, newRadius, seat.x, seat.y, seat.radius ?? DEFAULT_SEAT_RADIUS)) {
            return true
        }
    }
    return false
}

function buildLineRangeSeatIds(anchorSeat, targetSeat, seats) {
    const dx1 = targetSeat.x - anchorSeat.x
    const dy1 = targetSeat.y - anchorSeat.y
    const lengthSquared = dx1 * dx1 + dy1 * dy1

    if (lengthSquared === 0) return [anchorSeat.id]

    const lineLength = Math.sqrt(lengthSquared)
    const selectedIds = []

    for (const seat of seats) {
        const dx2 = seat.x - anchorSeat.x
        const dy2 = seat.y - anchorSeat.y
        const area = Math.abs(dx1 * dy2 - dx2 * dy1)
        const distance = area / lineLength
        const tolerance = seat.radius ?? DEFAULT_SEAT_RADIUS

        if (distance > tolerance) continue

        const dot = dx2 * dx1 + dy2 * dy1
        if (dot < 0 || dot > lengthSquared) continue

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
    } else {
        collisionIndex.set(cellKey, [seat])
    }
}

function buildCollisionIndex(seats, cellSize) {
    const collisionIndex = new Map()
    seats.forEach((seat) => addSeatToCollisionIndex(collisionIndex, seat, cellSize))
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
            if (seatsInCell) nearbySeats.push(...seatsInCell)
        }
    }

    return nearbySeats
}

function isOverlappingWithCollisionIndex(x, y, newRadius, collisionIndex, cellSize, maxSeatRadius) {
    const nearbySeats = getNearbySeatsFromCollisionIndex(
        collisionIndex, x, y, newRadius + maxSeatRadius, cellSize
    )

    for (const seat of nearbySeats) {
        if (areCirclesOverlapping(x, y, newRadius, seat.x, seat.y, seat.radius ?? DEFAULT_SEAT_RADIUS)) {
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
        id: createId('seat'),
        x: point.x,
        y: point.y,
        radius: DEFAULT_SEAT_RADIUS,
        fill: DEFAULT_SEAT_FILL,
        stroke: DEFAULT_SEAT_STROKE,
    }
}

function appendNonOverlappingSeats(currentSeats, candidatePoints) {
    if (candidatePoints.length === 0) return currentSeats

    const nextSeats = [...currentSeats]
    const collisionIndex = buildCollisionIndex(nextSeats, COLLISION_INDEX_CELL_SIZE)
    let maxSeatRadius = getMaxSeatRadius(nextSeats)
    let addedSeatCount = 0

    candidatePoints.forEach((point) => {
        if (
            isOverlappingWithCollisionIndex(
                point.x, point.y, DEFAULT_SEAT_RADIUS, collisionIndex, COLLISION_INDEX_CELL_SIZE, maxSeatRadius
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

    if (addedSeatCount === 0) return currentSeats
    return nextSeats
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useEditorStore = create((set, get) => ({
    // State
    activeTool: TOOL_SEAT,
    seats: [],
    texts: [],
    selectedSeatIds: [],
    selectedTextIds: [],
    
    // Actions
    setActiveTool: (tool) => set((state) => {
      if (state.activeTool !== tool) {
      return { 
        activeTool: tool, 
        selectedSeatIds: [], 
        selectedTextIds: [] 
      }
    }
    return state
  }),

    updateText: (textId, updates) => set((state) => ({
    texts: state.texts.map(t => t.id === textId ? { ...t, ...updates } : t)
    })),
    
    clearSelection: () => set({ selectedSeatIds: [], selectedTextIds: [] }),

    handleWorldClick: (worldPoint) => set((state) => {
        if (state.activeTool === TOOL_SELECT) {
            return { selectedSeatIds: [], selectedTextIds: [] }
        }

        if (state.activeTool === TOOL_TEXT) {
            const newTextId = createId('text')
            return {
                texts: [...state.texts, {
                    id: newTextId,
                    x: worldPoint.x,
                    y: worldPoint.y,
                    content: 'Text',
                    fontSize: 20,
                    fill: '#c9d6ea', 
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    scale: 1
                    }],
                    selectedTextIds: [newTextId],
                    selectedSeatIds: []
                    }
                }
        if (state.activeTool === TOOL_SEAT) {
            if (isOverlapping(worldPoint.x, worldPoint.y, state.seats)) return state
            return { seats: [...state.seats, createSeat(worldPoint)] }
        }
        return state
    }),

    submitText: () => set((state) => {
        const trimmedContent = state.textDraft.trim()
        if (trimmedContent && state.textPrompt) {
            return {
                texts: [...state.texts, {
                    id: createId('text'),
                    x: state.textPrompt.x,
                    y: state.textPrompt.y,
                    content: trimmedContent
                }],
                textDraft: '',
                textPrompt: null
            }
        }
        return { textDraft: '', textPrompt: null }
    }),

    selectSeat: (seatId, shiftKey) => set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state

        if (!shiftKey) return { selectedSeatIds: [seatId] }

        if (state.selectedSeatIds.length === 1) {
            const anchorSeatId = state.selectedSeatIds[0]
            const seatById = new Map(state.seats.map(s => [s.id, s]))
            const anchorSeat = seatById.get(anchorSeatId)
            const targetSeat = seatById.get(seatId)

            if (anchorSeat && targetSeat) {
                return { selectedSeatIds: buildLineRangeSeatIds(anchorSeat, targetSeat, state.seats) }
            }
        }

        if (state.selectedSeatIds.includes(seatId)) {
            return { selectedSeatIds: state.selectedSeatIds.filter(id => id !== seatId) }
        }
        return { selectedSeatIds: [...state.selectedSeatIds, seatId] }
    }),

    selectText: (textId, shiftKey) => set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state

        if (!shiftKey) return { selectedTextIds: [textId] }

        if (state.selectedTextIds.includes(textId)) {
            return { selectedTextIds: state.selectedTextIds.filter(id => id !== textId) }
        }
        return { selectedTextIds: [...state.selectedTextIds, textId] }
    }),

    smartRowSelect: (seatId, event) => set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state

        const clickedSeat = state.seats.find(s => s.id === seatId)
        if (!clickedSeat) return state

        const bucketCounts = new Map()
        let dominantBucketKey = null
        let dominantBucketCount = 0

        for (const seat of state.seats) {
            if (seat.id === seatId) continue

            const dx = seat.x - clickedSeat.x
            const dy = seat.y - clickedSeat.y
            const distanceSquared = dx * dx + dy * dy

            if (distanceSquared <= SMART_ROW_MIN_DISTANCE_SQUARED) continue

            let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI)
            if (angleDeg < 0) angleDeg += 180
            else if (angleDeg >= 180) angleDeg -= 180

            const bucketKey = Math.round(angleDeg / SMART_ROW_ANGLE_TOLERANCE) * SMART_ROW_ANGLE_TOLERANCE
            const nextCount = (bucketCounts.get(bucketKey) ?? 0) + 1
            bucketCounts.set(bucketKey, nextCount)

            if (nextCount > dominantBucketCount) {
                dominantBucketCount = nextCount
                dominantBucketKey = bucketKey
            }
        }

        if (dominantBucketKey === null || dominantBucketCount < 2) return state

        const angleRad = dominantBucketKey * (Math.PI / 180)
        const ux = Math.cos(angleRad)
        const uy = Math.sin(angleRad)
        const rowSeats = []

        for (const seat of state.seats) {
            const dx = seat.x - clickedSeat.x
            const dy = seat.y - clickedSeat.y
            const distance = Math.abs(dx * uy - dy * ux)
            const seatRadius = seat.radius ?? DEFAULT_SEAT_RADIUS

            if (distance < seatRadius * 1.2) {
                rowSeats.push({ id: seat.id, projection: dx * ux + dy * uy })
            }
        }

        if (rowSeats.length === 0) return state

        rowSeats.sort((a, b) => a.projection - b.projection)
        const rowSeatIds = rowSeats.map(s => s.id)

        if (event?.evt?.shiftKey || event?.shiftKey) {
            return { selectedSeatIds: [...new Set([...state.selectedSeatIds, ...rowSeatIds])] }
        }
        return { selectedSeatIds: rowSeatIds }
    }),

    marqueeSelect: (seatIds, textIds, shiftKey) => set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state

        if (!shiftKey) {
            return { selectedSeatIds: seatIds, selectedTextIds: textIds }
        }

        const updates = {}
        if (seatIds.length > 0) {
            updates.selectedSeatIds = [...new Set([...state.selectedSeatIds, ...seatIds])]
        }
        if (textIds.length > 0) {
            updates.selectedTextIds = [...new Set([...state.selectedTextIds, ...textIds])]
        }
        return updates
    }),

    moveSeats: (seatUpdates) => set((state) => {
        if (!seatUpdates.length) return state

        const seatById = new Map(state.seats.map(s => [s.id, s]))
        const movedSeatIds = new Set(seatUpdates.map(u => u.id))
        const staticSeats = state.seats.filter(s => !movedSeatIds.has(s.id))
        const acceptedMovedSeats = new Map()
        const collisionIndex = buildCollisionIndex(staticSeats, COLLISION_INDEX_CELL_SIZE)
        const maxSeatRadius = getMaxSeatRadius(state.seats)
        let hasAnyPositionChange = false

        for (const update of seatUpdates) {
            const currentSeat = seatById.get(update.id)
            if (!currentSeat) continue

            const seatRadius = currentSeat.radius ?? DEFAULT_SEAT_RADIUS

            if (isOverlappingWithCollisionIndex(
                update.x, update.y, seatRadius, collisionIndex, COLLISION_INDEX_CELL_SIZE, maxSeatRadius
            )) {
                continue
            }

            const newSeat = { ...currentSeat, x: update.x, y: update.y }
            if (newSeat.x !== currentSeat.x || newSeat.y !== currentSeat.y) {
                hasAnyPositionChange = true
            }

            acceptedMovedSeats.set(update.id, newSeat)
            addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE)
        }

        if (!hasAnyPositionChange || acceptedMovedSeats.size === 0) return state

        return { seats: state.seats.map(s => acceptedMovedSeats.get(s.id) ?? s) }
    }),

    moveTexts: (textUpdates) => set((state) => {
        if (!textUpdates.length) return state
        const updatesById = new Map(textUpdates.map(u => [u.id, u]))

        return {
            texts: state.texts.map(t => {
                const update = updatesById.get(t.id)
                if (!update) return t
                return { ...t, x: update.x, y: update.y }
            })
        }
    }),

    eraseSeat: (seatId) => set((state) => {
        if (state.activeTool !== TOOL_ERASER) return state

        const selectedSet = new Set(state.selectedSeatIds)
        if (selectedSet.has(seatId)) {
            return {
                seats: state.seats.filter(s => !selectedSet.has(s.id)),
                selectedSeatIds: []
            }
        }
        return { seats: state.seats.filter(s => s.id !== seatId) }
    }),

    eraseText: (textId) => set((state) => {
        if (state.activeTool !== TOOL_ERASER) return state

        const selectedSet = new Set(state.selectedTextIds)
        if (selectedSet.has(textId)) {
            return {
                texts: state.texts.filter(t => !selectedSet.has(t.id)),
                selectedTextIds: []
            }
        }
        return { texts: state.texts.filter(t => t.id !== textId) }
    }),

    commitRow: (rowPoints) => set((state) => {
        if (state.activeTool !== TOOL_ROW || rowPoints.length === 0) return state
        return { seats: appendNonOverlappingSeats(state.seats, rowPoints) }
    }),

    commitArc: (arcPoints) => set((state) => {
        if (state.activeTool !== TOOL_ARC || arcPoints.length === 0) return state
        return { seats: appendNonOverlappingSeats(state.seats, arcPoints) }
    })
}))
