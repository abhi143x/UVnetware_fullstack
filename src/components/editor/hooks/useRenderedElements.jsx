import { useMemo } from "react";
import { TOOL_ERASER } from "../constants/tools";
import ShapeComponent from "../canvas/ShapeComponent";
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
  shapes,
  selectedSeatIds,
  selectedTextIds,
  selectedShapeIds,
  activeTool,
  hoveredSeatId,
  hoveredTextId,
  hoveredShapeId,
  categories = [],
  camera = null,
  viewport = null,
) {
  const selectedSeatIdSet = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds],
  );
  const selectedTextIdSet = useMemo(
    () => new Set(selectedTextIds),
    [selectedTextIds],
  );
  const selectedShapeIdSet = useMemo(
    () => new Set(selectedShapeIds),
    [selectedShapeIds],
  );
  const isEraseModeActive = activeTool === TOOL_ERASER;

  const erasePreviewSeatIdSet = useMemo(() => {
    if (!isEraseModeActive || !hoveredSeatId) return null;

    if (selectedSeatIdSet.size > 0 && selectedSeatIdSet.has(hoveredSeatId)) {
      return selectedSeatIdSet;
    }

    return new Set([hoveredSeatId]);
  }, [isEraseModeActive, hoveredSeatId, selectedSeatIdSet]);

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

  // P-06: Compute visible world bounds for viewport culling
  const visibleSeats = useMemo(() => {
    if (!camera || !viewport || viewport.width <= 1) return seats;
    const scale = camera.scale;
    const left   = -camera.position.x / scale;
    const top    = -camera.position.y / scale;
    const right  = left + viewport.width / scale;
    const bottom = top  + viewport.height / scale;
    // 1-seat padding so seats at the edge don't pop
    const MARGIN = 30;
    return seats.filter(
      (s) => s.x >= left - MARGIN && s.x <= right + MARGIN &&
             s.y >= top  - MARGIN && s.y <= bottom + MARGIN
    );
  }, [seats, camera, viewport]);

  const renderedSeats = useMemo(() => {
    return visibleSeats.map((seat) => {
      const isSelected = selectedSeatIdSet.has(seat.id);
      const isEraseHovered = Boolean(erasePreviewSeatIdSet?.has(seat.id));
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
  }, [visibleSeats, selectedSeatIdSet, erasePreviewSeatIdSet, categoryColorMap]);

  const renderedTexts = useMemo(() => {
    return texts.map((textItem) => {
      const isSelected = selectedTextIdSet.has(textItem.id);
      const isEraseHovered =
        isEraseModeActive && textItem.id === hoveredTextId;

      return (
        <g
          key={textItem.id}
          data-type="text"
          onClick={(e) => {
            e.stopPropagation();   
          }}
        >
          <TextComponent
            textItem={textItem}
            isSelected={isSelected}
            isEraseHovered={isEraseHovered}
            activeTool={activeTool}
          />
        </g>
      );
    });
  }, [texts, selectedTextIdSet, isEraseModeActive, hoveredTextId, activeTool]);

  const renderedShapes = useMemo(() => {
    return shapes.map((shape) => {
      const isSelected = selectedShapeIdSet.has(shape.id);
      const isEraseHovered =
        isEraseModeActive && shape.id === hoveredShapeId;

      return (
        <ShapeComponent
          key={shape.id}
          shape={shape}
          isSelected={isSelected}
          isEraseHovered={isEraseHovered}
        />
      );
    });
  }, [shapes, selectedShapeIdSet, isEraseModeActive, hoveredShapeId]);

  return {
    renderedShapes,
    renderedSeats,
    renderedTexts,
  };
}
