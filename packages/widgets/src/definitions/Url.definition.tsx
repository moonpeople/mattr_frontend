import { createWidgetDefinition } from '../types'
import { TextInputDefinition, type TextInputProps } from './TextInput.definition'

const baseDefaults = TextInputDefinition.defaultProps

export type UrlProps = TextInputProps

export const UrlDefinition = createWidgetDefinition<TextInputProps>({
  type: 'Url',
  label: 'URL',
  category: 'inputs',
  description: 'URL input',
  defaultProps: {
    ...baseDefaults,
    label: 'URL',
    placeholder: 'Enter URL',
    type: 'url',
    pattern: 'url',
  },
  events: TextInputDefinition.events,
  builder: TextInputDefinition.builder,
  render: (props, context) =>
    TextInputDefinition.render(
      {
        ...props,
        type: 'url',
        pattern: 'url',
      },
      context
    ),
})
