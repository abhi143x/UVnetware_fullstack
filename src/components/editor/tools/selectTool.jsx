import { buildSelectionBounds, isSeatInsideBounds } from "../utils/mathUtils";
import {
  getShapeAbsolutePoints,
  getShapeBounds,
  getShapeResizeHandles,
  SHAPE_TYPES,
} from "../services/shapeService";

const SHAPE_HANDLE_HIT_RADIUS = 8;

export class SelectTool {
  constructor(storeActions) {
    this.selectSeat = storeActions.selectSeat;
    this.selectText = storeActions.selectText;
    this.selectShape = storeActions.selectShape;
    this.smartRowSelect = storeActions.smartRowSelect;
    this.moveSeats = storeActions.moveSeats;
    this.moveSeatsPreview = storeActions.moveSeatsPreview;
    this.moveTexts = storeActions.moveTexts;
    this.moveTextsPreview = storeActions.moveTextsPreview;
    this.moveShapes = storeActions.moveShapes;
    this.moveShapesPreview = storeActions.moveShapesPreview;
    this.updateShapePreview = storeActions.updateShapePreview;
    this.setCanvasCursor = storeActions.setCanvasCursor;
    this.marqueeSelect = storeActions.marqueeSelect;
    this.clearSelection = storeActions.clearSelection;
    this.pushHistoryCheckpoint = storeActions.pushHistoryCheckpoint;
  }

  handleMouseDown(event, worldPoint, context) {
    const {
      seats,
      texts,
      shapes,
      selectedSeatIds,
      selectedTextIds,
      selectedShapeIds,
      seatsById,
      textsById,
      shapesById,
    } = context;

    // Check if clicking on a selected item for dragging
    const clickedSeat = this.findSeatAtPoint(worldPoint, seats);
    const clickedText = this.findTextAtPoint(worldPoint, texts);
    const clickedShape = this.findShapeAtPoint(worldPoint, shapes);
    const shapeResizeHandle = this.findShapeResizeHandleAtPoint(
      worldPoint,
      shapes,
      selectedShapeIds,
    );

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

    if (shapeResizeHandle && !isMulti) {
      return this.startShapeResize(worldPoint, shapeResizeHandle);
    }

    if (clickedSeat) {
      if (!selectedSeatIds.includes(clickedSeat.id)) {
        this.selectSeat(clickedSeat.id, isMulti);
        const newSeatIds = isMulti
          ? [...selectedSeatIds, clickedSeat.id]
          : [clickedSeat.id];
        const newTextIds = isMulti ? selectedTextIds : [];
        const session = this.startDrag(
          event,
          worldPoint,
          seatsById,
          textsById,
          shapesById,
          newSeatIds,
          newTextIds,
          isMulti ? selectedShapeIds : [],
        );
        session.wasUnselectedOnDown = true;
        return session;
      }
      const session = this.startDrag(
        event,
        worldPoint,
        seatsById,
        textsById,
        shapesById,
        selectedSeatIds,
        selectedTextIds,
        selectedShapeIds,
      );
      session.wasUnselectedOnDown = false;
      return session;
    }

    if (clickedText) {
      if (!selectedTextIds.includes(clickedText.id)) {
        this.selectText(clickedText.id, isMulti);
        const newTextIds = isMulti
          ? [...selectedTextIds, clickedText.id]
          : [clickedText.id];
        const newSeatIds = isMulti ? selectedSeatIds : [];
        const session = this.startDrag(
          event,
          worldPoint,
          seatsById,
          textsById,
          shapesById,
          newSeatIds,
          newTextIds,
          isMulti ? selectedShapeIds : [],
        );
        session.wasUnselectedOnDown = true;
        return session;
      }
      const session = this.startDrag(
        event,
        worldPoint,
        seatsById,
        textsById,
        shapesById,
        selectedSeatIds,
        selectedTextIds,
        selectedShapeIds,
      );
      session.wasUnselectedOnDown = false;
      return session;
    }

    if (clickedShape) {
      if (!selectedShapeIds.includes(clickedShape.id)) {
        this.selectShape(clickedShape.id, isMulti);
        const newShapeIds = isMulti
          ? [...selectedShapeIds, clickedShape.id]
          : [clickedShape.id];
        const newSeatIds = isMulti ? selectedSeatIds : [];
        const newTextIds = isMulti ? selectedTextIds : [];
        const session = this.startDrag(
          event,
          worldPoint,
          seatsById,
          textsById,
          shapesById,
          newSeatIds,
          newTextIds,
          newShapeIds,
        );
        session.wasUnselectedOnDown = true;
        return session;
      }
      const session = this.startDrag(
        event,
        worldPoint,
        seatsById,
        textsById,
        shapesById,
        selectedSeatIds,
        selectedTextIds,
        selectedShapeIds,
      );
      session.wasUnselectedOnDown = false;
      return session;
    }

    // Start marquee selection
    return {
      type: "marquee_start",
      startPoint: worldPoint,
    };
  }

  handleMouseMove(event, worldPoint, context, session) {
    if (!session) {
      const hoveredHandle = this.findShapeResizeHandleAtPoint(
        worldPoint,
        context.shapes,
        context.selectedShapeIds,
      );
      this.setCanvasCursor?.(
        hoveredHandle
          ? this.getResizeCursorForHandle(hoveredHandle.handle)
          : null,
      );
      return session;
    }

    if (session.type === "drag") {
      this.setCanvasCursor?.(null);
      return this.updateDrag(worldPoint, session);
    }

    if (session.type === "shape_resize") {
      this.setCanvasCursor?.(this.getResizeCursorForHandle(session.handle));
      return this.updateShapeResize(worldPoint, session);
    }

    if (session.type === "marquee_start" || session.type === "marquee") {
      this.setCanvasCursor?.(null);
      const bounds = buildSelectionBounds(session.startPoint, worldPoint);
      const selectedSeatIds = context.seats
        .filter((seat) => isSeatInsideBounds(seat, bounds))
        .map((seat) => seat.id);

      const selectedTextIds = context.texts
        .filter((text) => this.isTextInsideBounds(text, bounds))
        .map((text) => text.id);

      const selectedShapeIds = context.shapes
        .filter((shape) => this.isShapeInsideBounds(shape, bounds))
        .map((shape) => shape.id);

      return {
        type: "marquee",
        startPoint: session.startPoint,
        endPoint: worldPoint,
        bounds,
        selectedSeatIds,
        selectedTextIds,
        selectedShapeIds,
      };
    }

    return session;
  }

  handleMouseUp(event, worldPoint, context, session) {
    this.setCanvasCursor?.(null);

    if (session.type === "drag") {
      this.commitDrag(session);
      if (session.hasMoved || session.wasUnselectedOnDown) {
        return null;
      }
    }

    if (session.type === "shape_resize") {
      if (!session.hasResized) {
        return null;
      }
      return null;
    }

    if (session.type === "marquee") {
      this.marqueeSelect(
        session.selectedSeatIds,
        session.selectedTextIds || [],
        session.selectedShapeIds || [],
        event.shiftKey || event.ctrlKey || event.metaKey,
      );
      return null;
    }

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

    // Single click selection
    const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats);
    const clickedText = this.findTextAtPoint(worldPoint, context.texts);
    const clickedShape = this.findShapeAtPoint(worldPoint, context.shapes);

    if (clickedSeat) {
      this.selectSeat(clickedSeat.id, isMulti);
    } else if (clickedText) {
      this.selectText(clickedText.id, isMulti);
    } else if (clickedShape) {
      this.selectShape(clickedShape.id, isMulti);
    } else {
      this.clearSelection();
    }

    return null;
  }

  handleClick(event, worldPoint, context) {
    // Double click selects a logical seat group (row or arc).
    if (event.detail === 2) {
      const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats);
      if (clickedSeat) {
        this.smartRowSelect(clickedSeat.id, event);
      }
    }
  }

  findSeatAtPoint(point, seats) {
    return seats.find((seat) => {
      // Rectangular seat types: AABB hit test using width/height (BUG-08)
      if (seat.width && seat.height) {
        const halfW = seat.width / 2;
        const halfH = seat.height / 2;
        return (
          point.x >= seat.x - halfW &&
          point.x <= seat.x + halfW &&
          point.y >= seat.y - halfH &&
          point.y <= seat.y + halfH
        );
      }
      // Default: circular hit test
      const dx = point.x - seat.x;
      const dy = point.y - seat.y;
      return Math.sqrt(dx * dx + dy * dy) <= seat.radius;
    });
  }

  findTextAtPoint(point, texts) {
    // Basic hit detection for centered text
    return texts.find((text) => {
      const fontSize = text.fontSize || 20;
      const width = (text.content?.length || 0) * fontSize * 0.6; // rough estimation of text width
      const height = fontSize;
      const radians = ((text.rotate ?? 0) * Math.PI) / 180;

      // Convert point to text-local coordinates by applying inverse rotation.
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

  isTextInsideBounds(text, bounds) {
    // A simplified bounding box check: checking if the center coordinate is inside
    return (
      text.x >= bounds.x &&
      text.x <= bounds.x + bounds.width &&
      text.y >= bounds.y &&
      text.y <= bounds.y + bounds.height
    );
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

  isShapeInsideBounds(shape, bounds) {
    const shapeBounds = getShapeBounds(shape);
    const left = shapeBounds.left;
    const top = shapeBounds.top;
    const right = shapeBounds.right;
    const bottom = shapeBounds.bottom;
    const boundsRight = bounds.x + bounds.width;
    const boundsBottom = bounds.y + bounds.height;

    return !(
      right < bounds.x ||
      left > boundsRight ||
      bottom < bounds.y ||
      top > boundsBottom
    );
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

  findShapeResizeHandleAtPoint(point, shapes, selectedShapeIds) {
    if (selectedShapeIds.length !== 1) return null;

    const selectedId = selectedShapeIds[0];
    const shape = shapes.find((item) => item.id === selectedId);
    if (!shape || shape.type === SHAPE_TYPES.POLYGON) return null;

    const handles = getShapeResizeHandles(shape);
    const matched = handles.find((handle) => {
      const dx = point.x - handle.x;
      const dy = point.y - handle.y;
      return Math.hypot(dx, dy) <= SHAPE_HANDLE_HIT_RADIUS;
    });

    if (!matched) return null;

    return {
      shapeId: shape.id,
      handle: matched.key,
      baseShape: shape,
    };
  }

  startShapeResize(worldPoint, shapeResizeHandle) {
    this.setCanvasCursor?.(
      this.getResizeCursorForHandle(shapeResizeHandle.handle),
    );

    return {
      type: "shape_resize",
      shapeId: shapeResizeHandle.shapeId,
      handle: shapeResizeHandle.handle,
      startPoint: worldPoint,
      baseShape: { ...shapeResizeHandle.baseShape },
      hasResized: false,
      historyCaptured: false,
    };
  }

  getResizeCursorForHandle(handle) {
    if (handle === "nw" || handle === "se") return "nwse-resize";
    if (handle === "ne" || handle === "sw") return "nesw-resize";
    return null;
  }

  updateShapeResize(worldPoint, session) {
    const nextBounds = this.calculateResizedBounds(
      session.baseShape,
      session.handle,
      worldPoint,
    );
    if (!nextBounds) return session;

    const crossedThreshold =
      Math.abs(worldPoint.x - session.startPoint.x) +
        Math.abs(worldPoint.y - session.startPoint.y) >
      2;
    const hasResized = session.hasResized || crossedThreshold;

    if (!hasResized) return session;

    if (!session.historyCaptured) {
      this.pushHistoryCheckpoint?.();
    }

    this.updateShapePreview?.(session.shapeId, nextBounds);

    return {
      ...session,
      hasResized: true,
      historyCaptured: true,
    };
  }

  calculateResizedBounds(shape, handle, worldPoint) {
    const bounds = getShapeBounds(shape);
    const minSize = 20;
    let left = bounds.left;
    let right = bounds.right;
    let top = bounds.top;
    let bottom = bounds.bottom;

    if (handle === "nw") {
      left = Math.min(worldPoint.x, right - minSize);
      top = Math.min(worldPoint.y, bottom - minSize);
    } else if (handle === "ne") {
      right = Math.max(worldPoint.x, left + minSize);
      top = Math.min(worldPoint.y, bottom - minSize);
    } else if (handle === "se") {
      right = Math.max(worldPoint.x, left + minSize);
      bottom = Math.max(worldPoint.y, top + minSize);
    } else if (handle === "sw") {
      left = Math.min(worldPoint.x, right - minSize);
      bottom = Math.max(worldPoint.y, top + minSize);
    }

    let width = right - left;
    let height = bottom - top;

    return {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      width,
      height,
    };
  }

  startDrag(
    _event,
    worldPoint,
    seatsById,
    textsById,
    shapesById,
    selectedSeatIds,
    selectedTextIds,
    selectedShapeIds,
  ) {
    const baseSeatPositions = new Map();
    selectedSeatIds.forEach((id) => {
      const seat = seatsById.get(id);
      if (seat) baseSeatPositions.set(id, { x: seat.x, y: seat.y });
    });

    const baseTextPositions = new Map();
    selectedTextIds.forEach((id) => {
      const text = textsById.get(id);
      if (text) baseTextPositions.set(id, { x: text.x, y: text.y });
    });

    const baseShapePositions = new Map();
    selectedShapeIds.forEach((id) => {
      const shape = shapesById.get(id);
      if (shape) baseShapePositions.set(id, { x: shape.x, y: shape.y });
    });

    return {
      type: "drag",
      startPoint: worldPoint,
      baseSeatPositions,
      baseTextPositions,
      baseShapePositions,
      hasMoved: false,
      historyCaptured: false,
    };
  }

  updateDrag(worldPoint, session) {
    const deltaX = worldPoint.x - session.startPoint.x;
    const deltaY = worldPoint.y - session.startPoint.y;
    const crossedThreshold = Math.abs(deltaX) + Math.abs(deltaY) > 5;
    const hasMoved = session.hasMoved || crossedThreshold;

    if (hasMoved) {
      if (!session.historyCaptured) {
        this.pushHistoryCheckpoint?.();
      }

      // Update positions (this would trigger re-renders)
      const newSeatPositions = [];
      session.baseSeatPositions.forEach((pos, id) => {
        newSeatPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY });
      });

      const newTextPositions = [];
      session.baseTextPositions.forEach((pos, id) => {
        newTextPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY });
      });

      const moveSeatsAction = this.moveSeatsPreview || this.moveSeats;
      const moveTextsAction = this.moveTextsPreview || this.moveTexts;
      const moveShapesAction = this.moveShapesPreview || this.moveShapes;

      moveSeatsAction?.(newSeatPositions);
      moveTextsAction?.(newTextPositions);

      const newShapePositions = [];
      session.baseShapePositions.forEach((pos, id) => {
        newShapePositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY });
      });
      moveShapesAction?.(newShapePositions);

      return {
        ...session,
        hasMoved: true,
        historyCaptured: true,
      };
    }

    return {
      ...session,
      hasMoved,
    };
  }

  commitDrag(_session) {
    // Final commit if needed
  }
}
