import EditorCanvas from './EditorCanvas'
import Toolbar from './Toolbar'
import PropertiesPanel from './PropertiesPanel'
import { useEditorStore } from './store/editorStore'


function Editor() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)

  return (
    <section className="relative flex h-full w-full bg-[#0e1319]">
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="min-w-0 flex-1 border-r border-white/5">
        <EditorCanvas />
      </div>

    {selectedTextIds.length > 0 && (
        <PropertiesPanel />
      )}

    </section>
  )
}

export default Editor
