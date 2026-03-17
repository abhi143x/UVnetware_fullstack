import React from "react";
import { useEditorStore } from "../store/editorStore";


const TextSVG = React.memo(function TextSVG({
  textItem,
  isSelected,
  isEraseHovered,
  onTextClick,
  onTextMouseDown,
  onTextMouseEnter,
  onTextMouseLeave,
}) {
  const updateText = useEditorStore((state) => state.updateText);

  const rotate = textItem.rotate ?? 0;
  const fontSize = textItem.fontSize || 20;

  return (
    <g transform={`translate(${textItem.x}, ${textItem.y}) rotate(${rotate})`}>
      {isSelected ? (
        <foreignObject x={-100} y={-20} width="200" height="40">
          <input
            autoFocus
            value={textItem.content}
            onChange={(e) => updateText(textItem.id, { content: e.target.value })}
            style={{
              width: "100%",
              height: "100%",
              fontSize: fontSize,
              color: textItem.fill || "#c9d6ea",
              background: "transparent",
              border: "1px solid white",
              outline: "none",
              textAlign: "center",
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={0}
          y={0}
          fill={isEraseHovered ? "#ff7a87" : textItem.fill || "#c9d6ea"}
          fontSize={fontSize}
          fontWeight={textItem.fontWeight || "normal"}
          fontStyle={textItem.fontStyle || "normal"}
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          dominantBaseline="central"
          onClick={(e) => onTextClick?.(e, textItem.id)}
          onMouseDown={(e) => onTextMouseDown?.(e, textItem)}
          onMouseEnter={() => onTextMouseEnter?.(textItem.id)}
          onMouseLeave={() => onTextMouseLeave?.()}
          className={`select-none ${
            isEraseHovered || isSelected ? "cursor-pointer" : ""
          }`}
        >
          {textItem.content}
        </text>
      )}
    </g>
  );
});

TextSVG.displayName = "TextSVG";

export default TextSVG;


