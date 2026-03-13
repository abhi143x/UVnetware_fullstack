import { generateSeatLabel } from "../utils/seatNumbering";
import { createSeat, DEFAULT_SEAT_RADIUS } from "./seatService";

export const COLLISION_INDEX_CELL_SIZE = DEFAULT_SEAT_RADIUS * 4;

export function calculateSeatSpacing(pointA, pointB, fallbackSpacing = 40) {
  if (!pointA || !pointB) return fallbackSpacing;
  const deltaX = pointB.x - pointA.x;
  const deltaY = pointB.y - pointA.y;
  return Math.hypot(deltaX, deltaY);
}

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
  const nextRowNumberByRow = new Map();

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

    const pointOptions = {
      ...seatOptions,
      ...(point.options || {}),
    };

    if (pointOptions.row) {
      const nextRowNumber = (nextRowNumberByRow.get(pointOptions.row) ?? 0) + 1;
      nextRowNumberByRow.set(pointOptions.row, nextRowNumber);
      pointOptions.number = nextRowNumber;
      pointOptions.label = generateSeatLabel(pointOptions.row, nextRowNumber);
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

export function deriveNextRowIndexFromSeats(seats) {
  let maxRowIndex = -1;
  seats.forEach((seat) => {
    if (seat.row) {
      const rowChar = seat.row[0];
      const rowIndex = rowChar.charCodeAt(0) - 65;
      if (seat.row.length > 1) {
        const secondChar = seat.row[1];
        const secondIndex = secondChar.charCodeAt(0) - 65;
        maxRowIndex = Math.max(maxRowIndex, 26 + rowIndex * 26 + secondIndex);
      } else {
        maxRowIndex = Math.max(maxRowIndex, rowIndex);
      }
    }
  });
  return maxRowIndex + 1;
}
