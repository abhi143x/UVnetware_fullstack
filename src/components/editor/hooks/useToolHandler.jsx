import { useCallback, useRef, useState } from "react";
import { ToolManager } from "../tools/ToolManager";
import { TOOL_ERASER } from "../constants/tools";

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
      if (!toolSession && context.activeTool !== TOOL_ERASER) return;

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
        toolManager.handleMouseUp(event, worldPoint, context, toolSession);
        setToolSession(null);
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

  return {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  };
}
