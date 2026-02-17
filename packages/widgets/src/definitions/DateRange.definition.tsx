import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type DateRangeProps = DateInputBaseProps

export const DateRangeDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'DateRange',
  label: 'Date Range',
  category: 'inputs',
  description: 'Date range input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Date range',
    mode: 'range',
    displayMode: 'popover',
    placeholder: 'Select date range',
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

