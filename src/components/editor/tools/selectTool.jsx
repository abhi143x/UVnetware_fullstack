import { buildSelectionBounds, isSeatInsideBounds } from "../utils/mathUtils";

export class SelectTool {
  constructor(storeActions) {
    this.selectSeat = storeActions.selectSeat;
    this.selectText = storeActions.selectText;
    this.smartRowSelect = storeActions.smartRowSelect;
    this.moveSeats = storeActions.moveSeats;
    this.moveTexts = storeActions.moveTexts;
    this.marqueeSelect = storeActions.marqueeSelect;
    this.clearSelection = storeActions.clearSelection;
  }

  handleMouseDown(event, worldPoint, context) {
    const {
      seats,
      texts,
      selectedSeatIds,
      selectedTextIds,
      seatsById,
      textsById,
    } = context;

    // Check if clicking on a selected item for dragging
    const clickedSeat = this.findSeatAtPoint(worldPoint, seats);
    const clickedText = this.findTextAtPoint(worldPoint, texts);

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

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
          newSeatIds,
          newTextIds,
        );
        session.wasUnselectedOnDown = true;
        return session;
      }
      const session = this.startDrag(
        event,
        worldPoint,
        seatsById,
        textsById,
        selectedSeatIds,
        selectedTextIds,
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
          newSeatIds,
          newTextIds,
        );
        session.wasUnselectedOnDown = true;
        return session;
      }
      const session = this.startDrag(
        event,
        worldPoint,
        seatsById,
        textsById,
        selectedSeatIds,
        selectedTextIds,
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
    if (session.type === "drag") {
      return this.updateDrag(worldPoint, session);
    }

    if (session.type === "marquee_start" || session.type === "marquee") {
      const bounds = buildSelectionBounds(session.startPoint, worldPoint);
      const selectedSeatIds = context.seats
        .filter((seat) => isSeatInsideBounds(seat, bounds))
        .map((seat) => seat.id);

      const selectedTextIds = context.texts
        .filter((text) => this.isTextInsideBounds(text, bounds))
        .map((text) => text.id);

      return {
        type: "marquee",
        startPoint: session.startPoint,
        endPoint: worldPoint,
        bounds,
        selectedSeatIds,
        selectedTextIds,
      };
    }

    return session;
  }

  handleMouseUp(event, worldPoint, context, session) {
    if (session.type === "drag") {
      this.commitDrag(session);
      if (session.hasMoved || session.wasUnselectedOnDown) {
        return null;
      }
    }

    if (session.type === "marquee") {
      this.marqueeSelect(
        session.selectedSeatIds,
        session.selectedTextIds || [],
        event.shiftKey || event.ctrlKey || event.metaKey,
      );
      return null;
    }

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

    // Single click selection
    const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats);
    const clickedText = this.findTextAtPoint(worldPoint, context.texts);

    if (clickedSeat) {
      this.selectSeat(clickedSeat.id, isMulti);
    } else if (clickedText) {
      this.selectText(clickedText.id, isMulti);
    } else {
      this.clearSelection();
    }

    return null;
  }

  handleClick(event, worldPoint, context) {
    // Double click for smart row selection
    if (event.detail === 2) {
      const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats);
      if (clickedSeat) {
        this.smartRowSelect(clickedSeat.id, event);
      }
    }
  }

  findSeatAtPoint(point, seats) {
    // Find seat within click tolerance (simple implementation)
    return seats.find((seat) => {
      const dx = point.x - seat.x;
      const dy = point.y - seat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= seat.radius;
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

  startDrag(
    _event,
    worldPoint,
    seatsById,
    textsById,
    selectedSeatIds,
    selectedTextIds,
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

    return {
      type: "drag",
      startPoint: worldPoint,
      baseSeatPositions,
      baseTextPositions,
      hasMoved: false,
    };
  }

  updateDrag(worldPoint, session) {
    const deltaX = worldPoint.x - session.startPoint.x;
    const deltaY = worldPoint.y - session.startPoint.y;

    if (!session.hasMoved && Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      session.hasMoved = true;
    }

    if (session.hasMoved) {
      // Update positions (this would trigger re-renders)
      const newSeatPositions = [];
      session.baseSeatPositions.forEach((pos, id) => {
        newSeatPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY });
      });

      const newTextPositions = [];
      session.baseTextPositions.forEach((pos, id) => {
        newTextPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY });
      });

      this.moveSeats(newSeatPositions);
      this.moveTexts(newTextPositions);
    }

    return session;
  }

  commitDrag(_session) {
    // Final commit if needed
  }
}
