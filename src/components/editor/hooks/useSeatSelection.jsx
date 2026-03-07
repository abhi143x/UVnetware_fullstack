import { useState, useMemo } from 'react'

export function useSeatSelection(seats, texts) {
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [selectedTextIds, setSelectedTextIds] = useState([])
  const [hoveredSeatId, setHoveredSeatId] = useState(null)
  const [hoveredTextId, setHoveredTextId] = useState(null)

  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])
  const seatsById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats])
  const selectedTextIdSet = useMemo(() => new Set(selectedTextIds), [selectedTextIds])
  const textsById = useMemo(() => new Map(texts.map((textItem) => [textItem.id, textItem])), [texts])

  const selectSeat = (seatId) => {
    setSelectedSeatIds([seatId])
    setSelectedTextIds([])
  }

  const selectText = (textId) => {
    setSelectedTextIds([textId])
    setSelectedSeatIds([])
  }

  const clearSelection = () => {
    setSelectedSeatIds([])
    setSelectedTextIds([])
  }

  return {
    selectedSeatIds,
    selectedTextIds,
    hoveredSeatId,
    hoveredTextId,
    selectedSeatIdSet,
    seatsById,
    selectedTextIdSet,
    textsById,
    selectSeat,
    selectText,
    clearSelection,
    setHoveredSeatId,
    setHoveredTextId,
  }
}