import { buildRowPoints } from '../utils/mathUtils'

export class RowTool {
  constructor(storeActions) {
    this.commitRow = storeActions.commitRow
  }

  handleMouseDown(_event, worldPoint, _context) {
    return {
      type: 'row_start',
      startPoint: worldPoint,
    }
  }

  handleMouseMove(event, worldPoint, _context, session) {
    if (session.type === 'row_start' || session.type === 'row_preview') {
      const points = buildRowPoints(session.startPoint, worldPoint, event.shiftKey)
      return {
        type: 'row_preview',
        startPoint: session.startPoint,
        endPoint: worldPoint,
        previewPoints: points,
      }
    }
    return session
  }

  handleMouseUp(_event, _worldPoint, _context, session) {
    if (session.type === 'row_preview') {
      this.commitRow(session.previewPoints)
    }
    return null
  }

  handleClick(_event, _worldPoint, _context) {
    // Row tool doesn't handle single clicks
  }
}
