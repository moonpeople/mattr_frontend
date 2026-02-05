import type { WidgetDefinition } from '../types'

type SpacerProps = {
  height: number
}

export const SpacerWidget: WidgetDefinition<SpacerProps> = {
  type: 'Spacer',
  label: 'Spacer',
  category: 'presentation',
  description: 'Empty space',
  defaultProps: {
    height: 24,
  },
  fields: [
    { key: 'height', label: 'Height', type: 'number', min: 4, max: 200, step: 4 },
  ],
  render: (props) => <div style={{ height: `${props.height}px` }} />,
}
