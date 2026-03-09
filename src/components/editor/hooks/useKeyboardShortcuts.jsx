import { useEffect } from 'react'

export function useKeyboardShortcuts(onDelete, onEscape, { onCopy, onPaste } = {}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return

      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault()
        onCopy?.()
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault()
        onPaste?.()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        onDelete?.()
      } else if (event.key === 'Escape') {
        onEscape?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDelete, onEscape, onCopy, onPaste])
}