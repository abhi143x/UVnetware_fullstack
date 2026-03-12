export class RotateTool {
  constructor(storeActions) {
    this.storeActions = storeActions;
  }

  handleMouseDown(_event, worldPoint, _context) {
    return {
      type: "rotate_start",
      startPoint: worldPoint,
      lastAngle: 0,
      historyCaptured: false,
    };
  }

  handleMouseMove(_event, worldPoint, _context, session) {
    if (!session || session.type !== "rotate_start") return session;

    const dx = worldPoint.x - session.startPoint.x;
    const dy = worldPoint.y - session.startPoint.y;

    // Current drag angle relative to the start point
    const currentAngle = Math.atan2(dy, dx);

    // Rotate by the delta from the previous angle so rotation is smooth
    const delta = currentAngle - (session.lastAngle ?? 0);

    if (Number.isFinite(delta) && delta !== 0) {
      if (!session.historyCaptured) {
        this.storeActions.pushHistoryCheckpoint?.();
      }

      const rotateAction =
        this.storeActions.rotateSelectionPreview ||
        this.storeActions.rotateSelection;
      rotateAction?.(delta);
    }

    return {
      ...session,
      lastAngle: currentAngle,
      historyCaptured:
        session.historyCaptured || (Number.isFinite(delta) && delta !== 0),
    };
  }

  handleMouseUp(_event, _worldPoint, _context, _session) {
    return null;
  }

  handleClick(_event, _worldPoint, _context) {}
}
