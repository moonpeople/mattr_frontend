/**
 * Обертка основной области страницы: рендерит заголовок main-фрейма и слот контента страницы.
 */
import type { ReactNode } from 'react'
import { cn } from 'ui'

import type { BuilderPageLayout } from '../../types'
import { resolvePagePadding } from '../shared'

interface CanvasMainAreaProps {
  isInternalDragActive: boolean
  isPageMainSelected: boolean
  pageMain?: BuilderPageLayout['main']
  pageLabel: string
  onSelectPageMain?: () => void
  children: ReactNode
}

export const CanvasMainArea = ({
  isInternalDragActive,
  isPageMainSelected,
  pageMain,
  pageLabel,
  onSelectPageMain,
  children,
}: CanvasMainAreaProps) => {
  return (
    <div
      className={cn(
        'relative min-h-0 flex-1',
        isInternalDragActive ? 'overflow-visible' : 'overflow-auto'
      )}
    >
      <div
        className={cn(
          'relative bg-surface-100 shadow-sm',
          isPageMainSelected ? 'shadow-md' : null,
          pageMain?.expandToFit ? 'min-h-0' : 'h-full min-h-full'
        )}
        style={{
          backgroundColor: pageMain?.background || undefined,
          padding: resolvePagePadding(pageMain),
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelectPageMain?.()
        }}
        data-builder-widget-id="page-component"
      >
        {isPageMainSelected && (
          <span className="pointer-events-none absolute inset-0 z-10 border border-dashed border-brand-500" />
        )}
        {isPageMainSelected && (
          <span className="absolute left-0 top-0 z-10 bg-brand-500 px-2 text-[9px] font-semibold uppercase text-white shadow-sm">
            {pageLabel}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}
