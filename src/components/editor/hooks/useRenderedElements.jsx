import { useMemo } from "react";
import { TOOL_ERASER } from "../constants/tools";
import SeatComponent from "../canvas/SeatComponent";
import TextComponent from "../canvas/TextComponent";

export function useRenderedElements(
  seats,
  texts,
  selectedSeatIds,
  selectedTextIds,
  activeTool,
  hoveredSeatId,
  hoveredTextId,
) {
  const selectedSeatIdSet = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds],
  );
  const selectedTextIdSet = useMemo(
    () => new Set(selectedTextIds),
    [selectedTextIds],
  );
  const isHoveringSelectedGroup = useMemo(() => {
    if (activeTool !== TOOL_ERASER) return false;

    const hoveringSelectedSeat =
      hoveredSeatId != null && selectedSeatIdSet.has(hoveredSeatId);
    const hoveringSelectedText =
      hoveredTextId != null && selectedTextIdSet.has(hoveredTextId);

    return hoveringSelectedSeat || hoveringSelectedText;
  }, [
    activeTool,
    hoveredSeatId,
    hoveredTextId,
    selectedSeatIdSet,
    selectedTextIdSet,
  ]);

  const renderedSeats = useMemo(() => {
    return seats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id);
      const isDirectlyHovered =
        activeTool === TOOL_ERASER && seat.id === hoveredSeatId;
      const isEraseHovered =
        isDirectlyHovered || (isHoveringSelectedGroup && isSelected);

      return (
        <SeatComponent
          key={seat.id}
          seat={seat}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      );
    });
  }, [
    seats,
    selectedSeatIdSet,
    activeTool,
    hoveredSeatId,
    isHoveringSelectedGroup,
  ]);

  const renderedTexts = useMemo(() => {
    return texts.map((textItem) => {
      const isSelected = selectedTextIdSet.has(textItem.id);
      const isDirectlyHovered =
        activeTool === TOOL_ERASER && textItem.id === hoveredTextId;
      const isEraseHovered =
        isDirectlyHovered || (isHoveringSelectedGroup && isSelected);

      return (
        <TextComponent
          key={textItem.id}
          textItem={textItem}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      );
    });
  }, [
    texts,
    selectedTextIdSet,
    activeTool,
    hoveredTextId,
    isHoveringSelectedGroup,
  ]);

  return {
    renderedSeats,
    renderedTexts,
  };
}
