import { useEffect } from "react";

export function useKeyboardShortcuts(
  onDelete,
  onEscape,
  { onCopy, onPaste, onUndo, onRedo } = {},
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
      } else if (event.key === "Delete" || event.key === "Backspace") {
        onDelete?.();
      } else if (event.key === "Escape") {
        onEscape?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, onEscape, onCopy, onPaste, onUndo, onRedo]);
}
