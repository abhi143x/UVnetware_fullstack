import { useCallback, useMemo, useRef, useState } from 'react'
import { ToolManager } from '../tools/ToolManager'

export function useToolHandler(storeActions) {
  const toolManagerRef = useRef(null)
  const [toolSession, setToolSession] = useState(null)

  const toolManager = useMemo(() => {
    if (!toolManagerRef.current) {
      toolManagerRef.current = new ToolManager(storeActions)
    }
    return toolManagerRef.current
  }, [storeActions])

  const handleMouseDown = useCallback((event, worldPoint, context) => {
    const session = toolManager.handleMouseDown(event, worldPoint, context)
    setToolSession(session)
  }, [toolManager])

  const handleMouseMove = useCallback((event, worldPoint, context) => {
    if (toolSession) {
      const newSession = toolManager.handleMouseMove(event, worldPoint, context, toolSession)
      setToolSession(newSession)
    }
  }, [toolManager, toolSession])

  const handleMouseUp = useCallback((event, worldPoint, context) => {
    if (toolSession) {
      toolManager.handleMouseUp(event, worldPoint, context, toolSession)
      setToolSession(null)
    }
  }, [toolManager, toolSession])

  const handleClick = useCallback((event, worldPoint, context) => {
    toolManager.handleClick(event, worldPoint, context)
  }, [toolManager])

  return {
    toolSession,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  }
}