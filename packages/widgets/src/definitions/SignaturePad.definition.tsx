import type { PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from 'ui'

import type { WidgetRenderContext } from '../types'
import { createWidgetDefinition } from '../types'

export type SignaturePadProps = {
  label: string
  emptyMessage: string
  showClear: boolean
  disabled: boolean
}

const resizeCanvas = (canvas: HTMLCanvasElement, container: HTMLDivElement) => {
  const { width, height } = container.getBoundingClientRect()
  if (width > 0 && height > 0) {
    canvas.width = Math.floor(width)
    canvas.height = Math.floor(height)
  }
}

const SignatureCanvas = ({
  emptyMessage,
  disabled,
  value,
  onChange,
}: {
  emptyMessage: string
  disabled: boolean
  value?: string
  onChange: (next: string) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasValue, setHasValue] = useState(Boolean(value))

  useEffect(() => {
    setHasValue(Boolean(value))
  }, [value])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) {
      return undefined
    }
    resizeCanvas(canvas, container)
    const observer = new ResizeObserver(() => resizeCanvas(canvas, container))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const drawLine = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return
    }
    const point = getPoint(event)
    if (!point) {
      return
    }
    drawingRef.current = true
    lastPointRef.current = point
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) {
      return
    }
    const point = getPoint(event)
    const lastPoint = lastPointRef.current
    if (!point || !lastPoint) {
      return
    }
    drawLine(lastPoint, point)
    lastPointRef.current = point
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) {
      return
    }
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL('image/png'))
    }
    setHasValue(true)
  }

  return (
    <div ref={containerRef} className="relative h-40 w-full rounded border border-border/40 bg-card">
      {!hasValue && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  )
}

export const SignaturePadDefinition = createWidgetDefinition<SignaturePadProps>({
  type: 'SignaturePad',
  label: 'Signature Pad',
  category: 'inputs',
  description: 'Draw a signature',
  defaultProps: {
    label: '',
    emptyMessage: 'Sign here',
    showClear: true,
    disabled: false,
  },
  render: (props, context?: WidgetRenderContext) => {
    const value = (context?.state?.value as string | undefined) ?? ''
    const handleChange = (next: string) => {
      context?.setState?.({ value: next })
      context?.runActions?.('change', { value: next })
    }

    return (
      <div className="space-y-2">
        {props.label && <div className="text-xs font-medium text-foreground">{props.label}</div>}
        <SignatureCanvas
          emptyMessage={props.emptyMessage}
          disabled={props.disabled}
          value={value}
          onChange={handleChange}
        />
        {props.showClear && (
          <Button
            type="secondary"
            size="small"
            htmlType="button"
            onClick={() => handleChange('')}
            disabled={props.disabled}
          >
            Clear
          </Button>
        )}
      </div>
    )
  },
})
