import { ELEMENT_TYPES } from "../domain/elementTypes";

export const TOOL_SELECT = "select";
export const TOOL_SEAT = ELEMENT_TYPES.SEAT;
export const TOOL_ROW = ELEMENT_TYPES.ROW;
export const TOOL_ARC = ELEMENT_TYPES.ARC;
export const TOOL_ERASER = "eraser";
export const TOOL_TEXT = ELEMENT_TYPES.TEXT;
export const TOOL_SHAPE = ELEMENT_TYPES.SHAPE;
export const TOOL_ROTATE = "rotate";

export const TOOLS = [
  { id: TOOL_SELECT, label: "Select" },
  { id: TOOL_SEAT, label: "Seat" },
  { id: TOOL_ROW, label: "Row" },
  { id: TOOL_ARC, label: "Arc" },
  { id: TOOL_ERASER, label: "Eraser" },
  { id: TOOL_TEXT, label: "Text" },
  { id: TOOL_SHAPE, label: "Shape" },
];

export const TOOL_INFO = {
  [TOOL_SELECT]: {
    name: "Select",
    description: "Select, move, and edit elements",
    shortcut: "V",
    modifier: { key: "Shift", action: "Multi-select" },
  },
  [TOOL_SEAT]: {
    name: "Seat",
    description: "Place individual seats on the canvas",
    shortcut: "S",
  },
  [TOOL_ROW]: {
    name: "Row",
    description: "Draw a straight row of seats",
    shortcut: "R",
    modifier: { key: "Shift", action: "Snap straight to 15° angle" },
  },
  [TOOL_ARC]: {
    name: "Arc",
    description: "Draw a curved arc of seats",
    shortcut: "A",
  },
  [TOOL_ERASER]: {
    name: "Eraser",
    description: "Click elements to remove them",
    shortcut: "E",
  },
  [TOOL_TEXT]: {
    name: "Text",
    description: "Add text labels",
    shortcut: "T",
  },
  [TOOL_SHAPE]: {
    name: "Shape",
    description: "Draw structural shapes",
    shortcut: "P",
  },
  [TOOL_ROTATE]: {
    name: "Rotate",
    description: "Rotate selected elements",
    shortcut: null,
  },
};

export const ACTION_INFO = {
  undo: {
    name: "Undo",
    description: "Revert the last action",
    shortcut: null,
    modifier: { key: "Ctrl+Z", action: "Shortcut" },
  },
  redo: {
    name: "Redo",
    description: "Restore the last undone action",
    shortcut: null,
    modifier: { key: "Ctrl+Shift+Z", action: "Shortcut" },
  },
};
