export class SeatTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick
  }

  handleMouseDown(event, worldPoint, context) {
    // For seat tool, we place seats on click
    return null
  }

  handleMouseMove(event, worldPoint, context, session) {
    // Preview seat placement
    return {
      type: 'preview',
      previewPoint: worldPoint,
    }
  }

  handleMouseUp(event, worldPoint, context, session) {
    // Place seat
    this.handleWorldClick(worldPoint)
    return null
  }

  handleClick(event, worldPoint, context) {
    this.handleWorldClick(worldPoint)
  }
}