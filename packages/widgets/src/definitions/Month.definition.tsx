import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type MonthProps = DateInputBaseProps

export const MonthDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Month',
  label: 'Month',
  category: 'inputs',
  description: 'Month input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Month',
    mode: 'month',
    displayMode: 'input',
    placeholder: 'Select month',
    showCalendarIcon: false,
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'month',
      },
      context
    ),
})
