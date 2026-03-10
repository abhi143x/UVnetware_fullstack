import { generateSeatLabel } from "../utils/seatNumbering";

export function generateArcSeats(arcPoints, rowLetter) {
    return arcPoints.map((point, index) => ({
        ...point,
        options: {
            row: rowLetter,
            number: index + 1,
            label: generateSeatLabel(rowLetter, index + 1),
        },
    }));
}
