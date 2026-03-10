/**
 * Text element model (documentation only).
 *
 * @typedef {Object} TextModel
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string} content
 * @property {number} [fontSize]
 * @property {string} [fill]
 * @property {"normal"|"bold"} [fontWeight]
 * @property {"normal"|"italic"} [fontStyle]
 * @property {number} [rotate]
 */

export const TEXT_MODEL_FIELDS = Object.freeze([
    "id",
    "x",
    "y",
    "content",
    "fontSize",
    "fill",
    "fontWeight",
    "fontStyle",
    "rotate",
]);
