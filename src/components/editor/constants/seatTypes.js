// Seat type definitions
export const SEAT_TYPES = Object.freeze({
  CHAIR: "chair",
  SOFA: "sofa",
  TABLE: "table",
  WHEELCHAIR: "wheelchair",
  ROUND_TABLE: "roundTable",
});

export const SEAT_TYPE_CONFIG = Object.freeze({
  [SEAT_TYPES.CHAIR]: {
    label: "Chair",
    defaultWidth: 24,
    defaultHeight: 24,
    minSize: 14,
    maxSize: 50,
  },
  [SEAT_TYPES.SOFA]: {
    label: "Sofa",
    defaultWidth: 60,
    defaultHeight: 28,
    minSize: 35,
    maxSize: 120,
  },
  [SEAT_TYPES.TABLE]: {
    label: "Table",
    defaultWidth: 50,
    defaultHeight: 40,
    minSize: 30,
    maxSize: 150,
  },
  [SEAT_TYPES.WHEELCHAIR]: {
    label: "Wheelchair",
    defaultWidth: 32,
    defaultHeight: 32,
    minSize: 25,
    maxSize: 60,
  },
  [SEAT_TYPES.ROUND_TABLE]: {
    label: "Round Table",
    defaultWidth: 45,
    defaultHeight: 45,
    minSize: 30,
    maxSize: 140,
  },
});
