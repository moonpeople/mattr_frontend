import { Slider } from '../shadcn'
import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  orientation: 'horizontal' | 'vertical'
  showTooltip: boolean
  tooltipFormat: 'number' | 'percent' | 'db' | 'hz'
  tooltipDecimals: number
  trackSize: 'sm' | 'md' | 'lg' | 'xl'
  minLabel: string
  maxLabel: string
  showTicks: boolean
  tickCount: number
  tickLabelEvery: number
  thumbVariant: 'circle' | 'bar'
  helperText: string
  disabled: boolean
  events: string
}

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const buildTickValues = ({
  min,
  max,
  step,
  tickCount,
}: {
  min: number
  max: number
  step: number
  tickCount: number
}) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return [] as number[]
  }

  const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000

  // `tickCount` is interpreted as number of intervals.
  // Example: min=0, max=100, tickCount=100 -> marks at 0..100 with step 1.
  const explicitIntervals = Math.floor(tickCount)
  if (explicitIntervals >= 1) {
    return Array.from({ length: explicitIntervals + 1 }, (_, index) => {
      const ratio = index / explicitIntervals
      return round(min + (max - min) * ratio)
    })
  }

  const safeStep = step > 0 ? step : 1
  const maxIterations = 500
  const epsilon = 1e-9
  const values: number[] = [min]

  for (let i = 1; i < maxIterations; i += 1) {
    const next = min + safeStep * i
    if (next >= max - epsilon) {
      break
    }
    values.push(round(next))
  }

  values.push(round(max))
  return values
}

const formatTooltipValue = (
  value: number,
  format: SliderProps['tooltipFormat'],
  decimals: number
) => {
  const precision = Math.max(0, Math.min(6, Math.floor(decimals)))
  const base = Number.isFinite(value) ? value.toFixed(precision) : String(value)
  if (format === 'percent') {
    return `${base}%`
  }
  if (format === 'db') {
    return `${base} dB`
  }
  if (format === 'hz') {
    return `${base} Hz`
  }
  return base
}

export const SliderDefinition = createWidgetDefinition<SliderProps>({
  type: 'Slider',
  label: 'Slider',
  category: 'inputs',
  description: 'Range slider',
  defaultProps: {
    label: 'Label',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    showTooltip: false,
    tooltipFormat: 'number',
    tooltipDecimals: 0,
    trackSize: 'md',
    minLabel: '',
    maxLabel: '',
    showTicks: false,
    tickCount: 0,
    tickLabelEvery: 1,
    thumbVariant: 'circle',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const min = toNumber(props.min, 0)
    const max = toNumber(props.max, 100)
    const step = toNumber(props.step, 1) || 1
    const safeValue = clamp(toNumber(rawValue, props.value), min, max)

    const label = normalizeString(props.label)
    const helperText = normalizeString(props.helperText)
    const minLabel = normalizeString(props.minLabel)
    const maxLabel = normalizeString(props.maxLabel)
    const showLabelRow = Boolean(minLabel || maxLabel)

    const orientation = props.orientation ?? 'horizontal'
    const isVertical = orientation === 'vertical'
    const tooltipFormat = props.tooltipFormat ?? 'number'
    const tooltipDecimals = toNumber(props.tooltipDecimals, 0)
    const trackSize = props.trackSize ?? 'md'

    const showTicks = Boolean(props.showTicks)
    const tickCountRaw = Math.floor(toNumber(props.tickCount, 0))
    const tickLabelEvery = Math.max(1, Math.floor(toNumber(props.tickLabelEvery, 1)))
    const tickValues = showTicks
      ? buildTickValues({
          min,
          max,
          step,
          tickCount: tickCountRaw > 0 ? Math.min(200, tickCountRaw) : 0,
        })
      : []

    return (
      <div className="space-y-2">
        {label && <label className="text-xs font-medium text-foreground">{label}</label>}

        {showLabelRow && !isVertical && (
          <div aria-hidden="true" className="mb-1 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}

        <div className={isVertical ? 'flex h-full justify-center' : undefined}>
          <Slider
            aria-label={label || 'Slider'}
            value={[safeValue]}
            min={min}
            max={max}
            step={step}
            orientation={orientation}
            trackSize={trackSize}
            thumbVariant={props.thumbVariant ?? 'circle'}
            showTooltip={Boolean(props.showTooltip)}
            tooltipContent={(v: number) => formatTooltipValue(v, tooltipFormat, tooltipDecimals)}
            disabled={props.disabled}
            onValueChange={(values: number[]) => {
              const next = values[0] ?? min
              context?.setState?.({ value: next })
              if (context?.mode !== 'canvas') {
                context?.runActions?.('change', { value: next })
              }
            }}
          />
        </div>

        {showTicks && tickValues.length > 1 && !isVertical && (
          <div aria-hidden="true" className="relative mt-3 h-8 w-full text-xs font-medium text-muted-foreground">
            {tickValues.map((valueAt, index) => {
              const lastIndex = tickValues.length - 1
              const ratio = lastIndex > 0 ? index / lastIndex : 0
              const left = `${ratio * 100}%`
              const isLabelVisible = index === 0 || index === lastIndex || index % tickLabelEvery === 0
              const isMajor = isLabelVisible
              const labelTransform =
                index === 0 ? 'translateX(50%)' : index === lastIndex ? 'translateX(-50%)' : 'translateX(0)'
              return (
                <span
                  key={String(index)}
                  className="absolute top-0 flex min-w-0 flex-col items-center gap-2"
                  style={{ left, transform: 'translateX(-50%)' }}
                >
                  <span
                    className={isMajor ? 'h-1.5 w-px' : 'h-1 w-px'}
                    style={{
                      backgroundColor: isMajor
                        ? 'hsl(var(--foreground, 222.2 84% 4.9%) / 0.45)'
                        : 'hsl(var(--foreground, 222.2 84% 4.9%) / 0.35)',
                    }}
                  />
                  <span
                    className={isLabelVisible ? 'block whitespace-nowrap' : 'block select-none whitespace-nowrap opacity-0'}
                    style={{ transform: labelTransform }}
                  >
                    {Number.isInteger(valueAt) ? valueAt : Math.round(valueAt * 100) / 100}
                  </span>
                </span>
              )
            })}
          </div>
        )}

        {helperText && <div className="text-xs text-muted-foreground">{helperText}</div>}
      </div>
    )
  },
})
