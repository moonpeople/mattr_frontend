import { createWidgetDefinition } from '../types'
import { ButtonDefinition, type ButtonProps } from './Button.definition'

const baseDefaults = ButtonDefinition.defaultProps

export type OutlineButtonProps = ButtonProps

export const OutlineButtonDefinition = createWidgetDefinition<ButtonProps>({
  type: 'OutlineButton',
  label: 'Outline Button',
  category: 'buttons',
  description: 'Outline-style button',
  defaultProps: {
    ...baseDefaults,
    label: 'Outline',
    variant: 'outline',
  },
  events: ButtonDefinition.events,
  builder: ButtonDefinition.builder,
  render: (props, context) =>
    ButtonDefinition.render(
      {
        ...props,
        variant: 'outline',
      },
      context
    ),
})
