import { SelectTool } from "./selectTool";
import { SeatTool } from "./seatTool";
import { RowTool } from "./rowTool";
import { ArcTool } from "./arcTool";
import { RotateTool } from "./rotateTool";
import { EraserTool } from "./eraserTool";
import { TextTool } from "./textTool";
import { ShapeTool } from "./shapeTool";
import {
  TOOL_SELECT,
  TOOL_SEAT,
  TOOL_ROW,
  TOOL_ARC,
  TOOL_ROTATE,
  TOOL_ERASER,
  TOOL_TEXT,
  TOOL_SHAPE,
} from "../constants/tools";

export const TOOL_REGISTRY = Object.freeze({
  [TOOL_SELECT]: SelectTool,
  [TOOL_SEAT]: SeatTool,
  [TOOL_ROW]: RowTool,
  [TOOL_ARC]: ArcTool,
  [TOOL_ROTATE]: RotateTool,
  [TOOL_ERASER]: EraserTool,
  [TOOL_TEXT]: TextTool,
  [TOOL_SHAPE]: ShapeTool,
});

export function buildToolRegistry(storeActions) {
  return Object.fromEntries(
    Object.entries(TOOL_REGISTRY).map(([toolId, ToolClass]) => [
      toolId,
      new ToolClass(storeActions),
    ]),
  );
}
