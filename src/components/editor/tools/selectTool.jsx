import { buildSelectionBounds, isSeatInsideBounds } from '../utils/mathUtils'

export class SelectTool {
  constructor(storeActions) {
    this.selectSeat = storeActions.selectSeat
    this.selectText = storeActions.selectText
    this.smartRowSelect = storeActions.smartRowSelect
    this.moveSeats = storeActions.moveSeats
    this.moveTexts = storeActions.moveTexts
    this.marqueeSelect = storeActions.marqueeSelect
    this.clearSelection = storeActions.clearSelection
  }

  handleMouseDown(event, worldPoint, context) {
    const { seats, texts, selectedSeatIds, selectedTextIds, seatsById, textsById } = context

    // Check if clicking on a selected item for dragging
    const clickedSeat = this.findSeatAtPoint(worldPoint, seats)
    const clickedText = this.findTextAtPoint(worldPoint, texts)

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey

    if (clickedSeat) {
      if (!selectedSeatIds.includes(clickedSeat.id)) {
        this.selectSeat(clickedSeat.id, isMulti)
        const newSeatIds = isMulti ? [...selectedSeatIds, clickedSeat.id] : [clickedSeat.id]
        const newTextIds = isMulti ? selectedTextIds : []
        const session = this.startDrag(event, worldPoint, seatsById, textsById, newSeatIds, newTextIds)
        session.wasUnselectedOnDown = true
        return session
      }
      const session = this.startDrag(event, worldPoint, seatsById, textsById, selectedSeatIds, selectedTextIds)
      session.wasUnselectedOnDown = false
      return session
    }

    if (clickedText) {
      if (!selectedTextIds.includes(clickedText.id)) {
        this.selectText(clickedText.id, isMulti)
        const newTextIds = isMulti ? [...selectedTextIds, clickedText.id] : [clickedText.id]
        const newSeatIds = isMulti ? selectedSeatIds : []
        const session = this.startDrag(event, worldPoint, seatsById, textsById, newSeatIds, newTextIds)
        session.wasUnselectedOnDown = true
        return session
      }
      const session = this.startDrag(event, worldPoint, seatsById, textsById, selectedSeatIds, selectedTextIds)
      session.wasUnselectedOnDown = false
      return session
    }

    // Start marquee selection
    return {
      type: 'marquee_start',
      startPoint: worldPoint,
    }
  }

  handleMouseMove(event, worldPoint, context, session) {
    if (session.type === 'drag') {
      return this.updateDrag(worldPoint, session)
    }

    if (session.type === 'marquee_start' || session.type === 'marquee') {
      const bounds = buildSelectionBounds(session.startPoint, worldPoint)
      const selectedSeatIds = context.seats
        .filter(seat => isSeatInsideBounds(seat, bounds))
        .map(seat => seat.id)

      return {
        type: 'marquee',
        startPoint: session.startPoint,
        endPoint: worldPoint,
        bounds,
        selectedSeatIds,
      }
    }

    return session
  }

  handleMouseUp(event, worldPoint, context, session) {
    if (session.type === 'drag') {
      this.commitDrag(session)
      if (session.hasMoved || session.wasUnselectedOnDown) {
        return null
      }
    }

    if (session.type === 'marquee') {
      this.marqueeSelect(session.selectedSeatIds, [], event.shiftKey || event.ctrlKey || event.metaKey)
      return null
    }

    const isMulti = event.shiftKey || event.ctrlKey || event.metaKey

    // Single click selection
    const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats)
    const clickedText = this.findTextAtPoint(worldPoint, context.texts)

    if (clickedSeat) {
      this.selectSeat(clickedSeat.id, isMulti)
    } else if (clickedText) {
      this.selectText(clickedText.id, isMulti)
    } else {
      this.clearSelection()
    }

    return null
  }

  handleClick(event, worldPoint, context) {
    // Double click for smart row selection
    if (event.detail === 2) {
      const clickedSeat = this.findSeatAtPoint(worldPoint, context.seats)
      if (clickedSeat) {
        this.smartRowSelect(clickedSeat.id, event)
      }
    }
  }

  findSeatAtPoint(point, seats) {
    // Find seat within click tolerance (simple implementation)
    return seats.find(seat => {
      const dx = point.x - seat.x
      const dy = point.y - seat.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance <= seat.radius
    })
  }

  findTextAtPoint(point, texts) {
    // Simple text hit detection (can be improved)
    return texts.find(text => {
      const width = (text.content?.length || 0) * 10 // Rough estimate
      const height = text.fontSize || 20
      return (
        point.x >= text.x &&
        point.x <= text.x + width &&
        point.y >= text.y - height &&
        point.y <= text.y
      )
    })
  }

  startDrag(event, worldPoint, seatsById, textsById, selectedSeatIds, selectedTextIds) {
    const baseSeatPositions = new Map()
    selectedSeatIds.forEach(id => {
      const seat = seatsById.get(id)
      if (seat) baseSeatPositions.set(id, { x: seat.x, y: seat.y })
    })

    const baseTextPositions = new Map()
    selectedTextIds.forEach(id => {
      const text = textsById.get(id)
      if (text) baseTextPositions.set(id, { x: text.x, y: text.y })
    })

    return {
      type: 'drag',
      startPoint: worldPoint,
      baseSeatPositions,
      baseTextPositions,
      hasMoved: false,
    }
  }

  updateDrag(worldPoint, session) {
    const deltaX = worldPoint.x - session.startPoint.x
    const deltaY = worldPoint.y - session.startPoint.y

    if (!session.hasMoved && Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      session.hasMoved = true
    }

    if (session.hasMoved) {
      // Update positions (this would trigger re-renders)
      const newSeatPositions = []
      session.baseSeatPositions.forEach((pos, id) => {
        newSeatPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY })
      })

      const newTextPositions = []
      session.baseTextPositions.forEach((pos, id) => {
        newTextPositions.push({ id, x: pos.x + deltaX, y: pos.y + deltaY })
      })

      this.moveSeats(newSeatPositions)
      this.moveTexts(newTextPositions)
    }

    return session
  }

  commitDrag(session) {
    // Final commit if needed
  }
}