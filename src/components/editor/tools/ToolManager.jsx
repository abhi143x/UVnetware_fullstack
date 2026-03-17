import { TOOL_SELECT } from "../constants/tools";
import { buildToolRegistry } from "./toolRegistry";

export class ToolManager {
  constructor(storeActions) {
    this.tools = buildToolRegistry(storeActions);
  }

  getTool(toolId) {
    return this.tools[toolId] || this.tools[TOOL_SELECT];
  }

  handleMouseDown(event, worldPoint, context) {
    const tool = this.getTool(context.activeTool);
    return tool.handleMouseDown(event, worldPoint, context);
  }

  handleMouseMove(event, worldPoint, context, session) {
    const tool = this.getTool(context.activeTool);
    return tool.handleMouseMove(event, worldPoint, context, session);
  }

  handleMouseUp(event, worldPoint, context, session) {
    const tool = this.getTool(context.activeTool);
    return tool.handleMouseUp(event, worldPoint, context, session);
  }

  handleClick(event, worldPoint, context) {
    const tool = this.getTool(context.activeTool);
    return tool.handleClick(event, worldPoint, context);
  }

  handleContextMenu(event, worldPoint, context, session) {
    const tool = this.getTool(context.activeTool);
    if (typeof tool.handleContextMenu !== "function") {
      return { handled: false, session };
    }

    const result = tool.handleContextMenu(event, worldPoint, context, session);
    if (!result) {
      return { handled: false, session };
    }
    return result;
  }

  handleKeyDown(event, context, session) {
    const tool = this.getTool(context.activeTool);
    if (typeof tool.handleKeyDown !== "function") {
      return { handled: false, session };
    }

    const result = tool.handleKeyDown(event, context, session);
    if (!result) {
      return { handled: false, session };
    }
    return result;
  }
}
