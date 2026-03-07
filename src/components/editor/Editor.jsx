import { useState } from 'react'
import EditorCanvas from './EditorCanvas'
import Toolbar from './Toolbar'
import PropertiesPanel from './PropertiesPanel'
import { useEditorStore } from './store/editorStore'


function Editor() {
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saved'

  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)
  const seatCount = useEditorStore((state) => state.seats.length)
  const saveLayout = useEditorStore((state) => state.saveLayout)
  const clearLayout = useEditorStore((state) => state.clearLayout)

  const textPrompt = useEditorStore((state) => state.textPrompt)
  const textDraft = useEditorStore((state) => state.textDraft)
  const setTextDraft = useEditorStore((state) => state.setTextDraft)
  const setTextPrompt = useEditorStore((state) => state.setTextPrompt)
  const submitText = useEditorStore((state) => state.submitText)

  function handleSave() {
    saveLayout()
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleClear() {
    if (seatCount === 0) return
    if (window.confirm(`Clear all ${seatCount} seat(s)? This cannot be undone.`)) {
      clearLayout()
    }
  }

  return (
    <section className="relative flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
     
      <div className="min-w-0 flex-1 flex flex-col">

        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#11161c] px-4 py-2">
          <span className="text-xs text-[#7a8a9e]">
            {seatCount} seat{seatCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : 'bg-[#587cb3] text-white hover:bg-[#688cc3]'
              }`}
            >
              {saveStatus === 'saved' ? 'Saved ✓' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/10"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <EditorCanvas />
        </div>
      </div>

    {selectedTextIds.length > 0 && (
        <PropertiesPanel />
      )}

    </section>
  )
}

export default Editor
