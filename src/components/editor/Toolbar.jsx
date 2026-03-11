import {
  TOOL_ARC,
  TOOL_ERASER,
  TOOL_ROW,
  TOOL_SEAT,
  TOOL_SELECT,
  TOOL_TEXT,
  TOOL_ROTATE,
} from './constants/tools'

const TOOLS = [
  { id: TOOL_SELECT, label: 'Select', icon: '🎯' },
  { id: TOOL_SEAT, label: 'Seat', icon: '💺' },
  { id: TOOL_ROW, label: 'Row', icon: '📏' },
  { id: TOOL_ARC, label: 'Arc', icon: '➰' },
  { id: TOOL_ROTATE, label: 'Rotate', icon: '🔄' },
  { id: TOOL_TEXT, label: 'Text', icon: 'T' },
  { id: TOOL_ERASER, label: 'Eraser', icon: '🧹' },
]

function Toolbar({ activeTool, onToolChange, onAlign }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {TOOLS.map((tool) => {
          const isActive = tool.id === activeTool
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-[#587cb3]/20 border-[#587cb3]/50 text-white shadow-[0_0_12px_rgba(88,124,179,0.2)]'
                  : 'bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]'
                }`}
              aria-label={tool.label}
              aria-pressed={isActive}
              title={tool.label}
            >
              <span className="text-sm">{tool.icon}</span>
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Align Button */}
      <button
        type="button"
        onClick={onAlign}
        className="flex flex-col items-center justify-center gap-1 rounded-lg border py-2 transition-all duration-200 cursor-pointer bg-[#0e1319] border-white/5 text-[#7a8a9e] hover:border-white/10 hover:bg-[#161c26] hover:text-[#c9d6ea]"
        aria-label="Align Selection"
        title="Align selected seats to grid"
      >
        <span className="text-sm">📐</span>
        <span className="text-[10px] font-medium">Align</span>
      </button>
    </div>
  )
}

export default Toolbar
