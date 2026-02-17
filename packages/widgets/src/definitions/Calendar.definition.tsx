import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type CalendarProps = DateInputBaseProps

export const CalendarDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Calendar',
  label: 'Calendar',
  category: 'inputs',
  description: 'Standalone calendar',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Calendar',
    mode: 'calendar',
    displayMode: 'inline',
    placeholder: '',
    showCalendarIcon: false,
    closeOnSelect: false,
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'calendar',
      },
      context
    ),
})

