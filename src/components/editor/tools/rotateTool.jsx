export class RotateTool {

  constructor(storeActions) {
    this.storeActions = storeActions
  }

  handleMouseDown(event, worldPoint, context) {

    return {
      type: "rotate_start",
      startPoint: worldPoint
    }

  }

  handleMouseMove(event, worldPoint, context, session) {

    if (!session || session.type !== "rotate_start") return session

    const dx = worldPoint.x - session.startPoint.x
    const dy = worldPoint.y - session.startPoint.y

    const angle = Math.atan2(dy, dx)

     this.storeActions.rotateSelection(angle * 0.05)

    return session
  }

  handleMouseUp(event, worldPoint, context, session) {
    return null
  }

  handleClick(event, worldPoint, context) {}

}