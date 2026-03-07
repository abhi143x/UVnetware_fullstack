export class TextTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick
  }

  handleMouseDown(event, worldPoint, context) {
    // Place text on click
    return null
  }

  handleMouseMove(event, worldPoint, context, session) {
    // Preview text placement
    return {
      type: 'preview',
      previewPoint: worldPoint,
    }
  }

  handleMouseUp(event, worldPoint, context, session) {
    // Place text
    this.handleWorldClick(worldPoint)
    return null
  }

  handleClick(event, worldPoint, context) {
    this.handleWorldClick(worldPoint)
  }
}