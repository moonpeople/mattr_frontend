import { createWidgetDefinition } from '../types'
import { TextInputDefinition, type TextInputProps } from './TextInput.definition'

const baseDefaults = TextInputDefinition.defaultProps

export type PasswordInputProps = TextInputProps

export const PasswordInputDefinition = createWidgetDefinition<TextInputProps>({
  type: 'PasswordInput',
  label: 'Password',
  category: 'inputs',
  description: 'Password input',
  defaultProps: {
    ...baseDefaults,
    label: 'Password',
    placeholder: '••••••••',
    type: 'password',
    autoFill: 'current-password',
    showPasswordToggle: true,
    labelWidthValue: '33',
    labelWidthUnit: '%',
  },
  events: TextInputDefinition.events,
  builder: TextInputDefinition.builder,
  render: (props, context) =>
    TextInputDefinition.render(
      {
        ...props,
        type: 'password',
      },
      context
    ),
})
