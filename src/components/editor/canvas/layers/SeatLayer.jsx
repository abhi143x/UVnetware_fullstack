import React from "react";

const SeatLayer = React.memo(function SeatLayer({ renderedSeats }) {
  return <>{renderedSeats}</>;
});

export default SeatLayer;
