import React from "react";
import { PREVIEW_SEAT_RADIUS } from "../../utils/mathUtils";
import {
  TOOL_ROW,
  TOOL_ARC,
  TOOL_SELECT,
  TOOL_SHAPE,
} from "../../constants/tools";
import { getRowLetter, generateSeatLabel } from "../../utils/seatNumbering";

const SelectionLayer = React.memo(function SelectionLayer({
  activeTool,
  rowPreviewPoints,
  arcPreviewPoints,
  polygonPreview,
  marqueeRect,
  nextRowIndex = 0,
}) {
  const currentRowLetter = getRowLetter(nextRowIndex);
  const polygonPoints = polygonPreview?.points || [];
  const previewPoint = polygonPreview?.previewPoint || null;
  const polygonPath = [
    ...polygonPoints,
    ...(previewPoint ? [previewPoint] : []),
  ]
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <>
      {activeTool === TOOL_ROW &&
        rowPreviewPoints.map((point, index) => {
          const label = generateSeatLabel(currentRowLetter, index + 1);
          const previewSize = PREVIEW_SEAT_RADIUS * 2;
          const rectX = point.x - previewSize / 2;
          const rectY = point.y - previewSize / 2;
          return (
            <g key={`row-preview-${index}`}>
              <rect
                x={rectX}
                y={rectY}
                width={previewSize}
                height={previewSize}
                rx={2}
                ry={2}
                fill="rgba(129, 184, 255, 0.35)"
                stroke="rgba(230, 240, 255, 0.7)"
                strokeWidth={2}
                pointerEvents="none"
              />
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={10}
                fontWeight="bold"
                pointerEvents="none"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {label}
              </text>
            </g>
          );
        })}

      {activeTool === TOOL_ARC &&
        arcPreviewPoints.map((point, index) => {
          const label = generateSeatLabel(currentRowLetter, index + 1);
          const previewSize = PREVIEW_SEAT_RADIUS * 2;
          const rectX = point.x - previewSize / 2;
          const rectY = point.y - previewSize / 2;
          return (
            <g key={`arc-preview-${index}`}>
              <rect
                x={rectX}
                y={rectY}
                width={previewSize}
                height={previewSize}
                rx={2}
                ry={2}
                fill="rgba(111, 222, 198, 0.3)"
                stroke="rgba(192, 245, 232, 0.72)"
                strokeWidth={2}
                pointerEvents="none"
              />
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={10}
                fontWeight="bold"
                pointerEvents="none"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {label}
              </text>
            </g>
          );
        })}

      {activeTool === TOOL_SELECT && marqueeRect && (
        <rect
          x={marqueeRect.x}
          y={marqueeRect.y}
          width={marqueeRect.width}
          height={marqueeRect.height}
          fill="rgba(115, 152, 206, 0.16)"
          stroke="rgba(160, 196, 245, 0.75)"
          strokeWidth={1.5}
          strokeDasharray="10,8"
          pointerEvents="none"
        />
      )}

      {activeTool === TOOL_SHAPE && polygonPoints.length > 0 && (
        <g pointerEvents="none">
          {polygonPath && (
            <polyline
              points={polygonPath}
              fill="rgba(95, 167, 255, 0.1)"
              stroke="rgba(149, 198, 255, 0.9)"
              strokeWidth={2}
              strokeDasharray="8 6"
            />
          )}
          {polygonPoints.map((point, index) => (
            <circle
              key={`polygon-point-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === 0 ? 5 : 4}
              fill={index === 0 ? "#f6fbff" : "#a7cbff"}
              stroke="rgba(49, 88, 129, 0.9)"
              strokeWidth={1.5}
            />
          ))}
        </g>
      )}
    </>
  );
});

export default SelectionLayer;
