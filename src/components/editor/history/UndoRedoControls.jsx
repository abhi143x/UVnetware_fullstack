import { useEditorStore } from "../store/editorStore";

function UndoRedoControls() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s._history.past.length > 0);
  const canRedo = useEditorStore((s) => s._history.future.length > 0);

  return (
    <div className="flex gap-2 mt-3">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="flex-1 rounded-lg border border-white/10 bg-[#0e1319] py-2 text-xs font-medium text-[#c9d6ea] transition-all hover:border-white/20 hover:bg-[#161c26] disabled:cursor-not-allowed disabled:opacity-40"
        title="Undo (Ctrl+Z)"
      >
        ↩ Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="flex-1 rounded-lg border border-white/10 bg-[#0e1319] py-2 text-xs font-medium text-[#c9d6ea] transition-all hover:border-white/20 hover:bg-[#161c26] disabled:cursor-not-allowed disabled:opacity-40"
        title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
      >
        ↪ Redo
      </button>
    </div>
  );
}

export default UndoRedoControls;
