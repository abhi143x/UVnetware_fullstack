export class EraserTool {
  constructor(storeActions) {
    this.eraseSeat = storeActions.eraseSeat
    this.eraseText = storeActions.eraseText
  }

  handleMouseDown(event, worldPoint, context) {
    const { seats, texts } = context

    // Find and erase items at point
    const seatToErase = this.findSeatAtPoint(worldPoint, seats)
    const textToErase = this.findTextAtPoint(worldPoint, texts)

    if (seatToErase) {
      this.eraseSeat(seatToErase.id)
    } else if (textToErase) {
      this.eraseText(textToErase.id)
    }

    return null
  }

  handleMouseMove(event, worldPoint, context, session) {
    // Continuous erasing while dragging
    const { seats, texts } = context

    const seatToErase = this.findSeatAtPoint(worldPoint, seats)
    const textToErase = this.findTextAtPoint(worldPoint, texts)

    if (seatToErase) {
      this.eraseSeat(seatToErase.id)
    } else if (textToErase) {
      this.eraseText(textToErase.id)
    }

    return session
  }

  handleMouseUp(event, worldPoint, context, session) {
    return null
  }

  handleClick(event, worldPoint, context) {
    // Single click erasing handled in mouseDown
  }

  findSeatAtPoint(point, seats) {
    return seats.find(seat => {
      const dx = point.x - seat.x
      const dy = point.y - seat.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance <= seat.radius
    })
  }

  findTextAtPoint(point, texts) {
    return texts.find(text => {
      const width = (text.content?.length || 0) * 10
      const height = text.fontSize || 20
      return (
        point.x >= text.x &&
        point.x <= text.x + width &&
        point.y >= text.y - height &&
        point.y <= text.y
      )
    })
  }
}