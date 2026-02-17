import { createWidgetDefinition } from '../types'
import { NumberInputDefinition, type NumberInputProps } from './NumberInput.definition'

const baseDefaults = NumberInputDefinition.defaultProps

export type PercentProps = NumberInputProps

export const PercentDefinition = createWidgetDefinition<NumberInputProps>({
  type: 'Percent',
  label: 'Percent',
  category: 'inputs',
  description: 'Percent input',
  defaultProps: {
    ...baseDefaults,
    label: 'Percent',
    placeholder: 'Enter percent',
    format: 'percent',
    decimalPlaces: 0,
    padDecimal: false,
    showSeparators: true,
  },
  events: NumberInputDefinition.events,
  builder: NumberInputDefinition.builder,
  render: (props, context) =>
    NumberInputDefinition.render(
      {
        ...props,
        format: 'percent',
      },
      context
    ),
})

