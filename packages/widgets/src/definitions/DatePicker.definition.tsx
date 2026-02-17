import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DatePickerProps = DateInputBaseProps

export const DatePickerDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DatePicker',
  label: 'Date Picker',
  category: 'inputs',
  description: 'Select a date',
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
