'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '../../../lib/utils/cn'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const fullDateRangeSelected =
    props.mode === 'range' && !!props.selected?.from && !!props.selected?.to

  const {
    months,
    month,
    month_caption,
    caption_label,
    dropdowns,
    dropdown_root,
    dropdown,
    months_dropdown,
    years_dropdown,
    button_previous,
    button_next,
    month_grid,
    weekdays,
    weekday,
    week,
    day,
    day_button,
    selected,
    today,
    outside,
    disabled,
    range_start,
    range_middle,
    range_end,
    hidden,
    ...restClassNames
  } = classNames ?? {}

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'rounded-md bg-[hsl(var(--popover))] p-3 text-[hsl(var(--popover-foreground))] shadow-xs',
        className
      )}
      classNames={{
        months: cn(
          'relative flex flex-col sm:flex-row space-y-4 sm:[&>*:not(nav)+*]:ml-4 sm:space-y-0',
          months
        ),
        month: cn('space-y-4', month),
        month_caption: cn('flex justify-center pt-1 relative items-center', month_caption),
        caption_label: cn(
          'inline-flex items-center gap-1 text-sm font-medium text-foreground',
          caption_label
        ),
        dropdowns: cn('inline-flex items-center gap-2', dropdowns),
        dropdown_root: cn(
          'relative inline-flex h-8 min-w-[7.5rem] items-center rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 pr-8 text-sm text-[hsl(var(--foreground))] shadow-xs',
          'focus-within:border-[hsl(var(--ring))] focus-within:ring-[3px] focus-within:ring-[hsl(var(--ring)/0.5)]',
          'data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed',
          dropdown_root
        ),
        dropdown: cn(
          'absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 outline-none',
          'disabled:cursor-not-allowed',
          dropdown
        ),
        months_dropdown: cn('w-full', months_dropdown),
        years_dropdown: cn('w-full', years_dropdown),
        button_previous: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--card))] p-0 text-[hsl(var(--foreground))] shadow-xs opacity-60 transition-[color,box-shadow,opacity] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] hover:opacity-100',
          'focus-visible:border-[hsl(var(--ring))] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ring)/0.5)]',
          'z-[5]',
          'aria-disabled:opacity-25 aria-disabled:hover:opacity-25 aria-disabled:cursor-not-allowed',
          'absolute left-0 top-0',
          button_previous
        ),
        button_next: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--card))] p-0 text-[hsl(var(--foreground))] shadow-xs opacity-60 transition-[color,box-shadow,opacity] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] hover:opacity-100',
          'focus-visible:border-[hsl(var(--ring))] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ring)/0.5)]',
          'z-[5]',
          'aria-disabled:opacity-25 aria-disabled:hover:opacity-25 aria-disabled:cursor-not-allowed',
          'absolute right-0 top-0',
          button_next
        ),
        month_grid: cn('w-full border-collapse space-y-1', month_grid),
        weekdays: cn('flex', weekdays),
        weekday: cn(
          'text-[hsl(var(--muted-foreground))] rounded-md w-9 font-normal text-[0.8rem]',
          weekday
        ),
        week: cn('mt-2 flex w-full', week),
        day: cn('group size-9 px-0 py-px text-sm', day),
        day_button: cn(
          'relative flex size-9 items-center justify-center whitespace-nowrap rounded-md bg-transparent p-0 text-inherit',
          'transition-[color,background-color,border-radius,box-shadow] duration-150',
          'outline-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ring)/0.5)]',
          'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
          'disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40',
          day_button
        ),
        selected: cn('bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]', selected),
        today: cn(
          '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10',
          '*:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-[hsl(var(--primary))]',
          '[&[data-selected=true]:not(.range-middle)>*]:after:bg-[hsl(var(--background))] [&[data-disabled=true]>*]:after:bg-[hsl(var(--foreground)/0.3)]',
          '*:after:transition-colors',
          today
        ),
        outside: cn(
          'text-[hsl(var(--muted-foreground))] opacity-50 data-[selected=true]:bg-[hsl(var(--accent)/0.5)] data-[selected=true]:text-[hsl(var(--muted-foreground))]',
          outside
        ),
        disabled: cn('pointer-events-none text-[hsl(var(--muted-foreground))] opacity-40', disabled),
        range_start: cn(
          fullDateRangeSelected ? 'rounded-l-md' : null,
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
          range_start
        ),
        range_middle: cn(
          'bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--foreground))] rounded-none',
          range_middle
        ),
        range_end: cn(
          fullDateRangeSelected ? 'rounded-r-md' : null,
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
          range_end
        ),
        hidden: cn('invisible', hidden),
        ...restClassNames,
      }}
      components={{
        Chevron: (props) => {
          const { className, ...rest } = props

          if (props.orientation === 'left') {
            return (
              <ChevronLeft className={cn('h-4 w-4 pointer-events-none', className)} {...rest} />
            )
          } else {
            return (
              <ChevronRight className={cn('h-4 w-4 pointer-events-none', className)} {...rest} />
            )
          }
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
