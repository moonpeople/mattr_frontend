/**
 * Hook авто-высоты для CanvasCard: синхронизирует высоту виджета с контентом.
 */
import { useEffect, useRef, type RefObject } from 'react'

interface UseCanvasCardAutoHeightParams {
  enabled: boolean
  contentRef: RefObject<HTMLDivElement | null>
  layoutHeight: number
  gridRowHeight: number
  gridMargin: number
  onAutoHeight: (nextHeight: number) => void
}

export const useCanvasCardAutoHeight = ({
  enabled,
  contentRef,
  layoutHeight,
  gridRowHeight,
  gridMargin,
  onAutoHeight,
}: UseCanvasCardAutoHeightParams) => {
  const autoHeightFrameRef = useRef<number | null>(null)
  const lastAutoHeightRef = useRef<number | null>(null)
  const lastMeasuredHeightRef = useRef<number | null>(null)

  useEffect(() => {
    lastAutoHeightRef.current = layoutHeight
  }, [layoutHeight])

  useEffect(() => {
    if (!enabled) {
      return
    }
    const node = contentRef.current
    if (!node) {
      return
    }

    const borderY = 0
    const updateHeight = () => {
      const contentHeight = node.scrollHeight || node.getBoundingClientRect().height
      const previousHeight = lastMeasuredHeightRef.current
      if (previousHeight !== null && Math.abs(contentHeight - previousHeight) < 1) {
        return
      }
      lastMeasuredHeightRef.current = contentHeight
      const totalHeight = Math.max(1, contentHeight + borderY)
      const rowStride = gridRowHeight + gridMargin
      const nextRows = Math.max(1, Math.ceil((totalHeight + gridMargin) / rowStride))
      if (nextRows === layoutHeight || nextRows === lastAutoHeightRef.current) {
        return
      }
      lastAutoHeightRef.current = nextRows
      onAutoHeight(nextRows)
    }

    const scheduleUpdate = () => {
      if (autoHeightFrameRef.current) {
        window.cancelAnimationFrame(autoHeightFrameRef.current)
      }
      autoHeightFrameRef.current = window.requestAnimationFrame(updateHeight)
    }

    scheduleUpdate()
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (autoHeightFrameRef.current) {
        window.cancelAnimationFrame(autoHeightFrameRef.current)
      }
    }
  }, [contentRef, enabled, gridMargin, gridRowHeight, layoutHeight, onAutoHeight])
}

