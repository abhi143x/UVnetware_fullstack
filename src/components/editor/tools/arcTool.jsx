import { buildArcPoints, canCommitArc } from '../utils/mathUtils'

export class ArcTool {
  constructor(storeActions) {
    this.commitArc = storeActions.commitArc
  }

  handleMouseDown(event, worldPoint, context) {
    return {
      type: 'arc_start',
      centerPoint: worldPoint,
      startAngle: null,
      radius: 0,
      totalSweep: 0,
    }
  }

  handleMouseMove(event, worldPoint, context, session) {
    if (session.type === 'arc_start' || session.type === 'arc_drawing') {
      const centerPoint = session.centerPoint
      const dx = worldPoint.x - centerPoint.x
      const dy = worldPoint.y - centerPoint.y
      const radius = Math.sqrt(dx * dx + dy * dy)

      if (radius < 1) return session

      const currentAngle = Math.atan2(dy, dx)
      let startAngle = session.startAngle
      let totalSweep = session.totalSweep

      if (startAngle === null) {
        startAngle = currentAngle
        totalSweep = 0
      } else {
        totalSweep = currentAngle - startAngle
      }

      const points = buildArcPoints(centerPoint, radius, startAngle, totalSweep)

      return {
        type: 'arc_drawing',
        centerPoint,
        startAngle,
        radius,
        totalSweep,
        previewPoints: points,
        canCommit: canCommitArc({ startAngle, radius, totalSweep }),
      }
    }
    return session
  }

  handleMouseUp(event, worldPoint, context, session) {
    if (session.type === 'arc_drawing' && session.canCommit) {
      this.commitArc(session.previewPoints)
    }
    return null
  }

  handleClick(event, worldPoint, context) {
    // Arc tool doesn't handle single clicks
  }
}