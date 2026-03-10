import { buildArcPoints, canCommitArc } from '../utils/mathUtils'

export class ArcTool {
  constructor(storeActions) {
    this.commitArc = storeActions.commitArc
  }

  handleMouseDown(_event, worldPoint, _context) {
    return {
      type: 'arc_start',
      centerPoint: worldPoint,
      startAngle: null,
      radius: 0,
      totalSweep: 0,
      rotation: 0,
    }
  }

  handleMouseMove(event, worldPoint, _context, session) {
    if (session.type === 'arc_start' || session.type === 'arc_drawing' || session.type === 'arc_rotate') {
      const centerPoint = session.centerPoint
      const dx = worldPoint.x - centerPoint.x
      const dy = worldPoint.y - centerPoint.y
      const radius = Math.sqrt(dx * dx + dy * dy)

      if (radius < 1) return session

      const currentAngle = Math.atan2(dy, dx)

      let startAngle = session.startAngle
      let totalSweep = session.totalSweep
      let rotation = session.rotation || 0

      if(session.type === "arc_rotate"){
        rotation = currentAngle - startAngle
      }


      if (startAngle === null) {
        startAngle = currentAngle
        totalSweep = 0
      } else {
        totalSweep = currentAngle - startAngle
      }

      const points = buildArcPoints(centerPoint, radius, startAngle, totalSweep, rotation)

      return {
        type: 'arc_drawing',
        centerPoint,
        radius,
        startAngle,
        totalSweep,
        rotation,
        previewPoints: points,
        canCommit: canCommitArc({ 
          startAngle,
           radius,
            totalSweep
           }),
      }
    }
    return session
  }

  handleMouseUp(_event, _worldPoint, _context, session) {
    if(session.type === 'arcdrawing'){
      console.log(session)
    }
    if (session.type === 'arc_drawing' && session.canCommit) {
      this.commitArc(session.previewPoints)
    }
    return null
  }

  handleClick(_event, _worldPoint, _context) {
    // Arc tool doesn't handle single clicks
  }
}
