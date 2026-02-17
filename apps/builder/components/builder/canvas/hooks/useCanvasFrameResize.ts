/**
 * Hook resize для frame canvas через внешний width-handle приложения.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from 'react'

import { CANVAS_MIN_WIDTH } from '../shared'

interface UseCanvasFrameResizeParams {
  frameRef: RefObject<HTMLDivElement>
}

export const useCanvasFrameResize = ({ frameRef }: UseCanvasFrameResizeParams) => {
  const [frameWidth, setFrameWidth] = useState<number | null>(null)
  const [isFrameResizing, setIsFrameResizing] = useState(false)
  const frameResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    if (!isFrameResizing) {
      return
    }

    const handleMove = (event: globalThis.MouseEvent) => {
      if (!frameResizeRef.current) {
        return
      }
      const delta = event.clientX - frameResizeRef.current.startX
      const nextWidth = Math.max(
        CANVAS_MIN_WIDTH,
        Math.round(frameResizeRef.current.startWidth + delta)
      )
      setFrameWidth(nextWidth)
    }

    const handleUp = () => {
      setIsFrameResizing(false)
      frameResizeRef.current = null
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isFrameResizing])

  const onFrameResizeMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = frameRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }
      frameResizeRef.current = {
        startX: event.clientX,
        startWidth: frameWidth ?? rect.width,
      }
      setIsFrameResizing(true)
    },
    [frameRef, frameWidth]
  )

  return {
    frameWidth,
    onFrameResizeMouseDown,
  }
}
