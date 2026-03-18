import React from "react";
import { useEditorStore } from "../store/editorStore";
import { TOOL_TEXT, TOOL_SELECT, TOOL_ERASER } from "../constants/tools";


const TextSVG = React.memo(function TextSVG({
  textItem,
  isSelected,
  isEraseHovered,
  activeTool,
  onTextClick,
  onTextMouseDown,
  onTextMouseEnter,
  onTextMouseLeave,
}) {
  const updateText = useEditorStore((state) => state.updateText);
  const selectText = useEditorStore((state) => state.selectText);

  const rotate = textItem.rotate ?? 0;
  const fontSize = textItem.fontSize || 20;
  
  // Allow editing when text is selected and either select tool or text tool is active
  const canEdit = isSelected && (activeTool === TOOL_SELECT || activeTool === TOOL_TEXT);

  const handleTextClick = (e) => {
    e.stopPropagation();
    if (activeTool === TOOL_TEXT || activeTool === TOOL_SELECT) {
      // Direct store call for text selection
      selectText(textItem.id);
      onTextClick?.(e, textItem.id);
    }
  };

  return (
    <g transform={`translate(${textItem.x}, ${textItem.y}) rotate(${rotate})`}>
      {canEdit ? (
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
          onClick={handleTextClick}
          onMouseDown={(e) => onTextMouseDown?.(e, textItem)}
          onMouseEnter={() => onTextMouseEnter?.(textItem.id)}
          onMouseLeave={() => onTextMouseLeave?.()}
          className={`select-none ${
            isEraseHovered || isSelected || activeTool === TOOL_TEXT ? "cursor-pointer" : ""
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


