import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DateRangePickerProps = DateInputBaseProps

export const DateRangePickerDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DateRangePicker',
  label: 'Date Range Picker',
  category: 'inputs',
  description: 'Select a date range',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Date range',
    mode: 'range',
    displayMode: 'popover',
    placeholder: 'Select range',
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'range',
      },
      context
    ),
})
