/**
 * Seat element model (documentation only).
 *
 * @typedef {Object} SeatModel
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} [rotation]
 * @property {string|null} [label]
 * @property {string|null} [groupId]
 * @property {"row"|"arc"|null} [groupType]
 * @property {string|null} [rowId]
 * @property {string|null} [arcId]
 * @property {string|null} [category]
 * @property {number} [radius]
 * @property {number} [size]
 * @property {string} [fill]
 * @property {string} [stroke]
 * @property {string|null} [row]
 * @property {number|null} [number]
 * @property {"available"|"reserved"|"sold"|"locked"} [status]
 * @property {number|null} [price]
 */

export const SEAT_MODEL_FIELDS = Object.freeze([
    "id",
    "x",
    "y",
    "rotation",
    "label",
    "groupId",
    "groupType",
    "rowId",
    "arcId",
    "category",
    "radius",
    "size",
    "fill",
    "stroke",
    "row",
    "number",
    "status",
    "price",
]);
