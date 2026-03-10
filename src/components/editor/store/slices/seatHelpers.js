// ─── Seat & Collision Helpers ─────────────────────────────────────────────────
// Pure functions — no Zustand dependency. Safe to import from any slice.

import { generateSeatLabel } from "../../utils/seatNumbering";

export const DEFAULT_SEAT_RADIUS = 12;
export const DEFAULT_SEAT_FILL = "#5fa7ff";
export const DEFAULT_SEAT_STROKE = "#cfe4ff";

export const SMART_ROW_ANGLE_TOLERANCE = 5;
export const SMART_ROW_MIN_DISTANCE_SQUARED = 0.0001;
export const COLLISION_INDEX_CELL_SIZE = DEFAULT_SEAT_RADIUS * 4;

// ─── ID Generation ────────────────────────────────────────────────────────────

export function createId(prefix = "item") {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Circle Overlap ───────────────────────────────────────────────────────────

export function areCirclesOverlapping(x1, y1, radius1, x2, y2, radius2) {
    const deltaX = x1 - x2;
    const deltaY = y1 - y2;
    const minDistance = radius1 + radius2;
    return deltaX * deltaX + deltaY * deltaY < minDistance * minDistance;
}

export function isOverlapping(x, y, seats, newRadius = DEFAULT_SEAT_RADIUS) {
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
            return true;
        }
    }
    return false;
}

// ─── Collision Index ──────────────────────────────────────────────────────────

function getCollisionCellKey(cellX, cellY) {
    return `${cellX}:${cellY}`;
}

function getCollisionCellCoordinate(value, cellSize) {
    return Math.floor(value / cellSize);
}

export function addSeatToCollisionIndex(collisionIndex, seat, cellSize) {
    const cellX = getCollisionCellCoordinate(seat.x, cellSize);
    const cellY = getCollisionCellCoordinate(seat.y, cellSize);
    const cellKey = getCollisionCellKey(cellX, cellY);
    const seatsInCell = collisionIndex.get(cellKey);

    if (seatsInCell) {
        seatsInCell.push(seat);
    } else {
        collisionIndex.set(cellKey, [seat]);
    }
}

export function buildCollisionIndex(seats, cellSize) {
    const collisionIndex = new Map();
    seats.forEach((seat) =>
        addSeatToCollisionIndex(collisionIndex, seat, cellSize),
    );
    return collisionIndex;
}

export function getNearbySeatsFromCollisionIndex(
    collisionIndex,
    x,
    y,
    searchRadius,
    cellSize,
) {
    const centerCellX = getCollisionCellCoordinate(x, cellSize);
    const centerCellY = getCollisionCellCoordinate(y, cellSize);
    const searchRange = Math.max(1, Math.ceil(searchRadius / cellSize));
    const nearbySeats = [];

    for (let offsetX = -searchRange; offsetX <= searchRange; offsetX += 1) {
        for (let offsetY = -searchRange; offsetY <= searchRange; offsetY += 1) {
            const cellKey = getCollisionCellKey(
                centerCellX + offsetX,
                centerCellY + offsetY,
            );
            const seatsInCell = collisionIndex.get(cellKey);
            if (seatsInCell) nearbySeats.push(...seatsInCell);
        }
    }

    return nearbySeats;
}

export function isOverlappingWithCollisionIndex(
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
    );

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
            return true;
        }
    }
    return false;
}

export function getMaxSeatRadius(seats) {
    return seats.reduce(
        (maxRadius, seat) =>
            Math.max(maxRadius, seat.radius ?? DEFAULT_SEAT_RADIUS),
        DEFAULT_SEAT_RADIUS,
    );
}

// ─── Seat Factory ─────────────────────────────────────────────────────────────

export function createSeat(point, options = {}) {
    return {
        id: createId("seat"),
        x: point.x,
        y: point.y,
        radius: DEFAULT_SEAT_RADIUS, // Keep for backward compatibility (half of square size)
        size: options.size || DEFAULT_SEAT_RADIUS * 2, // Square size (width/height)
        fill: DEFAULT_SEAT_FILL,
        stroke: DEFAULT_SEAT_STROKE,
        // Seat management properties
        row: options.row || null,
        number: options.number || null,
        label: options.label || null,
        category: options.category || null,
        status: options.status || "available", // available, reserved, sold, locked
        price: options.price || null,
    };
}

// ─── Batch Seat Append ────────────────────────────────────────────────────────

export function appendNonOverlappingSeats(
    currentSeats,
    candidatePoints,
    seatOptions = {},
) {
    if (candidatePoints.length === 0) return currentSeats;

    const nextSeats = [...currentSeats];
    const collisionIndex = buildCollisionIndex(
        nextSeats,
        COLLISION_INDEX_CELL_SIZE,
    );
    let maxSeatRadius = getMaxSeatRadius(nextSeats);
    let addedSeatCount = 0;

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
            return;
        }

        // Merge point-specific options with general options
        const pointOptions = {
            ...seatOptions,
            ...(point.options || {}),
        };

        // If row and number are provided, generate label
        if (pointOptions.row && pointOptions.number) {
            pointOptions.label = generateSeatLabel(
                pointOptions.row,
                pointOptions.number,
            );
        }

        const newSeat = createSeat(point, pointOptions);
        nextSeats.push(newSeat);
        addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE);
        maxSeatRadius = Math.max(
            maxSeatRadius,
            newSeat.radius ?? DEFAULT_SEAT_RADIUS,
        );
        addedSeatCount += 1;
    });

    if (addedSeatCount === 0) return currentSeats;
    return nextSeats;
}
