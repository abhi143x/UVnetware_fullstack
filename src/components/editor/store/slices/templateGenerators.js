// ─── Template Generators ──────────────────────────────────────────────────────
// Venue template data generators. Depends only on services and seatNumbering.

import { getRowLetter, generateSeatLabel } from "../../utils/seatNumbering";
import {
    createId,
    createSeat,
    createSeatGroupMetadata,
} from "../../services/seatService";
import { ELEMENT_TYPES } from "../../domain/elementTypes";

function createGroupedSeat(point, rowLetter, number, groupType, groupId) {
    return createSeat(point, {
        row: rowLetter,
        number,
        label: generateSeatLabel(rowLetter, number),
        ...createSeatGroupMetadata(groupType, groupId),
    });
}

function createGroupedRowSeat(point, rowLetter, number, rowId) {
    return createGroupedSeat(
        point,
        rowLetter,
        number,
        ELEMENT_TYPES.ROW,
        rowId,
    );
}

function createGroupedArcSeat(point, rowLetter, number, arcId) {
    return createGroupedSeat(
        point,
        rowLetter,
        number,
        ELEMENT_TYPES.ARC,
        arcId,
    );
}

export function generateSmallTheater() {
    const seats = [];
    const texts = [];
    const rows = 5;
    const seatsPerRow = 12;
    const spacing = 32;
    const startX = -(seatsPerRow * spacing) / 2;
    const startY = -(rows * spacing) / 2;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const rowId = createId(ELEMENT_TYPES.ROW);
        for (let s = 0; s < seatsPerRow; s++) {
            seats.push(
                createGroupedRowSeat(
                    { x: startX + s * spacing, y: startY + r * spacing },
                    rowLetter,
                    s + 1,
                    rowId,
                ),
            );
        }
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: startY - 40,
        content: "SCREEN",
        fontSize: 24,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Small Theater",
        description: "5 rows × 12 seats — intimate screening room",
        seatCount: rows * seatsPerRow,
        nextRowIndex: rows,
    };
}

export function generateMediumHall() {
    const seats = [];
    const texts = [];
    const rows = 10;
    const seatsPerRow = 15;
    const spacing = 30;
    const startX = -(seatsPerRow * spacing) / 2;
    const startY = -(rows * spacing) / 2;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const rowId = createId(ELEMENT_TYPES.ROW);
        for (let s = 0; s < seatsPerRow; s++) {
            seats.push(
                createGroupedRowSeat(
                    { x: startX + s * spacing, y: startY + r * spacing },
                    rowLetter,
                    s + 1,
                    rowId,
                ),
            );
        }
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: startY - 40,
        content: "STAGE",
        fontSize: 28,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Medium Hall",
        description: "10 rows × 15 seats — standard auditorium",
        seatCount: rows * seatsPerRow,
        nextRowIndex: rows,
    };
}

export function generateLargeArena() {
    const seats = [];
    const texts = [];
    const rows = 15;
    const baseSeats = 14;
    const spacing = 30;
    const centerY = 0;
    let rowIndex = 0;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const arcId = createId(ELEMENT_TYPES.ARC);
        const seatsInRow = baseSeats + Math.floor(r * 1.5);
        const curveRadius = 200 + r * spacing;
        const angleSpan = Math.min(
            Math.PI * 0.7,
            (seatsInRow * spacing) / curveRadius,
        );
        const startAngle = Math.PI / 2 - angleSpan / 2;

        for (let s = 0; s < seatsInRow; s++) {
            const angle = startAngle + (s / (seatsInRow - 1 || 1)) * angleSpan;
            const x = Math.cos(angle) * curveRadius;
            const y = centerY + curveRadius - Math.sin(angle) * curveRadius;
            seats.push(
                createGroupedArcSeat(
                    { x, y },
                    rowLetter,
                    s + 1,
                    arcId,
                ),
            );
        }
        rowIndex++;
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: -30,
        content: "STAGE",
        fontSize: 32,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Large Arena",
        description: "15 curved rows — arena-style venue",
        seatCount: seats.length,
        nextRowIndex: rowIndex,
    };
}

export function generateConferenceRoom() {
    const seats = [];
    const texts = [];
    const sections = [
        { label: "Left Block", offsetX: -160, rows: 4, cols: 4 },
        { label: "Center Block", offsetX: 0, rows: 4, cols: 8 },
        { label: "Right Block", offsetX: 160, rows: 4, cols: 4 },
    ];
    const spacing = 30;
    let rowIndex = 0;

    sections.forEach((section) => {
        const startX = section.offsetX - (section.cols * spacing) / 2;
        const startY = -60;
        for (let r = 0; r < section.rows; r++) {
            const rowLetter = getRowLetter(rowIndex + r);
            const rowId = createId(ELEMENT_TYPES.ROW);
            for (let c = 0; c < section.cols; c++) {
                seats.push(
                    createGroupedRowSeat(
                        { x: startX + c * spacing, y: startY + r * spacing },
                        rowLetter,
                        c + 1,
                        rowId,
                    ),
                );
            }
        }
        rowIndex += section.rows;
        texts.push({
            id: createId(ELEMENT_TYPES.TEXT),
            x: section.offsetX,
            y: startY - 30,
            content: section.label,
            fontSize: 14,
            fill: "#587cb3",
            fontWeight: "normal",
            fontStyle: "normal",
            rotate: 0,
        });
    });

    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: -120,
        content: "PODIUM",
        fontSize: 22,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Conference Room",
        description: "3 blocks — seminar/conference layout",
        seatCount: seats.length,
        nextRowIndex: rowIndex,
    };
}

export function generateAmphitheater() {
    const seats = [];
    const texts = [];
    const rows = 10;
    const spacing = 30;
    let rowIndex = 0;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const arcId = createId(ELEMENT_TYPES.ARC);
        const radius = 120 + r * spacing;
        const seatsInRow = Math.floor((Math.PI * radius) / spacing);
        const limitedSeats = Math.min(seatsInRow, 12 + r * 2);
        const angleSpan = Math.PI * 0.85;
        const startAngle = (Math.PI - angleSpan) / 2;

        for (let s = 0; s < limitedSeats; s++) {
            const angle = startAngle + (s / (limitedSeats - 1 || 1)) * angleSpan;
            const x = Math.cos(angle) * radius;
            const y = -Math.sin(angle) * radius + radius;
            seats.push(
                createGroupedArcSeat(
                    { x, y },
                    rowLetter,
                    s + 1,
                    arcId,
                ),
            );
        }
        rowIndex++;
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: -30,
        content: "STAGE",
        fontSize: 28,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Amphitheater",
        description: "10 concentric arcs — classic amphitheater",
        seatCount: seats.length,
        nextRowIndex: rowIndex,
    };
}

export function generateBus() {
    const seats = [];
    const texts = [];
    const rows = 10;
    const spacing = 30;
    const aisleGap = 28;
    let rowIndex = 0;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const rowId = createId(ELEMENT_TYPES.ROW);
        // Left pair
        seats.push(
            createGroupedRowSeat(
                { x: -spacing - aisleGap / 2, y: r * spacing },
                rowLetter,
                1,
                rowId,
            ),
        );
        seats.push(
            createGroupedRowSeat(
                { x: -aisleGap / 2, y: r * spacing },
                rowLetter,
                2,
                rowId,
            ),
        );
        // Right pair
        seats.push(
            createGroupedRowSeat(
                { x: aisleGap / 2, y: r * spacing },
                rowLetter,
                3,
                rowId,
            ),
        );
        seats.push(
            createGroupedRowSeat(
                { x: spacing + aisleGap / 2, y: r * spacing },
                rowLetter,
                4,
                rowId,
            ),
        );
        rowIndex++;
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: -40,
        content: "DRIVER",
        fontSize: 18,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Bus",
        description: "2+2 seating — standard bus layout",
        seatCount: rows * 4,
        nextRowIndex: rowIndex,
    };
}

export function generateTrain() {
    const seats = [];
    const texts = [];
    const coaches = 2;
    const rowsPerCoach = 7;
    const spacing = 30;
    const aisleGap = 28;
    const coachGap = 60;
    let rowIndex = 0;

    for (let coach = 0; coach < coaches; coach++) {
        const coachOffset = coach * (rowsPerCoach * spacing + coachGap);
        for (let r = 0; r < rowsPerCoach; r++) {
            const rowLetter = getRowLetter(rowIndex);
            const rowId = createId(ELEMENT_TYPES.ROW);
            // Left pair
            seats.push(
                createGroupedRowSeat(
                    { x: -spacing - aisleGap / 2, y: coachOffset + r * spacing },
                    rowLetter,
                    1,
                    rowId,
                ),
            );
            seats.push(
                createGroupedRowSeat(
                    { x: -aisleGap / 2, y: coachOffset + r * spacing },
                    rowLetter,
                    2,
                    rowId,
                ),
            );
            // Right pair
            seats.push(
                createGroupedRowSeat(
                    { x: aisleGap / 2, y: coachOffset + r * spacing },
                    rowLetter,
                    3,
                    rowId,
                ),
            );
            seats.push(
                createGroupedRowSeat(
                    { x: spacing + aisleGap / 2, y: coachOffset + r * spacing },
                    rowLetter,
                    4,
                    rowId,
                ),
            );
            rowIndex++;
        }
        texts.push({
            id: createId(ELEMENT_TYPES.TEXT),
            x: 0,
            y: coachOffset - 25,
            content: `Coach ${coach + 1}`,
            fontSize: 14,
            fill: "#587cb3",
            fontWeight: "bold",
            fontStyle: "normal",
            rotate: 0,
        });
    }
    return {
        seats,
        texts,
        name: "Train Coach",
        description: "2 coaches × 2+2 — railway coach",
        seatCount: coaches * rowsPerCoach * 4,
        nextRowIndex: rowIndex,
    };
}

export function generateMovieTheatre() {
    const seats = [];
    const texts = [];
    const rows = 12;
    const aisleGap = 40;
    const spacing = 28;
    let rowIndex = 0;

    for (let r = 0; r < rows; r++) {
        const rowLetter = getRowLetter(r);
        const rowId = createId(ELEMENT_TYPES.ROW);
        const seatsLeft = 6 + Math.floor(r * 0.3);
        const seatsRight = seatsLeft;
        // Left section
        for (let s = 0; s < seatsLeft; s++) {
            seats.push(
                createGroupedRowSeat(
                    {
                        x: -(aisleGap / 2) - (seatsLeft - s) * spacing,
                        y: r * (spacing + 2),
                    },
                    rowLetter,
                    s + 1,
                    rowId,
                ),
            );
        }
        // Right section
        for (let s = 0; s < seatsRight; s++) {
            seats.push(
                createGroupedRowSeat(
                    { x: aisleGap / 2 + s * spacing, y: r * (spacing + 2) },
                    rowLetter,
                    seatsLeft + s + 1,
                    rowId,
                ),
            );
        }
        rowIndex++;
    }
    texts.push({
        id: createId(ELEMENT_TYPES.TEXT),
        x: 0,
        y: -50,
        content: "SCREEN",
        fontSize: 28,
        fill: "#7a8a9e",
        fontWeight: "bold",
        fontStyle: "normal",
        rotate: 0,
    });
    return {
        seats,
        texts,
        name: "Movie Theatre",
        description: "12 tiered rows with center aisle",
        seatCount: seats.length,
        nextRowIndex: rowIndex,
    };
}

export const VENUE_TEMPLATES = [
    {
        id: "movie-theatre",
        name: "Movie Theatre",
        description: "12 tiered rows with center aisle",
        seatCount: "~180",
        generator: generateMovieTheatre,
    },
    {
        id: "small-theater",
        name: "Small Theater",
        description: "5 rows × 12 seats — intimate screening room",
        seatCount: 60,
        generator: generateSmallTheater,
    },
    {
        id: "bus",
        name: "Bus",
        description: "2+2 seating — standard bus layout",
        seatCount: 40,
        generator: generateBus,
    },
    {
        id: "train",
        name: "Train Coach",
        description: "2 coaches × 2+2 — railway coach",
        seatCount: 56,
        generator: generateTrain,
    },
    {
        id: "medium-hall",
        name: "Medium Hall",
        description: "10 rows × 15 seats — standard auditorium",
        seatCount: 150,
        generator: generateMediumHall,
    },
    {
        id: "large-arena",
        name: "Large Arena",
        description: "15 curved rows — arena-style venue",
        seatCount: "~300",
        generator: generateLargeArena,
    },
    {
        id: "conference-room",
        name: "Conference Room",
        description: "3 blocks — seminar/conference layout",
        seatCount: 48,
        generator: generateConferenceRoom,
    },
    {
        id: "amphitheater",
        name: "Amphitheater",
        description: "10 concentric arcs — classic amphitheater",
        seatCount: "~200",
        generator: generateAmphitheater,
    },
];
