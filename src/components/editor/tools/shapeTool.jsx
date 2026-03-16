import { SHAPE_TYPES } from "../services/shapeService";

const POLYGON_CLOSE_DISTANCE = 14;

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

    return {
      type: "polygon_drawing",
      points: [...this.polygonDraftPoints],
      previewPoint: worldPoint,
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

    return {
      ...session,
      previewPoint: worldPoint,
    };
  }

  handleMouseUp(event, worldPoint, context, session) {
    if (context.selectedShapeType !== SHAPE_TYPES.POLYGON) {
      return null;
    }

    if (event.button !== 0) return session;

    const currentPoints = session?.points ?? this.polygonDraftPoints;

    if (
      currentPoints.length >= 3 &&
      this.isCloseToStart(worldPoint, currentPoints[0])
    ) {
      this.addPolygonShape(currentPoints);
      this.polygonDraftPoints = [];
      return null;
    }

    const nextPoints = [...currentPoints, worldPoint];
    this.polygonDraftPoints = nextPoints;

    return {
      type: "polygon_drawing",
      points: nextPoints,
      previewPoint: worldPoint,
    };
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
