const INITIAL_UNITS_PER_PIXEL = 1.0
const MIN_UNITS_PER_PIXEL = 0.08
const MAX_UNITS_PER_PIXEL = 8
const MIN_SCALE = 1 / MAX_UNITS_PER_PIXEL
const MAX_SCALE = 1 / MIN_UNITS_PER_PIXEL
const GRID_SIZE = 40
const ROW_ANGLE_SNAP_DEGREES = 15
const DEGREES_PER_RADIAN = 180 / Math.PI
const RADIANS_PER_DEGREE = Math.PI / 180
const PAN_CLICK_TOLERANCE = 4
const PREVIEW_SEAT_RADIUS = 12

export {
  INITIAL_UNITS_PER_PIXEL,
  MIN_UNITS_PER_PIXEL,
  MAX_UNITS_PER_PIXEL,
  MIN_SCALE,
  MAX_SCALE,
  GRID_SIZE,
  ROW_ANGLE_SNAP_DEGREES,
  DEGREES_PER_RADIAN,
  RADIANS_PER_DEGREE,
  PAN_CLICK_TOLERANCE,
  PREVIEW_SEAT_RADIUS,
}

// ─── Pure Math Utilities ──────────────────────────────────────────────────────

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function buildSelectionBounds(startPoint, endPoint) {
  const x = Math.min(startPoint.x, endPoint.x)
  const y = Math.min(startPoint.y, endPoint.y)
  const width = Math.abs(endPoint.x - startPoint.x)
  const height = Math.abs(endPoint.y - startPoint.y)

  return { x, y, width, height }
}

export function isSeatInsideBounds(seat, bounds) {
  return (
    seat.x >= bounds.x &&
    seat.x <= bounds.x + bounds.width &&
    seat.y >= bounds.y &&
    seat.y <= bounds.y + bounds.height
  )
}

export function resolveRowAngle(rawAngle, shiftKey) {
  const angleDeg = rawAngle * DEGREES_PER_RADIAN
  const finalAngleDeg = shiftKey
    ? Math.round(angleDeg / ROW_ANGLE_SNAP_DEGREES) * ROW_ANGLE_SNAP_DEGREES
    : angleDeg

  return finalAngleDeg * RADIANS_PER_DEGREE
}

export function buildRowPoints(startPoint, endPoint, shiftKey) {
  const deltaX = endPoint.x - startPoint.x
  const deltaY = endPoint.y - startPoint.y
  const rawAngle = Math.atan2(deltaY, deltaX)
  const finalAngle = resolveRowAngle(rawAngle, shiftKey)
  const unitX = Math.cos(finalAngle)
  const unitY = Math.sin(finalAngle)
  const distance = Math.hypot(deltaX, deltaY)
  const seatCount = Math.floor(distance / GRID_SIZE)
  const points = []

  for (let step = 0; step <= seatCount; step += 1) {
    points.push({
      x: startPoint.x + unitX * (step * GRID_SIZE),
      y: startPoint.y + unitY * (step * GRID_SIZE),
    })
  }

  return points
}

export function normalizeAngleDelta(angle) {
  let normalizedAngle = angle
  while (normalizedAngle <= -Math.PI) normalizedAngle += Math.PI * 2
  while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2
  return normalizedAngle
}

export function screenToWorldPoint(screenPoint, camera) {
  return {
    x: (screenPoint.x - camera.position.x) / camera.scale,
    y: (screenPoint.y - camera.position.y) / camera.scale,
  }
}
