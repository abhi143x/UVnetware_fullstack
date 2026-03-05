import EditorCanvas from './EditorCanvas'
import Toolbar from './Toolbar'
import { useEditorStore } from './useEditorStore'

function Editor() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  const textPrompt = useEditorStore((state) => state.textPrompt)
  const textDraft = useEditorStore((state) => state.textDraft)
  const setTextDraft = useEditorStore((state) => state.setTextDraft)
  const setTextPrompt = useEditorStore((state) => state.setTextPrompt)
  const submitText = useEditorStore((state) => state.submitText)

  return (
    <section className="relative flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="min-w-0 flex-1">
        <EditorCanvas />
      </div>

      {textPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#00000066]">
          <div className="flex w-[320px] flex-col gap-3 rounded-xl border border-white/10 bg-[#11161c] p-5 shadow-2xl">
            <h3 className="text-sm font-medium text-[#c9d6ea]">Add Label</h3>
            <input
              autoFocus
              type="text"
              value={textDraft}
              placeholder="Enter text..."
              className="rounded border border-white/10 bg-[#0e1319] px-3 py-2 text-white outline-none focus:border-[#587cb3]"
              onChange={(event) => setTextDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitText()
                }

                if (event.key === 'Escape') {
                  setTextDraft('')
                  setTextPrompt(null)
                }
              }}
            />
            <div className="mt-2 flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setTextDraft('')
                  setTextPrompt(null)
                }}
                className="px-3 py-1 text-[#c9d6ea] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitText()}
                className="rounded bg-[#587cb3] px-3 py-1 text-white hover:bg-[#688cc3]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Editor
