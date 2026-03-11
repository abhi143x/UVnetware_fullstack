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
                return {
                    seats: updatedSeats,
                    nextRowIndex: deriveNextRowIndexFromSeats(updatedSeats),
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
                    const newSeat = generateSeat(worldPoint);
                    return { seats: [...state.seats, newSeat] };
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

        // Auto-align selected seats to grid and ensure consistent spacing
        alignSelection: (gridSize = 40) => {
            const state = get();
            const selectedSeats = state.seats.filter(seat => 
                state.selectedSeatIds.includes(seat.id)
            );

            if (selectedSeats.length === 0) return;

            // Group seats by row for row-specific alignment
            const seatsByRow = {};
            selectedSeats.forEach(seat => {
                const rowKey = seat.row || 'unassigned';
                if (!seatsByRow[rowKey]) seatsByRow[rowKey] = [];
                seatsByRow[rowKey].push(seat);
            });

            const alignedSeats = state.seats.map(seat => {
                if (!state.selectedSeatIds.includes(seat.id)) return seat;

                // If seat has a row, align with other seats in the same row
                if (seat.row && seatsByRow[seat.row] && seatsByRow[seat.row].length > 1) {
                    const rowSeats = seatsByRow[seat.row];
                    
                    // Sort by original x position to determine order
                    rowSeats.sort((a, b) => a.x - b.x);
                    const seatIndex = rowSeats.findIndex(s => s.id === seat.id);
                    
                    // Find the average y position of the row for straight alignment
                    const avgY = rowSeats.reduce((sum, s) => sum + s.y, 0) / rowSeats.length;
                    const alignedY = Math.round(avgY / gridSize) * gridSize;
                    
                    // Calculate ideal spacing (tighter for better appearance)
                    const baseSpacing = gridSize * 1.2; // 48px spacing for nicer look
                    
                    // Find the leftmost seat position and align it to grid
                    const leftmostX = Math.min(...rowSeats.map(s => s.x));
                    const alignedLeftmost = Math.round(leftmostX / gridSize) * gridSize;
                    
                    // Position based on index with consistent spacing
                    const targetX = alignedLeftmost + (seatIndex * baseSpacing);
                    
                    return {
                        ...seat,
                        x: targetX,
                        y: alignedY,
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
