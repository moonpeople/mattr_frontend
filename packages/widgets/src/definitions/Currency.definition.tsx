import { createWidgetDefinition } from '../types'
import { NumberInputDefinition, type NumberInputProps } from './NumberInput.definition'

const baseDefaults = NumberInputDefinition.defaultProps

export type CurrencyProps = NumberInputProps

export const CurrencyDefinition = createWidgetDefinition<NumberInputProps>({
  type: 'Currency',
  label: 'Currency',
  category: 'inputs',
  description: 'Currency input',
  defaultProps: {
    ...baseDefaults,
    label: 'Currency',
    placeholder: 'Enter amount',
    format: 'currency',
    currency: 'USD',
    decimalPlaces: 2,
    padDecimal: true,
    showSeparators: true,
  },
  events: NumberInputDefinition.events,
  builder: NumberInputDefinition.builder,
  render: (props, context) =>
    NumberInputDefinition.render(
      {
        ...props,
        format: 'currency',
      },
      context
    ),
})

