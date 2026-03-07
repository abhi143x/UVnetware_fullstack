import React from 'react'

const TextSVG = React.memo(({ textItem, isSelected, isEraseHovered, onTextClick, onTextMouseDown, onTextMouseEnter, onTextMouseLeave }) => {
  const scale = textItem.scale || 1
  const fontSize = textItem.fontSize || 20

  return (
    <g transform={`translate(${textItem.x}, ${textItem.y}) scale(${scale})`}>
      <text
        x={0}
        y={0}
        fill={isEraseHovered ? '#ff7a87' : (textItem.fill || '#c9d6ea')}
        fontSize={fontSize}
        fontWeight={textItem.fontWeight || 'normal'}
        fontStyle={textItem.fontStyle || 'normal'}
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        onClick={(e) => onTextClick?.(e, textItem.id)}
        onMouseDown={(e) => onTextMouseDown?.(e, textItem)}
        onMouseEnter={() => onTextMouseEnter?.(textItem.id)}
        onMouseLeave={() => onTextMouseLeave?.()}
        className={`select-none ${isEraseHovered || isSelected ? 'cursor-pointer' : ''}`}
      >
        {textItem.content}
      </text>
    </g>
  )
})
TextSVG.displayName = 'TextSVG'

export default TextSVG