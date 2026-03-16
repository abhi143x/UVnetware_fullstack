import React from "react";
import {
  getShapeAbsolutePoints,
  getShapeBounds,
  getShapeResizeHandles,
  SHAPE_TYPES,
} from "../services/shapeService";

const ShapeComponent = React.memo(function ShapeComponent({
  shape,
  isSelected,
  isEraseHovered,
}) {
  const bounds = getShapeBounds(shape);
  const left = bounds.left;
  const top = bounds.top;
  const width = Math.max(20, bounds.width || 0);
  const height = Math.max(20, bounds.height || 0);
  const isCircle = shape.type === SHAPE_TYPES.CIRCLE;
  const isPolygon = shape.type === SHAPE_TYPES.POLYGON;
  const polygonPoints = getShapeAbsolutePoints(shape);
  const polygonPath = polygonPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const resizeHandles = getShapeResizeHandles(shape);

  return (
    <g>
      {(isSelected || isEraseHovered) && (
        <rect
          x={left - 4}
          y={top - 4}
          width={width + 8}
          height={height + 8}
          fill="none"
          stroke={isEraseHovered ? "#ff7a87" : "#86baff"}
          strokeWidth={1.5}
          strokeDasharray="8 4"
          pointerEvents="none"
        />
      )}

      {isPolygon ? (
        <polygon
          points={polygonPath}
          fill={isEraseHovered ? "rgba(255, 122, 135, 0.24)" : shape.fill}
          stroke={isEraseHovered ? "#ff7a87" : shape.stroke}
          strokeWidth={shape.strokeWidth || 2}
          strokeLinejoin="round"
        />
      ) : isCircle ? (
        <ellipse
          cx={shape.x}
          cy={shape.y}
          rx={width / 2}
          ry={height / 2}
          fill={isEraseHovered ? "rgba(255, 122, 135, 0.24)" : shape.fill}
          stroke={isEraseHovered ? "#ff7a87" : shape.stroke}
          strokeWidth={shape.strokeWidth || 2}
        />
      ) : (
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          fill={isEraseHovered ? "rgba(255, 122, 135, 0.24)" : shape.fill}
          stroke={isEraseHovered ? "#ff7a87" : shape.stroke}
          strokeWidth={shape.strokeWidth || 2}
          rx={8}
          ry={8}
        />
      )}

      {isSelected &&
        resizeHandles.map((handle) => (
          <rect
            key={`${shape.id}-${handle.key}`}
            x={handle.x - 4}
            y={handle.y - 4}
            width={8}
            height={8}
            fill="#d8e7ff"
            stroke="#2c5b8a"
            strokeWidth={1}
            pointerEvents="none"
          />
        ))}
    </g>
  );
});

export default ShapeComponent;
