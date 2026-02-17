import { createWidgetDefinition } from '../types'

export type SpacerProps = {
  height: number
}

export const SpacerDefinition = createWidgetDefinition<SpacerProps>({
  type: 'Spacer',
  label: 'Spacer',
  category: 'presentation',
  description: 'Empty space',
  defaultProps: {
    height: 24,
  },
  render: (props) => <div style={{ height: `${props.height}px` }} />,
})
