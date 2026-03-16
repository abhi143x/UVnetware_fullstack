import {
  getShapeAbsolutePoints,
  getShapeBounds,
  SHAPE_TYPES,
} from "../services/shapeService";

export class EraserTool {
  constructor(storeActions) {
    this.eraseSeat = storeActions.eraseSeat;
    this.eraseText = storeActions.eraseText;
    this.eraseShape = storeActions.eraseShape;
    this.setEraseHover = storeActions.setEraseHover;
  }

  handleMouseDown(event, worldPoint, context) {
    const { seats, texts, shapes } = context;

    // Find and erase items at point
    const seatToErase = this.findSeatAtPoint(worldPoint, seats);
    const textToErase = this.findTextAtPoint(worldPoint, texts);
    const shapeToErase = this.findShapeAtPoint(worldPoint, shapes);

    this.setEraseHover?.(
      seatToErase?.id ?? null,
      textToErase?.id ?? null,
      shapeToErase?.id ?? null,
    );

    if (seatToErase) {
      this.eraseSeat(seatToErase.id);
    } else if (textToErase) {
      this.eraseText(textToErase.id);
    } else if (shapeToErase) {
      this.eraseShape(shapeToErase.id);
    }

    return {
      type: "erasing",
    };
  }

  handleMouseMove(event, worldPoint, context, session) {
    // Update hover target continuously so seats/texts react visually.
    const { seats, texts, shapes } = context;

    const seatToErase = this.findSeatAtPoint(worldPoint, seats);
    const textToErase = this.findTextAtPoint(worldPoint, texts);
    const shapeToErase = this.findShapeAtPoint(worldPoint, shapes);

    this.setEraseHover?.(
      seatToErase?.id ?? null,
      textToErase?.id ?? null,
      shapeToErase?.id ?? null,
    );

    const isPointerDown =
      (event.buttons & 1) === 1 || session?.type === "erasing";

    if (!isPointerDown) {
      return session;
    }

    if (seatToErase) {
      this.eraseSeat(seatToErase.id);
    } else if (textToErase) {
      this.eraseText(textToErase.id);
    } else if (shapeToErase) {
      this.eraseShape(shapeToErase.id);
    }

    return session;
  }

  handleMouseUp(_event, _worldPoint, _context, _session) {
    return null;
  }

  handleClick(_event, _worldPoint, _context) {
    // Single click erasing handled in mouseDown
  }

  findSeatAtPoint(point, seats) {
    return seats.find((seat) => {
      const dx = point.x - seat.x;
      const dy = point.y - seat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= seat.radius;
    });
  }

  findTextAtPoint(point, texts) {
    return texts.find((text) => {
      const fontSize = text.fontSize || 20;
      const width = (text.content?.length || 0) * fontSize * 0.55;
      const height = fontSize;
      const radians = ((text.rotate ?? 0) * Math.PI) / 180;
      const dx = point.x - text.x;
      const dy = point.y - text.y;
      const localX = dx * Math.cos(radians) + dy * Math.sin(radians);
      const localY = -dx * Math.sin(radians) + dy * Math.cos(radians);
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      return (
        localX >= -halfWidth &&
        localX <= halfWidth &&
        localY >= -halfHeight &&
        localY <= halfHeight
      );
    });
  }

  findShapeAtPoint(point, shapes) {
    for (let index = shapes.length - 1; index >= 0; index -= 1) {
      const shape = shapes[index];
      const bounds = getShapeBounds(shape);
      const width = Math.max(20, bounds.width || 0);
      const height = Math.max(20, bounds.height || 0);
      const left = bounds.left;
      const top = bounds.top;

      if (shape.type === SHAPE_TYPES.POLYGON) {
        const polygonPoints = getShapeAbsolutePoints(shape);
        if (this.isPointInsidePolygon(point, polygonPoints)) {
          return shape;
        }
        continue;
      }

      if (shape.type === "circle") {
        const rx = width / 2;
        const ry = height / 2;
        const dx = point.x - shape.x;
        const dy = point.y - shape.y;
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          return shape;
        }
        continue;
      }

      if (
        point.x >= left &&
        point.x <= left + width &&
        point.y >= top &&
        point.y <= top + height
      ) {
        return shape;
      }
    }

    return null;
  }

  isPointInsidePolygon(point, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-6) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}
