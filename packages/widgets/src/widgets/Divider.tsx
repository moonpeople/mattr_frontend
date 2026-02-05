import { Separator } from 'ui'

import type { WidgetDefinition } from '../types'

type DividerProps = {
  text: string
}

export const DividerWidget: WidgetDefinition<DividerProps> = {
  type: 'Divider',
  label: 'Divider',
  category: 'presentation',
  description: 'Section divider',
  defaultProps: {
    text: '',
  },
  fields: [
    { key: 'text', label: 'Text', type: 'text', placeholder: 'Optional label' },
  ],
  render: (props) => {
    if (!props.text) {
      return <Separator className="bg-border" />
    }

    return (
      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-border" />
        <span className="text-xs text-foreground-muted">{props.text}</span>
        <Separator className="flex-1 bg-border" />
      </div>
    )
  },
}
