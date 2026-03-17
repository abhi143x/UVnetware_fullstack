import React from "react";
import { SEAT_TYPES, SEAT_TYPE_CONFIG } from "../constants/seatTypes";

// Status colors
const STATUS_COLORS = {
  available: "#5fa7ff", // Blue (default)
  reserved: "#ffa500", // Orange
  sold: "#ef4444", // Red
  locked: "#6b7280", // Gray
};

// Render different seat types
function renderSeatShape(cx, cy, seatType, width, height, fillColor, darkerFill, lighterFill) {
  const halfW = width / 2;
  const halfH = height / 2;

  switch (seatType) {
    case SEAT_TYPES.SOFA:
      return (
        <>
          {/* Sofa legs */}
          <rect x={cx - halfW * 0.7} y={cy + halfH * 0.6} width={width * 0.15} height={halfH * 0.4} rx={1} fill={darkerFill} opacity={0.7} />
          <rect x={cx + halfW * 0.5} y={cy + halfH * 0.6} width={width * 0.15} height={halfH * 0.4} rx={1} fill={darkerFill} opacity={0.7} />
          {/* Sofa cushion */}
          <rect x={cx - halfW * 0.9} y={cy - halfH * 0.15} width={width * 0.9} height={halfH * 0.7} rx={3} fill={fillColor} opacity={0.95} />
          {/* Sofa armrests */}
          <rect x={cx - halfW - 2} y={cy - halfH * 0.1} width={4} height={halfH * 0.6} rx={2} fill={darkerFill} opacity={0.85} />
          <rect x={cx + halfW - 2} y={cy - halfH * 0.1} width={4} height={halfH * 0.6} rx={2} fill={darkerFill} opacity={0.85} />
          {/* Backrest */}
          <rect x={cx - halfW * 0.85} y={cy - halfH * 0.7} width={width * 0.85} height={halfH * 0.6} rx={2} fill={lighterFill} opacity={0.9} />
        </>
      );

    case SEAT_TYPES.TABLE:
      return (
        <>
          {/* Table legs */}
          <rect x={cx - halfW * 0.7} y={cy + halfH * 0.5} width={width * 0.12} height={halfH * 0.5} rx={1} fill={darkerFill} opacity={0.8} />
          <rect x={cx + halfW * 0.58} y={cy + halfH * 0.5} width={width * 0.12} height={halfH * 0.5} rx={1} fill={darkerFill} opacity={0.8} />
          {/* Table top */}
          <ellipse cx={cx} cy={cy} rx={halfW * 0.85} ry={halfH * 0.6} fill={fillColor} opacity={0.95} />
          {/* Table edge highlight */}
          <ellipse cx={cx} cy={cy - halfH * 0.05} rx={halfW * 0.8} ry={halfH * 0.55} fill="none" stroke={lighterFill} strokeWidth={1} opacity={0.5} />
        </>
      );

    case SEAT_TYPES.WHEELCHAIR:
      return (
        <>
          {/* Wheel back */}
          <circle cx={cx + halfW * 0.3} cy={cy + halfH * 0.2} r={halfH * 0.55} fill="none" stroke={darkerFill} strokeWidth={2} opacity={0.8} />
          {/* Wheel front */}
          <circle cx={cx - halfW * 0.3} cy={cy + halfH * 0.35} r={halfH * 0.4} fill="none" stroke={darkerFill} strokeWidth={1.5} opacity={0.7} />
          {/* Seat cushion */}
          <rect x={cx - halfW * 0.5} y={cy - halfH * 0.3} width={width * 0.6} height={halfH * 0.5} rx={2} fill={fillColor} opacity={0.95} />
          {/* Backrest */}
          <rect x={cx - halfW * 0.45} y={cy - halfH * 0.7} width={width * 0.3} height={halfH * 0.5} rx={2} fill={lighterFill} opacity={0.9} />
          {/* Armrest right */}
          <rect x={cx + halfW * 0.3} y={cy - halfH * 0.2} width={3} height={halfH * 0.8} rx={1} fill={darkerFill} opacity={0.85} />
        </>
      );

    case SEAT_TYPES.ROUND_TABLE:
      return (
        <>
          {/* Pedestal base */}
          <circle cx={cx} cy={cy + halfH * 0.5} r={width * 0.08} fill={darkerFill} opacity={0.8} />
          {/* Round table top */}
          <circle cx={cx} cy={cy} r={Math.max(halfW, halfH) * 0.85} fill={fillColor} opacity={0.95} />
          {/* Table edge highlight */}
          <circle cx={cx} cy={cy} r={Math.max(halfW, halfH) * 0.8} fill="none" stroke={lighterFill} strokeWidth={1} opacity={0.5} />
        </>
      );

    default: // CHAIR
      return (
        <>
          {/* Legs */}
          <rect x={cx - halfW * 0.6} y={cy + halfH * 0.55} width={halfW * 0.2} height={halfH * 0.45} rx={1} fill={darkerFill} opacity={0.7} />
          <rect x={cx + halfW * 0.4} y={cy + halfH * 0.55} width={halfW * 0.2} height={halfH * 0.45} rx={1} fill={darkerFill} opacity={0.7} />
          {/* Seat base / cushion */}
          <rect x={cx - halfW * 0.85} y={cy + halfH * 0.1} width={width * 0.85} height={halfH * 0.5} rx={2} fill={fillColor} opacity={0.95} />
          {/* Armrests */}
          <rect x={cx - halfW * 0.95} y={cy - halfH * 0.15} width={halfW * 0.2} height={halfH * 0.8} rx={2} fill={darkerFill} opacity={0.85} />
          <rect x={cx + halfW * 0.75} y={cy - halfH * 0.15} width={halfW * 0.2} height={halfH * 0.8} rx={2} fill={darkerFill} opacity={0.85} />
          {/* Backrest */}
          <rect x={cx - halfW * 0.75} y={cy - halfH * 0.55} width={width * 0.75} height={halfH * 0.75} rx={3} fill={lighterFill} opacity={0.9} />
          {/* Headrest */}
          <rect x={cx - halfW * 0.45} y={cy - halfH * 0.85} width={width * 0.45} height={halfH * 0.35} rx={3} fill={darkerFill} opacity={0.9} />
        </>
      );
  }
}

const SeatSVG = React.memo(
  ({
    seat,
    isSelected,
    isEraseHovered,
    onSeatClick,
    onSeatDoubleClick,
    onSeatMouseDown,
    onSeatMouseEnter,
    onSeatMouseLeave,
    categoryColor,
  }) => {
    // Determine fill color based on status, category, and selection
    const getFillColor = () => {
      if (isEraseHovered) return "rgba(232, 98, 110, 0.45)";
      if (isSelected) return "#81b8ff";

      // Use status color if available, otherwise use category color or default
      const status = seat.status || "available";
      if (status !== "available" && STATUS_COLORS[status]) {
        return STATUS_COLORS[status];
      }

      // If available and has category color, use it
      if (categoryColor && status === "available") {
        return categoryColor;
      }

      // Fallback to status color or default
      return STATUS_COLORS[status] || seat.fill || STATUS_COLORS.available;
    };

    const fillColor = getFillColor();
    const strokeColor = isEraseHovered
      ? "#ff7a87"
      : isSelected
        ? "#1a3a5c"
        : "transparent";
    const strokeWidth = isEraseHovered || isSelected ? 2.5 : 0;

    // Determine label text
    const getLabel = () => {
      if (seat.row && seat.number) {
        return `${seat.row}${seat.number}`;
      }
      if (seat.label) {
        return seat.label;
      }
      if (seat.number) {
        return `${seat.number}`;
      }
      return seat.id.substring(0, 4).toUpperCase();
    };

    const label = getLabel();

    // Seat dimensions - prefer width/height, fall back to size
    const width = seat.width || seat.size || 24;
    const height = seat.height || seat.size || 24;
    const cx = seat.x;
    const cy = seat.y;
    const seatType = seat.seatType || SEAT_TYPES.CHAIR;
    const fontSize = Math.max(7, Math.min(Math.min(width, height) * 0.32, 10));

    // Determine text color based on background
    const getTextColor = () => {
      const status = seat.status || "available";
      if (status === "sold" || status === "locked" || status === "reserved") {
        return "#ffffff";
      }
      if (isSelected) {
        return "#1f2937";
      }
      if (categoryColor && status === "available") {
        const hex = categoryColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128 ? "#ffffff" : "#1f2937";
      }
      return "#ffffff";
    };

    const textColor = getTextColor();
    const halfW = width / 2;
    const halfH = height / 2;

    // Derived colors for chair parts
    const darkerFill = adjustBrightness(fillColor, -30);
    const lighterFill = adjustBrightness(fillColor, 20);

    return (
      <g
        onClick={(e) => onSeatClick?.(e, seat.id)}
        onDoubleClick={(e) => onSeatDoubleClick?.(e, seat.id)}
        onMouseDown={(e) => onSeatMouseDown?.(e, seat)}
        onMouseEnter={() => onSeatMouseEnter?.(seat.id)}
        onMouseLeave={() => onSeatMouseLeave?.()}
        className={isEraseHovered || isSelected ? "cursor-pointer" : ""}
      >
        {/* Selection outline */}
        {(isSelected || isEraseHovered) && (
          <rect
            x={cx - halfW - 2}
            y={cy - halfH - 4}
            width={width + 4}
            height={height + 7}
            rx={3}
            ry={3}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}

        {/* Render seat based on type */}
        {renderSeatShape(cx, cy, seatType, width, height, fillColor, darkerFill, lighterFill)}

        {/* Seat label */}
        <text
          x={cx}
          y={cy + halfH * 0.05}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={fontSize}
          fontWeight="bold"
          pointerEvents="none"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            userSelect: "none",
          }}
        >
          {label}
        </text>
      </g>
    );
  },
);
SeatSVG.displayName = "SeatSVG";

// Helper: adjust hex color brightness
function adjustBrightness(hex, amount) {
  try {
    const clean = hex.replace("#", "");
    if (clean.length < 6) return hex;
    let r = parseInt(clean.substr(0, 2), 16);
    let g = parseInt(clean.substr(2, 2), 16);
    let b = parseInt(clean.substr(4, 2), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return hex;
  }
}

export default SeatSVG;
