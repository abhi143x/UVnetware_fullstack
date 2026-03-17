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

const SelectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3H7M11 3H13M17 3H19C20.1 3 21 3.9 21 5V7M21 11V13M21 17V19C21 20.1 20.1 21 19 21H17M13 21H11M7 21H5C3.9 21 3 20.1 3 19V17M3 13V11M3 7V5C3 3.9 3.9 3 5 3Z" strokeDasharray="1.5 1.5"/>
    <path d="M12 12l5 10 2-5 5-2-12-3z" fill="currentColor" stroke="none"/>
  </svg>
);

const SeatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2h-4a2 2 0 01-2-2V4z" />
    <path d="M11 8v2m2-2v2" />
    <path d="M18 21c0-4-1-10-3-11H9c-2 1-3 7-3 11c0 2 1 3 3 3h6c2 0 3-1 3-3z" />
    <path d="M9 10v13m6-13v13" />
    <path d="M9 16h6" />
  </svg>
);

const AlignIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" strokeWidth="3"/>
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="3"/>
    <line x1="4" y1="18" x2="20" y2="18" strokeWidth="3"/>
  </svg>
);

const ArcIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20c0-8.8 7.2-16 16-16" />
    <rect x="2" y="18" width="4" height="4" fill="currentColor" />
    <rect x="18" y="2" width="4" height="4" fill="currentColor" />
    <rect x="8" y="8" width="4" height="4" fill="currentColor" />
  </svg>
);

const RotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 11-9-9c2.5 0 4.8 1 6.5 2.8" />
    <polyline points="16 1 19 4 16 7" />
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5h14" />
    <path d="M12 5v14" />
    <path d="M9 19h6" />
  </svg>
);

const ShapeToolIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 4L3 14h12L9 4z" />
    <rect x="12" y="6" width="8" height="8" />
    <circle cx="12" cy="15" r="5" />
  </svg>
);

const EraserToolIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L11 20" />
    <path d="M17 17l-6-6" />
  </svg>
);

const TOOLS = [
  { id: TOOL_SELECT, label: "Select", icon: <SelectIcon /> },
  { id: TOOL_SEAT, label: "Seat", icon: <SeatIcon /> },
  { id: TOOL_ROW, label: "Row", icon: "📏" },
  { id: TOOL_ARC, label: "Arc", icon: <ArcIcon /> },
  { id: TOOL_ROTATE, label: "Rotate", icon: <RotateIcon /> },
  { id: TOOL_TEXT, label: "Text", icon: <TextIcon /> },
  { id: TOOL_SHAPE, label: "Shape", icon: <ShapeToolIcon /> },
  { id: TOOL_ERASER, label: "Eraser", icon: <EraserToolIcon /> },
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

      <button
        type="button"
        onClick={onAlign}
        className={`flex items-center justify-center ${compact ? "min-h-10" : "flex-col gap-1 py-2"} rounded-lg border transition-all duration-200 cursor-pointer bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]`}
        aria-label="Align Selection"
        title="Align selected seats to grid"
      >
        <span className="text-sm leading-none">
          <AlignIcon />
        </span>
        {!compact && <span className="text-[10px] font-medium">Align</span>}
      </button>
    </div>
  );
}

export default Toolbar;
