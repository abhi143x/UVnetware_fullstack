import { TOOLS } from './editorConstants'

const TOOLBAR_CLASSNAME =
  'h-screen w-[72px] shrink-0 flex flex-col items-center gap-3 border-r border-white/5 bg-[#11161c] pt-4'

const TOOL_BUTTON_BASE_CLASSNAME =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[11px] font-normal leading-none text-[#c9d6ea] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587cb3]'

function Toolbar({ activeTool, onToolChange }) {
  return (
    <aside className={TOOLBAR_CLASSNAME}>
      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool
        const toolButtonClassName = `${TOOL_BUTTON_BASE_CLASSNAME} ${
          isActive
            ? 'bg-[rgba(88,124,179,0.18)] border border-[rgba(88,124,179,0.4)]'
            : 'border border-transparent hover:bg-white/10'
        }`

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className={toolButtonClassName}
            aria-label={tool.label}
            aria-pressed={isActive}
            title={tool.label}
          >
            {tool.label}
          </button>
        )
      })}
    </aside>
  )
}

export default Toolbar
