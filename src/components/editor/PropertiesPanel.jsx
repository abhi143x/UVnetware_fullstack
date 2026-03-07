import React from 'react'
import { useEditorStore } from './useEditorStore'
import { TOOL_SELECT } from './editorConstants'

function PropertiesPanel() {
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds)
  const texts = useEditorStore((state) => state.texts)
  const updateText = useEditorStore((state) => state.updateText)
  
  
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  const selectedTextId = selectedTextIds.length === 1 ? selectedTextIds[0] : null
  const selectedText = texts.find((t) => t.id === selectedTextId)

  // Function to handle the Apply button click
  const handleApply = () => {
    clearSelection()             
    setActiveTool(TOOL_SELECT) 
  }

  if (!selectedText) return null

  return (
    <aside className="w-[300px] shrink-0 bg-[#11161c] flex flex-col text-sm text-[#c9d6ea] h-full overflow-y-auto">
        <div className="p-5 flex flex-col gap-8">
          
          {/* TEXT Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold tracking-wide text-white">Text</h3>

            {/* Caption */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-gray-400">Caption</label>
              <input
                type="text"
                value={selectedText.content}
                onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
              />
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between mt-2">
              <label className="text-[11px] text-gray-400">Font size</label>
              <div className="flex items-center gap-1 rounded border border-white/10 bg-[#0e1319] px-1 py-0.5">
                <button
                  onClick={() => updateText(selectedText.id, { fontSize: Math.max(8, (selectedText.fontSize || 20) - 1) })}
                  className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  &lt;
                </button>
                <span className="w-12 text-center text-xs text-white">{selectedText.fontSize || 20} pt</span>
                <button
                  onClick={() => updateText(selectedText.id, { fontSize: Math.min(120, (selectedText.fontSize || 20) + 1) })}
                  className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Text color */}
            <div className="flex items-center justify-between mt-2">
              <label className="text-[11px] text-gray-400">Text color</label>
              <div className="flex items-center border border-white/10 rounded bg-[#0e1319] overflow-hidden pr-2">
                <input
                  type="color"
                  value={selectedText.fill || '#c9d6ea'}
                  onChange={(e) => updateText(selectedText.id, { fill: e.target.value })}
                  className="h-8 w-12 cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-[10px] text-gray-400 w-4">▼</span>
              </div>
            </div>

            {/* Style */}
            <div className="flex items-center justify-between mt-2">
              <label className="text-[11px] text-gray-400">Style</label>
              <div className="flex overflow-hidden rounded border border-white/10 bg-[#0e1319]">
                <button
                  onClick={() => updateText(selectedText.id, { fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`px-4 py-1.5 font-bold text-sm ${selectedText.fontWeight === 'bold' ? 'bg-[#587cb3] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  B
                </button>
                <div className="w-[1px] bg-white/10" />
                <button
                  onClick={() => updateText(selectedText.id, { fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`px-4 py-1.5 italic font-serif text-sm ${selectedText.fontStyle === 'italic' ? 'bg-[#587cb3] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  I
                </button>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* TRANSFORM Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold tracking-wide text-white">Transform</h3>

            {/* Scale */}
            <div className="flex items-center gap-4">
              <label className="text-[11px] text-gray-400 w-16">Scale</label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={selectedText.scale || 1}
                onChange={(e) => updateText(selectedText.id, { scale: parseFloat(e.target.value) })}
                className="flex-1 accent-[#587cb3]"
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleApply}
              className="rounded bg-[#587cb3] px-6 py-2 text-sm font-medium text-white hover:bg-[#688cc3] transition-colors"
            >
              Apply
            </button>
          </div>
          
        </div>
    </aside>
  )
}

export default PropertiesPanel