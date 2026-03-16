import React from "react";

const ShapeLayer = React.memo(function ShapeLayer({ renderedShapes }) {
  return <>{renderedShapes}</>;
});

export default ShapeLayer;
