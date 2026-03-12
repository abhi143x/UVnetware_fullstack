import { useEditorStore } from "../store/editorStore";

function UndoRedoControls({ compact = false }) {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s._history.past.length > 0);
  const canRedo = useEditorStore((s) => s._history.future.length > 0);

  return (
    <div
      className={`mt-2 ${compact ? "flex flex-col gap-1.5" : "flex gap-2 mt-3"}`}
    >
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className={`rounded-lg border border-white/10 bg-[#0e1319] text-xs font-medium text-[#c9d6ea] transition-all hover:border-white/20 hover:bg-[#161c26] disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "w-full py-2" : "flex-1 py-2"}`}
        title="Undo (Ctrl+Z)"
      >
        {compact ? "Undo" : "↩ Undo"}
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className={`rounded-lg border border-white/10 bg-[#0e1319] text-xs font-medium text-[#c9d6ea] transition-all hover:border-white/20 hover:bg-[#161c26] disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "w-full py-2" : "flex-1 py-2"}`}
        title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
      >
        {compact ? "Redo" : "↪ Redo"}
      </button>
    </div>
  );
}

export default UndoRedoControls;
