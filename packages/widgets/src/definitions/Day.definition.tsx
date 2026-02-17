import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DayProps = DateInputBaseProps

export const DayDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Day',
  label: 'Day',
  category: 'inputs',
  description: 'Day input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Day',
    mode: 'day',
    displayMode: 'input',
    placeholder: 'DD',
    showCalendarIcon: false,
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'day',
      },
      context
    ),
})

