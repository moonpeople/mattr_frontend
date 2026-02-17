/**
 * Hook UI-состояния для open/close quick-add меню и жизненного цикла поиска.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

type QuickAddPosition = 'above' | 'below'

type QuickAddState = {
  widgetId: string
  position: QuickAddPosition
} | null

export const useCanvasQuickAddState = () => {
  const [quickAdd, setQuickAdd] = useState<QuickAddState>(null)
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!quickAdd) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setQuickAdd(null)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [quickAdd])

  useEffect(() => {
    if (!quickAdd) {
      return
    }
    setSearch('')
  }, [quickAdd])

  const toggleQuickAdd = useCallback((widgetId: string, position: QuickAddPosition) => {
    setQuickAdd((prev) =>
      prev?.widgetId === widgetId && prev.position === position
        ? null
        : { widgetId, position }
    )
  }, [])

  const closeQuickAdd = useCallback(() => {
    setQuickAdd(null)
  }, [])

  return {
    quickAdd,
    search,
    setSearch,
    menuRef,
    toggleQuickAdd,
    closeQuickAdd,
  }
}
