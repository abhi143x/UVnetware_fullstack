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
import { generateArcSeats } from "../../services/arcService";
import { ELEMENT_TYPES } from "../../domain/elementTypes";
import {
  createPolygonShape,
  createShape,
  SHAPE_TYPES,
} from "../../services/shapeService";

const DEFAULT_CATEGORIES = [
  { id: "vip", name: "VIP", color: "#ffd700", price: null },
  { id: "standard", name: "Standard", color: "#5fa7ff", price: null },
  { id: "balcony", name: "Balcony", color: "#9b59b6", price: null },
];

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

    const newSeat = { ...currentSeat, x: update.x, y: update.y };
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

    return {
      ...seat,
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
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
    nextRowIndex: persisted.seats && persisted.seats.length > 0 ? (persisted.nextRowIndex || 0) : 0,

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
        const selectedSeats = state.seats.filter((seat) =>
          state.selectedSeatIds.includes(seat.id),
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
        const newRightmostPosition = leftmostX + ((selectedSeats.length - 1) * newSpacing);

        // Calculate how much the rightmost seat moved
        const positionShift = newRightmostPosition - currentRightmostPosition;

        // Find all seats that come after the rightmost selected seat
        const seatsToMove = state.seats.filter(seat =>
          !state.selectedSeatIds.includes(seat.id) && seat.x > currentRightmostPosition
        );

        const updatedSeats = state.seats.map((seat) => {
          // Handle selected seats
          if (state.selectedSeatIds.includes(seat.id)) {
            // Find the index of this seat in the sorted selected seats
            const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id);

            // Calculate new position based on index and new spacing
            let targetX = leftmostX + (seatIndex * newSpacing);

            // Check for overlaps with non-selected seats (only those before the selected area)
            const seatRadius = 15; // Approximate seat radius
            const nonSelectedSeats = state.seats.filter(s =>
              !state.selectedSeatIds.includes(s.id) && s.x <= currentRightmostPosition
            );

            for (const otherSeat of nonSelectedSeats) {
              const distance = Math.abs(targetX - otherSeat.x);
              const yDistance = Math.abs(seat.y - otherSeat.y);

              // If seats would overlap (both x and y are too close)
              if (distance < (seatRadius * 2) && yDistance < (seatRadius * 2)) {
                // Move the seat to the right of the overlapping seat
                if (targetX < otherSeat.x) {
                  targetX = otherSeat.x + (seatRadius * 2) + 5; // Add 5px buffer
                } else {
                  targetX = otherSeat.x - (seatRadius * 2) - 5; // Move to left
                }
              }
            }

            return {
              ...seat,
              x: targetX,
            };
          }

          // Handle seats that come after the selected area - move them forward
          if (seatsToMove.find(s => s.id === seat.id)) {
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
          customSpacing: updatedCustomSpacing // Remember the spacing
        };
      }),

    // ─── Spacing Preview Functions ───────────────────────────────────────────

    previewSelectedSeatsSpacing: (newSpacing) =>
      set((state) => {
        const selectedSeats = state.seats.filter((seat) =>
          state.selectedSeatIds.includes(seat.id),
        );

        if (selectedSeats.length < 2) return state;

        // Store original positions for ALL seats (selected + subsequent) for proper cancel
        const originalPositions = {};
        state.seats.forEach(seat => {
          originalPositions[seat.id] = seat.x;
        });
        console.log('Storing original positions for', Object.keys(originalPositions).length, 'seats');

        // Sort selected seats by x position
        selectedSeats.sort((a, b) => a.x - b.x);

        // Find the leftmost and rightmost selected seats
        const leftmostX = selectedSeats[0].x;
        const rightmostX = selectedSeats[selectedSeats.length - 1].x;
        const currentRightmostPosition = rightmostX;
        const newRightmostPosition = leftmostX + ((selectedSeats.length - 1) * newSpacing);

        // Calculate how much the rightmost seat moved
        const positionShift = newRightmostPosition - currentRightmostPosition;

        // Find all seats that come after the rightmost selected seat
        const seatsToMove = state.seats.filter(seat =>
          !state.selectedSeatIds.includes(seat.id) && seat.x > currentRightmostPosition
        );

        const updatedSeats = state.seats.map((seat) => {
          // Handle selected seats
          if (state.selectedSeatIds.includes(seat.id)) {
            // Find the index of this seat in the sorted selected seats
            const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id);

            // Calculate new position based on index and new spacing
            let targetX = leftmostX + (seatIndex * newSpacing);

            // Check for overlaps with non-selected seats (only those before the selected area)
            const seatRadius = 15; // Approximate seat radius
            const nonSelectedSeats = state.seats.filter(s =>
              !state.selectedSeatIds.includes(s.id) && s.x <= currentRightmostPosition
            );

            for (const otherSeat of nonSelectedSeats) {
              const distance = Math.abs(targetX - otherSeat.x);
              const yDistance = Math.abs(seat.y - otherSeat.y);

              // If seats would overlap (both x and y are too close)
              if (distance < (seatRadius * 2) && yDistance < (seatRadius * 2)) {
                // Move the seat to the right of the overlapping seat
                if (targetX < otherSeat.x) {
                  targetX = otherSeat.x + (seatRadius * 2) + 5; // Add 5px buffer
                } else {
                  targetX = otherSeat.x - (seatRadius * 2) - 5; // Move to left
                }
              }
            }

            return {
              ...seat,
              x: targetX,
            };
          }

          // Handle seats that come after the selected area - move them forward in preview
          if (seatsToMove.find(s => s.id === seat.id)) {
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
          spacingPreview: originalPositions
        };
      }),

    clearSpacingPreview: () =>
      trackedSet((state) => {
        console.log('clearSpacingPreview called, spacingPreview:', state.spacingPreview);
        if (!state.spacingPreview) {
          console.log('No spacingPreview data found');
          return state;
        }

        // Restore ALL seats to their original positions from preview data
        const restoredSeats = state.seats.map((seat) => {
          const originalX = state.spacingPreview[seat.id];
          if (originalX !== undefined) {
            console.log(`Restoring seat ${seat.id} from ${seat.x} to ${originalX}`);
            return {
              ...seat,
              x: originalX, // Restore to original X position
            };
          }
          console.log(`Seat ${seat.id} not in preview data, keeping current position`);
          return seat;
        });

        console.log('Restoration complete, clearing spacingPreview');
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
          const newSeat = generateSeat(worldPoint, nextSeatLabel);
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
        const updatedSeats = state.seats.filter((s) => !selectedSeatIds.has(s.id));
        const updatedTexts = state.texts.filter((t) => !selectedTextIds.has(t.id));
        const updatedShapes = state.shapes.filter((s) => !selectedShapeIds.has(s.id));

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

    commitRow: (rowPoints) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ROW || rowPoints.length === 0)
          return state;

        const currentRowIndex = state.nextRowIndex;
        const rowLetter = getRowLetter(currentRowIndex);

        const seatsWithOptions = generateRowSeats(rowPoints, rowLetter);
        const nextSeats = appendNonOverlappingSeats(
          state.seats,
          seatsWithOptions,
        );

        return {
          seats: nextSeats,
          nextRowIndex: currentRowIndex + 1,
        };
      }),

    commitArc: (arcPoints) =>
      trackedSet((state) => {
        if (state.activeTool !== TOOL_ARC || arcPoints.length === 0)
          return state;

        const currentRowIndex = state.nextRowIndex;
        const rowLetter = getRowLetter(currentRowIndex);

        const seatsWithOptions = generateArcSeats(arcPoints, rowLetter);
        const nextSeats = appendNonOverlappingSeats(
          state.seats,
          seatsWithOptions,
        );

        return {
          seats: nextSeats,
          nextRowIndex: currentRowIndex + 1,
        };
      }),

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
        const rowKey = seat.row || 'unassigned';
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
          const nonSelectedRowSeats = rowSeats.filter(s => !state.selectedSeatIds.includes(s.id));
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
          const baseSpacing = state.customSpacing || (gridSize * 1.2);

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
