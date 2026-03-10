export class SeatTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick
  }

  handleMouseDown(_event, _worldPoint, _context) {
    // For seat tool, we place seats on click
    return null
  }

  handleMouseMove(_event, worldPoint, _context, _session) {
    // Preview seat placement
    return {
      type: 'preview',
      previewPoint: worldPoint,
    }
  }

  handleMouseUp(_event, worldPoint, _context, _session) {
    // Place seat
    this.handleWorldClick(worldPoint)
    return null
  }

  handleClick(_event, worldPoint, _context) {
    this.handleWorldClick(worldPoint)
  }
}
