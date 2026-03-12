import { generateLayoutId } from "../../../utils/layoutIdGenerator";
import { generateSeatId } from "../../../utils/seatIdGenerator";

export const DEFAULT_SEAT_RADIUS = 12;
export const DEFAULT_SEAT_FILL = "#5fa7ff";
export const DEFAULT_SEAT_STROKE = "#cfe4ff";
export const layoutId = generateLayoutId();

const generatedSeatIds = new Set();

function buildGeneratedSeatSnapshot() {
    return Array.from(generatedSeatIds, (id) => ({ id }));
}

function reserveSeatId(existingSeats = []) {
    const sourceSeats =
        Array.isArray(existingSeats) && existingSeats.length > 0
            ? existingSeats
            : buildGeneratedSeatSnapshot();
    const nextSeatId = generateSeatId(sourceSeats, layoutId);
    generatedSeatIds.add(nextSeatId);
    return nextSeatId;
}

export function createId(prefix = "item") {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateSeat(point, options = {}) {
    const nextSeatId = reserveSeatId(options.seats);
    return {
        id: nextSeatId,
        seatId: nextSeatId,
        layoutId,
        x: point.x,
        y: point.y,
        radius: DEFAULT_SEAT_RADIUS, // Keep for backward compatibility (half of square size)
        size: options.size || DEFAULT_SEAT_RADIUS * 2, // Square size (width/height)
        fill: DEFAULT_SEAT_FILL,
        stroke: DEFAULT_SEAT_STROKE,
        row: options.row || null,
        number: options.number || null,
        label: options.label || null,
        category: options.category || null,
        status: options.status || "available", // available, reserved, sold, locked
        price: options.price || null,
    };
}

export const createSeat = generateSeat;
