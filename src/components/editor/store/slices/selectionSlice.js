// ─── Selection Slice ──────────────────────────────────────────────────────────
// Manages seat/text selection, smart row selection, marquee, and copy/paste.

import { TOOL_SELECT } from "../../constants/tools";
import {
    DEFAULT_SEAT_RADIUS,
    SMART_ROW_ANGLE_TOLERANCE,
    SMART_ROW_MIN_DISTANCE_SQUARED,
    createId,
    isOverlapping,
} from "./seatHelpers";
import { generateSeatLabel } from "../../utils/seatNumbering";

export function createSelectionSlice(set, get, { trackedSet }) {
    return {
        // State
        selectedSeatIds: [],
        selectedTextIds: [],
        clipboard: null,
        pasteCount: 0,

        // Actions
        clearSelection: () => set({ selectedSeatIds: [], selectedTextIds: [] }),

        selectSeat: (seatId, isMulti) =>
            set((state) => {
                if (state.activeTool !== TOOL_SELECT) return state;

                if (!isMulti) return { selectedSeatIds: [seatId] };

                if (state.selectedSeatIds.includes(seatId)) {
                    return {
                        selectedSeatIds: state.selectedSeatIds.filter(
                            (id) => id !== seatId,
                        ),
                    };
                }
                return { selectedSeatIds: [...state.selectedSeatIds, seatId] };
            }),

        selectText: (textId, shiftKey) =>
            set((state) => {
                if (state.activeTool !== TOOL_SELECT) return state;

                if (!shiftKey) return { selectedTextIds: [textId] };

                if (state.selectedTextIds.includes(textId)) {
                    return {
                        selectedTextIds: state.selectedTextIds.filter(
                            (id) => id !== textId,
                        ),
                    };
                }
                return { selectedTextIds: [...state.selectedTextIds, textId] };
            }),

        smartRowSelect: (seatId, event) =>
            set((state) => {
                if (state.activeTool !== TOOL_SELECT) return state;

                const clickedSeat = state.seats.find((s) => s.id === seatId);
                if (!clickedSeat) return state;

                const bucketCounts = new Map();
                let dominantBucketKey = null;
                let dominantBucketCount = 0;

                for (const seat of state.seats) {
                    if (seat.id === seatId) continue;

                    const dx = seat.x - clickedSeat.x;
                    const dy = seat.y - clickedSeat.y;
                    const distanceSquared = dx * dx + dy * dy;

                    if (distanceSquared <= SMART_ROW_MIN_DISTANCE_SQUARED) continue;

                    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
                    if (angleDeg < 0) angleDeg += 180;
                    else if (angleDeg >= 180) angleDeg -= 180;

                    const bucketKey =
                        Math.round(angleDeg / SMART_ROW_ANGLE_TOLERANCE) *
                        SMART_ROW_ANGLE_TOLERANCE;
                    const nextCount = (bucketCounts.get(bucketKey) ?? 0) + 1;
                    bucketCounts.set(bucketKey, nextCount);

                    if (nextCount > dominantBucketCount) {
                        dominantBucketCount = nextCount;
                        dominantBucketKey = bucketKey;
                    }
                }

                if (dominantBucketKey === null || dominantBucketCount < 2) return state;

                const angleRad = dominantBucketKey * (Math.PI / 180);
                const ux = Math.cos(angleRad);
                const uy = Math.sin(angleRad);
                const rowSeats = [];

                for (const seat of state.seats) {
                    const dx = seat.x - clickedSeat.x;
                    const dy = seat.y - clickedSeat.y;
                    const distance = Math.abs(dx * uy - dy * ux);
                    const seatRadius = seat.radius ?? DEFAULT_SEAT_RADIUS;

                    if (distance < seatRadius * 1.2) {
                        rowSeats.push({ id: seat.id, projection: dx * ux + dy * uy });
                    }
                }

                if (rowSeats.length === 0) return state;

                rowSeats.sort((a, b) => a.projection - b.projection);
                const rowSeatIds = rowSeats.map((s) => s.id);

                if (event?.evt?.shiftKey || event?.shiftKey) {
                    return {
                        selectedSeatIds: [
                            ...new Set([...state.selectedSeatIds, ...rowSeatIds]),
                        ],
                    };
                }
                return { selectedSeatIds: rowSeatIds };
            }),

        marqueeSelect: (seatIds, textIds, shiftKey) =>
            set((state) => {
                if (state.activeTool !== TOOL_SELECT) return state;

                if (!shiftKey) {
                    return { selectedSeatIds: seatIds, selectedTextIds: textIds };
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
                return updates;
            }),

        copySelection: () => {
            const { seats, texts, selectedSeatIds, selectedTextIds } = get();
            const copiedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
            const copiedTexts = texts.filter((t) => selectedTextIds.includes(t.id));
            if (copiedSeats.length === 0 && copiedTexts.length === 0) return;

            // Compute centroid so paste positions are relative
            const allItems = [
                ...copiedSeats.map((s) => ({ x: s.x, y: s.y })),
                ...copiedTexts.map((t) => ({ x: t.x, y: t.y })),
            ];
            const cx = allItems.reduce((sum, p) => sum + p.x, 0) / allItems.length;
            const cy = allItems.reduce((sum, p) => sum + p.y, 0) / allItems.length;

            set({
                clipboard: {
                    seats: copiedSeats.map((s) => ({ ...s, x: s.x - cx, y: s.y - cy })),
                    texts: copiedTexts.map((t) => ({ ...t, x: t.x - cx, y: t.y - cy })),
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

                const newSeatIds = [];
                const pastedSeats = clipboard.seats.map((s) => {
                    const newId = createId("seat");
                    newSeatIds.push(newId);
                    const row = s.row || "A";
                    if (!pastedCountPerRow[row]) pastedCountPerRow[row] = 0;
                    pastedCountPerRow[row]++;
                    const newNumber =
                        (maxNumberPerRow[row] || 0) + pastedCountPerRow[row];
                    return {
                        ...s,
                        id: newId,
                        x: clipboard.cx + s.x + offset,
                        y: clipboard.cy + s.y + offset,
                        number: newNumber,
                        label: generateSeatLabel(row, newNumber),
                    };
                });

                const newTextIds = [];
                const pastedTexts = clipboard.texts.map((t) => {
                    const newId = createId("text");
                    newTextIds.push(newId);
                    return {
                        ...t,
                        id: newId,
                        x: clipboard.cx + t.x + offset,
                        y: clipboard.cy + t.y + offset,
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
                    selectedSeatIds: nonOverlapping.map((s) => s.id),
                    selectedTextIds: newTextIds,
                    pasteCount: nextPasteCount,
                    activeTool: TOOL_SELECT,
                };
            }),
    };
}
