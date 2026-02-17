import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type TimeProps = DateInputBaseProps

export const TimeDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Time',
  label: 'Time',
  category: 'inputs',
  description: 'Time input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Time',
    mode: 'time',
    displayMode: 'input',
    placeholder: 'HH:mm',
    showCalendarIcon: false,
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'time',
      },
      context
    ),
})

