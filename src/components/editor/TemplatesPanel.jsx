import React from 'react'
import { useEditorStore, VENUE_TEMPLATES } from './store/editorStore'

export default function TemplatesPanel({ onTemplateLoad }) {
  const loadTemplate = useEditorStore((state) => state.loadTemplate)

  function handleLoadTemplate(template) {
    const data = template.generator()
    loadTemplate(data)
    onTemplateLoad?.(data.seats)
  }

  return (
    <div className="flex flex-col h-full bg-[#11161c] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 bg-[#0e1319]/30">
        <h3 className="text-[10px] font-semibold text-[#5a6a7e] uppercase tracking-wider">
          Venue Templates
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-col gap-2">
          {VENUE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="group w-full text-left rounded-lg border border-white/5 bg-[#0e1319] p-3 transition-all duration-200 hover:border-[#587cb3]/40 hover:bg-[#141b24] cursor-pointer shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#c9d6ea] group-hover:text-white transition-colors truncate">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] font-bold text-[#587cb3] bg-[#587cb3]/10 px-1.5 py-0.5 rounded ml-1 shrink-0">
                    {tpl.seatCount}
                  </span>
                </div>
                <p className="text-[10px] text-[#5a6a7e] line-clamp-1 italic">
                  {tpl.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
