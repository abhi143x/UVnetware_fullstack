import { useMemo } from 'react'
import { TOOL_ERASER } from '../constants/tools'
import SeatComponent from '../canvas/SeatComponent'
import TextComponent from '../canvas/TextComponent'

export function useRenderedElements(seats, texts, selectedSeatIds, selectedTextIds, activeTool, hoveredSeatId, hoveredTextId) {
  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])
  const selectedTextIdSet = useMemo(() => new Set(selectedTextIds), [selectedTextIds])

  const renderedSeats = useMemo(() => {
    return seats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id)
      const isEraseHovered = activeTool === TOOL_ERASER && seat.id === hoveredSeatId

      return (
        <SeatComponent
          key={seat.id}
          seat={seat}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      )
    })
  }, [seats, selectedSeatIdSet, activeTool, hoveredSeatId])

  const renderedTexts = useMemo(() => {
    return texts.map((textItem) => {
      const isSelected = selectedTextIdSet.has(textItem.id)
      const isEraseHovered = activeTool === TOOL_ERASER && textItem.id === hoveredTextId

      return (
        <TextComponent
          key={textItem.id}
          textItem={textItem}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      )
    })
  }, [texts, selectedTextIdSet, activeTool, hoveredTextId])

  return {
    renderedSeats,
    renderedTexts,
  }
}