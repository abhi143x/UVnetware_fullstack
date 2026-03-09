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
  const strokeColor = isEraseHovered ? '#ff7a87' : isSelected ? '#edf6ff' : seat.stroke || '#cfe4ff'
  const strokeWidth = isEraseHovered || isSelected ? 3 : 2

  // Determine label text
  const getLabel = () => {
    // Priority: row+number > custom label > number > id
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
  
  // Convert radius to size (radius represents half the square size)
  const seatSize = (seat.size || seat.radius * 2) || 24
  const fontSize = Math.max(9, Math.min(seatSize * 0.4, 12))
  
  // Calculate rectangle position (centered on x, y)
  const rectX = seat.x - seatSize / 2
  const rectY = seat.y - seatSize / 2
  
  // Determine text color based on background
  const getTextColor = () => {
    const status = seat.status || 'available'
    if (status === 'sold' || status === 'locked' || status === 'reserved') {
      return '#ffffff'
    }
    if (isSelected) {
      return '#1f2937' // Dark text on light blue
    }
    if (categoryColor && status === 'available') {
      // Check if category color is dark
      const hex = categoryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness < 128 ? '#ffffff' : '#1f2937'
    }
    return '#1f2937'
  }

  const textColor = getTextColor()

  return (
    <g>
      <rect
        x={rectX}
        y={rectY}
        width={seatSize}
        height={seatSize}
        rx={2}
        ry={2}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onClick={(e) => onSeatClick?.(e, seat.id)}
        onDoubleClick={(e) => onSeatDoubleClick?.(e, seat.id)}
        onMouseDown={(e) => onSeatMouseDown?.(e, seat)}
        onMouseEnter={() => onSeatMouseEnter?.(seat.id)}
        onMouseLeave={() => onSeatMouseLeave?.()}
        className={isEraseHovered || isSelected ? 'cursor-pointer z-10' : ''}
      />
      {/* Seat label */}
      <text
        x={seat.x}
        y={seat.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={fontSize}
        fontWeight="bold"
        pointerEvents="none"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
      >
        {label}
      </text>
    </g>
  )
})
SeatSVG.displayName = 'SeatSVG'

export default SeatSVG