import React from 'react'

// Status colors
const STATUS_COLORS = {
  available: '#5fa7ff', // Blue (default)
  reserved: '#ffa500', // Orange
  sold: '#ef4444', // Red
  locked: '#6b7280', // Gray
}

const SeatSVG = React.memo(({ seat, isSelected, isEraseHovered, onSeatClick, onSeatDoubleClick, onSeatMouseDown, onSeatMouseEnter, onSeatMouseLeave, categoryColor }) => {
  // Determine fill color based on status, category, and selection
  const getFillColor = () => {
    if (isEraseHovered) return 'rgba(232, 98, 110, 0.45)'
    if (isSelected) return '#81b8ff'
    
    // Use status color if available, otherwise use category color or default
    const status = seat.status || 'available'
    if (status !== 'available' && STATUS_COLORS[status]) {
      return STATUS_COLORS[status]
    }
    
    // If available and has category color, use it
    if (categoryColor && status === 'available') {
      return categoryColor
    }
    
    // Fallback to status color or default
    return STATUS_COLORS[status] || seat.fill || STATUS_COLORS.available
  }

  const fillColor = getFillColor()
  // Dark selection border (#1a3a5c) instead of white for visibility on light canvas
  const strokeColor = isEraseHovered ? '#ff7a87' : isSelected ? '#1a3a5c' : 'transparent'
  const strokeWidth = isEraseHovered || isSelected ? 2.5 : 0

  // Determine label text
  const getLabel = () => {
    if (seat.row && seat.number) {
      return `${seat.row}${seat.number}`
    }
    if (seat.label) {
      return seat.label
    }
    if (seat.number) {
      return `${seat.number}`
    }
    return seat.id.substring(0, 4).toUpperCase()
  }

  const label = getLabel()
  
  // Seat dimensions
  const seatSize = (seat.size || seat.radius * 2) || 24
  const cx = seat.x
  const cy = seat.y
  const fontSize = Math.max(7, Math.min(seatSize * 0.32, 10))

  // Determine text color based on background
  const getTextColor = () => {
    const status = seat.status || 'available'
    if (status === 'sold' || status === 'locked' || status === 'reserved') {
      return '#ffffff'
    }
    if (isSelected) {
      return '#1f2937'
    }
    if (categoryColor && status === 'available') {
      const hex = categoryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness < 128 ? '#ffffff' : '#1f2937'
    }
    return '#ffffff'
  }

  const textColor = getTextColor()
  const halfW = seatSize / 2
  const halfH = seatSize / 2

  // Derived colors for chair parts
  const darkerFill = adjustBrightness(fillColor, -30)
  const lighterFill = adjustBrightness(fillColor, 20)

  return (
    <g
      onClick={(e) => onSeatClick?.(e, seat.id)}
      onDoubleClick={(e) => onSeatDoubleClick?.(e, seat.id)}
      onMouseDown={(e) => onSeatMouseDown?.(e, seat)}
      onMouseEnter={() => onSeatMouseEnter?.(seat.id)}
      onMouseLeave={() => onSeatMouseLeave?.()}
      className={isEraseHovered || isSelected ? 'cursor-pointer' : ''}
    >
      {/* Selection outline (rendered behind the chair) */}
      {(isSelected || isEraseHovered) && (
        <rect
          x={cx - halfW - 2}
          y={cy - halfH - 4}
          width={seatSize + 4}
          height={seatSize + 7}
          rx={3}
          ry={3}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}

      {/* ── Legs ── */}
      <rect
        x={cx - halfW * 0.6}
        y={cy + halfH * 0.55}
        width={halfW * 0.2}
        height={halfH * 0.45}
        rx={1}
        fill={darkerFill}
        opacity={0.7}
      />
      <rect
        x={cx + halfW * 0.4}
        y={cy + halfH * 0.55}
        width={halfW * 0.2}
        height={halfH * 0.45}
        rx={1}
        fill={darkerFill}
        opacity={0.7}
      />

      {/* ── Seat base / cushion ── */}
      <rect
        x={cx - halfW * 0.85}
        y={cy + halfH * 0.1}
        width={seatSize * 0.85}
        height={halfH * 0.5}
        rx={2}
        fill={fillColor}
        opacity={0.95}
      />

      {/* ── Armrests ── */}
      <rect
        x={cx - halfW * 0.95}
        y={cy - halfH * 0.15}
        width={halfW * 0.2}
        height={halfH * 0.8}
        rx={2}
        fill={darkerFill}
        opacity={0.85}
      />
      <rect
        x={cx + halfW * 0.75}
        y={cy - halfH * 0.15}
        width={halfW * 0.2}
        height={halfH * 0.8}
        rx={2}
        fill={darkerFill}
        opacity={0.85}
      />

      {/* ── Backrest ── */}
      <rect
        x={cx - halfW * 0.75}
        y={cy - halfH * 0.55}
        width={seatSize * 0.75}
        height={halfH * 0.75}
        rx={3}
        fill={lighterFill}
        opacity={0.9}
      />

      {/* ── Headrest ── */}
      <rect
        x={cx - halfW * 0.45}
        y={cy - halfH * 0.85}
        width={seatSize * 0.45}
        height={halfH * 0.35}
        rx={3}
        fill={darkerFill}
        opacity={0.9}
      />

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
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          userSelect: 'none',
        }}
      >
        {label}
      </text>
    </g>
  )
})
SeatSVG.displayName = 'SeatSVG'

// Helper: adjust hex color brightness
function adjustBrightness(hex, amount) {
  try {
    const clean = hex.replace('#', '')
    if (clean.length < 6) return hex
    let r = parseInt(clean.substr(0, 2), 16)
    let g = parseInt(clean.substr(2, 2), 16)
    let b = parseInt(clean.substr(4, 2), 16)
    r = Math.max(0, Math.min(255, r + amount))
    g = Math.max(0, Math.min(255, g + amount))
    b = Math.max(0, Math.min(255, b + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
}

export default SeatSVG
