import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DateTimeProps = DateInputBaseProps

export const DateTimeDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DateTime',
  label: 'Date Time',
  category: 'inputs',
  description: 'Date and time input',
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

