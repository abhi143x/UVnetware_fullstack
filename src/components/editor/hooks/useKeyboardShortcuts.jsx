import { useEffect } from "react";

export function useKeyboardShortcuts(
  onDelete,
  onEscape,
  { onCopy, onPaste, onCut, onUndo, onRedo, onToolChange, onSelectAll, onFitView, onToggleSnap } = {},
) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        event.target.isContentEditable
      )
        return;

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      // U-08: Tool activation shortcuts (no modifier, no input focus)
      if (!mod && onToolChange) {
        const toolMap = { v: 'select', s: 'seat', r: 'row', a: 'arc', t: 'text', e: 'eraser', p: 'shape' };
        if (toolMap[key]) {
          event.preventDefault();
          onToolChange(toolMap[key]);
          return;
        }
      }

      // Ctrl+A — select all
      if (mod && key === "a") {
        event.preventDefault();
        onSelectAll?.();
        return;
      }

      // G — toggle snap grid (no modifier)
      if (!mod && key === "g") {
        event.preventDefault();
        onToggleSnap?.();
        return;
      }

      // F — fit / center view (no modifier)
      if (!mod && key === "f") {
        event.preventDefault();
        onFitView?.();
        return;
      }

      if (mod && key === "z" && event.shiftKey) {
        event.preventDefault();
        onRedo?.();
      } else if (mod && key === "z") {
        event.preventDefault();
        onUndo?.();
      } else if (mod && key === "y") {
        event.preventDefault();
        onRedo?.();
      } else if (mod && key === "c") {
        event.preventDefault();
        onCopy?.();
      } else if (mod && key === "v") {
        event.preventDefault();
        onPaste?.();
      } else if (mod && key === "x") {
        event.preventDefault();
        onCut?.();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        const handled = onDelete?.(event);
        if (handled) {
          event.preventDefault();
        }
      } else if (event.key === "Escape") {
        const handled = onEscape?.(event);
        if (handled) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, onEscape, onCopy, onPaste, onCut, onUndo, onRedo]);
}
