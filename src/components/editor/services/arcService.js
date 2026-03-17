import { generateSeatLabel } from "../utils/seatNumbering";
import { createSeatGroupMetadata } from "./seatService";
import { ELEMENT_TYPES } from "../domain/elementTypes";

export function generateArcSeats(arcPoints, rowLetter, arcId) {
    const groupOptions = createSeatGroupMetadata(ELEMENT_TYPES.ARC, arcId);

    return arcPoints.map((point, index) => ({
        ...point,
        options: {
            row: rowLetter,
            number: index + 1,
            label: generateSeatLabel(rowLetter, index + 1),
            ...groupOptions,
        },
    }));
}
