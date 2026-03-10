// Backward-compatible re-exports.
// Calculation logic lives in editor/services.

export {
    DEFAULT_SEAT_RADIUS,
    DEFAULT_SEAT_FILL,
    DEFAULT_SEAT_STROKE,
    createId,
    generateSeat,
    createSeat,
} from "../../services/seatService";

export {
    SMART_ROW_ANGLE_TOLERANCE,
    SMART_ROW_MIN_DISTANCE_SQUARED,
} from "../../services/rowService";

export {
    COLLISION_INDEX_CELL_SIZE,
    calculateSeatSpacing,
    areCirclesOverlapping,
    isOverlapping,
    addSeatToCollisionIndex,
    buildCollisionIndex,
    getNearbySeatsFromCollisionIndex,
    isOverlappingWithCollisionIndex,
    getMaxSeatRadius,
    appendNonOverlappingSeats,
    deriveNextRowIndexFromSeats,
} from "../../services/layoutService";
