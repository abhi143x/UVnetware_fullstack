import { generateLayoutId } from "../../../utils/layoutIdGenerator";
import { generateSeatId } from "../../../utils/seatIdGenerator";
import { ELEMENT_TYPES } from "../domain/elementTypes";
import { SEAT_TYPES, SEAT_TYPE_CONFIG } from "../constants/seatTypes";

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

export function normalizeSeatGroupOptions(options = {}) {
  const initialGroupType =
    options.groupType === ELEMENT_TYPES.ROW ||
    options.groupType === ELEMENT_TYPES.ARC
      ? options.groupType
      : null;
  const rowId = options.rowId || null;
  const arcId = options.arcId || null;
  const groupType =
    initialGroupType ||
    (rowId ? ELEMENT_TYPES.ROW : arcId ? ELEMENT_TYPES.ARC : null);
  const groupId = options.groupId || rowId || arcId || null;

  return {
    groupId,
    groupType,
    rowId: groupType === ELEMENT_TYPES.ROW ? rowId || groupId : null,
    arcId: groupType === ELEMENT_TYPES.ARC ? arcId || groupId : null,
  };
}

export function createSeatGroupMetadata(groupType, groupId) {
  return normalizeSeatGroupOptions({ groupType, groupId });
}

export function generateSeat(point, options = {}) {
  const nextSeatId = reserveSeatId(options.seats);
  const groupOptions = normalizeSeatGroupOptions(options);

  // Get seat type config or use default
  const seatType = options.seatType || SEAT_TYPES.CHAIR;
  const typeConfig =
    SEAT_TYPE_CONFIG[seatType] || SEAT_TYPE_CONFIG[SEAT_TYPES.CHAIR];

  return {
    id: nextSeatId,
    seatId: nextSeatId,
    layoutId,
    x: point.x,
    y: point.y,
    radius: DEFAULT_SEAT_RADIUS, // Keep for backward compatibility (half of square size)
    size: options.size || DEFAULT_SEAT_RADIUS * 2, // Square size (width/height)
    width: options.width || typeConfig.defaultWidth,
    height: options.height || typeConfig.defaultHeight,
    seatType,
    fill: DEFAULT_SEAT_FILL,
    stroke: DEFAULT_SEAT_STROKE,
    row: options.row || null,
    number: options.number || null,
    label: options.label || null,
    groupId: groupOptions.groupId,
    groupType: groupOptions.groupType,
    rowId: groupOptions.rowId,
    arcId: groupOptions.arcId,
    arcCenterX: Number.isFinite(options.arcCenterX) ? options.arcCenterX : null,
    arcCenterY: Number.isFinite(options.arcCenterY) ? options.arcCenterY : null,
    arcRadius: Number.isFinite(options.arcRadius) ? options.arcRadius : null,
    arcAngle: Number.isFinite(options.arcAngle) ? options.arcAngle : null,
    arcRotation: Number.isFinite(options.arcRotation)
      ? options.arcRotation
      : null,
    arcSeatCount: Number.isFinite(options.arcSeatCount)
      ? options.arcSeatCount
      : null,
    arcSeatIndex: Number.isFinite(options.arcSeatIndex)
      ? options.arcSeatIndex
      : null,
    arcSeatSpacing: Number.isFinite(options.arcSeatSpacing)
      ? options.arcSeatSpacing
      : null,
    category: options.category || null,
    status: options.status || "available", // available, reserved, sold, locked
    price: options.price || null,
  };
}

export const createSeat = generateSeat;
