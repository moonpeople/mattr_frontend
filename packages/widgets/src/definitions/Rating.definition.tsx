import type { MouseEvent } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'
import { normalizeString } from '../helpers'
import { getWidgetIconComponent } from '../icon-library'
import { createWidgetDefinition } from '../types'

export type RatingProps = {
  label: string
  value: number
  max: number
  allowHalf: boolean
  labelPosition: 'left' | 'top'
  tooltipText: string
  required: boolean
  ratingSize: 'default' | 'small'
  ratingIcon: 'star' | 'heart' | 'smile'
  iconSize?: number
  helperText: string
  readOnly: boolean
  disabled: boolean
  events: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    const normalized =
      trimmed.includes(',') && !trimmed.includes('.')
        ? trimmed.replace(',', '.')
        : trimmed
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (Array.isArray(value) && value.length > 0) {
    return parseNumeric(value[0])
  }
  return null
}

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

const getStarSize = (size: RatingProps['ratingSize'], max: number) => {
  if (size === 'small' || max >= 10) {
    return 'h-4 w-4'
  }
  return 'h-5 w-5'
}

const resolveRatingIcons = (
  iconType: RatingProps['ratingIcon'],
  iconLibrary?: string
) => {
  const base = iconType === 'heart' ? 'heart' : iconType === 'smile' ? 'smile' : 'star'
  const outline =
    getWidgetIconComponent(base, iconLibrary) ??
    getWidgetIconComponent(base) ??
    getWidgetIconComponent('star', iconLibrary) ??
    getWidgetIconComponent('star')
  const filled =
    getWidgetIconComponent(`${base}Filled`, iconLibrary) ??
    getWidgetIconComponent(`${base}Filled`) ??
    getWidgetIconComponent('starFilled', iconLibrary) ??
    getWidgetIconComponent('starFilled') ??
    outline
  return { outline, filled }
}

export const RatingDefinition = createWidgetDefinition<RatingProps>({
  type: 'Rating',
  label: 'Rating',
  category: 'inputs',
  description: 'Star rating input',
  defaultProps: {
    label: 'Label',
    value: 0,
    max: 5,
    allowHalf: false,
    labelPosition: 'left',
    tooltipText: '',
    required: false,
    ratingSize: 'default',
    ratingIcon: 'star',
    iconSize: 0,
    helperText: '',
    readOnly: false,
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const maxCount = Math.max(1, Math.floor(parseNumeric(props.max) ?? 5))
    const label = normalizeString(props.label)
    const labelPosition = props.labelPosition === 'top' ? 'top' : 'left'
    const tooltipText = normalizeString(props.tooltipText || props.helperText)
    const helperText = normalizeString(props.helperText)
    const showRequiredIndicator = parseBoolean(props.required)
    const starSizeClass = getStarSize(props.ratingSize ?? 'default', maxCount)
    const iconSizeValue =
      typeof props.iconSize === 'number' && Number.isFinite(props.iconSize) && props.iconSize > 0
        ? Math.round(props.iconSize)
        : null
    const iconStyle = iconSizeValue ? { width: `${iconSizeValue}px`, height: `${iconSizeValue}px` } : undefined
    const outlineIconStyle = iconStyle
      ? { ...iconStyle, fill: 'none' as const }
      : { fill: 'none' as const }
    const filledIconStyle = iconStyle
      ? { ...iconStyle, fill: 'currentColor' as const }
      : { fill: 'currentColor' as const }
    const allowHalf = parseBoolean(props.allowHalf)
    const rawNumericValue = parseNumeric(context?.state?.value) ?? parseNumeric(props.value) ?? 0
    const clampedValue = clamp(rawNumericValue, 0, maxCount)
    const normalizedValue = allowHalf
      ? Math.round(clampedValue * 2) / 2
      : Math.round(clampedValue)
    const { outline: StarOutline, filled: StarFilled } = resolveRatingIcons(
      props.ratingIcon ?? 'star',
      context?.iconLibrary
    )
    const OutlineIcon = StarOutline ?? StarFilled
    const FillIcon = StarFilled ?? OutlineIcon

    const handleSelect = (event: MouseEvent<HTMLButtonElement>, index: number) => {
      if (props.disabled || parseBoolean(props.readOnly)) {
        return
      }
      let nextValue = index + 1
      if (allowHalf) {
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = (event.clientX - rect.left) / rect.width
        nextValue = ratio <= 0.5 ? index + 0.5 : index + 1
      }
      const clamped = clamp(nextValue, 0, maxCount)
      context?.setState?.({ value: clamped })
      if (context?.mode !== 'canvas') {
        context?.runActions?.('change', { value: clamped })
      }
    }

    const labelElement = label ? (
      <label className="text-xs font-medium text-foreground">
        {label}
        {showRequiredIndicator ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
    ) : null

    const labelBlock =
      labelElement && tooltipText ? (
        <Tooltip>
          <TooltipTrigger asChild>{labelElement}</TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      ) : (
        labelElement
      )

    const starsBlock = (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxCount }, (_, index) => {
          const fill = clamp(normalizedValue - index, 0, 1)
          const fillWidth = `${Math.round(fill * 100)}%`
          const isEmpty = fill <= 0
          return (
            <button
              key={`rating-${index}`}
              type="button"
              className={`relative inline-flex shrink-0 items-center justify-center rounded-sm transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 ${starSizeClass}`}
              disabled={props.disabled || parseBoolean(props.readOnly)}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                handleSelect(event, index)
              }}
              aria-label={`Set rating ${index + 1}`}
              style={iconStyle}
            >
              {OutlineIcon ? (
                <OutlineIcon
                  className={`${starSizeClass} text-muted-foreground`}
                  style={outlineIconStyle}
                />
              ) : null}
              {!isEmpty && FillIcon ? (
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={{ width: fillWidth }}
                >
                  <FillIcon
                    className={`${starSizeClass} text-primary`}
                    style={filledIconStyle}
                  />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    )

    return (
      <div className={labelPosition === 'left' ? 'flex items-center gap-3' : 'space-y-1'}>
        {labelBlock}
        {starsBlock}
        {!tooltipText && helperText && labelPosition === 'top' ? (
          <div className="text-xs text-muted-foreground">{helperText}</div>
        ) : null}
      </div>
    )
  },
})
