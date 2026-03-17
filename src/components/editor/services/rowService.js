import { generateSeatLabel } from "../utils/seatNumbering";
import { createSeatGroupMetadata } from "./seatService";
import { ELEMENT_TYPES } from "../domain/elementTypes";

export const SMART_ROW_ANGLE_TOLERANCE = 5;
export const SMART_ROW_MIN_DISTANCE_SQUARED = 0.0001;

export function generateRowSeats(rowPoints, rowLetter, rowId) {
    const groupOptions = createSeatGroupMetadata(ELEMENT_TYPES.ROW, rowId);

    return rowPoints.map((point, index) => ({
        ...point,
        options: {
            row: rowLetter,
            number: index + 1,
            label: generateSeatLabel(rowLetter, index + 1),
            ...groupOptions,
        },
    }));
}
