import { TOOL_SELECT } from '../constants/tools'
import { buildToolRegistry } from './toolRegistry'

export class ToolManager {
  constructor(storeActions) {
    this.tools = buildToolRegistry(storeActions)
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
