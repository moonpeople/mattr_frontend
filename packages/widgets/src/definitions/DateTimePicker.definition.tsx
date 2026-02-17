import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DateTimePickerProps = DateInputBaseProps

export const DateTimePickerDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DateTimePicker',
  label: 'Date Time Picker',
  category: 'inputs',
  description: 'Select date and time',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Date & time',
    mode: 'datetime',
    displayMode: 'popover',
    placeholder: 'Select date & time',
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'datetime',
      },
      context
    ),
})
