import React from 'react'
import SeatComponent from './SeatComponent'
import TextComponent from './TextComponent'
import { PREVIEW_SEAT_RADIUS } from '../utils/mathUtils'
import { TOOL_ROW, TOOL_ARC, TOOL_SELECT } from '../constants/tools'

const CanvasStage = ({
  viewport,
  camera,
  renderedSeats,
  renderedTexts,
  activeTool,
  rowPreviewPoints,
  arcPreviewPoints,
  marqueeRect,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{ display: 'block' }}
    >
      <g transform={`translate(${camera.position.x}, ${camera.position.y}) scale(${camera.scale})`}>
        {renderedSeats}
        {renderedTexts}

        {activeTool === TOOL_ROW &&
          rowPreviewPoints.map((point, index) => (
            <circle
              key={`row-preview-${index}`}
              cx={point.x}
              cy={point.y}
              r={PREVIEW_SEAT_RADIUS}
              fill="rgba(129, 184, 255, 0.35)"
              stroke="rgba(230, 240, 255, 0.7)"
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}

        {activeTool === TOOL_ARC &&
          arcPreviewPoints.map((point, index) => (
            <circle
              key={`arc-preview-${index}`}
              cx={point.x}
              cy={point.y}
              r={PREVIEW_SEAT_RADIUS}
              fill="rgba(111, 222, 198, 0.3)"
              stroke="rgba(192, 245, 232, 0.72)"
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}

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
      </g>
    </svg>
  )
}

export default CanvasStage