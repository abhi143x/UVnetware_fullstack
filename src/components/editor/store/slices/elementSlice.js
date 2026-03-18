// ─── Element Slice ────────────────────────────────────────────────────────────
// Manages seats, texts, categories, and all element mutation actions.

import {
  TOOL_TEXT,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_ROW,
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_SHAPE,
} from "../../constants/tools";
import {
  generateSeatLabel,
  assignRowNumbers,
  getNextSingleSeatLabel,
} from "../../utils/seatNumbering";
import { getRowLetter } from "../../utils/seatNumbering";
import {
  DEFAULT_SEAT_RADIUS,
  createId,
  createSeatGroupMetadata,
  generateSeat,
} from "../../services/seatService";
import {
  isOverlapping,
  buildCollisionIndex,
  addSeatToCollisionIndex,
  isOverlappingWithCollisionIndex,
  getMaxSeatRadius,
  appendNonOverlappingSeats,
  COLLISION_INDEX_CELL_SIZE,
  deriveNextRowIndexFromSeats,
} from "../../services/layoutService";
import { generateRowSeats } from "../../services/rowService";
import {
  buildArcLayoutPoints,
  buildArcSeatPlacements,
  calculateArcAngleFromSpacing,
  calculateArcSeatSpacing,
  hasArcLayoutMetadata,
  normalizeArcRadius,
  normalizeArcSeatCount,
  resolveArcLayoutConfig,
} from "../../services/arcService";
import { ELEMENT_TYPES } from "../../domain/elementTypes";
import {
  createPolygonShape,
  createShape,
  SHAPE_TYPES,
} from "../../services/shapeService";
import { SEAT_TYPES, SEAT_TYPE_CONFIG } from "../../constants/seatTypes";

const DEFAULT_CATEGORIES = [
  { id: "vip", name: "VIP", color: "#ffd700", price: null },
  { id: "standard", name: "Standard", color: "#5fa7ff", price: null },
  { id: "balcony", name: "Balcony", color: "#9b59b6", price: null },
];
const ARC_AUTO_PLACEMENT_VERTICAL_SPACING = 80;
const ARC_AUTO_PLACEMENT_Y_STEP = 20;
const ARC_AUTO_PLACEMENT_MAX_ATTEMPTS = 400;

function hasArcPlacementCollision(arcPlacements, collisionIndex, maxSeatRadius) {
  const candidateCollisionIndex = new Map();

  for (const placement of arcPlacements) {
    if (
      isOverlappingWithCollisionIndex(
        placement.x,
        placement.y,
        DEFAULT_SEAT_RADIUS,
        collisionIndex,
        COLLISION_INDEX_CELL_SIZE,
        maxSeatRadius,
      )
    ) {
      return true;
    }

    if (
      isOverlappingWithCollisionIndex(
        placement.x,
        placement.y,
        DEFAULT_SEAT_RADIUS,
        candidateCollisionIndex,
        COLLISION_INDEX_CELL_SIZE,
        DEFAULT_SEAT_RADIUS,
      )
    ) {
      return true;
    }

    addSeatToCollisionIndex(
      candidateCollisionIndex,
      {
        x: placement.x,
        y: placement.y,
        radius: DEFAULT_SEAT_RADIUS,
      },
      COLLISION_INDEX_CELL_SIZE,
    );
  }

  return false;
}

function resolveArcPlacementCenter(existingSeats, fallbackCenter, radius) {
  if (!fallbackCenter || !Number.isFinite(fallbackCenter.x)) {
    return null;
  }

  const maxSeatY = existingSeats.reduce(
    (currentMaxY, seat) => Math.max(currentMaxY, seat.y),
    Number.NEGATIVE_INFINITY,
  );

  return {
    x: fallbackCenter.x,
    y: Number.isFinite(maxSeatY)
      ? maxSeatY + ARC_AUTO_PLACEMENT_VERTICAL_SPACING + radius
      : fallbackCenter.y,
  };
}

function findAvailableArcPlacements(
  existingSeats,
  arcConfig,
  baseCenter,
  rowLetter,
  arcId,
  seatType,
) {
  if (
    !baseCenter ||
    !Number.isFinite(baseCenter.x) ||
    !Number.isFinite(baseCenter.y)
  ) {
    return null;
  }

  const resolvedArcLayout = resolveArcLayoutConfig(arcConfig);
  const collisionIndex = buildCollisionIndex(
    existingSeats,
    COLLISION_INDEX_CELL_SIZE,
  );
  const maxSeatRadius = getMaxSeatRadius(existingSeats);

  for (
    let attemptIndex = 0;
    attemptIndex < ARC_AUTO_PLACEMENT_MAX_ATTEMPTS;
    attemptIndex += 1
  ) {
    const centerPoint = {
      x: baseCenter.x,
      y: baseCenter.y + attemptIndex * ARC_AUTO_PLACEMENT_Y_STEP,
    };
    const arcPlacements = buildArcSeatPlacements({
      centerPoint,
      rowLetter,
      arcId,
      seatType,
      ...resolvedArcLayout,
    });

    if (
      !hasArcPlacementCollision(arcPlacements, collisionIndex, maxSeatRadius)
    ) {
      return arcPlacements;
    }
  }

  return null;
}

function buildAutoPlacedArcPlacements(
  existingSeats,
  arcConfig,
  fallbackCenter,
  rowLetter,
  arcId,
) {
  const resolvedArcLayout = resolveArcLayoutConfig(arcConfig);
  const baseCenter = resolveArcPlacementCenter(
    existingSeats,
    fallbackCenter,
    resolvedArcLayout.radius,
  );

  return findAvailableArcPlacements(
    existingSeats,
    resolvedArcLayout,
    baseCenter,
    rowLetter,
    arcId,
  );
}

function sortArcSeatsByLayoutOrder(arcSeats) {
  return [...arcSeats].sort((leftSeat, rightSeat) => {
    const leftIndex = Number.isFinite(leftSeat.arcSeatIndex)
      ? leftSeat.arcSeatIndex
      : null;
    const rightIndex = Number.isFinite(rightSeat.arcSeatIndex)
      ? rightSeat.arcSeatIndex
      : null;

    if (leftIndex !== null && rightIndex !== null) {
      return leftIndex - rightIndex;
    }

    const leftNumber = Number.isFinite(leftSeat.number) ? leftSeat.number : 0;
    const rightNumber = Number.isFinite(rightSeat.number)
      ? rightSeat.number
      : 0;
    return leftNumber - rightNumber;
  });
}

function distributeIndices(itemCount, slotCount) {
  if (itemCount <= 0 || slotCount <= 0) return [];
  if (itemCount === 1) {
    return [Math.round((slotCount - 1) / 2)];
  }

  return Array.from({ length: itemCount }, (_, index) =>
    Math.round((index * (slotCount - 1)) / (itemCount - 1)),
  );
}

function buildArcSeatUpdatePayload(
  seat,
  point,
  index,
  rowLetter,
  groupMetadata,
  centerPoint,
  resolvedArcLayout,
) {
  return {
    ...seat,
    x: point.x,
    y: point.y,
    row: rowLetter,
    number: index + 1,
    label: generateSeatLabel(rowLetter, index + 1),
    groupId: groupMetadata.groupId,
    groupType: groupMetadata.groupType,
    rowId: groupMetadata.rowId,
    arcId: groupMetadata.arcId,
    arcCenterX: centerPoint.x,
    arcCenterY: centerPoint.y,
    arcRadius: resolvedArcLayout.radius,
    arcAngle: resolvedArcLayout.arcAngle,
    arcRotation: resolvedArcLayout.rotation,
    arcSeatCount: resolvedArcLayout.seatCount,
    arcSeatIndex: index,
    arcSeatSpacing: resolvedArcLayout.seatSpacing,
  };
}

function createArcSeatFromTemplate(
  templateSeat,
  point,
  index,
  rowLetter,
  groupMetadata,
  centerPoint,
  resolvedArcLayout,
) {
  const newSeat = generateSeat(point, {
    row: rowLetter,
    number: index + 1,
    label: generateSeatLabel(rowLetter, index + 1),
    seatType: templateSeat.seatType,
    width: templateSeat.width,
    height: templateSeat.height,
    size: templateSeat.size,
    category: templateSeat.category,
    status: templateSeat.status,
    price: templateSeat.price,
    ...groupMetadata,
    arcCenterX: centerPoint.x,
    arcCenterY: centerPoint.y,
    arcRadius: resolvedArcLayout.radius,
    arcAngle: resolvedArcLayout.arcAngle,
    arcRotation: resolvedArcLayout.rotation,
    arcSeatCount: resolvedArcLayout.seatCount,
    arcSeatIndex: index,
    arcSeatSpacing: resolvedArcLayout.seatSpacing,
  });

  return {
    ...newSeat,
    fill: templateSeat.fill ?? newSeat.fill,
    stroke: templateSeat.stroke ?? newSeat.stroke,
    radius: templateSeat.radius ?? newSeat.radius,
    size: templateSeat.size ?? newSeat.size,
    width: templateSeat.width ?? newSeat.width,
    height: templateSeat.height ?? newSeat.height,
  };
}

function buildUpdatedArcSeats(arcSeats, arcUpdates = {}) {
  if (!arcSeats.length) return null;

  const orderedArcSeats = sortArcSeatsByLayoutOrder(arcSeats);
  const baseSeat = orderedArcSeats[0];

  if (!hasArcLayoutMetadata(baseSeat)) {
    return null;
  }

  const centerPoint = {
    x:
      Number.isFinite(arcUpdates.arcCenterX) || Number.isFinite(arcUpdates.x)
        ? (arcUpdates.arcCenterX ?? arcUpdates.x)
        : baseSeat.arcCenterX,
    y:
      Number.isFinite(arcUpdates.arcCenterY) || Number.isFinite(arcUpdates.y)
        ? (arcUpdates.arcCenterY ?? arcUpdates.y)
        : baseSeat.arcCenterY,
  };

  if (!Number.isFinite(centerPoint.x) || !Number.isFinite(centerPoint.y)) {
    return null;
  }

  const nextSeatCount = normalizeArcSeatCount(
    arcUpdates.arcSeatCount ?? arcUpdates.seatCount ?? orderedArcSeats.length,
  );
  const parsedArcAngle = Number(arcUpdates.arcAngle);
  const parsedArcRadius = Number(arcUpdates.arcRadius);
  const parsedArcSpacing = Number(arcUpdates.arcSeatSpacing);
  const nextRadius = normalizeArcRadius(
    Number.isFinite(parsedArcRadius) ? parsedArcRadius : baseSeat.arcRadius,
  );
  const nextArcAngle =
    Number.isFinite(parsedArcAngle)
      ? parsedArcAngle
      : Number.isFinite(parsedArcSpacing) && nextSeatCount > 1
        ? calculateArcAngleFromSpacing(
          nextSeatCount,
          nextRadius,
          parsedArcSpacing,
        )
        : baseSeat.arcAngle;
  const resolvedArcLayout = resolveArcLayoutConfig({
    seatCount: nextSeatCount,
    arcAngle: nextArcAngle,
    radius: nextRadius,
    rotation: arcUpdates.arcRotation ?? baseSeat.arcRotation,
  });
  const arcLayout = {
    ...resolvedArcLayout,
    seatSpacing: 150, // Force 150px spacing for all arc updates
  };
  const nextLayoutPoints = buildArcLayoutPoints({
    centerPoint,
    ...arcLayout,
  });
  const rowLetter = baseSeat.row || "A";
  const groupMetadata = createSeatGroupMetadata(
    ELEMENT_TYPES.ARC,
    baseSeat.groupId,
  );

  if (nextSeatCount === orderedArcSeats.length) {
    return orderedArcSeats.map((seat, index) =>
      buildArcSeatUpdatePayload(
        seat,
        nextLayoutPoints[index],
        index,
        rowLetter,
        groupMetadata,
        centerPoint,
        arcLayout,
      ),
    );
  }

  if (nextSeatCount < orderedArcSeats.length) {
    const keptSeatIndices = distributeIndices(
      nextSeatCount,
      orderedArcSeats.length,
    );

    return keptSeatIndices.map((seatIndex, index) =>
      buildArcSeatUpdatePayload(
        orderedArcSeats[seatIndex],
        nextLayoutPoints[index],
        index,
        rowLetter,
        groupMetadata,
        centerPoint,
        arcLayout,
      ),
    );
  }

  const reusedSeatByNextIndex = new Map(
    distributeIndices(orderedArcSeats.length, nextSeatCount).map(
      (nextIndex, seatIndex) => [nextIndex, orderedArcSeats[seatIndex]],
    ),
  );

  return nextLayoutPoints.map((point, index) => {
    const existingSeat = reusedSeatByNextIndex.get(index);

    if (existingSeat) {
      return buildArcSeatUpdatePayload(
        existingSeat,
        point,
        index,
        rowLetter,
        groupMetadata,
        centerPoint,
        arcLayout,
      );
    }

    const templateSeat =
      orderedArcSeats[
        Math.round(
          (index * (orderedArcSeats.length - 1)) /
            Math.max(nextSeatCount - 1, 1),
        )
      ] ?? baseSeat;

    return createArcSeatFromTemplate(
      templateSeat,
      point,
      index,
      rowLetter,
      groupMetadata,
      centerPoint,
      arcLayout,
    );
  });
}

function applyArcGroupLayout(state, arcGroupId, arcUpdates = {}) {
  if (!arcGroupId) return state;

  const arcSeats = state.seats.filter(
    (seat) =>
      seat.groupType === ELEMENT_TYPES.ARC && seat.groupId === arcGroupId,
  );
  const updatedArcSeats = buildUpdatedArcSeats(arcSeats, arcUpdates);

  if (!updatedArcSeats) return state;

  const originalArcSeatIdSet = new Set(arcSeats.map((seat) => seat.id));
  const nextArcSeatIdSet = new Set(updatedArcSeats.map((seat) => seat.id));
  const isCompleteArcSelection =
    state.selectedSeatIds.length === arcSeats.length &&
    state.selectedSeatIds.every((seatId) => originalArcSeatIdSet.has(seatId));
  const nextSelectedSeatIds = isCompleteArcSelection
    ? updatedArcSeats.map((seat) => seat.id)
    : state.selectedSeatIds.filter(
      (seatId) =>
        !originalArcSeatIdSet.has(seatId) || nextArcSeatIdSet.has(seatId),
    );

  const nextSeats = [];
  let insertedUpdatedArcSeats = false;

  state.seats.forEach((seat) => {
    if (
      seat.groupType === ELEMENT_TYPES.ARC &&
      seat.groupId === arcGroupId
    ) {
      if (!insertedUpdatedArcSeats) {
        nextSeats.push(...updatedArcSeats);
        insertedUpdatedArcSeats = true;
      }
      return;
    }

    nextSeats.push(seat);
  });

  return {
    seats: nextSeats,
    selectedSeatIds: nextSelectedSeatIds,
  };
}

function normalizeGeneratedArcGroup(nextSeats, arcGroupId) {
  const arcSeats = nextSeats.filter(
    (seat) =>
      seat.groupType === ELEMENT_TYPES.ARC && seat.groupId === arcGroupId,
  );
  if (!arcSeats.length) return nextSeats;

  const normalizedArcSeats = buildUpdatedArcSeats(arcSeats);
  if (!normalizedArcSeats) return nextSeats;

  const normalizedArcSeatMap = new Map(
    normalizedArcSeats.map((seat) => [seat.id, seat]),
  );

  return nextSeats.map((seat) => normalizedArcSeatMap.get(seat.id) ?? seat);
}

function applySeatMoveUpdates(state, seatUpdates) {
  if (!seatUpdates.length) return state;

  const seatById = new Map(state.seats.map((s) => [s.id, s]));
  const movedSeatIds = new Set(seatUpdates.map((u) => u.id));
  const staticSeats = state.seats.filter((s) => !movedSeatIds.has(s.id));
  const acceptedMovedSeats = new Map();
  const collisionIndex = buildCollisionIndex(
    staticSeats,
    COLLISION_INDEX_CELL_SIZE,
  );
  const maxSeatRadius = getMaxSeatRadius(state.seats);
  let hasAnyPositionChange = false;

  for (const update of seatUpdates) {
    const currentSeat = seatById.get(update.id);
    if (!currentSeat) continue;

    const seatRadius = currentSeat.radius ?? DEFAULT_SEAT_RADIUS;

    if (
      isOverlappingWithCollisionIndex(
        update.x,
        update.y,
        seatRadius,
        collisionIndex,
        COLLISION_INDEX_CELL_SIZE,
        maxSeatRadius,
      )
    ) {
      // Skip updating this seat's position, it hit something.
      acceptedMovedSeats.set(update.id, currentSeat);
      addSeatToCollisionIndex(
        collisionIndex,
        currentSeat,
        COLLISION_INDEX_CELL_SIZE,
      );
      continue;
    }

    const deltaX = update.x - currentSeat.x;
    const deltaY = update.y - currentSeat.y;
    const newSeat = { ...currentSeat, x: update.x, y: update.y };
    if (
      Number.isFinite(currentSeat.arcCenterX) &&
      Number.isFinite(currentSeat.arcCenterY)
    ) {
      newSeat.arcCenterX = currentSeat.arcCenterX + deltaX;
      newSeat.arcCenterY = currentSeat.arcCenterY + deltaY;
    }
    if (newSeat.x !== currentSeat.x || newSeat.y !== currentSeat.y) {
      hasAnyPositionChange = true;
    }

    acceptedMovedSeats.set(update.id, newSeat);
    addSeatToCollisionIndex(collisionIndex, newSeat, COLLISION_INDEX_CELL_SIZE);
  }

  if (!hasAnyPositionChange || acceptedMovedSeats.size === 0) return state;

  return {
    seats: state.seats.map((s) => acceptedMovedSeats.get(s.id) ?? s),
  };
}

function applyTextMoveUpdates(state, textUpdates) {
  if (!textUpdates.length) return state;
  const updatesById = new Map(textUpdates.map((u) => [u.id, u]));

  return {
    texts: state.texts.map((t) => {
      const update = updatesById.get(t.id);
      if (!update) return t;
      return { ...t, x: update.x, y: update.y };
    }),
  };
}

function applyShapeMoveUpdates(state, shapeUpdates) {
  if (!shapeUpdates.length) return state;
  const updatesById = new Map(shapeUpdates.map((u) => [u.id, u]));

  return {
    shapes: state.shapes.map((shape) => {
      const update = updatesById.get(shape.id);
      if (!update) return shape;
      return { ...shape, x: update.x, y: update.y };
    }),
  };
}

function applySelectionRotation(state, angle) {
  const selectedSeatIds = new Set(state.selectedSeatIds);
  const selectedTextIds = new Set(state.selectedTextIds);

  const selectedSeats = state.seats.filter((seat) =>
    selectedSeatIds.has(seat.id),
  );
  const selectedTexts = state.texts.filter((text) =>
    selectedTextIds.has(text.id),
  );
  const selectedCount = selectedSeats.length + selectedTexts.length;

  if (selectedCount === 0) return state;

  const sum = [...selectedSeats, ...selectedTexts].reduce(
    (acc, item) => ({ x: acc.x + item.x, y: acc.y + item.y }),
    { x: 0, y: 0 },
  );
  const cx = sum.x / selectedCount;
  const cy = sum.y / selectedCount;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rotatedSeats = state.seats.map((seat) => {
    if (!selectedSeatIds.has(seat.id)) return seat;

    const dx = seat.x - cx;
    const dy = seat.y - cy;

    const rotatedSeat = {
      ...seat,
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
    if (Number.isFinite(seat.arcCenterX) && Number.isFinite(seat.arcCenterY)) {
      const centerDx = seat.arcCenterX - cx;
      const centerDy = seat.arcCenterY - cy;
      rotatedSeat.arcCenterX = cx + centerDx * cos - centerDy * sin;
      rotatedSeat.arcCenterY = cy + centerDx * sin + centerDy * cos;
    }
    if (Number.isFinite(seat.arcRotation)) {
      rotatedSeat.arcRotation = seat.arcRotation + angle;
    }

    return rotatedSeat;
  });

  const angleDeg = (angle * 180) / Math.PI;
  const rotatedTexts = state.texts.map((text) => {
    if (!selectedTextIds.has(text.id)) return text;

    const dx = text.x - cx;
    const dy = text.y - cy;

    return {
      ...text,
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
      rotate: (text.rotate ?? 0) + angleDeg,
    };
  });

  return { seats: rotatedSeats, texts: rotatedTexts };
}

export function createElementSlice(set, get, { trackedSet, persisted }) {
  return {
    // State
    seats: persisted.seats,
    texts: persisted.texts,
    shapes: Array.isArray(persisted.shapes) ? persisted.shapes : [],
    categories:
      Array.isArray(persisted.categories) && persisted.categories.length > 0
        ? persisted.categories
        : DEFAULT_CATEGORIES,
    nextRowIndex:
      persisted.seats && persisted.seats.length > 0
        ? persisted.nextRowIndex || 0
        : 0,

    // Custom spacing preference for align function
    customSpacing: persisted.customSpacing || 48, // Remember user's spacing preference

    // Preview state for real-time spacing adjustments
    spacingPreview: null, // { seatId: originalX }

    // ─── Text & Seat Updates ─────────────────────────────────────────────────

    updateText: (textId, updates) =>
      trackedSet((state) => ({
        texts: state.texts.map((t) =>
          t.id === textId ? { ...t, ...updates } : t,
        ),
      })),

    // Used by continuous UI controls (e.g. sliders) to avoid history spam.
    updateTextPreview: (textId, updates) =>
      set((state) => ({
        texts: state.texts.map((t) =>
          t.id === textId ? { ...t, ...updates } : t,
        ),
      })),

    updateShape: (shapeId, updates) =>
      trackedSet((state) => ({
        shapes: state.shapes.map((shape) =>
          shape.id === shapeId ? { ...shape, ...updates } : shape,
        ),
      })),

    updateShapePreview: (shapeId, updates) =>
      set((state) => ({
        shapes: state.shapes.map((shape) =>
          shape.id === shapeId ? { ...shape, ...updates } : shape,
        ),
      })),

    updateSeat: (seatId, updates) =>
      trackedSet((state) => ({
        seats: state.seats.map((s) => {
          if (s.id === seatId) {
            const updated = { ...s, ...updates };
            // Auto-generate label if row and number are set
            if (updated.row && updated.number && !updates.label) {
              updated.label = generateSeatLabel(updated.row, updated.number);
            }
            return updated;
          }
          return s;
        }),
      })),

    updateSeats: (seatIds, updates) =>
      trackedSet((state) => ({
        seats: state.seats.map((s) => {
          if (seatIds.includes(s.id)) {
            const updated = { ...s, ...updates };
            // Auto-generate label if row and number are set
            if (updated.row && updated.number && !updates.label) {
              updated.label = generateSeatLabel(updated.row, updated.number);
            }
            return updated;
          }
          return s;
        }),
      })),

    // ─── Category Management ─────────────────────────────────────────────────

    addCategory: (category) =>
      trackedSet((state) => ({
        categories: [
          ...state.categories,
          { ...category, id: category.id || createId("category") },
        ],
      })),

    updateCategory: (categoryId, updates) =>
      trackedSet((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c,
        ),
      })),

    removeCategory: (categoryId) =>
      trackedSet((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        seats: state.seats.map((s) =>
          s.category === categoryId ? { ...s, category: null } : s,
        ),
      })),

    // ─── Auto Numbering ──────────────────────────────────────────────────────

    autoNumberSeats: () =>
      trackedSet((state) => {
        const updatedSeats = assignRowNumbers(state.seats, 0);
        return {
          seats: updatedSeats,
          nextRowIndex: deriveNextRowIndexFromSeats(updatedSeats),
        };
      }),

    // ─── Selected Seat Spacing Control ─────────────────────────────────────

    updateSelectedSeatsSpacing: (newSpacing) =>
      trackedSet((state) => {
        const selectedSeatIdSet = new Set(state.selectedSeatIds);
        const selectedSeats = state.seats.filter((seat) =>
          selectedSeatIdSet.has(seat.id),
        );

        if (selectedSeats.length < 2) return state;

        // Remember this spacing for future align operations
        const updatedCustomSpacing = newSpacing;

        // Sort selected seats by x position
        selectedSeats.sort((a, b) => a.x - b.x);

        // Find the leftmost and rightmost selected seats
        const leftmostX = selectedSeats[0].x;
        const rightmostX = selectedSeats[selectedSeats.length - 1].x;
        const currentRightmostPosition = rightmostX;
        const newRightmostPosition =
          leftmostX + (selectedSeats.length - 1) * newSpacing;

        // Calculate how much the rightmost seat moved
        const positionShift = newRightmostPosition - currentRightmostPosition;

        // Find all seats that come after the rightmost selected seat
        const seatsToMove = state.seats.filter(
          (seat) =>
            !selectedSeatIdSet.has(seat.id) &&
            seat.x > currentRightmostPosition,
        );
        const seatsToMoveSet = new Set(seatsToMove.map((seat) => seat.id));
        const nonSelectedSeats = state.seats.filter(
          (seat) =>
            !selectedSeatIdSet.has(seat.id) &&
            seat.x <= currentRightmostPosition,
        );

        const updatedSeats = state.seats.map((seat) => {
          // Handle selected seats
          if (selectedSeatIdSet.has(seat.id)) {
            // Find the index of this seat in the sorted selected seats
            const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id);

            // Calculate new position based on index and new spacing
            let targetX = leftmostX + seatIndex * newSpacing;

            // Check for overlaps with non-selected seats (only those before the selected area)
            const seatRadius = seat.radius ?? DEFAULT_SEAT_RADIUS;

            for (const otherSeat of nonSelectedSeats) {
              const distance = Math.abs(targetX - otherSeat.x);
              const yDistance = Math.abs(seat.y - otherSeat.y);

              // If seats would overlap (both x and y are too close)
              if (distance < seatRadius * 2 && yDistance < seatRadius * 2) {
                // Move the seat to the right of the overlapping seat
                if (targetX < otherSeat.x) {
                  targetX = otherSeat.x + seatRadius * 2 + 5; // Add 5px buffer
                } else {
                  targetX = otherSeat.x - seatRadius * 2 - 5; // Move to left
                }
              }
            }

            return {
              ...seat,
              x: targetX,
            };
          }

          // Handle seats that come after the selected area - move them forward
          if (seatsToMoveSet.has(seat.id)) {
            return {
              ...seat,
              x: seat.x + positionShift,
            };
          }

          // Other seats remain unchanged
          return seat;
        });

        return {
          seats: updatedSeats,
          customSpacing: updatedCustomSpacing, // Remember the spacing
        };
      }),

    // ─── Spacing Preview Functions ───────────────────────────────────────────

    previewSelectedSeatsSpacing: (newSpacing) =>
      set((state) => {
        const selectedSeatIdSet = new Set(state.selectedSeatIds);
        const selectedSeats = state.seats.filter((seat) =>
          selectedSeatIdSet.has(seat.id),
        );

        if (selectedSeats.length < 2) return state;

        // Store original positions for ALL seats (selected + subsequent) for proper cancel
        const originalPositions = {};
        state.seats.forEach((seat) => {
          originalPositions[seat.id] = seat.x;
        });

        // Sort selected seats by x position
        selectedSeats.sort((a, b) => a.x - b.x);

        // Find the leftmost and rightmost selected seats
        const leftmostX = selectedSeats[0].x;
        const rightmostX = selectedSeats[selectedSeats.length - 1].x;
        const currentRightmostPosition = rightmostX;
        const newRightmostPosition =
          leftmostX + (selectedSeats.length - 1) * newSpacing;

        // Calculate how much the rightmost seat moved
        const positionShift = newRightmostPosition - currentRightmostPosition;

        // Find all seats that come after the rightmost selected seat
        const seatsToMove = state.seats.filter(
          (seat) =>
            !selectedSeatIdSet.has(seat.id) &&
            seat.x > currentRightmostPosition,
        );
        const seatsToMoveSet = new Set(seatsToMove.map((seat) => seat.id));
        const nonSelectedSeats = state.seats.filter(
          (seat) =>
            !selectedSeatIdSet.has(seat.id) &&
            seat.x <= currentRightmostPosition,
        );

        const updatedSeats = state.seats.map((seat) => {
          // Handle selected seats
          if (selectedSeatIdSet.has(seat.id)) {
            // Find the index of this seat in the sorted selected seats
            const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id);

            // Calculate new position based on index and new spacing
            let targetX = leftmostX + seatIndex * newSpacing;

            // Check for overlaps with non-selected seats (only those before the selected area)
            const seatRadius = seat.radius ?? DEFAULT_SEAT_RADIUS;

            for (const otherSeat of nonSelectedSeats) {
              const distance = Math.abs(targetX - otherSeat.x);
              const yDistance = Math.abs(seat.y - otherSeat.y);

              // If seats would overlap (both x and y are too close)
              if (distance < seatRadius * 2 && yDistance < seatRadius * 2) {
                // Move the seat to the right of the overlapping seat
                if (targetX < otherSeat.x) {
                  targetX = otherSeat.x + seatRadius * 2 + 5; // Add 5px buffer
                } else {
                  targetX = otherSeat.x - seatRadius * 2 - 5; // Move to left
                }
              }
            }

            return {
              ...seat,
              x: targetX,
            };
          }

          // Handle seats that come after the selected area - move them forward in preview
          if (seatsToMoveSet.has(seat.id)) {
            return {
              ...seat,
              x: seat.x + positionShift,
            };
          }

          // Other seats remain unchanged
          return seat;
        });

        return {
          seats: updatedSeats,
          spacingPreview: originalPositions,
        };
      }),

    clearSpacingPreview: () =>
      trackedSet((state) => {
        if (!state.spacingPreview) {
          return state;
        }

        // Restore ALL seats to their original positions from preview data
        const restoredSeats = state.seats.map((seat) => {
          const originalX = state.spacingPreview[seat.id];
          if (originalX !== undefined) {
            return {
              ...seat,
              x: originalX, // Restore to original X position
            };
          }
          return seat;
        });

        return {
          seats: restoredSeats,
          spacingPreview: null,
        };
      }),

    // ─── World Click (seat/text placement) ───────────────────────────────────

    handleWorldClick: (worldPoint) =>
      trackedSet((state) => {
        if (state.activeTool === TOOL_SELECT) {
          return {
            selectedSeatIds: [],
            selectedTextIds: [],
            selectedShapeIds: [],
          };
        }

        if (state.activeTool === TOOL_TEXT) {
          // Check if clicking on existing text
          const clickedText = state.texts.find(text => {
            const distance = Math.sqrt(
              Math.pow(text.x - worldPoint.x, 2) + Math.pow(text.y - worldPoint.y, 2)
            );
            // Use dynamic selection radius based on font size
            const selectionRadius = Math.max(30, text.fontSize || 20);
            return distance < selectionRadius;
          });

          if (clickedText) {
            // Select existing text for editing
            return {
              selectedTextIds: [clickedText.id],
              selectedSeatIds: [],
              selectedShapeIds: [],
            };
          } else {
            // Create new text
            const newTextId = createId(ELEMENT_TYPES.TEXT);
            return {
              texts: [
                ...state.texts,
                {
                  id: newTextId,
                  x: worldPoint.x,
                  y: worldPoint.y,
                  content: "Text",
                  fontSize: 20,
                  fill: "#c9d6ea",
                  fontWeight: "normal",
                  fontStyle: "normal",
                  rotate: 0,
                },
              ],
              selectedTextIds: [newTextId],
              selectedSeatIds: [],
              selectedShapeIds: [],
            };
          }
        }
        if (state.activeTool === TOOL_SHAPE) {
          if (state.selectedShapeType === SHAPE_TYPES.POLYGON) {
            return state;
          }

          const newShape = createShape(worldPoint, state.selectedShapeType);
          return {
            shapes: [...state.shapes, newShape],
            selectedShapeIds: [newShape.id],
            selectedSeatIds: [],
            selectedTextIds: [],
            activeTool: TOOL_SELECT,
          };
        }
        if (state.activeTool === TOOL_SEAT) {
          if (isOverlapping(worldPoint.x, worldPoint.y, state.seats))
            return state;
          const nextSeatLabel = getNextSingleSeatLabel(state.seats);
          const newSeat = generateSeat(worldPoint, {
            ...nextSeatLabel,
            seatType: state.selectedSeatType,
          });
          return { seats: [...state.seats, newSeat] };
        }
        return state;
      }),

    addPolygonShape: (points) =>
      trackedSet((state) => {
        const newShape = createPolygonShape(points);
        if (!newShape) return state;

        return {
          shapes: [...state.shapes, newShape],
          selectedShapeIds: [newShape.id],
          selectedSeatIds: [],
          selectedTextIds: [],
          activeTool: TOOL_SELECT,
        };
      }),

    submitText: () =>
      trackedSet((state) => {
        const trimmedContent = state.textDraft.trim();
        if (trimmedContent && state.textPrompt) {
          return {
            texts: [
              ...state.texts,
              {
                id: createId(ELEMENT_TYPES.TEXT),
                x: state.textPrompt.x,
                y: state.textPrompt.y,
                content: trimmedContent,
              },
            ],
            textDraft: "",
            textPrompt: null,
          };
        }
        return { textDraft: "", textPrompt: null };
      }),

    // ─── Move ────────────────────────────────────────────────────────────────

    moveSeats: (seatUpdates) =>
      trackedSet((state) => applySeatMoveUpdates(state, seatUpdates)),

    // Used by drag gestures to avoid history entries per mouse move.
    moveSeatsPreview: (seatUpdates) =>
      set((state) => applySeatMoveUpdates(state, seatUpdates)),

    moveTexts: (textUpdates) =>
      trackedSet((state) => applyTextMoveUpdates(state, textUpdates)),

    // Used by drag gestures to avoid history entries per mouse move.
    moveTextsPreview: (textUpdates) =>
      set((state) => applyTextMoveUpdates(state, textUpdates)),

    moveShapes: (shapeUpdates) =>
      trackedSet((state) => applyShapeMoveUpdates(state, shapeUpdates)),

    // Used by drag gestures to avoid history entries per mouse move.
    moveShapesPreview: (shapeUpdates) =>
      set((state) => applyShapeMoveUpdates(state, shapeUpdates)),

    // ─── Resize ──────────────────────────────────────────────────────────────

    resizeSeats: (seatUpdates) =>
      trackedSet((state) => {
        const updateMap = new Map();
        seatUpdates.forEach((update) => {
          updateMap.set(update.id, update);
        });

        const updatedSeats = state.seats.map((seat) => {
          const update = updateMap.get(seat.id);
          if (!update) return seat;

          const typeConfig =
            SEAT_TYPE_CONFIG[seat.seatType || SEAT_TYPES.CHAIR];
          const minSize = typeConfig?.minSize || 14;
          const maxSize = typeConfig?.maxSize || 150;

          return {
            ...seat,
            width: update.width
              ? Math.max(minSize, Math.min(maxSize, update.width))
              : seat.width,
            height: update.height
              ? Math.max(minSize, Math.min(maxSize, update.height))
              : seat.height,
          };
        });

        return { seats: updatedSeats };
      }),

    // Used by drag gestures to avoid history entries per mouse move.
    resizeSeatsPreview: (seatUpdates) =>
      set((state) => {
        const updateMap = new Map();
        seatUpdates.forEach((update) => {
          updateMap.set(update.id, update);
        });

        const updatedSeats = state.seats.map((seat) => {
          const update = updateMap.get(seat.id);
          if (!update) return seat;

          const typeConfig =
            SEAT_TYPE_CONFIG[seat.seatType || SEAT_TYPES.CHAIR];
          const minSize = typeConfig?.minSize || 14;
          const maxSize = typeConfig?.maxSize || 150;

          return {
            ...seat,
            width: update.width
              ? Math.max(minSize, Math.min(maxSize, update.width))
              : seat.width,
            height: update.height
              ? Math.max(minSize, Math.min(maxSize, update.height))
              : seat.height,
          };
        });

        return { seats: updatedSeats };
      }),

    // ─── Erase ───────────────────────────────────────────────────────────────

    eraseSeat: (seatId) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ERASER) return state;

        const selectedSet = new Set(state.selectedSeatIds);

        let updatedSeats;

        if (selectedSet.has(seatId)) {
          updatedSeats = state.seats.filter((s) => !selectedSet.has(s.id));
        } else {
          updatedSeats = state.seats.filter((s) => s.id !== seatId);
        }

        // ---- FIX: group seats by row safely ----
        const rows = {};

        updatedSeats.forEach((seat) => {
          const row = seat.row || "A"; // ensure row exists
          if (!rows[row]) rows[row] = [];
          rows[row].push(seat);
        });

        const finalSeats = [];

        Object.keys(rows).forEach((row) => {
          const rowSeats = rows[row].sort((a, b) => a.x - b.x);

          rowSeats.forEach((seat, index) => {
            const number = index + 1;

            finalSeats.push({
              ...seat,
              row,
              number,
              label: generateSeatLabel(row, number),
            });
          });
        });

        return {
          seats: finalSeats,
          selectedSeatIds: [],
        };
      }),

    eraseText: (textId) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ERASER) return state;

        const selectedSet = new Set(state.selectedTextIds);
        const nextTexts = selectedSet.has(textId)
          ? state.texts.filter((text) => !selectedSet.has(text.id))
          : state.texts.filter((text) => text.id !== textId);

        return {
          texts: nextTexts,
          selectedTextIds: [],
        };
      }),

    eraseShape: (shapeId) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ERASER) return state;

        const selectedSet = new Set(state.selectedShapeIds);
        const nextShapes = selectedSet.has(shapeId)
          ? state.shapes.filter((shape) => !selectedSet.has(shape.id))
          : state.shapes.filter((shape) => shape.id !== shapeId);

        return {
          shapes: nextShapes,
          selectedShapeIds: [],
        };
      }),

    deleteSelection: () =>
      trackedSet((state) => {
        const selectedSeatIds = new Set(state.selectedSeatIds);
        const selectedTextIds = new Set(state.selectedTextIds);
        const selectedShapeIds = new Set(state.selectedShapeIds);

        if (
          selectedSeatIds.size === 0 &&
          selectedTextIds.size === 0 &&
          selectedShapeIds.size === 0
        )
          return state;

        // Filter out selected elements
        const updatedSeats = state.seats.filter(
          (s) => !selectedSeatIds.has(s.id),
        );
        const updatedTexts = state.texts.filter(
          (t) => !selectedTextIds.has(t.id),
        );
        const updatedShapes = state.shapes.filter(
          (s) => !selectedShapeIds.has(s.id),
        );

        // Re-number rows for seats
        const rows = {};
        updatedSeats.forEach((seat) => {
          const row = seat.row || "A";
          if (!rows[row]) rows[row] = [];
          rows[row].push(seat);
        });

        const finalSeats = [];
        Object.keys(rows).forEach((row) => {
          const rowSeats = rows[row].sort((a, b) => a.x - b.x);
          rowSeats.forEach((seat, index) => {
            const number = index + 1;
            finalSeats.push({
              ...seat,
              row,
              number,
              label: generateSeatLabel(row, number),
            });
          });
        });

        return {
          seats: finalSeats,
          texts: updatedTexts,
          shapes: updatedShapes,
          selectedSeatIds: [],
          selectedTextIds: [],
          selectedShapeIds: [],
        };
      }),

    // ─── Commit Row / Arc ─────────────────────────────────────────────────────

    commitRow: (rowPoints, seatType) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ROW || rowPoints.length === 0)
          return state;

        const currentRowIndex = state.nextRowIndex;
        const rowLetter = getRowLetter(currentRowIndex);
        const rowId = createId(ELEMENT_TYPES.ROW);

        const seatsWithOptions = generateRowSeats(rowPoints, rowLetter, rowId, seatType);
        const nextSeats = appendNonOverlappingSeats(
          state.seats,
          seatsWithOptions,
        );

        return {
          seats: nextSeats,
          nextRowIndex: currentRowIndex + 1,
        };
      }),

    commitArc: (arcConfig, centerPoint, seatType) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ARC) return state;
        if (
          !centerPoint ||
          !Number.isFinite(centerPoint.x) ||
          !Number.isFinite(centerPoint.y)
        ) {
          return state;
        }

        const currentRowIndex = state.nextRowIndex;
        const rowLetter = getRowLetter(currentRowIndex);
        const arcId = createId(ELEMENT_TYPES.ARC);
        const arcPlacements = findAvailableArcPlacements(
          state.seats,
          arcConfig,
          centerPoint,
          rowLetter,
          arcId,
          seatType,
        );

        if (!arcPlacements?.length) {
          return state;
        }

        return {
          seats: normalizeGeneratedArcGroup(
            appendNonOverlappingSeats(state.seats, arcPlacements),
            arcId,
          ),
          nextRowIndex: currentRowIndex + 1,
        };
      }),

    generateArcGroup: (arcConfig, centerPoint) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ARC) return state;

        const arcCenter = centerPoint ?? state.arcGeneratorCenter;
        if (!arcCenter || !Number.isFinite(arcCenter.x)) {
          return state;
        }

        const currentRowIndex = state.nextRowIndex;
        const rowLetter = getRowLetter(currentRowIndex);
        const arcId = createId(ELEMENT_TYPES.ARC);
        const arcPlacements = buildAutoPlacedArcPlacements(
          state.seats,
          arcConfig,
          arcCenter,
          rowLetter,
          arcId,
        );

        if (!arcPlacements?.length) return state;

        const nextSeats = normalizeGeneratedArcGroup(
          appendNonOverlappingSeats(state.seats, arcPlacements),
          arcId,
        );

        // Force 150px spacing for all arc seats
        const finalSeats = nextSeats.map(seat => ({
          ...seat,
          options: {
            ...seat.options,
            arcSeatSpacing: 150, // Override with fixed 150px spacing
          },
        }));
        const generatedArcSeatIds = nextSeats
          .filter(
            (seat) =>
              seat.groupType === ELEMENT_TYPES.ARC && seat.groupId === arcId,
          )
          .map((seat) => seat.id);

        if (!generatedArcSeatIds.length) return state;

        return {
          seats: nextSeats,
          nextRowIndex: currentRowIndex + 1,
          selectedSeatIds: generatedArcSeatIds,
          selectedTextIds: [],
          selectedShapeIds: [],
        };
      }),

    updateArcGroup: (arcGroupId, arcUpdates) =>
      trackedSet((state) => applyArcGroupLayout(state, arcGroupId, arcUpdates)),

    updateArcGroupPreview: (arcGroupId, arcUpdates) =>
      set((state) => applyArcGroupLayout(state, arcGroupId, arcUpdates)),

    // ─── Rotate Selection ─────────────────────────────────────────────────────

    rotateSelection: (angle) =>
      trackedSet((state) => applySelectionRotation(state, angle)),

    // Used by rotate drag to avoid creating history on every mouse move.
    rotateSelectionPreview: (angle) =>
      set((state) => applySelectionRotation(state, angle)),

    // Auto-align selected seats to grid and ensure consistent spacing
    alignSelection: (gridSize = 40) => {
      const state = get();
      const selectedSeats = state.seats.filter((seat) =>
        state.selectedSeatIds.includes(seat.id),
      );

      if (selectedSeats.length === 0) return;

      // Group seats by row for row-specific alignment
      const seatsByRow = {};

      // Include all seats (selected and non-selected) to find the correct row Y position
      state.seats.forEach((seat) => {
        const rowKey = seat.row || "unassigned";
        if (!seatsByRow[rowKey]) seatsByRow[rowKey] = [];
        seatsByRow[rowKey].push(seat);
      });

      const alignedSeats = state.seats.map((seat) => {
        if (!state.selectedSeatIds.includes(seat.id)) return seat;

        // If seat has a row, align with other seats in the same row
        if (
          seat.row &&
          seatsByRow[seat.row] &&
          seatsByRow[seat.row].length > 1
        ) {
          const rowSeats = seatsByRow[seat.row];

          // Sort by original x position to determine order
          rowSeats.sort((a, b) => a.x - b.x);
          const seatIndex = rowSeats.findIndex((s) => s.id === seat.id);

          // Find the Y position of all seats in this row (including non-selected)
          const nonSelectedRowSeats = rowSeats.filter(
            (s) => !state.selectedSeatIds.includes(s.id),
          );
          let targetY = seat.y; // Default to current Y

          // If there are non-selected seats in the row, use their exact Y position
          if (nonSelectedRowSeats.length > 0) {
            // Use the Y position of non-selected seats as reference (no grid snapping)
            const referenceY = nonSelectedRowSeats[0].y; // Take first non-selected seat's Y
            targetY = referenceY;
          } else {
            // If all seats in row are selected, keep current Y position
            targetY = seat.y;
          }

          // Use custom spacing if available, otherwise default
          const baseSpacing = state.customSpacing || gridSize * 1.2;

          // Find the leftmost seat position and align it to grid
          const leftmostX = Math.min(...rowSeats.map((s) => s.x));
          const alignedLeftmost = Math.round(leftmostX / gridSize) * gridSize;

          // Position based on index with consistent spacing
          const targetX = alignedLeftmost + seatIndex * baseSpacing;

          return {
            ...seat,
            x: targetX,
            y: targetY, // Use the calculated Y position
          };
        }

        // For individual seats or unassigned rows, just snap to grid
        const alignedX = Math.round(seat.x / gridSize) * gridSize;
        const alignedY = Math.round(seat.y / gridSize) * gridSize;

        return {
          ...seat,
          x: alignedX,
          y: alignedY,
        };
      });

      trackedSet({ seats: alignedSeats });
    },
  };
}
