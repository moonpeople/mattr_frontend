import { Separator } from 'ui'

import { createWidgetDefinition } from '../types'

export type DividerProps = {
  text: string
}

export const DividerDefinition = createWidgetDefinition<DividerProps>({
  type: 'Divider',
  label: 'Divider',
  category: 'presentation',
  description: 'Section divider',
  defaultProps: {
    text: '',
  },
  render: (props) => {
    if (!props.text) {
      return <Separator className="bg-border" />
    }

    return (
      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{props.text}</span>
        <Separator className="flex-1 bg-border" />
      </div>
    )
  },
})
