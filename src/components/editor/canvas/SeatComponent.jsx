import React from 'react'

const SeatSVG = React.memo(({ seat, isSelected, isEraseHovered, onSeatClick, onSeatDoubleClick, onSeatMouseDown, onSeatMouseEnter, onSeatMouseLeave }) => {
  return (
    <circle
      cx={seat.x}
      cy={seat.y}
      r={seat.radius}
      fill={isEraseHovered ? 'rgba(232, 98, 110, 0.45)' : isSelected ? '#81b8ff' : seat.fill}
      stroke={isEraseHovered ? '#ff7a87' : isSelected ? '#edf6ff' : seat.stroke}
      strokeWidth={isEraseHovered || isSelected ? 3 : 2}
      onClick={(e) => onSeatClick?.(e, seat.id)}
      onDoubleClick={(e) => onSeatDoubleClick?.(e, seat.id)}
      onMouseDown={(e) => onSeatMouseDown?.(e, seat)}
      onMouseEnter={() => onSeatMouseEnter?.(seat.id)}
      onMouseLeave={() => onSeatMouseLeave?.()}
      className={isEraseHovered || isSelected ? 'cursor-pointer z-10' : ''}
    />
  )
})
SeatSVG.displayName = 'SeatSVG'

export default SeatSVG