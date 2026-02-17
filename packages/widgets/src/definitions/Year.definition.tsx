import { createWidgetDefinition } from '../types'
import {
  dateInputBaseDefaultProps,
  renderDateInputBase,
  type DateInputBaseProps,
} from './date-input-base'

export type YearProps = DateInputBaseProps

export const YearDefinition = createWidgetDefinition<DateInputBaseProps>({
  type: 'Year',
  label: 'Year',
  category: 'inputs',
  description: 'Year input',
  defaultProps: {
    ...dateInputBaseDefaultProps,
    label: 'Year',
    mode: 'year',
    displayMode: 'input',
    placeholder: 'YYYY',
    showCalendarIcon: false,
  },
  render: (props, context) =>
    renderDateInputBase(
      {
        ...props,
        mode: 'year',
      },
      context
    ),
})

