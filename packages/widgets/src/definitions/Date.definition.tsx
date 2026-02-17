import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DateProps = DateInputBaseProps

export const DateDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Date',
  label: 'Date',
  category: 'inputs',
  description: 'Date input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Date',
    mode: 'date',
    displayMode: 'popover',
    placeholder: 'Select date',
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'date',
      },
      context
    ),
})

