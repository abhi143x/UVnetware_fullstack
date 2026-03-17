// ─── Selection Slice ──────────────────────────────────────────────────────────
// Manages seat/text selection, grouped seat selection, marquee, and copy/paste.

import { TOOL_SELECT } from "../../constants/tools";
import {
  DEFAULT_SEAT_RADIUS,
  createId,
  createSeatGroupMetadata,
} from "../../services/seatService";
import { isOverlapping } from "../../services/layoutService";
import { generateSeatLabel } from "../../utils/seatNumbering";
import { ELEMENT_TYPES } from "../../domain/elementTypes";

const GROUP_SELECTABLE_TYPES = new Set([ELEMENT_TYPES.ROW, ELEMENT_TYPES.ARC]);

function isGroupedSeat(seat) {
  return Boolean(
    seat?.groupId &&
      seat?.groupType &&
      GROUP_SELECTABLE_TYPES.has(seat.groupType),
  );
}

function getGroupedSeatIds(clickedSeat, seats) {
  if (!clickedSeat) return [];
  if (!isGroupedSeat(clickedSeat)) return [clickedSeat.id];

  const selectedSeatIds = [];

  seats.forEach((seat) => {
    if (
      seat.groupId === clickedSeat.groupId &&
      seat.groupType === clickedSeat.groupType
    ) {
      selectedSeatIds.push(seat.id);
    }
  });

  return selectedSeatIds.length > 0 ? selectedSeatIds : [clickedSeat.id];
}

function isMultiSelectEvent(event) {
  return Boolean(event?.evt?.shiftKey || event?.shiftKey);
}

function getPastedSeatGroupMetadata(seat, groupIdMap) {
  if (!isGroupedSeat(seat)) return {};

  const sourceKey = `${seat.groupType}:${seat.groupId}`;
  let nextGroupId = groupIdMap.get(sourceKey);

  if (!nextGroupId) {
    nextGroupId = createId(
      seat.groupType === ELEMENT_TYPES.ARC ? ELEMENT_TYPES.ARC : ELEMENT_TYPES.ROW,
    );
    groupIdMap.set(sourceKey, nextGroupId);
  }

  return createSeatGroupMetadata(seat.groupType, nextGroupId);
}

export function createSelectionSlice(set, get, { trackedSet }) {
  return {
    // State
    selectedSeatIds: [],
    selectedTextIds: [],
    selectedShapeIds: [],
    clipboard: null,
    pasteCount: 0,

    // Actions
    clearSelection: () =>
      set(() => {
        return {
          selectedSeatIds: [],
          selectedTextIds: [],
          selectedShapeIds: [],
        };
      }),

    selectSeat: (seatId, isMulti) =>
      set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state;

        if (!isMulti) {
          return { selectedSeatIds: [seatId] };
        }

        if (state.selectedSeatIds.includes(seatId)) {
          const selectedSeatIds = state.selectedSeatIds.filter(
            (id) => id !== seatId,
          );
          return {
            selectedSeatIds,
          };
        }
        const selectedSeatIds = [...state.selectedSeatIds, seatId];
        return { selectedSeatIds };
      }),

    selectText: (textId, shiftKey) =>
      set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state;

        if (!shiftKey) {
          return { selectedTextIds: [textId] };
        }

        if (state.selectedTextIds.includes(textId)) {
          const selectedTextIds = state.selectedTextIds.filter(
            (id) => id !== textId,
          );
          return {
            selectedTextIds,
          };
        }
        const selectedTextIds = [...state.selectedTextIds, textId];
        return { selectedTextIds };
      }),

    selectShape: (shapeId, shiftKey) =>
      set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state;

        if (!shiftKey) {
          return { selectedShapeIds: [shapeId] };
        }

        if (state.selectedShapeIds.includes(shapeId)) {
          const selectedShapeIds = state.selectedShapeIds.filter(
            (id) => id !== shapeId,
          );
          return {
            selectedShapeIds,
          };
        }
        const selectedShapeIds = [...state.selectedShapeIds, shapeId];
        return { selectedShapeIds };
      }),

    smartRowSelect: (seatId, event) =>
      set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state;

        const clickedSeat = state.seats.find((s) => s.id === seatId);
        if (!clickedSeat) return state;

        const groupedSeatIds = getGroupedSeatIds(clickedSeat, state.seats);

        if (isMultiSelectEvent(event)) {
          return {
            selectedSeatIds: [
              ...new Set([...state.selectedSeatIds, ...groupedSeatIds]),
            ],
          };
        }

        return { selectedSeatIds: groupedSeatIds };
      }),

    marqueeSelect: (seatIds, textIds, shapeIds, shiftKey) =>
      set((state) => {
        if (state.activeTool !== TOOL_SELECT) return state;

        if (!shiftKey) {
          return {
            selectedSeatIds: seatIds,
            selectedTextIds: textIds,
            selectedShapeIds: shapeIds,
          };
        }

        const updates = {};
        if (seatIds.length > 0) {
          updates.selectedSeatIds = [
            ...new Set([...state.selectedSeatIds, ...seatIds]),
          ];
        }
        if (textIds.length > 0) {
          updates.selectedTextIds = [
            ...new Set([...state.selectedTextIds, ...textIds]),
          ];
        }
        if (shapeIds.length > 0) {
          updates.selectedShapeIds = [
            ...new Set([...state.selectedShapeIds, ...shapeIds]),
          ];
        }
        return updates;
      }),

    copySelection: () => {
      const {
        seats,
        texts,
        shapes,
        selectedSeatIds,
        selectedTextIds,
        selectedShapeIds,
      } = get();
      const copiedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
      const copiedTexts = texts.filter((t) => selectedTextIds.includes(t.id));
      const copiedShapes = shapes.filter((s) =>
        selectedShapeIds.includes(s.id),
      );
      if (
        copiedSeats.length === 0 &&
        copiedTexts.length === 0 &&
        copiedShapes.length === 0
      )
        return;

      // Compute centroid so paste positions are relative
      const allItems = [
        ...copiedSeats.map((s) => ({ x: s.x, y: s.y })),
        ...copiedTexts.map((t) => ({ x: t.x, y: t.y })),
        ...copiedShapes.map((s) => ({ x: s.x, y: s.y })),
      ];
      const cx = allItems.reduce((sum, p) => sum + p.x, 0) / allItems.length;
      const cy = allItems.reduce((sum, p) => sum + p.y, 0) / allItems.length;

      set({
        clipboard: {
          seats: copiedSeats.map((s) => ({ ...s, x: s.x - cx, y: s.y - cy })),
          texts: copiedTexts.map((t) => ({ ...t, x: t.x - cx, y: t.y - cy })),
          shapes: copiedShapes.map((s) => ({ ...s, x: s.x - cx, y: s.y - cy })),
          cx,
          cy,
        },
        pasteCount: 0,
      });
    },

    pasteClipboard: () =>
      trackedSet((state) => {
        const { clipboard } = state;
        if (!clipboard) return state;

        const nextPasteCount = state.pasteCount + 1;
        const offset = nextPasteCount * 30;

        // Build max seat number per row from existing seats
        const maxNumberPerRow = {};
        state.seats.forEach((s) => {
          if (s.row) {
            maxNumberPerRow[s.row] = Math.max(
              maxNumberPerRow[s.row] || 0,
              s.number || 0,
            );
          }
        });

        // Track running count per row for pasted seats
        const pastedCountPerRow = {};
        const pastedGroupIdMap = new Map();

        const newSeatIds = [];
        const pastedSeats = clipboard.seats.map((s) => {
          const newId = createId(ELEMENT_TYPES.SEAT);
          newSeatIds.push(newId);
          const row = s.row || "A";
          if (!pastedCountPerRow[row]) pastedCountPerRow[row] = 0;
          pastedCountPerRow[row]++;
          const newNumber =
            (maxNumberPerRow[row] || 0) + pastedCountPerRow[row];
          const groupMetadata = getPastedSeatGroupMetadata(
            s,
            pastedGroupIdMap,
          );
          return {
            ...s,
            ...groupMetadata,
            id: newId,
            x: clipboard.cx + s.x + offset,
            y: clipboard.cy + s.y + offset,
            number: newNumber,
            label: generateSeatLabel(row, newNumber),
          };
        });

        const newTextIds = [];
        const pastedTexts = clipboard.texts.map((t) => {
          const newId = createId(ELEMENT_TYPES.TEXT);
          newTextIds.push(newId);
          return {
            ...t,
            id: newId,
            x: clipboard.cx + t.x + offset,
            y: clipboard.cy + t.y + offset,
          };
        });

        const newShapeIds = [];
        const pastedShapes = (clipboard.shapes || []).map((shape) => {
          const newId = createId(ELEMENT_TYPES.SHAPE);
          newShapeIds.push(newId);
          return {
            ...shape,
            id: newId,
            x: clipboard.cx + shape.x + offset,
            y: clipboard.cy + shape.y + offset,
          };
        });

        // Filter out seats that overlap existing ones
        const allExistingSeats = state.seats;
        const nonOverlapping = pastedSeats.filter(
          (s) =>
            !isOverlapping(
              s.x,
              s.y,
              allExistingSeats,
              s.radius ?? DEFAULT_SEAT_RADIUS,
            ),
        );

        return {
          seats: [...state.seats, ...nonOverlapping],
          texts: [...state.texts, ...pastedTexts],
          shapes: [...state.shapes, ...pastedShapes],
          selectedSeatIds: nonOverlapping.map((s) => s.id),
          selectedTextIds: newTextIds,
          selectedShapeIds: newShapeIds,
          pasteCount: nextPasteCount,
          activeTool: TOOL_SELECT,
        };
      }),
    cutSelection: () => {
      get().copySelection();
      get().deleteSelection();
    },
  };
}
