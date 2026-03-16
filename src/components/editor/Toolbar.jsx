import {
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_ROW,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_SHAPE,
  TOOL_TEXT,
  TOOL_ROTATE,
} from "./constants/tools";
import { useMemo, useState } from "react";

const TOOLS = [
  { id: TOOL_SELECT, label: "Select", icon: "🎯" },
  { id: TOOL_SEAT, label: "Seat", icon: "💺" },
  { id: TOOL_ROW, label: "Row", icon: "📏" },
  { id: TOOL_ARC, label: "Arc", icon: "➰" },
  { id: TOOL_ROTATE, label: "Rotate", icon: "🔄" },
  { id: TOOL_TEXT, label: "Text", icon: "T" },
  { id: TOOL_SHAPE, label: "Shape", icon: "◼" },
  { id: TOOL_ERASER, label: "Eraser", icon: "🧹" },
];

const SHAPE_OPTIONS = [
  { id: "circle", label: "Elipse", icon: "◯" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "polygon", label: "Polygonal Area", icon: "⬠" },
];

function Toolbar({
  activeTool,
  onToolChange,
  onAlign,
  compact = false,
  selectedShapeType = "rectangle",
  onShapeTypeChange,
}) {
  const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
  const activeShape = useMemo(
    () =>
      SHAPE_OPTIONS.find((option) => option.id === selectedShapeType) ||
      SHAPE_OPTIONS[1],
    [selectedShapeType],
  );

  const handleToolClick = (toolId) => {
    if (toolId === TOOL_SHAPE) {
      setShapeMenuOpen((open) => !open);
      onToolChange(toolId);
      return;
    }

    setShapeMenuOpen(false);
    onToolChange(toolId);
  };

  const handleShapeSelection = (shapeType) => {
    onShapeTypeChange?.(shapeType);
    onToolChange(TOOL_SHAPE);
    setShapeMenuOpen(false);
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
      <div
        className={
          compact ? "grid grid-cols-1 gap-1.5" : "grid grid-cols-3 gap-2"
        }
      >
        {TOOLS.map((tool) => {
          const isActive = tool.id === activeTool;

          if (tool.id === TOOL_SHAPE) {
            return (
              <div key={tool.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleToolClick(tool.id)}
                  className={`flex items-center justify-center ${compact ? "min-h-10" : "flex-col gap-1 py-2"} rounded-lg border transition-all duration-200 cursor-pointer w-full ${
                    isActive
                      ? "bg-[#587cb3]/20 border-[#587cb3]/50 text-white shadow-[0_0_12px_rgba(88,124,179,0.2)]"
                      : "bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]"
                  }`}
                  aria-label={tool.label}
                  aria-pressed={isActive}
                  title="Shape"
                >
                  <span className="text-sm leading-none">{tool.icon}</span>
                  {!compact && (
                    <span className="text-[10px] font-medium">
                      {tool.label}
                    </span>
                  )}
                </button>

                <div
                  className={`absolute left-full top-0 z-20 ml-2 min-w-32 rounded-md border border-white/10 bg-[#111925]/95 p-1 shadow-[0_8px_25px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 origin-left ${
                    isShapeMenuOpen
                      ? "translate-x-0 opacity-100 pointer-events-auto"
                      : "-translate-x-2 opacity-0 pointer-events-none"
                  }`}
                >
                  {SHAPE_OPTIONS.map((shapeOption) => {
                    const optionActive = shapeOption.id === selectedShapeType;
                    return (
                      <button
                        key={shapeOption.id}
                        type="button"
                        onClick={() => handleShapeSelection(shapeOption.id)}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                          optionActive
                            ? "bg-[#587cb3]/25 text-[#dbe9ff]"
                            : "text-[#a8b6ca] hover:bg-white/6 hover:text-white"
                        }`}
                      >
                        <span className="mr-2">{shapeOption.icon}</span>
                        {shapeOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleToolClick(tool.id)}
              className={`flex items-center justify-center ${compact ? "min-h-10" : "flex-col gap-1 py-2"} rounded-lg border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#587cb3]/20 border-[#587cb3]/50 text-white shadow-[0_0_12px_rgba(88,124,179,0.2)]"
                  : "bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]"
              }`}
              aria-label={tool.label}
              aria-pressed={isActive}
              title={tool.label}
            >
              <span className="text-sm leading-none">{tool.icon}</span>
              {!compact && (
                <span className="text-[10px] font-medium">{tool.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Align Button */}
      <button
        type="button"
        onClick={onAlign}
        className={`flex items-center justify-center ${compact ? "min-h-10" : "flex-col gap-1 py-2"} rounded-lg border transition-all duration-200 cursor-pointer bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]`}
        aria-label="Align Selection"
        title="Align selected seats to grid"
      >
        <span className="text-sm leading-none">📐</span>
        {!compact && <span className="text-[10px] font-medium">Align</span>}
      </button>
    </div>
  );
}

export default Toolbar;
