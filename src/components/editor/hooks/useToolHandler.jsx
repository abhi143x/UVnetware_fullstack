import { useCallback, useRef, useState } from "react";
import { ToolManager } from "../tools/ToolManager";
import { TOOL_ERASER } from "../constants/tools";
import { TOOL_SELECT } from "../constants/tools";

export function useToolHandler(storeActions) {
  const toolManagerRef = useRef(null);
  const [toolSession, setToolSession] = useState(null);

  if (toolManagerRef.current == null) {
    toolManagerRef.current = new ToolManager(storeActions);
  }
  const toolManager = toolManagerRef.current;

  const handleMouseDown = useCallback(
    (event, worldPoint, context) => {
      const session = toolManager.handleMouseDown(event, worldPoint, context);
      setToolSession(session);
    },
    [toolManager],
  );

  const handleMouseMove = useCallback(
    (event, worldPoint, context) => {
      if (
        !toolSession &&
        context.activeTool !== TOOL_ERASER &&
        context.activeTool !== TOOL_SELECT
      )
        return;

      const newSession = toolManager.handleMouseMove(
        event,
        worldPoint,
        context,
        toolSession,
      );
      setToolSession(newSession);
    },
    [toolManager, toolSession],
  );

  const handleMouseUp = useCallback(
    (event, worldPoint, context) => {
      if (toolSession) {
        const nextSession = toolManager.handleMouseUp(
          event,
          worldPoint,
          context,
          toolSession,
        );
        setToolSession(nextSession ?? null);
      }
    },
    [toolManager, toolSession],
  );

  const handleClick = useCallback(
    (event, worldPoint, context) => {
      toolManager.handleClick(event, worldPoint, context);
    },
    [toolManager],
  );

  const handleContextMenu = useCallback(
    (event, worldPoint, context) => {
      const { handled, session } = toolManager.handleContextMenu(
        event,
        worldPoint,
        context,
        toolSession,
      );
      if (handled) {
        setToolSession(session ?? null);
      }
      return handled;
    },
    [toolManager, toolSession],
  );

  const handleKeyDown = useCallback(
    (event, context) => {
      const { handled, session } = toolManager.handleKeyDown(
        event,
        context,
        toolSession,
      );
      if (handled) {
        setToolSession(session ?? null);
      }
      return handled;
    },
    [toolManager, toolSession],
  );

  return {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleContextMenu,
    handleKeyDown,
  };
}
