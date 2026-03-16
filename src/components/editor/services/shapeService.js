import { createId } from "./seatService";
import { ELEMENT_TYPES } from "../domain/elementTypes";

export const SHAPE_TYPES = Object.freeze({
  CIRCLE: "circle",
  RECTANGLE: "rectangle",
  POLYGON: "polygon",
});

export const DEFAULT_SHAPE_STROKE = "#2f5f8f";
export const DEFAULT_SHAPE_FILL = "rgba(95, 167, 255, 0.22)";

const SHAPE_SIZES = Object.freeze({
  [SHAPE_TYPES.CIRCLE]: { width: 90, height: 90 },
  [SHAPE_TYPES.RECTANGLE]: { width: 140, height: 90 },
});

export function normalizeShapeSize(type, width, height) {
  const fallback = SHAPE_SIZES[type] || SHAPE_SIZES[SHAPE_TYPES.RECTANGLE];
  const safeWidth = Number.isFinite(width)
    ? Math.max(20, width)
    : fallback.width;
  const safeHeight = Number.isFinite(height)
    ? Math.max(20, height)
    : fallback.height;

  return { width: safeWidth, height: safeHeight };
}

export function createShape(point, type = SHAPE_TYPES.RECTANGLE) {
  if (type === SHAPE_TYPES.POLYGON) {
    return createPolygonShape([
      { x: point.x - 35, y: point.y - 20 },
      { x: point.x + 35, y: point.y - 20 },
      { x: point.x + 35, y: point.y + 20 },
      { x: point.x - 35, y: point.y + 20 },
    ]);
  }

  const baseSize = SHAPE_SIZES[type] || SHAPE_SIZES[SHAPE_TYPES.RECTANGLE];
  const { width, height } = normalizeShapeSize(
    type,
    baseSize.width,
    baseSize.height,
  );

  return {
    id: createId(ELEMENT_TYPES.SHAPE),
    type,
    x: point.x,
    y: point.y,
    width,
    height,
    stroke: DEFAULT_SHAPE_STROKE,
    fill: DEFAULT_SHAPE_FILL,
    strokeWidth: 2,
  };
}

export function createPolygonShape(points) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length < 3) return null;

  const center = safePoints.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  center.x /= safePoints.length;
  center.y /= safePoints.length;

  const localPoints = safePoints.map((point) => ({
    x: point.x - center.x,
    y: point.y - center.y,
  }));

  return {
    id: createId(ELEMENT_TYPES.SHAPE),
    type: SHAPE_TYPES.POLYGON,
    x: center.x,
    y: center.y,
    points: localPoints,
    stroke: DEFAULT_SHAPE_STROKE,
    fill: DEFAULT_SHAPE_FILL,
    strokeWidth: 2,
  };
}

export function getShapeAbsolutePoints(shape) {
  if (shape?.type !== SHAPE_TYPES.POLYGON || !Array.isArray(shape.points)) {
    return [];
  }

  return shape.points.map((point) => ({
    x: shape.x + point.x,
    y: shape.y + point.y,
  }));
}

export function getShapeBounds(shape) {
  if (shape?.type === SHAPE_TYPES.POLYGON) {
    const points = getShapeAbsolutePoints(shape);
    if (points.length === 0) {
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x,
        bottom: shape.y,
        width: 0,
        height: 0,
      };
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  const width = Math.max(20, shape?.width || 80);
  const height = Math.max(20, shape?.height || 80);
  const left = shape.x - width / 2;
  const top = shape.y - height / 2;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

export function getShapeResizeHandles(shape) {
  if (!shape || shape.type === SHAPE_TYPES.POLYGON) return [];

  const bounds = getShapeBounds(shape);
  return [
    { key: "nw", x: bounds.left, y: bounds.top },
    { key: "ne", x: bounds.right, y: bounds.top },
    { key: "se", x: bounds.right, y: bounds.bottom },
    { key: "sw", x: bounds.left, y: bounds.bottom },
  ];
}
