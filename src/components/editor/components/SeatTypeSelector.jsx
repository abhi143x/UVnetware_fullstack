import React from "react";
import { SEAT_TYPES, SEAT_TYPE_CONFIG } from "../constants/seatTypes";

// Render mini seat previews
function renderMiniSeat(seatType, size = 20) {
  const halfW = size / 2;
  const halfH = size / 2;
  const cx = halfW;
  const cy = halfH;
  const fill = "#5fa7ff";
  const darker = "#3a7bcc";
  const lighter = "#7ab8ff";

  switch (seatType) {
    case SEAT_TYPES.SOFA:
      return (
        <svg width={size * 2.5} height={size} viewBox={`0 0 ${size * 2.5} ${size}`}>
          <rect x={halfW * 0.3} y={halfH * 0.3} width={size * 1.3} height={halfH * 0.5} rx={2} fill={fill} />
          <rect x={halfW * 0.1} y={halfH * 0.2} width={2} height={halfH * 0.6} fill={darker} />
          <rect x={size * 2.2} y={halfH * 0.2} width={2} height={halfH * 0.6} fill={darker} />
        </svg>
      );
    case SEAT_TYPES.TABLE:
      return (
        <svg width={size * 2} height={size * 1.8} viewBox={`0 0 ${size * 2} ${size * 1.8}`}>
          <ellipse cx={size} cy={size * 0.8} rx={halfW * 1.2} ry={halfH * 0.8} fill={fill} />
          <rect x={halfW * 0.7} y={size * 1.1} width={2} height={size * 0.5} fill={darker} />
          <rect x={size * 1.8} y={size * 1.1} width={2} height={size * 0.5} fill={darker} />
        </svg>
      );
    case SEAT_TYPES.WHEELCHAIR:
      return (
        <svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <circle cx={size * 1.1} cy={size * 1.2} r={halfH * 0.6} fill="none" stroke={darker} strokeWidth={1.5} />
          <circle cx={halfW * 1.2} cy={size * 1.4} r={halfH * 0.4} fill="none" stroke={darker} strokeWidth={1} />
          <rect x={halfW * 0.6} y={halfH * 0.8} width={size * 0.6} height={halfH * 0.4} fill={fill} />
          <rect x={size * 1.2} y={halfH * 0.4} width={2} height={halfH * 0.8} fill={darker} />
        </svg>
      );
    case SEAT_TYPES.ROUND_TABLE:
      return (
        <svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
          <circle cx={size} cy={size} r={halfW * 1.4} fill={fill} />
          <circle cx={size} cy={size * 0.2} r={2} fill={darker} />
        </svg>
      );
    default: // CHAIR
      return (
        <svg width={size * 1.5} height={size * 2} viewBox={`0 0 ${size * 1.5} ${size * 2}`}>
          <rect x={halfW * 0.3} y={size * 0.8} width={size * 0.7} height={halfH * 0.5} fill={fill} />
          <rect x={halfW * 0.2} y={size * 0.4} width={2} height={halfH * 0.8} fill={darker} />
          <rect x={size * 0.9} y={size * 0.4} width={2} height={halfH * 0.8} fill={darker} />
          <rect x={halfW * 0.3} y={halfH * 0.2} width={size * 0.7} height={halfH * 0.3} fill={lighter} />
        </svg>
      );
  }
}

export function SeatTypeSelector({ selectedType = SEAT_TYPES.CHAIR, onSelectType }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] text-[#6b7a94] font-medium tracking-wide">Seat Type</label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(SEAT_TYPES).map(([key, seatType]) => {
          const config = SEAT_TYPE_CONFIG[seatType];
          const isSelected = selectedType === seatType;

          return (
            <button
              key={seatType}
              onClick={() => onSelectType?.(seatType)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 transition-all ${isSelected
                  ? "bg-[#587cb3]/20 border-[#587cb3]/50 shadow-[0_0_8px_rgba(88,124,179,0.2)]"
                  : "bg-[#0c1017] border-white/8 hover:border-white/20 hover:bg-[#161c26]"
                }`}
              title={config.label}
            >
              <div className="h-6 flex items-center justify-center">
                {renderMiniSeat(seatType, 12)}
              </div>
              <span className="text-[9px] text-white/70">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
