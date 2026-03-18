import React from "react";

const GridLayer = React.memo(function GridLayer({ snapEnabled, gridSize = 20, camera, viewport }) {
  if (!snapEnabled || !camera || !viewport || viewport.width <= 1) return null;

  const { scale, position } = camera;
  const left = -position.x / scale;
  const top = -position.y / scale;
  const width = viewport.width / scale;
  const height = viewport.height / scale;

  return (
    <>
      <defs>
        <pattern 
          id="snap-grid" 
          width={gridSize} 
          height={gridSize} 
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="rgba(255, 255, 255, 0.12)" />
        </pattern>
      </defs>
      <rect 
        x={left} 
        y={top} 
        width={width} 
        height={height} 
        fill="url(#snap-grid)" 
        pointerEvents="none" 
      />
    </>
  );
});

export default GridLayer;
