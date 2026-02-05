import type { Ref } from 'react'

import { cn } from 'ui'

import type { BuilderWidgetInstance } from './types'
import { resolveWidgetSpacingModes } from './types'

export type BuilderResizeHandleAxis = 'e' | 'w' | 's' | 'n' | 'ne' | 'nw' | 'se' | 'sw'

const BOTTOM_HANDLE_DISABLED_WIDGETS = new Set<string>([])
const ALLOWED_HANDLES = new Set<BuilderResizeHandleAxis>([
  'e',
  'w',
  's',
  'n',
  'ne',
  'nw',
  'se',
  'sw',
])
const DEFAULT_HANDLES_FIXED: BuilderResizeHandleAxis[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
]
const DEFAULT_HANDLES_AUTO: BuilderResizeHandleAxis[] = ['e', 'w']

export const getWidgetResizeHandles = (
  widget: BuilderWidgetInstance,
  spacing: ReturnType<typeof resolveWidgetSpacingModes>,
  overrideHandles?: string[]
): BuilderResizeHandleAxis[] => {
  if (overrideHandles && overrideHandles.length > 0) {
    return overrideHandles.filter((handle): handle is BuilderResizeHandleAxis =>
      ALLOWED_HANDLES.has(handle as BuilderResizeHandleAxis)
    )
  }
  if (spacing.heightMode === 'auto') {
    return DEFAULT_HANDLES_AUTO
  }
  if (BOTTOM_HANDLE_DISABLED_WIDGETS.has(widget.type)) {
    return DEFAULT_HANDLES_FIXED.filter(
      (handle) => handle !== 's' && handle !== 'se' && handle !== 'sw'
    )
  }
  return DEFAULT_HANDLES_FIXED
}

export const renderBuilderResizeHandle = (handleAxis: string, ref: Ref<HTMLDivElement>) => {
  const axis = handleAxis as BuilderResizeHandleAxis
  const cornerCursor = axis === 'ne' || axis === 'sw' ? 'cursor-nesw-resize' : 'cursor-nwse-resize'
  const axisClass =
    axis === 'e'
      ? 'right-0 h-[30px] w-[9px] cursor-ew-resize'
      : axis === 'w'
        ? 'left-0 h-[30px] w-[9px] cursor-ew-resize'
        : axis === 's'
          ? 'bottom-0 left-0 h-[9px] w-[30px] cursor-ns-resize'
          : axis === 'n'
            ? 'top-0 left-0 h-[9px] w-[30px] cursor-ns-resize'
            : axis === 'ne'
              ? `top-0 right-0 h-[6px] w-[6px] ${cornerCursor}`
              : axis === 'nw'
                ? `top-0 left-0 h-[6px] w-[6px] ${cornerCursor}`
                : axis === 'se'
                  ? `bottom-0 right-0 h-[6px] w-[6px] ${cornerCursor}`
                  : `bottom-0 left-0 h-[6px] w-[6px] ${cornerCursor}`
  const baseStyle = { backgroundImage: 'none', transform: 'none' }
  const inlineStyle =
    axis === 'e'
      ? { ...baseStyle, top: 'calc(50% - 5px)', right: -4, width: '9px', height: '30px' }
      : axis === 'w'
        ? { ...baseStyle, top: 'calc(50% - 5px)', left: -4, width: '9px', height: '30px' }
        : axis === 's'
          ? { ...baseStyle, bottom: -4, left: 'calc(50% - 5px)', width: '30px', height: '9px' }
          : axis === 'n'
            ? { ...baseStyle, top: -4, left: 'calc(50% - 5px)', width: '30px', height: '9px' }
            : axis === 'ne'
              ? { ...baseStyle, top: -4, right: -4, width: '9px', height: '9px' }
              : axis === 'nw'
                ? { ...baseStyle, top: -4, left: -4, width: '9px', height: '9px' }
                : axis === 'se'
                  ? { ...baseStyle, bottom: -4, right: -4, width: '9px', height: '9px' }
                  : axis === 'sw'
                    ? { ...baseStyle, bottom: -4, left: -4, width: '9px', height: '9px' }
            : baseStyle
  const lineClass =
    axis === 'e' || axis === 'w' || axis === 's' || axis === 'n'
      ? 'before:absolute before:left-2 before:right-2 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-border'
      : 'before:hidden'

  return (
    <div
      ref={ref}
      style={inlineStyle}
      aria-hidden="true"
      className={cn(
        'react-resizable-handle',
        `react-resizable-handle-${handleAxis}`,
        'absolute z-10 flex items-center justify-center touch-none rounded-full border border-brand-500 bg-surface-100 shadow-sm opacity-100 pointer-events-auto transition-opacity after:content-none after:hidden hover:bg-brand-500',
        axisClass,
        lineClass
      )}
    />
  )
}
