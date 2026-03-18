/**
 * LayoutModal – replaces browser prompt() / alert() / confirm() (BUG-05)
 *
 * Supports three modes driven by the `mode` prop:
 *   "name"    – asks for a layout name (single text input + Save)
 *   "confirm" – shows a message with Cancel + Confirm buttons
 *   "alert"   – shows a message with a single OK button
 */
import { useEffect, useRef, useState } from "react";

export function LayoutModal({ mode, message, defaultValue = "", onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "name" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter" && mode === "name") handleConfirm();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function handleConfirm() {
    if (mode === "name" && !value.trim()) return;
    onConfirm?.(value.trim());
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="w-full max-w-sm mx-4 rounded-xl border border-white/10 bg-[#0d141e] shadow-[0_24px_60px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-4">
        {/* Message */}
        <p className="text-sm text-[#c9d6ea] leading-relaxed">{message}</p>

        {/* Text input for "name" mode */}
        {mode === "name" && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Layout name…"
            className="w-full rounded-md border border-white/10 bg-[#0a1018] px-3 py-2 text-sm text-[#c9d6ea] outline-none focus:border-[#587cb3]/60 focus:ring-1 focus:ring-[#587cb3]/40"
          />
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          {mode !== "alert" && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#9fb0c8] transition hover:bg-white/10"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={mode === "name" && !value.trim()}
            className="rounded-md border border-[#587cb3]/40 bg-[#587cb3]/20 px-4 py-1.5 text-xs font-semibold text-[#d6e5fb] transition hover:bg-[#587cb3]/35 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === "confirm" ? "Confirm" : mode === "alert" ? "OK" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
