import { ResizableHandle, ResizablePanel, ResizablePanelGroup, cn } from 'ui'

import { createWidgetDefinition } from '../types'

export type SplitPaneProps = {
  title: string
  orientation: 'horizontal' | 'vertical'
  firstPaneSize: number
  minPaneSize: number
  maxPaneSize: number
  resizable: boolean
  showHandle: boolean
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: unknown[]
}

const paddingClasses: Record<SplitPaneProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<SplitPaneProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizePaneValue = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

export const SplitPaneDefinition = createWidgetDefinition<SplitPaneProps>({
  type: 'SplitPane',
  label: 'Split Pane',
  category: 'containers',
  description: 'Two-pane resizable container',
  supportsChildren: true,
  events: ['change'],
  defaultProps: {
    title: 'Split pane',
    orientation: 'horizontal',
    firstPaneSize: 50,
    minPaneSize: 20,
    maxPaneSize: 80,
    resizable: true,
    showHandle: true,
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: [],
  },
  render: (props, context) => {
    const firstRaw = normalizePaneValue(context?.state?.firstPaneSize, props.firstPaneSize)
    const minSize = clamp(normalizePaneValue(props.minPaneSize, 20), 5, 95)
    const maxSize = clamp(normalizePaneValue(props.maxPaneSize, 80), minSize, 95)
    const firstPaneSize = clamp(firstRaw, minSize, maxSize)
    const secondPaneSize = clamp(100 - firstPaneSize, 100 - maxSize, 100 - minSize)
    const isHorizontal = props.orientation === 'horizontal'

    const firstPaneChildren = context?.renderChildren?.({
      slot: 'pane-1',
      includeUnassigned: true,
    })
    const secondPaneChildren = context?.renderChildren?.({
      slot: 'pane-2',
    })

    const firstPaneContent = firstPaneChildren ?? context?.children ?? (
      <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-xs text-muted-foreground">
        Drop widgets here
      </div>
    )
    const secondPaneContent = secondPaneChildren ?? (
      <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-xs text-muted-foreground">
        Drop widgets here
      </div>
    )

    const paneClass = cn(
      'h-full min-h-0 overflow-auto',
      paddingClasses[props.padding],
      props.bordered ? 'border-border/30' : 'border-transparent'
    )
    const contentAreaClass = props.title
      ? 'h-[calc(100%-44px)] min-h-[176px]'
      : 'h-full min-h-[220px]'

    return (
      <div
        className={cn(
          'h-full min-h-[220px] overflow-hidden rounded-lg',
          backgroundClasses[props.background],
          props.bordered ? 'border border-border/40' : 'border border-transparent'
        )}
      >
        {props.title ? (
          <div className="border-b border-border/30 px-4 py-3 text-sm font-medium text-foreground">
            {props.title}
          </div>
        ) : null}
        <div className={contentAreaClass}>
          {props.resizable ? (
            <ResizablePanelGroup
              direction={isHorizontal ? 'horizontal' : 'vertical'}
              onLayout={(sizes) => {
                const nextFirst = Array.isArray(sizes) ? sizes[0] : undefined
                if (typeof nextFirst !== 'number' || !Number.isFinite(nextFirst)) {
                  return
                }
                const normalized = clamp(nextFirst, minSize, maxSize)
                context?.setState?.({ firstPaneSize: normalized })
                if (context?.mode !== 'canvas') {
                  context?.runActions?.('change', {
                    firstPaneSize: normalized,
                    secondPaneSize: 100 - normalized,
                    sizes,
                  })
                }
              }}
            >
              <ResizablePanel defaultSize={firstPaneSize} minSize={minSize} maxSize={maxSize}>
                <div className={paneClass}>{firstPaneContent}</div>
              </ResizablePanel>
              <ResizableHandle withHandle={props.showHandle} />
              <ResizablePanel
                defaultSize={secondPaneSize}
                minSize={100 - maxSize}
                maxSize={100 - minSize}
              >
                <div className={paneClass}>{secondPaneContent}</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className={cn('flex h-full min-h-0', isHorizontal ? 'flex-row' : 'flex-col')}>
              <div
                className={paneClass}
                style={
                  isHorizontal
                    ? { width: `${firstPaneSize}%` }
                    : { height: `${firstPaneSize}%` }
                }
              >
                {firstPaneContent}
              </div>
              <div className={cn(isHorizontal ? 'w-px h-full' : 'h-px w-full', 'bg-border/40')} />
              <div
                className={paneClass}
                style={
                  isHorizontal
                    ? { width: `${100 - firstPaneSize}%` }
                    : { height: `${100 - firstPaneSize}%` }
                }
              >
                {secondPaneContent}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
})
