/**
 * Hook press-to-drag для CanvasCard: обрабатывает pointer-интент перетаскивания.
 */
import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

interface UseCanvasCardPressToDragParams {
  dragHandleSelector: string
  interactiveTargetSelector: string
  holdDelayMs: number
}

export const useCanvasCardPressToDrag = ({
  dragHandleSelector,
  interactiveTargetSelector,
  holdDelayMs,
}: UseCanvasCardPressToDragParams) => {
  const holdTimerRef = useRef<number | null>(null)
  const holdTargetRef = useRef<HTMLElement | null>(null)
  const holdPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isPressingRef = useRef(false)

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
    }
    holdTimerRef.current = null
    holdTargetRef.current = null
    holdPositionRef.current = null
    isPressingRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current)
      }
    }
  }, [])

  const handlePressStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return
      }
      const target = event.target as HTMLElement
      if (target.closest(dragHandleSelector)) {
        return
      }
      event.stopPropagation()
      const isInteractive = Boolean(target.closest(interactiveTargetSelector))
      if (!isInteractive) {
        event.preventDefault()
      }

      const gridItem = (event.currentTarget as HTMLElement).closest('.react-grid-item') as
        | HTMLElement
        | null
      if (!gridItem || isInteractive) {
        clearHold()
        return
      }

      isPressingRef.current = true
      holdTargetRef.current = gridItem
      holdPositionRef.current = { x: event.clientX, y: event.clientY }
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current)
      }
      holdTimerRef.current = window.setTimeout(() => {
        if (!isPressingRef.current || !holdTargetRef.current || !holdPositionRef.current) {
          return
        }
        const { x, y } = holdPositionRef.current
        holdTargetRef.current.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            button: 0,
            buttons: 1,
          })
        )
      }, holdDelayMs)
    },
    [clearHold, dragHandleSelector, holdDelayMs, interactiveTargetSelector]
  )

  const handlePressMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPressingRef.current) {
      return
    }
    holdPositionRef.current = { x: event.clientX, y: event.clientY }
  }, [])

  const handlePressEnd = useCallback(() => {
    clearHold()
  }, [clearHold])

  return {
    handlePressStart,
    handlePressMove,
    handlePressEnd,
  }
}

