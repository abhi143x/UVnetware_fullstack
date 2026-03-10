export class EraserTool {
  constructor(storeActions) {
    this.eraseSeat = storeActions.eraseSeat;
    this.eraseText = storeActions.eraseText;
    this.setEraseHover = storeActions.setEraseHover;
  }

  handleMouseDown(event, worldPoint, context) {
    const { seats, texts } = context;

    // Find and erase items at point
    const seatToErase = this.findSeatAtPoint(worldPoint, seats);
    const textToErase = this.findTextAtPoint(worldPoint, texts);

    this.setEraseHover?.(seatToErase?.id ?? null, textToErase?.id ?? null);

    if (seatToErase) {
      this.eraseSeat(seatToErase.id);
    } else if (textToErase) {
      this.eraseText(textToErase.id);
    }

    return {
      type: "erasing",
    };
  }

  handleMouseMove(event, worldPoint, context, session) {
    // Update hover target continuously so seats/texts react visually.
    const { seats, texts } = context;

    const seatToErase = this.findSeatAtPoint(worldPoint, seats);
    const textToErase = this.findTextAtPoint(worldPoint, texts);

    this.setEraseHover?.(seatToErase?.id ?? null, textToErase?.id ?? null);

    const isPointerDown =
      (event.buttons & 1) === 1 || session?.type === "erasing";

    if (!isPointerDown) {
      return session;
    }

    if (seatToErase) {
      this.eraseSeat(seatToErase.id);
    } else if (textToErase) {
      this.eraseText(textToErase.id);
    }

    return session;
  }

  handleMouseUp(event, worldPoint, context, session) {
    return null;
  }

  handleClick(event, worldPoint, context) {
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
}
