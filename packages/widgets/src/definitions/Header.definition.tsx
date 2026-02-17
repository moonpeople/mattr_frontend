import { createWidgetDefinition } from '../types'

export type HeaderProps = {
  title: string
}

export const HeaderDefinition = createWidgetDefinition<HeaderProps>({
  type: 'Header',
  label: 'Header',
  category: 'containers',
  description: 'Header container',
  supportsChildren: true,
  defaultProps: {
    title: 'Header',
  },
  layout: {
    scope: 'local',
    slot: 'header',
  },
  render: (props, context) => {
    const hasChildren = Boolean(context?.children)
    return (
      <div className="rounded-md border border-border/30 bg-card px-4 py-3">
        <div className="text-xs uppercase text-muted-foreground/70">
          {props.title || 'Header'}
        </div>
        <div className="mt-3">
          {hasChildren ? (
            <div className="space-y-3">{context?.children}</div>
          ) : (
            <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-xs text-muted-foreground">
              Drop widgets here
            </div>
          )}
        </div>
      </div>
    )
  },
})
