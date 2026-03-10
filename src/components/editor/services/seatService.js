import { ELEMENT_TYPES } from "../domain/elementTypes";

export const DEFAULT_SEAT_RADIUS = 12;
export const DEFAULT_SEAT_FILL = "#5fa7ff";
export const DEFAULT_SEAT_STROKE = "#cfe4ff";

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
    return {
        id: createId(ELEMENT_TYPES.SEAT),
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
