export class RotateTool {

  constructor(storeActions) {
    this.storeActions = storeActions
  }

  handleMouseDown(event, worldPoint, context) {

    return {
      type: 'rotate_start',
      startPoint: worldPoint,
      lastAngle: 0,
    }

  }

  handleMouseMove(event, worldPoint, context, session) {

    if (!session || session.type !== 'rotate_start') return session

    const dx = worldPoint.x - session.startPoint.x
    const dy = worldPoint.y - session.startPoint.y

    // Current drag angle relative to the start point
    const currentAngle = Math.atan2(dy, dx)

    // Rotate by the delta from the previous angle so rotation is smooth
    const delta = currentAngle - (session.lastAngle ?? 0)

    if (Number.isFinite(delta) && delta !== 0) {
      this.storeActions.rotateSelection(delta)
    }

    return {
      ...session,
      lastAngle: currentAngle,
    }
  }

  handleMouseUp(event, worldPoint, context, session) {
    return null
  }

  handleClick(event, worldPoint, context) {}

}