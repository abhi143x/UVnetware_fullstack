import { create } from 'zustand'
import { TOOL_SEAT, TOOL_SELECT, TOOL_ERASER, TOOL_ROW, TOOL_ARC, TOOL_TEXT } from '../constants/tools'
import { getRowLetter, generateSeatLabel, assignRowNumbers } from '../utils/seatNumbering'

const STORAGE_KEY = 'uvnetware-layout'

const DEFAULT_CATEGORIES = [
    { id: 'vip', name: 'VIP', color: '#ffd700', price: null },
    { id: 'standard', name: 'Standard', color: '#5fa7ff', price: null },
    { id: 'balcony', name: 'Balcony', color: '#9b59b6', price: null },
]

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { seats: [], texts: [], categories: [], nextRowIndex: 0 }
        const parsed = JSON.parse(raw)
        return {
            seats: Array.isArray(parsed.seats) ? parsed.seats : [],
            texts: Array.isArray(parsed.texts) ? parsed.texts : [],
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            nextRowIndex: typeof parsed.nextRowIndex === 'number' ? parsed.nextRowIndex : 0,
        }
    } catch {
        return { seats: [], texts: [], categories: [], nextRowIndex: 0 }
    }
}

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

// The buildLineRangeSeatIds feature was removed to allow standard Shift-Click multi-selection.

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

function createSeat(point, options = {}) {
    return {
        id: createId('seat'),
        x: point.x,
        y: point.y,
        radius: DEFAULT_SEAT_RADIUS, // Keep for backward compatibility (half of square size)
        size: options.size || (DEFAULT_SEAT_RADIUS * 2), // Square size (width/height)
        fill: DEFAULT_SEAT_FILL,
        stroke: DEFAULT_SEAT_STROKE,
        // Seat management properties
        row: options.row || null,
        number: options.number || null,
        label: options.label || null,
        category: options.category || null,
        status: options.status || 'available', // available, reserved, sold, locked
        price: options.price || null,
    }
}

function appendNonOverlappingSeats(currentSeats, candidatePoints, seatOptions = {}) {
    if (candidatePoints.length === 0) return currentSeats

    const nextSeats = [...currentSeats]
    const collisionIndex = buildCollisionIndex(nextSeats, COLLISION_INDEX_CELL_SIZE)
    let maxSeatRadius = getMaxSeatRadius(nextSeats)
    let addedSeatCount = 0

    candidatePoints.forEach((point, index) => {
        if (
            isOverlappingWithCollisionIndex(
                point.x, point.y, DEFAULT_SEAT_RADIUS, collisionIndex, COLLISION_INDEX_CELL_SIZE, maxSeatRadius
            )
        ) {
            return
        }

        // Merge point-specific options with general options
        const pointOptions = {
            ...seatOptions,
            ...(point.options || {}),
        }
        
        // If row and number are provided, generate label
        if (pointOptions.row && pointOptions.number) {
            pointOptions.label = generateSeatLabel(pointOptions.row, pointOptions.number)
        }

        const newSeat = createSeat(point, pointOptions)
        nextSeats.push(newSeat)
        addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE)
        maxSeatRadius = Math.max(maxSeatRadius, newSeat.radius ?? DEFAULT_SEAT_RADIUS)
        addedSeatCount += 1
    })

    if (addedSeatCount === 0) return currentSeats
    return nextSeats
}

// ─── Template Generators ──────────────────────────────────────────────────────

export function generateSmallTheater() {
    const seats = []
    const texts = []
    const rows = 5
    const seatsPerRow = 12
    const spacing = 32
    const startX = -(seatsPerRow * spacing) / 2
    const startY = -(rows * spacing) / 2

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        for (let s = 0; s < seatsPerRow; s++) {
            seats.push(createSeat(
                { x: startX + s * spacing, y: startY + r * spacing },
                { row: rowLetter, number: s + 1, label: generateSeatLabel(rowLetter, s + 1) }
            ))
        }
    }
    texts.push({
        id: createId('text'), x: 0, y: startY - 40,
        content: 'SCREEN', fontSize: 24, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Small Theater', description: '5 rows × 12 seats — intimate screening room', seatCount: rows * seatsPerRow, nextRowIndex: rows }
}

export function generateMediumHall() {
    const seats = []
    const texts = []
    const rows = 10
    const seatsPerRow = 15
    const spacing = 30
    const startX = -(seatsPerRow * spacing) / 2
    const startY = -(rows * spacing) / 2

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        for (let s = 0; s < seatsPerRow; s++) {
            seats.push(createSeat(
                { x: startX + s * spacing, y: startY + r * spacing },
                { row: rowLetter, number: s + 1, label: generateSeatLabel(rowLetter, s + 1) }
            ))
        }
    }
    texts.push({
        id: createId('text'), x: 0, y: startY - 40,
        content: 'STAGE', fontSize: 28, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Medium Hall', description: '10 rows × 15 seats — standard auditorium', seatCount: rows * seatsPerRow, nextRowIndex: rows }
}

export function generateLargeArena() {
    const seats = []
    const texts = []
    const rows = 15
    const baseSeats = 14
    const spacing = 30
    const centerY = 0
    let rowIndex = 0

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        const seatsInRow = baseSeats + Math.floor(r * 1.5)
        const curveRadius = 200 + r * spacing
        const angleSpan = Math.min(Math.PI * 0.7, (seatsInRow * spacing) / curveRadius)
        const startAngle = Math.PI / 2 - angleSpan / 2

        for (let s = 0; s < seatsInRow; s++) {
            const angle = startAngle + (s / (seatsInRow - 1 || 1)) * angleSpan
            const x = Math.cos(angle) * curveRadius
            const y = centerY + curveRadius - Math.sin(angle) * curveRadius
            seats.push(createSeat(
                { x, y },
                { row: rowLetter, number: s + 1, label: generateSeatLabel(rowLetter, s + 1) }
            ))
        }
        rowIndex++
    }
    texts.push({
        id: createId('text'), x: 0, y: -30,
        content: 'STAGE', fontSize: 32, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Large Arena', description: '15 curved rows — arena-style venue', seatCount: seats.length, nextRowIndex: rowIndex }
}

export function generateConferenceRoom() {
    const seats = []
    const texts = []
    const sections = [
        { label: 'Left Block', offsetX: -160, rows: 4, cols: 4 },
        { label: 'Center Block', offsetX: 0, rows: 4, cols: 8 },
        { label: 'Right Block', offsetX: 160, rows: 4, cols: 4 },
    ]
    const spacing = 30
    let rowIndex = 0

    sections.forEach((section) => {
        const startX = section.offsetX - (section.cols * spacing) / 2
        const startY = -60
        for (let r = 0; r < section.rows; r++) {
            const rowLetter = getRowLetter(rowIndex + r)
            for (let c = 0; c < section.cols; c++) {
                seats.push(createSeat(
                    { x: startX + c * spacing, y: startY + r * spacing },
                    { row: rowLetter, number: c + 1, label: generateSeatLabel(rowLetter, c + 1) }
                ))
            }
        }
        rowIndex += section.rows
        texts.push({
            id: createId('text'), x: section.offsetX, y: startY - 30,
            content: section.label, fontSize: 14, fill: '#587cb3',
            fontWeight: 'normal', fontStyle: 'normal', scale: 1,
        })
    })

    texts.push({
        id: createId('text'), x: 0, y: -120,
        content: 'PODIUM', fontSize: 22, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Conference Room', description: '3 blocks — seminar/conference layout', seatCount: seats.length, nextRowIndex: rowIndex }
}

export function generateAmphitheater() {
    const seats = []
    const texts = []
    const rows = 10
    const spacing = 30
    let rowIndex = 0

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        const radius = 120 + r * spacing
        const seatsInRow = Math.floor(Math.PI * radius / spacing)
        const limitedSeats = Math.min(seatsInRow, 12 + r * 2)
        const angleSpan = Math.PI * 0.85
        const startAngle = (Math.PI - angleSpan) / 2

        for (let s = 0; s < limitedSeats; s++) {
            const angle = startAngle + (s / (limitedSeats - 1 || 1)) * angleSpan
            const x = Math.cos(angle) * radius
            const y = -Math.sin(angle) * radius + radius
            seats.push(createSeat(
                { x, y },
                { row: rowLetter, number: s + 1, label: generateSeatLabel(rowLetter, s + 1) }
            ))
        }
        rowIndex++
    }
    texts.push({
        id: createId('text'), x: 0, y: -30,
        content: 'STAGE', fontSize: 28, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Amphitheater', description: '10 concentric arcs — classic amphitheater', seatCount: seats.length, nextRowIndex: rowIndex }
}

export function generateBus() {
    const seats = []
    const texts = []
    const rows = 10
    const spacing = 30
    const aisleGap = 28
    let rowIndex = 0

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        // Left pair
        seats.push(createSeat(
            { x: -spacing - aisleGap / 2, y: r * spacing },
            { row: rowLetter, number: 1, label: generateSeatLabel(rowLetter, 1) }
        ))
        seats.push(createSeat(
            { x: -aisleGap / 2, y: r * spacing },
            { row: rowLetter, number: 2, label: generateSeatLabel(rowLetter, 2) }
        ))
        // Right pair
        seats.push(createSeat(
            { x: aisleGap / 2, y: r * spacing },
            { row: rowLetter, number: 3, label: generateSeatLabel(rowLetter, 3) }
        ))
        seats.push(createSeat(
            { x: spacing + aisleGap / 2, y: r * spacing },
            { row: rowLetter, number: 4, label: generateSeatLabel(rowLetter, 4) }
        ))
        rowIndex++
    }
    texts.push({
        id: createId('text'), x: 0, y: -40,
        content: 'DRIVER', fontSize: 18, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Bus', description: '2+2 seating — standard bus layout', seatCount: rows * 4, nextRowIndex: rowIndex }
}

export function generateTrain() {
    const seats = []
    const texts = []
    const coaches = 2
    const rowsPerCoach = 7
    const spacing = 30
    const aisleGap = 28
    const coachGap = 60
    let rowIndex = 0

    for (let coach = 0; coach < coaches; coach++) {
        const coachOffset = coach * (rowsPerCoach * spacing + coachGap)
        for (let r = 0; r < rowsPerCoach; r++) {
            const rowLetter = getRowLetter(rowIndex)
            // Left pair
            seats.push(createSeat(
                { x: -spacing - aisleGap / 2, y: coachOffset + r * spacing },
                { row: rowLetter, number: 1, label: generateSeatLabel(rowLetter, 1) }
            ))
            seats.push(createSeat(
                { x: -aisleGap / 2, y: coachOffset + r * spacing },
                { row: rowLetter, number: 2, label: generateSeatLabel(rowLetter, 2) }
            ))
            // Right pair
            seats.push(createSeat(
                { x: aisleGap / 2, y: coachOffset + r * spacing },
                { row: rowLetter, number: 3, label: generateSeatLabel(rowLetter, 3) }
            ))
            seats.push(createSeat(
                { x: spacing + aisleGap / 2, y: coachOffset + r * spacing },
                { row: rowLetter, number: 4, label: generateSeatLabel(rowLetter, 4) }
            ))
            rowIndex++
        }
        texts.push({
            id: createId('text'), x: 0, y: coachOffset - 25,
            content: `Coach ${coach + 1}`, fontSize: 14, fill: '#587cb3',
            fontWeight: 'bold', fontStyle: 'normal', scale: 1,
        })
    }
    return { seats, texts, name: 'Train Coach', description: '2 coaches × 2+2 — railway coach', seatCount: coaches * rowsPerCoach * 4, nextRowIndex: rowIndex }
}

export function generateMovieTheatre() {
    const seats = []
    const texts = []
    const rows = 12
    const aisleGap = 40
    const spacing = 28
    let rowIndex = 0

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r)
        const seatsLeft = 6 + Math.floor(r * 0.3)
        const seatsRight = seatsLeft
        // Left section
        for (let s = 0; s < seatsLeft; s++) {
            seats.push(createSeat(
                { x: -(aisleGap / 2) - (seatsLeft - s) * spacing, y: r * (spacing + 2) },
                { row: rowLetter, number: s + 1, label: generateSeatLabel(rowLetter, s + 1) }
            ))
        }
        // Right section
        for (let s = 0; s < seatsRight; s++) {
            seats.push(createSeat(
                { x: (aisleGap / 2) + s * spacing, y: r * (spacing + 2) },
                { row: rowLetter, number: seatsLeft + s + 1, label: generateSeatLabel(rowLetter, seatsLeft + s + 1) }
            ))
        }
        rowIndex++
    }
    texts.push({
        id: createId('text'), x: 0, y: -50,
        content: 'SCREEN', fontSize: 28, fill: '#7a8a9e',
        fontWeight: 'bold', fontStyle: 'normal', scale: 1,
    })
    return { seats, texts, name: 'Movie Theatre', description: '12 tiered rows with center aisle', seatCount: seats.length, nextRowIndex: rowIndex }
}

export const VENUE_TEMPLATES = [
    { id: 'movie-theatre', name: 'Movie Theatre', description: '12 tiered rows with center aisle', seatCount: '~180', generator: generateMovieTheatre },
    { id: 'small-theater', name: 'Small Theater', description: '5 rows × 12 seats — intimate screening room', seatCount: 60, generator: generateSmallTheater },
    { id: 'bus', name: 'Bus', description: '2+2 seating — standard bus layout', seatCount: 40, generator: generateBus },
    { id: 'train', name: 'Train Coach', description: '2 coaches × 2+2 — railway coach', seatCount: 56, generator: generateTrain },
    { id: 'medium-hall', name: 'Medium Hall', description: '10 rows × 15 seats — standard auditorium', seatCount: 150, generator: generateMediumHall },
    { id: 'large-arena', name: 'Large Arena', description: '15 curved rows — arena-style venue', seatCount: '~300', generator: generateLargeArena },
    { id: 'conference-room', name: 'Conference Room', description: '3 blocks — seminar/conference layout', seatCount: 48, generator: generateConferenceRoom },
    { id: 'amphitheater', name: 'Amphitheater', description: '10 concentric arcs — classic amphitheater', seatCount: '~200', generator: generateAmphitheater },
]

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useEditorStore = create((set, get) => {
    const persisted = loadFromStorage()

    return {
    // State
    activeTool: TOOL_SEAT,
    seats: persisted.seats,
    texts: persisted.texts,
    selectedSeatIds: [],
    selectedTextIds: [],
    textPrompt: null,
    textDraft: '',
    lastSavedAt: persisted.seats.length > 0 || persisted.texts.length > 0 ? Date.now() : null,
    templateVersion: 0,
    
    // Seat management state
    categories: Array.isArray(persisted.categories) && persisted.categories.length > 0
        ? persisted.categories
        : DEFAULT_CATEGORIES,
    nextRowIndex: persisted.nextRowIndex || 0, // Tracks the next row letter to assign

    // Actions
    loadTemplate: (templateData) => set((state) => ({
        seats: templateData.seats || [],
        texts: templateData.texts || [],
        selectedSeatIds: [],
        selectedTextIds: [],
        nextRowIndex: templateData.nextRowIndex || 0,
        templateVersion: state.templateVersion + 1,
    })),

    setActiveTool: (tool) => set((state) => {
        if (state.activeTool !== tool) {
            return {
                activeTool: tool
            }
        }
        return state
    }),

    updateText: (textId, updates) => set((state) => ({
        texts: state.texts.map(t => t.id === textId ? { ...t, ...updates } : t)
    })),

    updateSeat: (seatId, updates) => set((state) => ({
        seats: state.seats.map(s => {
            if (s.id === seatId) {
                const updated = { ...s, ...updates }
                // Auto-generate label if row and number are set
                if (updated.row && updated.number && !updates.label) {
                    updated.label = generateSeatLabel(updated.row, updated.number)
                }
                return updated
            }
            return s
        })
    })),

    updateSeats: (seatIds, updates) => set((state) => ({
        seats: state.seats.map(s => {
            if (seatIds.includes(s.id)) {
                const updated = { ...s, ...updates }
                // Auto-generate label if row and number are set
                if (updated.row && updated.number && !updates.label) {
                    updated.label = generateSeatLabel(updated.row, updated.number)
                }
                return updated
            }
            return s
        })
    })),

    // Category management
    addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: category.id || createId('category') }]
    })),

    updateCategory: (categoryId, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === categoryId ? { ...c, ...updates } : c)
    })),

    removeCategory: (categoryId) => set((state) => ({
        categories: state.categories.filter(c => c.id !== categoryId),
        seats: state.seats.map(s => s.category === categoryId ? { ...s, category: null } : s)
    })),

    // Auto-number all seats
    autoNumberSeats: () => set((state) => {
        const updatedSeats = assignRowNumbers(state.seats, 0)
        // Find the highest row index used
        let maxRowIndex = -1
        updatedSeats.forEach(seat => {
            if (seat.row) {
                // Convert row letter back to index
                const rowChar = seat.row[0]
                const rowIndex = rowChar.charCodeAt(0) - 65
                if (seat.row.length > 1) {
                    // Handle AA, AB, etc.
                    const secondChar = seat.row[1]
                    const secondIndex = secondChar.charCodeAt(0) - 65
                    maxRowIndex = Math.max(maxRowIndex, 26 + (rowIndex * 26) + secondIndex)
                } else {
                    maxRowIndex = Math.max(maxRowIndex, rowIndex)
                }
            }
        })
        return {
            seats: updatedSeats,
            nextRowIndex: maxRowIndex + 1
        }
    }),

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

    selectSeat: (seatId, isMulti) => set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state

        if (!isMulti) return { selectedSeatIds: [seatId] }

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

    rotateSelection: (angle) => set((state) => {

        const selected = state.seats.filter(seat =>
            state.selectedSeatIds.includes(seat.id)
        )

        if (selected.length === 0) return state

        const cx = selected.reduce((sum, s) => sum + s.x, 0) / selected.length
        const cy = selected.reduce((sum, s) => sum + s.y, 0) / selected.length

        const rotatedSeats = state.seats.map((seat) => {

            if (!state.selectedSeatIds.includes(seat.id)) return seat

            const dx = seat.x - cx
            const dy = seat.y - cy

            const rx = dx * Math.cos(angle) - dy * Math.sin(angle)
            const ry = dx * Math.sin(angle) + dy * Math.cos(angle)

            return {
            ...seat,
            x: cx + rx,
            y: cy + ry
            }

        })

  return { seats: rotatedSeats }

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
                // Skip updating this seat's position, it hit something
                acceptedMovedSeats.set(update.id, currentSeat)
                addSeatToCollisionIndex(collisionIndex, currentSeat, COLLISION_INDEX_CELL_SIZE)
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
        
        const currentRowIndex = state.nextRowIndex
        const rowLetter = getRowLetter(currentRowIndex)
        
        // Create seat options for each point in the row
        const seatsWithOptions = rowPoints.map((point, index) => ({
            ...point,
            options: {
                row: rowLetter,
                number: index + 1,
                label: generateSeatLabel(rowLetter, index + 1),
            }
        }))
        
        return {
            seats: appendNonOverlappingSeats(state.seats, seatsWithOptions),
            nextRowIndex: currentRowIndex + 1, // Increment for next row
        }
    }),

    commitArc: (arcPoints) => set((state) => {
        if (state.activeTool !== TOOL_ARC || arcPoints.length === 0) return state
        
        const currentRowIndex = state.nextRowIndex
        const rowLetter = getRowLetter(currentRowIndex)
        
        // Create seat options for each point in the arc
        const seatsWithOptions = arcPoints.map((point, index) => ({
            ...point,
            options: {
                row: rowLetter,
                number: index + 1,
                label: generateSeatLabel(rowLetter, index + 1),
            }
        }))
        
        return {
            seats: appendNonOverlappingSeats(state.seats, seatsWithOptions),
            nextRowIndex: currentRowIndex + 1, // Increment for next row
        }
    }),

    // ─── Persistence Actions ──────────────────────────────────────────────────

    saveLayout: () => {
        const { seats, texts, categories, nextRowIndex } = get()
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ seats, texts, categories, nextRowIndex }))
            set({ lastSavedAt: Date.now() })
            return true
        } catch {
            return false
        }
    },

    exportJSON: () => {
        const { seats, texts, categories, nextRowIndex } = get()
        const data = JSON.stringify({ seats, texts, categories, nextRowIndex }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'layout.json'
        anchor.click()
        URL.revokeObjectURL(url)
    },

    clearLayout: () => {
        localStorage.removeItem(STORAGE_KEY)
        set({
            seats: [],
            texts: [],
            selectedSeatIds: [],
            selectedTextIds: [],
            lastSavedAt: null,
            nextRowIndex: 0,
        })
    },
    }
})
