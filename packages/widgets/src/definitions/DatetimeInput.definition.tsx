import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DatetimeInputProps = DateInputBaseProps

export const DatetimeInputDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DatetimeInput',
  label: 'Datetime Input',
  category: 'inputs',
  description: 'Select date/time value',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Date',
    mode: 'date',
    displayMode: 'popover',
    placeholder: 'Select value',
  },
  render: renderDateInputBase,
})
