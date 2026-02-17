import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import {
  Calendar,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

import { normalizeString, parseMaybeJson } from '../helpers'
import type { WidgetRenderContext } from '../types'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn'
import { normalizeSelectLabelVariant } from './select-utils'

export type DateInputMode =
  | 'date'
  | 'datetime'
  | 'time'
  | 'day'
  | 'month'
  | 'year'
  | 'range'
  | 'calendar'

export type DateInputDisplayMode = 'input' | 'popover' | 'inline'

export type DateInputBaseProps = {
  label: string
  labelVariant?: string
  placeholder: string
  helperText: string
  disabled: boolean
  readOnly?: boolean
  required?: boolean
  value: string
  startDate?: string
  endDate?: string
  mode?: DateInputMode
  displayMode?: DateInputDisplayMode
  numberOfMonths?: number
  showOutsideDays?: boolean
  showWeekNumber?: boolean
  weekStartsOn?: number
  closeOnSelect?: boolean
  showCalendarIcon?: boolean
  showClearButton?: boolean
  minuteStep?: number
  hour12?: boolean
  calendarCaptionLayout?: string
  fromYear?: number
  toYear?: number
  disabledDates?: string
  showInlineInput?: boolean
  showRangePresets?: boolean
  rangePresets?: string
  showTimeSlots?: boolean
  timeSlots?: string
  events: string
}

const DATE_INPUT_MODES: DateInputMode[] = [
  'date',
  'datetime',
  'time',
  'day',
  'month',
  'year',
  'range',
  'calendar',
]

const DATE_DISPLAY_MODES: DateInputDisplayMode[] = ['input', 'popover', 'inline']

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const getDaysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate()

const pad2 = (value: number) => String(value).padStart(2, '0')

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const formatDateValue = (value: Date) =>
  `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`

const parseDateValue = (value: string) => {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined
  }
  const [yearRaw, monthRaw, dayRaw] = trimmed.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined
  }
  const next = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (
    next.getFullYear() !== year ||
    next.getMonth() + 1 !== month ||
    next.getDate() !== day
  ) {
    return undefined
  }
  return next
}

const extractDatePart = (value: string) => {
  if (value.includes('T')) {
    return value.split('T')[0] ?? ''
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  return ''
}

const extractTimePart = (value: string) => {
  if (value.includes('T')) {
    const [, raw] = value.split('T')
    if (raw && /^\d{2}:\d{2}/.test(raw)) {
      return raw.slice(0, 5)
    }
  }
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value
  }
  return ''
}

const composeDatetime = (datePart: string, timePart: string) => {
  const normalizedDate = extractDatePart(datePart)
  const normalizedTime = /^\d{2}:\d{2}$/.test(timePart) ? timePart : '00:00'
  if (!normalizedDate) {
    return ''
  }
  return `${normalizedDate}T${normalizedTime}`
}

const normalizeMode = (value: unknown, fallback: DateInputMode = 'date') => {
  const normalized = normalizeString(value, fallback).toLowerCase() as DateInputMode
  return DATE_INPUT_MODES.includes(normalized) ? normalized : fallback
}

const normalizeDisplayMode = (
  value: unknown,
  fallback: DateInputDisplayMode = 'input'
) => {
  const normalized = normalizeString(value, fallback).toLowerCase() as DateInputDisplayMode
  return DATE_DISPLAY_MODES.includes(normalized) ? normalized : fallback
}

const normalizeMonthSelectionValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const byLabel = MONTH_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase())
  if (byLabel) {
    return byLabel
  }

  const numericMonth = /^\d{1,2}$/.test(trimmed) ? Number(trimmed) : undefined
  if (typeof numericMonth === 'number' && numericMonth >= 1 && numericMonth <= 12) {
    return MONTH_OPTIONS[numericMonth - 1] ?? ''
  }

  const yearMonthMatch = /^\d{4}-(\d{2})$/.exec(trimmed)
  if (yearMonthMatch?.[1]) {
    const monthFromYear = Number(yearMonthMatch[1])
    if (monthFromYear >= 1 && monthFromYear <= 12) {
      return MONTH_OPTIONS[monthFromYear - 1] ?? ''
    }
  }

  return ''
}

const resolveValidation = ({
  mode,
  required,
  value,
  startDate,
  endDate,
}: {
  mode: DateInputMode
  required: boolean
  value: string
  startDate: string
  endDate: string
}) => {
  if (!required) {
    return { invalid: false, message: '' }
  }
  if (mode === 'range') {
    const invalid = !startDate.trim() || !endDate.trim()
    return invalid ? { invalid: true, message: 'Required' } : { invalid: false, message: '' }
  }
  return value.trim() ? { invalid: false, message: '' } : { invalid: true, message: 'Required' }
}

const buildRangeString = (startDate: string, endDate: string) => {
  const from = startDate.trim()
  const to = endDate.trim()
  if (!from && !to) {
    return ''
  }
  return JSON.stringify({ startDate: from, endDate: to })
}

const dateControlModes = new Set<DateInputMode>(['date', 'datetime', 'calendar'])

type DateRangePreset = {
  label: string
  startDate: string
  endDate: string
  days?: number
}

const DayMonthYearInput = ({
  mode,
  value,
  disabled,
  placeholder,
  maxDay,
  onChange,
}: {
  mode: DateInputMode
  value: string
  disabled: boolean
  placeholder: string
  maxDay?: number
  onChange: (nextValue: string) => void
}) => {
  if (mode === 'day') {
    const normalizedMaxDay =
      typeof maxDay === 'number' && Number.isFinite(maxDay)
        ? clamp(Math.floor(maxDay), 28, 31)
        : 31

    return (
      <Input
        type="number"
        min={1}
        max={normalizedMaxDay}
        step={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder || 'DD'}
        onChange={(event) => {
          const nextRaw = event.target.value
          if (!nextRaw.trim()) {
            onChange('')
            return
          }

          const parsed = Number(nextRaw)
          if (!Number.isFinite(parsed)) {
            return
          }

          const nextValue = String(clamp(Math.floor(parsed), 1, normalizedMaxDay))
          onChange(nextValue)
        }}
      />
    )
  }
  if (mode === 'year') {
    return (
      <Input
        type="number"
        min={1000}
        max={9999}
        step={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder || 'YYYY'}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  if (mode === 'month') {
    const normalizedMonthValue = normalizeMonthSelectionValue(value)
    return (
      <Select
        value={normalizedMonthValue || undefined}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue)}
      >
        <SelectTrigger
          className="h-9 w-full px-3 text-left font-normal"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <SelectValue placeholder={placeholder || 'Select month'} />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((monthLabel) => (
            <SelectItem key={monthLabel} value={monthLabel}>
              {monthLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return null
}

export const dateInputBaseDefaultProps: DateInputBaseProps = {
  label: 'Date',
  labelVariant: 'default',
  placeholder: '',
  helperText: '',
  disabled: false,
  readOnly: false,
  required: false,
  value: '',
  startDate: '',
  endDate: '',
  mode: 'date',
  displayMode: 'input',
  numberOfMonths: 1,
  showOutsideDays: true,
  showWeekNumber: false,
  weekStartsOn: 1,
  closeOnSelect: true,
  showCalendarIcon: true,
  showClearButton: false,
  minuteStep: 1,
  hour12: false,
  calendarCaptionLayout: 'label',
  fromYear: undefined,
  toYear: undefined,
  disabledDates: '',
  showInlineInput: false,
  showRangePresets: false,
  rangePresets: '',
  showTimeSlots: false,
  timeSlots: '',
  events: '[]',
}

const DateInputBaseRenderer = ({
  props,
  context,
}: {
  props: DateInputBaseProps
  context?: WidgetRenderContext
}) => {
  const widgetState = context?.state ?? {}

  const label = normalizeString(props.label)
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const placeholder = normalizeString(props.placeholder)
  const helperText = normalizeString(props.helperText)
  const disabled = parseBoolean(props.disabled)
  const readOnly = parseBoolean(props.readOnly)
  const required = parseBoolean(props.required)
  const closeOnSelect = parseBoolean(props.closeOnSelect, true)
  const showCalendarIcon = parseBoolean(props.showCalendarIcon, true)
  const showClearButton = parseBoolean(props.showClearButton)
  const showOutsideDays = parseBoolean(props.showOutsideDays, true)
  const showWeekNumber = parseBoolean(props.showWeekNumber)
  const hour12 = parseBoolean(props.hour12)
  const minuteStep = clamp(Math.floor(parseNumber(props.minuteStep) ?? 1), 1, 60)
  const numberOfMonths = clamp(Math.floor(parseNumber(props.numberOfMonths) ?? 1), 1, 12)
  const weekStartsOn = clamp(Math.floor(parseNumber(props.weekStartsOn) ?? 1), 0, 6)
  const showInlineInput = parseBoolean(props.showInlineInput)
  const showRangePresets = parseBoolean(props.showRangePresets)
  const showTimeSlots = parseBoolean(props.showTimeSlots)
  const captionLayoutRaw = normalizeString(props.calendarCaptionLayout, 'label').trim()
  const captionLayout =
    captionLayoutRaw === 'dropdown' ||
    captionLayoutRaw === 'dropdown-months' ||
    captionLayoutRaw === 'dropdown-years'
      ? captionLayoutRaw
      : 'label'
  const fromYearRaw = parseNumber(props.fromYear)
  const toYearRaw = parseNumber(props.toYear)
  const fromYear =
    typeof fromYearRaw === 'number' ? clamp(Math.floor(fromYearRaw), 1900, 2200) : undefined
  const toYear =
    typeof toYearRaw === 'number' ? clamp(Math.floor(toYearRaw), 1900, 2200) : undefined
  const normalizedFromYear =
    typeof fromYear === 'number' && typeof toYear === 'number'
      ? Math.min(fromYear, toYear)
      : fromYear
  const normalizedToYear =
    typeof fromYear === 'number' && typeof toYear === 'number'
      ? Math.max(fromYear, toYear)
      : toYear

  const mode = normalizeMode(widgetState.mode ?? props.mode, 'date')
  const displayMode = normalizeDisplayMode(widgetState.displayMode ?? props.displayMode, 'input')

  const value = normalizeString(widgetState.value ?? props.value)
  const startDate = normalizeString(widgetState.startDate ?? props.startDate)
  const endDate = normalizeString(widgetState.endDate ?? props.endDate)
  const validation = resolveValidation({ mode, required, value, startDate, endDate })
  const helperMessage = validation.invalid ? validation.message : helperText
  const timeHint = hour12 ? 'hh:mm AM/PM' : 'HH:mm'
  const now = useMemo(() => new Date(), [])
  const maxDayForCurrentMonth = useMemo(
    () => getDaysInMonth(now.getFullYear(), now.getMonth()),
    [now]
  )
  const inlineCalendarClassNames = useMemo(
    () =>
      displayMode === 'inline'
        ? {
            month: 'w-full',
            weekday: 'w-full text-center text-[0.75rem]',
            day: 'group h-9 w-full px-0 py-px text-sm',
            day_button: 'h-9 w-full',
          }
        : undefined,
    [displayMode]
  )

  const selectedDate = useMemo(() => parseDateValue(extractDatePart(value)), [value])
  const selectedRange = useMemo(() => {
    const from = parseDateValue(startDate)
    const to = parseDateValue(endDate)
    if (!from && !to) {
      return undefined
    }
    return { from, to }
  }, [startDate, endDate])

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const disabledMatcher = useMemo(() => {
    const parsed = parseMaybeJson(props.disabledDates)
    if (!parsed) {
      return undefined
    }
    const list = Array.isArray(parsed) ? parsed : [parsed]
    const exactDates = new Set<string>()
    const weekdays = new Set<number>()
    const beforeDates: Date[] = []
    const afterDates: Date[] = []
    const ranges: Array<{ from: Date; to: Date }> = []

    for (const item of list) {
      if (typeof item === 'string') {
        const date = parseDateValue(item)
        if (date) {
          exactDates.add(formatDateValue(date))
        }
        continue
      }
      if (!item || typeof item !== 'object') {
        continue
      }
      const entry = item as Record<string, unknown>
      if (Array.isArray(entry.weekdays)) {
        for (const day of entry.weekdays) {
          const normalized = parseNumber(day)
          if (typeof normalized === 'number') {
            weekdays.add(clamp(Math.floor(normalized), 0, 6))
          }
        }
      }
      const before = typeof entry.before === 'string' ? parseDateValue(entry.before) : undefined
      const after = typeof entry.after === 'string' ? parseDateValue(entry.after) : undefined
      const from = typeof entry.from === 'string' ? parseDateValue(entry.from) : undefined
      const to = typeof entry.to === 'string' ? parseDateValue(entry.to) : undefined
      if (before) beforeDates.push(before)
      if (after) afterDates.push(after)
      if (from && to) {
        ranges.push(from <= to ? { from, to } : { from: to, to: from })
      }
    }

    if (
      exactDates.size === 0 &&
      weekdays.size === 0 &&
      beforeDates.length === 0 &&
      afterDates.length === 0 &&
      ranges.length === 0
    ) {
      return undefined
    }

    return (date: Date) => {
      const key = formatDateValue(date)
      if (exactDates.has(key)) {
        return true
      }
      if (weekdays.has(date.getDay())) {
        return true
      }
      for (const value of beforeDates) {
        if (date < value) {
          return true
        }
      }
      for (const value of afterDates) {
        if (date > value) {
          return true
        }
      }
      for (const range of ranges) {
        if (date >= range.from && date <= range.to) {
          return true
        }
      }
      return false
    }
  }, [props.disabledDates])

  const resolvedRangePresets = useMemo<DateRangePreset[]>(() => {
    const parsed = parseMaybeJson(props.rangePresets)
    if (Array.isArray(parsed)) {
      return parsed
        .map<DateRangePreset | null>((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }
          const entry = item as Record<string, unknown>
          return {
            label: normalizeString(entry.label),
            startDate: normalizeString(entry.startDate),
            endDate: normalizeString(entry.endDate),
            days: parseNumber(entry.days),
          }
        })
        .filter((item): item is DateRangePreset => Boolean(item?.label))
    }

    return [
      { label: 'Today', days: 0, startDate: '', endDate: '' },
      { label: 'Yesterday', days: -1, startDate: '', endDate: '' },
      { label: 'Last 7 days', days: 6, startDate: '', endDate: '' },
      { label: 'Last 30 days', days: 29, startDate: '', endDate: '' },
      {
        label: 'This month',
        startDate: `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}-01`,
        endDate: formatDateValue(new Date()),
      },
    ]
  }, [props.rangePresets])

  const resolvedTimeSlots = useMemo(() => {
    const parsed = parseMaybeJson(props.timeSlots)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeString(item).trim())
        .filter((item) => /^\d{2}:\d{2}$/.test(item))
    }
    return ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
  }, [props.timeSlots])

  const commitPatch = (patch: Record<string, unknown>) => {
    context?.setState?.(patch)
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', patch)
    }
  }

  const commitSingle = (nextValue: string) => {
    const nextValidation = resolveValidation({
      mode,
      required,
      value: nextValue,
      startDate: '',
      endDate: '',
    })
    commitPatch({
      value: nextValue,
      invalid: nextValidation.invalid,
      valid: !nextValidation.invalid,
      validationMessage: nextValidation.message,
    })
  }

  const commitRange = (nextStartDate: string, nextEndDate: string) => {
    const nextValidation = resolveValidation({
      mode: 'range',
      required,
      value: '',
      startDate: nextStartDate,
      endDate: nextEndDate,
    })
    commitPatch({
      startDate: nextStartDate,
      endDate: nextEndDate,
      value: buildRangeString(nextStartDate, nextEndDate),
      invalid: nextValidation.invalid,
      valid: !nextValidation.invalid,
      validationMessage: nextValidation.message,
    })
  }

  const applyRangePreset = (preset: DateRangePreset) => {
    if (preset.startDate && preset.endDate) {
      commitRange(preset.startDate, preset.endDate)
      return
    }
    const now = new Date()
    const today = formatDateValue(now)
    if (typeof preset.days === 'number') {
      if (preset.days < 0) {
        const target = new Date(now)
        target.setDate(now.getDate() + preset.days)
        const value = formatDateValue(target)
        commitRange(value, value)
        return
      }
      const from = new Date(now)
      from.setDate(now.getDate() - preset.days)
      commitRange(formatDateValue(from), today)
      return
    }
    commitRange(today, today)
  }

  const clearValue = () => {
    if (mode === 'range') {
      commitRange('', '')
      return
    }
    commitSingle('')
  }

  const renderSingleInput = () => {
    if (mode === 'day' || mode === 'month' || mode === 'year') {
      return (
        <DayMonthYearInput
          mode={mode}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          maxDay={maxDayForCurrentMonth}
          onChange={commitSingle}
        />
      )
    }

    const nativeType =
      mode === 'datetime'
        ? 'datetime-local'
        : mode === 'time'
          ? 'time'
          : 'date'

  return (
      <Input
        type={nativeType}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={
          placeholder ||
          (mode === 'datetime'
            ? `YYYY-MM-DD ${timeHint}`
            : mode === 'time'
              ? timeHint
              : 'YYYY-MM-DD')
        }
        step={mode === 'time' || mode === 'datetime' ? minuteStep * 60 : undefined}
        onChange={(event) => commitSingle(event.target.value)}
      />
    )
  }

  const renderCalendarPopoverContent = () => {
    if (mode === 'range') {
      return (
        <div className={cn('w-full', showRangePresets ? 'flex gap-2 max-sm:flex-col' : null)}>
          {showRangePresets ? (
            <div className="w-32 shrink-0 border-e border-border pe-2 max-sm:w-full max-sm:border-e-0 max-sm:border-b max-sm:pb-2 max-sm:pe-0">
              <div className="space-y-1">
                {resolvedRangePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full justify-start px-2 text-xs"
                    onClick={() => applyRangePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <Calendar
            mode="range"
            selected={selectedRange}
            className={cn(displayMode === 'inline' ? 'w-full flex-1' : null)}
            classNames={inlineCalendarClassNames}
            numberOfMonths={numberOfMonths}
            showOutsideDays={showOutsideDays}
            showWeekNumber={showWeekNumber}
            weekStartsOn={weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            disabled={disabledMatcher}
            captionLayout={captionLayout}
            fromYear={normalizedFromYear}
            toYear={normalizedToYear}
            onSelect={(nextRange) => {
              const nextStartDate = nextRange?.from ? formatDateValue(nextRange.from) : ''
              const nextEndDate = nextRange?.to ? formatDateValue(nextRange.to) : ''

              // DayPicker may return from=to on first click for range mode.
              // Keep the picker open and treat it as range start so users can choose the end date.
              const isInitialRangeSelection =
                !startDate &&
                !endDate &&
                Boolean(nextStartDate) &&
                Boolean(nextEndDate) &&
                nextStartDate === nextEndDate

              if (isInitialRangeSelection) {
                commitRange(nextStartDate, '')
                return
              }

              commitRange(nextStartDate, nextEndDate)
              if (closeOnSelect && nextStartDate && nextEndDate) {
                setIsPopoverOpen(false)
              }
            }}
          />
        </div>
      )
    }

    if (!dateControlModes.has(mode)) {
      return null
    }

    const currentTime = extractTimePart(value) || '00:00'

    return (
      <div className="space-y-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          className={cn(displayMode === 'inline' ? 'w-full' : null)}
          classNames={inlineCalendarClassNames}
          numberOfMonths={numberOfMonths}
          showOutsideDays={showOutsideDays}
          showWeekNumber={showWeekNumber}
          weekStartsOn={weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          disabled={disabledMatcher}
          captionLayout={captionLayout}
          fromYear={normalizedFromYear}
          toYear={normalizedToYear}
          onSelect={(nextDate) => {
            const nextDatePart = nextDate ? formatDateValue(nextDate) : ''
            const nextValue =
              mode === 'datetime'
                ? composeDatetime(nextDatePart, extractTimePart(value) || '00:00')
                : nextDatePart
            commitSingle(nextValue)
            if (closeOnSelect && mode !== 'datetime') {
              setIsPopoverOpen(false)
            }
          }}
        />
        {mode === 'datetime' ? (
          <div className="space-y-2 border-t border-border pt-2">
            <Input
              type="time"
              value={currentTime}
              step={minuteStep * 60}
              onChange={(event) => {
                const nextValue = composeDatetime(extractDatePart(value), event.target.value)
                commitSingle(nextValue)
              }}
            />
            {showTimeSlots ? (
              <div className="grid grid-cols-4 gap-1 max-sm:grid-cols-2">
                {resolvedTimeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const baseDate = extractDatePart(value) || formatDateValue(new Date())
                      commitSingle(composeDatetime(baseDate, slot))
                    }}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  const renderRangeInput = () => (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="date"
        value={startDate}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => commitRange(event.target.value, endDate)}
      />
      <Input
        type="date"
        value={endDate}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => commitRange(startDate, event.target.value)}
      />
    </div>
  )

  const renderPopoverTrigger = () => {
    const displayValue =
      mode === 'range'
        ? [startDate, endDate].filter(Boolean).join(' - ')
        : mode === 'datetime'
          ? value.replace('T', ' ')
          : value

    return (
      <div className="relative">
        <Input
          value={displayValue}
          readOnly
          disabled={disabled}
          placeholder={placeholder || (mode === 'range' ? 'Select date range' : 'Select date')}
          className={cn(showCalendarIcon || showClearButton ? 'pr-16' : null)}
          onClick={() => {
            if (!disabled) {
              setIsPopoverOpen(true)
            }
          }}
        />
        <div className="pointer-events-auto absolute inset-y-0 right-2 flex items-center gap-1">
          {showClearButton && (displayValue || (mode === 'range' && (startDate || endDate))) ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={disabled}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                clearValue()
              }}
            >
              <X size={14} />
            </Button>
          ) : null}
          {showCalendarIcon ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={disabled}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setIsPopoverOpen((prev) => !prev)
              }}
            >
              <CalendarIcon size={14} />
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  const control = (() => {
    if (mode === 'range' && displayMode === 'input') {
      return renderRangeInput()
    }
    if ((mode === 'range' || dateControlModes.has(mode)) && displayMode === 'inline') {
      return (
        <div className="space-y-2 rounded-md border border-input p-2">
          {renderCalendarPopoverContent()}
          {showInlineInput ? (
            <>
              {mode === 'range' ? (
                renderRangeInput()
              ) : (
                <Input
                  type={mode === 'datetime' ? 'datetime-local' : 'date'}
                  value={mode === 'datetime' ? value : extractDatePart(value)}
                  onChange={(event) => commitSingle(event.target.value)}
                />
              )}
            </>
          ) : null}
        </div>
      )
    }
    if ((mode === 'range' || dateControlModes.has(mode)) && displayMode === 'popover') {
      return (
        <Popover_Shadcn_ open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger_Shadcn_ asChild>{renderPopoverTrigger()}</PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_
            className="w-auto border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-2 text-[hsl(var(--popover-foreground))] shadow-md"
            align="start"
          >
            {renderCalendarPopoverContent()}
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )
    }
    return renderSingleInput()
  })()

  const withLabelVariant = () => {
    if (labelVariant === 'overlapping') {
      return (
        <div className="group relative pt-1">
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground">
            {label}
          </label>
          <div>{control}</div>
        </div>
      )
    }
    if (labelVariant === 'inset') {
      return (
        <div className="rounded-md border border-input bg-background p-3 shadow-xs">
          {label ? (
            <label className="mb-2 block text-xs font-medium text-foreground">{label}</label>
          ) : null}
          {control}
        </div>
      )
    }
    if (label && labelVariant === 'default') {
      return (
        <>
          <label className="text-xs font-medium text-foreground">{label}</label>
          {control}
        </>
      )
    }
    return control
  }

  return (
    <div className="space-y-1">
      {withLabelVariant()}
      {helperMessage ? (
        <div className={cn('text-xs', validation.invalid ? 'text-destructive' : 'text-muted-foreground')}>
          {helperMessage}
        </div>
      ) : null}
    </div>
  )
}

export const renderDateInputBase = (
  props: DateInputBaseProps,
  context?: WidgetRenderContext
) => <DateInputBaseRenderer props={props} context={context} />
