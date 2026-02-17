import { createWidgetDefinition } from '../types'
import { TextInputDefinition, type TextInputProps } from './TextInput.definition'

const baseDefaults = TextInputDefinition.defaultProps

export type EmailProps = TextInputProps

export const EmailDefinition = createWidgetDefinition<TextInputProps>({
  type: 'Email',
  label: 'Email',
  category: 'inputs',
  description: 'Email input',
  defaultProps: {
    ...baseDefaults,
    label: 'Email',
    placeholder: 'Enter email',
    type: 'email',
    pattern: 'email',
  },
  events: TextInputDefinition.events,
  builder: TextInputDefinition.builder,
  render: (props, context) =>
    TextInputDefinition.render(
      {
        ...props,
        type: 'email',
        pattern: 'email',
      },
      context
    ),
})
