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
