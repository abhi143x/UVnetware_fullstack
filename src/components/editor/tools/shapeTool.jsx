import { SHAPE_TYPES } from "../services/shapeService";

const POLYGON_CLOSE_DISTANCE = 14;
const POLYGON_COMMIT_MAX_DRAG_DISTANCE = 4;

export class ShapeTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick;
    this.addPolygonShape = storeActions.addPolygonShape;
    this.polygonDraftPoints = [];
  }

  handleMouseDown(event, worldPoint, context) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      this.polygonDraftPoints = [];
      return null;
    }

    if (event.button !== 0) return null;

    const points = this.getCurrentPoints(null);

    return {
      ...this.buildPolygonSession(points, worldPoint),
      mouseDownPoint: worldPoint,
    };
  }

  handleMouseMove(_event, worldPoint, context, session) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      return {
        type: "preview",
        previewPoint: worldPoint,
      };
    }

    if (session?.type !== "polygon_drawing") {
      return session;
    }

    const points = this.getCurrentPoints(session);
    return this.buildPolygonSession(points, worldPoint);
  }

  handleMouseUp(event, worldPoint, context, session) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      return null;
    }

    if (session?.type !== "polygon_drawing") {
      return session;
    }

    if (event.button !== 0) return session;

    const mouseDownPoint = session.mouseDownPoint;
    if (
      mouseDownPoint &&
      this.distanceBetween(mouseDownPoint, worldPoint) >
        POLYGON_COMMIT_MAX_DRAG_DISTANCE
    ) {
      return this.buildPolygonSession(
        this.getCurrentPoints(session),
        worldPoint,
      );
    }

    const currentPoints = this.getCurrentPoints(session);
    const previewSession = this.buildPolygonSession(currentPoints, worldPoint);

    if (currentPoints.length >= 3 && previewSession.isClosing) {
      this.addPolygonShape(currentPoints);
      this.polygonDraftPoints = [];
      return null;
    }

    const nextPoints = [...currentPoints, worldPoint];
    this.polygonDraftPoints = nextPoints;

    return this.buildPolygonSession(nextPoints, worldPoint);
  }

  handleContextMenu(event, worldPoint, context, session) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      return { handled: false, session };
    }

    if (session?.type !== "polygon_drawing") {
      return { handled: false, session };
    }

    event.preventDefault?.();

    return {
      handled: true,
      session: this.removeLastPoint(session, worldPoint),
    };
  }

  handleKeyDown(event, context, session) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      return { handled: false, session };
    }

    if (event.key === "Escape") {
      this.polygonDraftPoints = [];
      return { handled: true, session: null };
    }

    if (event.key !== "Backspace" && event.key !== "Delete") {
      return { handled: false, session };
    }

    if (session?.type !== "polygon_drawing") {
      return { handled: false, session };
    }

    return {
      handled: true,
      session: this.removeLastPoint(session, session.previewPoint),
    };
  }

  buildPolygonSession(points, previewPoint) {
    const safePoints = Array.isArray(points) ? [...points] : [];
    const startPoint = safePoints[0] || null;
    const isClosing =
      !!startPoint &&
      safePoints.length >= 3 &&
      this.isCloseToStart(previewPoint, startPoint);
    const snappedPreviewPoint = isClosing ? { ...startPoint } : previewPoint;

    return {
      type: "polygon_drawing",
      points: safePoints,
      previewPoint: snappedPreviewPoint,
      isClosing,
    };
  }

  removeLastPoint(session, previewPoint) {
    const currentPoints = this.getCurrentPoints(session);
    if (currentPoints.length === 0) {
      this.polygonDraftPoints = [];
      return null;
    }

    const nextPoints = currentPoints.slice(0, -1);
    this.polygonDraftPoints = nextPoints;

    if (nextPoints.length === 0) {
      return null;
    }

    const nextPreviewPoint = previewPoint || nextPoints[nextPoints.length - 1];
    return this.buildPolygonSession(nextPoints, nextPreviewPoint);
  }

  getCurrentPoints(session) {
    if (session?.type === "polygon_drawing" && Array.isArray(session.points)) {
      this.polygonDraftPoints = [...session.points];
      return [...session.points];
    }

    return [...this.polygonDraftPoints];
  }

  distanceBetween(pointA, pointB) {
    if (!pointA || !pointB) return Infinity;
    const dx = pointA.x - pointB.x;
    const dy = pointA.y - pointB.y;
    return Math.hypot(dx, dy);
  }

  handleClick(_event, worldPoint, context) {
    if (context.selectedShapeType === SHAPE_TYPES.POLYGON) {
      return;
    }
    this.handleWorldClick(worldPoint);
  }

  isCloseToStart(point, startPoint) {
    if (!startPoint) return false;

    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;
    return Math.hypot(dx, dy) <= POLYGON_CLOSE_DISTANCE;
  }
}
