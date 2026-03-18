import { buildRowPoints } from '../utils/mathUtils'

export class RowTool {
  constructor(storeActions) {
    this.commitRow = storeActions.commitRow
  }

  handleMouseDown(_event, worldPoint, context) {
    return {
      type: 'row_start',
      startPoint: worldPoint,
      seatType: context.selectedSeatType || 'chair',
    }
  }

  handleMouseMove(event, worldPoint, context, session) {
    if (session.type === 'row_start' || session.type === 'row_preview') {
      const points = buildRowPoints(session.startPoint, worldPoint, event.shiftKey, context.selectedSeatType)
      return {
        type: 'row_preview',
        startPoint: session.startPoint,
        endPoint: worldPoint,
        previewPoints: points,
        seatType: context.selectedSeatType || 'chair', // Always use current selection
      }
    }
    return session
  }

  handleMouseUp(_event, worldPoint, context, session) {
    if (session.type === 'row_preview') {
      this.commitRow(session.previewPoints, context.selectedSeatType || 'chair') // Always use current selection
    }
    return null
  }

  handleClick(_event, _worldPoint, _context) {
    // Row tool doesn't handle single clicks
  }
}
