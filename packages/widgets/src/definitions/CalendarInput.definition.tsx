import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type CalendarInputProps = DateInputBaseProps

export const CalendarInputDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'CalendarInput',
  label: 'Calendar Input',
  category: 'inputs',
  description: 'Date input with calendar popover/inline modes',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Calendar',
    mode: 'date',
    displayMode: 'popover',
    placeholder: 'Select date',
    showCalendarIcon: true,
    closeOnSelect: true,
  },
  render: renderDateInputBase,
})

