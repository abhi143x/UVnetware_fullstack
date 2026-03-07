import { useEffect } from 'react'

export function useKeyboardShortcuts(onDelete, onEscape) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        onDelete?.()
      } else if (event.key === 'Escape') {
        onEscape?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDelete, onEscape])
}