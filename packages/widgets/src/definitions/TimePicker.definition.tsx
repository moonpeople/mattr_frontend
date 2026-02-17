import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type TimePickerProps = DateInputBaseProps

export const TimePickerDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'TimePicker',
  label: 'Time Picker',
  category: 'inputs',
  description: 'Select a time',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Time',
    mode: 'time',
    displayMode: 'input',
    placeholder: 'HH:mm',
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
