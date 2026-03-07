import { SelectTool } from './selectTool'
import { SeatTool } from './seatTool'
import { RowTool } from './rowTool'
import { ArcTool } from './arcTool'
import { EraserTool } from './eraserTool'
import { TextTool } from './textTool'
import { TOOL_SELECT, TOOL_SEAT, TOOL_ROW, TOOL_ARC, TOOL_ERASER, TOOL_TEXT } from '../constants/tools'

export class ToolManager {
  constructor(storeActions) {
    this.tools = {
      [TOOL_SELECT]: new SelectTool(storeActions),
      [TOOL_SEAT]: new SeatTool(storeActions),
      [TOOL_ROW]: new RowTool(storeActions),
      [TOOL_ARC]: new ArcTool(storeActions),
      [TOOL_ERASER]: new EraserTool(storeActions),
      [TOOL_TEXT]: new TextTool(storeActions),
    }
  }

  getTool(toolId) {
    return this.tools[toolId] || this.tools[TOOL_SELECT]
  }

  handleMouseDown(event, worldPoint, context) {
    const tool = this.getTool(context.activeTool)
    return tool.handleMouseDown(event, worldPoint, context)
  }

  handleMouseMove(event, worldPoint, context, session) {
    const tool = this.getTool(context.activeTool)
    return tool.handleMouseMove(event, worldPoint, context, session)
  }

  handleMouseUp(event, worldPoint, context, session) {
    const tool = this.getTool(context.activeTool)
    return tool.handleMouseUp(event, worldPoint, context, session)
  }

  handleClick(event, worldPoint, context) {
    const tool = this.getTool(context.activeTool)
    return tool.handleClick(event, worldPoint, context)
  }
}