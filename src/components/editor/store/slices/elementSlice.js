// ─── Element Slice ────────────────────────────────────────────────────────────
// Manages seats, texts, categories, and all element mutation actions.

import {
    TOOL_TEXT,
    TOOL_SEAT,
    TOOL_SELECT,
    TOOL_ROW,
    TOOL_ARC,
    TOOL_ERASER,
} from "../../constants/tools";
import {
    generateSeatLabel,
    assignRowNumbers,
} from "../../utils/seatNumbering";
import { getRowLetter } from "../../utils/seatNumbering";
import {
    DEFAULT_SEAT_RADIUS,
    createId,
    createSeat,
    isOverlapping,
    buildCollisionIndex,
    addSeatToCollisionIndex,
    isOverlappingWithCollisionIndex,
    getMaxSeatRadius,
    appendNonOverlappingSeats,
    COLLISION_INDEX_CELL_SIZE,
} from "./seatHelpers";
import { ELEMENT_TYPES } from "../../domain/elementTypes";

const DEFAULT_CATEGORIES = [
    { id: "vip", name: "VIP", color: "#ffd700", price: null },
    { id: "standard", name: "Standard", color: "#5fa7ff", price: null },
    { id: "balcony", name: "Balcony", color: "#9b59b6", price: null },
];

export function createElementSlice(set, get, { trackedSet, persisted }) {
    return {
        // State
        seats: persisted.seats,
        texts: persisted.texts,
        categories:
            Array.isArray(persisted.categories) && persisted.categories.length > 0
                ? persisted.categories
                : DEFAULT_CATEGORIES,
        nextRowIndex: persisted.nextRowIndex || 0,

        // ─── Text & Seat Updates ─────────────────────────────────────────────────

        updateText: (textId, updates) =>
            trackedSet((state) => ({
                texts: state.texts.map((t) =>
                    t.id === textId ? { ...t, ...updates } : t,
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
                // Find the highest row index used
                let maxRowIndex = -1;
                updatedSeats.forEach((seat) => {
                    if (seat.row) {
                        // Convert row letter back to index
                        const rowChar = seat.row[0];
                        const rowIndex = rowChar.charCodeAt(0) - 65;
                        if (seat.row.length > 1) {
                            // Handle AA, AB, etc.
                            const secondChar = seat.row[1];
                            const secondIndex = secondChar.charCodeAt(0) - 65;
                            maxRowIndex = Math.max(
                                maxRowIndex,
                                26 + rowIndex * 26 + secondIndex,
                            );
                        } else {
                            maxRowIndex = Math.max(maxRowIndex, rowIndex);
                        }
                    }
                });
                return {
                    seats: updatedSeats,
                    nextRowIndex: maxRowIndex + 1,
                };
            }),

        // ─── World Click (seat/text placement) ───────────────────────────────────

        handleWorldClick: (worldPoint) =>
            trackedSet((state) => {
                if (state.activeTool === TOOL_SELECT) {
                    return { selectedSeatIds: [], selectedTextIds: [] };
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
                    };
                }
                if (state.activeTool === TOOL_SEAT) {
                    if (isOverlapping(worldPoint.x, worldPoint.y, state.seats))
                        return state;
                    return { seats: [...state.seats, createSeat(worldPoint)] };
                }
                return state;
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
            trackedSet((state) => {
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
                        // Skip updating this seat's position, it hit something
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
                    addSeatToCollisionIndex(
                        collisionIndex,
                        newSeat,
                        COLLISION_INDEX_CELL_SIZE,
                    );
                }

                if (!hasAnyPositionChange || acceptedMovedSeats.size === 0)
                    return state;

                return {
                    seats: state.seats.map((s) => acceptedMovedSeats.get(s.id) ?? s),
                };
            }),

        moveTexts: (textUpdates) =>
            trackedSet((state) => {
                if (!textUpdates.length) return state;
                const updatesById = new Map(textUpdates.map((u) => [u.id, u]));

                return {
                    texts: state.texts.map((t) => {
                        const update = updatesById.get(t.id);
                        if (!update) return t;
                        return { ...t, x: update.x, y: update.y };
                    }),
                };
            }),

        // ─── Erase ───────────────────────────────────────────────────────────────

        eraseSeat: (seatId) =>
            trackedSet((state) => {
                if (state.activeTool !== TOOL_ERASER) return state;

                const selectedSet = new Set(state.selectedSeatIds);
                if (selectedSet.has(seatId)) {
                    return {
                        seats: state.seats.filter((s) => !selectedSet.has(s.id)),
                        selectedSeatIds: [],
                    };
                }
                return { seats: state.seats.filter((s) => s.id !== seatId) };
            }),

        eraseText: (textId) =>
            trackedSet((state) => {
                if (state.activeTool !== TOOL_ERASER) return state;

                const selectedSet = new Set(state.selectedTextIds);
                if (selectedSet.has(textId)) {
                    return {
                        texts: state.texts.filter((t) => !selectedSet.has(t.id)),
                        selectedTextIds: [],
                    };
                }
                return { texts: state.texts.filter((t) => t.id !== textId) };
            }),

        // ─── Commit Row / Arc ─────────────────────────────────────────────────────

        commitRow: (rowPoints) =>
            trackedSet((state) => {
                if (state.activeTool !== TOOL_ROW || rowPoints.length === 0)
                    return state;

                const currentRowIndex = state.nextRowIndex;
                const rowLetter = getRowLetter(currentRowIndex);

                // Create seat options for each point in the row
                const seatsWithOptions = rowPoints.map((point, index) => ({
                    ...point,
                    options: {
                        row: rowLetter,
                        number: index + 1,
                        label: generateSeatLabel(rowLetter, index + 1),
                    },
                }));

                return {
                    seats: appendNonOverlappingSeats(state.seats, seatsWithOptions),
                    nextRowIndex: currentRowIndex + 1,
                };
            }),

        commitArc: (arcPoints) =>
            trackedSet((state) => {
                if (state.activeTool !== TOOL_ARC || arcPoints.length === 0)
                    return state;

                const currentRowIndex = state.nextRowIndex;
                const rowLetter = getRowLetter(currentRowIndex);

                // Create seat options for each point in the arc
                const seatsWithOptions = arcPoints.map((point, index) => ({
                    ...point,
                    options: {
                        row: rowLetter,
                        number: index + 1,
                        label: generateSeatLabel(rowLetter, index + 1),
                    },
                }));

                return {
                    seats: appendNonOverlappingSeats(state.seats, seatsWithOptions),
                    nextRowIndex: currentRowIndex + 1,
                };
            }),

        // ─── Rotate Selection ─────────────────────────────────────────────────────

        rotateSelection: (angle) =>
            trackedSet((state) => {
                const selected = state.seats.filter((seat) =>
                    state.selectedSeatIds.includes(seat.id),
                );

                if (selected.length === 0) return state;

                const cx = selected.reduce((sum, s) => sum + s.x, 0) / selected.length;
                const cy = selected.reduce((sum, s) => sum + s.y, 0) / selected.length;

                const rotatedSeats = state.seats.map((seat) => {
                    if (!state.selectedSeatIds.includes(seat.id)) return seat;

                    const dx = seat.x - cx;
                    const dy = seat.y - cy;

                    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
                    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);

                    return {
                        ...seat,
                        x: cx + rx,
                        y: cy + ry,
                    };
                });

                return { seats: rotatedSeats };
            }),
    };
}
