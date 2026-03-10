export class TextTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick
  }

  handleMouseDown(_event, _worldPoint, _context) {
    // Place text on click
    return null
  }

  handleMouseMove(_event, worldPoint, _context, _session) {
    // Preview text placement
    return {
      type: 'preview',
      previewPoint: worldPoint,
    }
  }

  handleMouseUp(_event, worldPoint, _context, _session) {
    // Place text
    this.handleWorldClick(worldPoint)
    return null
  }

  handleClick(_event, worldPoint, _context) {
    this.handleWorldClick(worldPoint)
  }
}
