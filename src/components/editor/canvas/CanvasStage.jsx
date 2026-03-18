import React from "react";
import GridLayer from "./layers/GridLayer";
import ShapeLayer from "./layers/ShapeLayer";
import SeatLayer from "./layers/SeatLayer";
import TextLayer from "./layers/TextLayer";
import SelectionLayer from "./layers/SelectionLayer";

const CanvasStage = ({
  viewport,
  camera,
  renderedShapes,
  renderedSeats,
  renderedTexts,
  activeTool,
  selectionCenter,
  rowPreviewPoints,
  arcPreviewPoints,
  polygonPreview,
  marqueeRect,
  nextRowIndex = 0,
  snapEnabled,
  gridSize,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{ display: "block" }}
    >
      <g
        transform={`translate(${camera.position.x}, ${camera.position.y}) scale(${camera.scale})`}
      >
        <GridLayer camera={camera} viewport={viewport} snapEnabled={snapEnabled} gridSize={gridSize} />
        <ShapeLayer renderedShapes={renderedShapes} />
        <SeatLayer renderedSeats={renderedSeats} />
        <TextLayer renderedTexts={renderedTexts} />
        <SelectionLayer
          activeTool={activeTool}
          selectionCenter={selectionCenter}
          rowPreviewPoints={rowPreviewPoints}
          arcPreviewPoints={arcPreviewPoints}
          polygonPreview={polygonPreview}
          marqueeRect={marqueeRect}
          nextRowIndex={nextRowIndex}
        />
      </g>
    </svg>
  );
};

export default CanvasStage;
