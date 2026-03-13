import { useMemo } from "react";
import { TOOL_ERASER } from "../constants/tools";
import SeatComponent from "../canvas/SeatComponent";
import TextComponent from "../canvas/TextComponent";

/**
 * Renders seats and texts as React elements for the SVG canvas.
 * Supports:
 * - selection state
 * - eraser hover state
 * - category-based seat coloring
 */
export function useRenderedElements(
  seats,
  texts,
  selectedSeatIds,
  selectedTextIds,
  activeTool,
  hoveredSeatId,
  hoveredTextId,
  categories = [],
) {
  const selectedSeatIdSet = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds],
  );
  const selectedTextIdSet = useMemo(
    () => new Set(selectedTextIds),
    [selectedTextIds],
  );

  // Map category id -> color for quick lookup
  const categoryColorMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      if (cat?.id && cat?.color) {
        map.set(cat.id, cat.color);
      }
    });
    return map;
  }, [categories]);

  const renderedSeats = useMemo(() => {
    return seats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id);
      const isEraseHovered =
        activeTool === TOOL_ERASER && seat.id === hoveredSeatId;
      const categoryColor = seat.category
        ? categoryColorMap.get(seat.category) || null
        : null;

      return (
        <SeatComponent
          key={seat.id}
          seat={seat}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
          categoryColor={categoryColor}
        />
      );
    });
  }, [seats, selectedSeatIdSet, activeTool, hoveredSeatId, categoryColorMap]);

  const renderedTexts = useMemo(() => {
    return texts.map((textItem) => {
      const isSelected = selectedTextIdSet.has(textItem.id);
      const isEraseHovered =
        activeTool === TOOL_ERASER && textItem.id === hoveredTextId;

      return (
        <TextComponent
          key={textItem.id}
          textItem={textItem}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      );
    });
  }, [texts, selectedTextIdSet, activeTool, hoveredTextId]);

  return {
    renderedSeats,
    renderedTexts,
  };
}
