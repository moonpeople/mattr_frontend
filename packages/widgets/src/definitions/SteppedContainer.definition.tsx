import { cn } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

type StepConfig = {
  label: string
  value?: string
  content?: string
}

export type SteppedContainerProps = {
  title: string
  steps: string
  optionsMode?: 'static' | 'dynamic'
  optionsData?: string
  optionLabelKey?: string
  optionValueKey?: string
  optionDescriptionKey?: string
  currentStep: string
  showNumbers: boolean
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: string
}

const paddingClasses: Record<SteppedContainerProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<SteppedContainerProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const normalizeSteps = (raw: unknown): StepConfig[] => {
  const parsed = normalizeArray<StepConfig | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: String(item), value: String(item), content: '' }))
  }
  return (parsed as StepConfig[]).map((item) => ({
    label: String(item.label ?? ''),
    value: String(item.value ?? item.label ?? ''),
    content: item.content ?? '',
  }))
}

const readPath = (item: unknown, pathRaw: string) => {
  if (!item || typeof item !== 'object') {
    return undefined
  }
  const path = pathRaw
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (path.length === 0) {
    return undefined
  }
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, item)
}

const resolveDynamicSteps = (
  dataRaw: unknown,
  labelKeyRaw: unknown,
  valueKeyRaw: unknown,
  descriptionKeyRaw: unknown
): StepConfig[] => {
  const rows = normalizeArray<unknown>(parseMaybeJson(dataRaw), [])
  if (rows.length === 0) {
    return []
  }
  const labelKey = normalizeString(labelKeyRaw, 'label').trim() || 'label'
  const valueKey = normalizeString(valueKeyRaw, 'value').trim() || 'value'
  const descriptionKey = normalizeString(descriptionKeyRaw, '').trim()

  return rows
    .map((row, index) => {
      const labelRaw = readPath(row, labelKey)
      const valueRaw = readPath(row, valueKey)
      const descriptionRaw = descriptionKey ? readPath(row, descriptionKey) : undefined
      const label = normalizeString(labelRaw, '').trim() || normalizeString(valueRaw, '').trim() || `Step ${index + 1}`
      const value = normalizeString(valueRaw, '').trim() || label
      const content = normalizeString(descriptionRaw, '').trim()
      return {
        label,
        value,
        content,
      }
    })
    .filter((step) => step.label.length > 0)
}

export const SteppedContainerDefinition = createWidgetDefinition<SteppedContainerProps>({
  type: 'SteppedContainer',
  label: 'Stepped Container',
  category: 'containers',
  description: 'Container with step navigation',
  supportsChildren: true,
  defaultProps: {
    title: 'Stepped container',
    steps: JSON.stringify(
      [
        { label: 'Step 1', content: 'Step 1 content' },
        { label: 'Step 2', content: 'Step 2 content' },
        { label: 'Step 3', content: 'Step 3 content' },
      ],
      null,
      2
    ),
    currentStep: 'Step 1',
    optionsMode: 'static',
    optionsData: '',
    optionLabelKey: 'label',
    optionValueKey: 'value',
    optionDescriptionKey: 'description',
    showNumbers: true,
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: '[]',
  },
  render: (props, context) => {
    const dynamicMode = props.optionsMode === 'dynamic'
    const parsedSteps = dynamicMode
      ? resolveDynamicSteps(
          props.optionsData,
          props.optionLabelKey,
          props.optionValueKey,
          props.optionDescriptionKey
        )
      : normalizeSteps(props.steps).map((step) => ({ ...step, value: step.label }))
    const steps =
      parsedSteps.length > 0
        ? parsedSteps
        : [
            { label: 'Step 1', value: 'Step 1', content: 'Step 1 content' },
            { label: 'Step 2', value: 'Step 2', content: 'Step 2 content' },
          ]
    const fallbackStep = steps[0]?.value ?? 'Step 1'
    const activeStepRaw =
      normalizeString(context?.state?.currentStep ?? props.currentStep, fallbackStep) || fallbackStep
    const activeStep = steps.some((step) => step.value === activeStepRaw) ? activeStepRaw : fallbackStep
    const activeIndex = Math.max(0, steps.findIndex((step) => step.value === activeStep))
    const active = steps[activeIndex] ?? steps[0]
    const hasRenderChildrenApi = typeof context?.renderChildren === 'function'
    const slotChildren = context?.renderChildren?.({
      slot: `step:${normalizeString(active?.value, '').trim().toLowerCase()}`,
      includeUnassigned: activeIndex === 0,
    })
    const renderedChildren = slotChildren ?? (hasRenderChildrenApi ? null : context?.children)

    return (
      <div
        className={cn(
          'rounded-lg',
          backgroundClasses[props.background],
          props.bordered ? 'border border-border/40' : 'border border-transparent'
        )}
      >
        {props.title ? (
          <div className="border-b border-border/30 px-4 py-3 text-sm font-medium text-foreground">{props.title}</div>
        ) : null}
        <div className={cn('border-b border-border/30 px-3 py-2', paddingClasses[props.padding])}>
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((step, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={`${step.label}-${index}`}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                  onClick={() => {
                    context?.setState?.({ currentStep: step.value })
                    if (context?.mode !== 'canvas') {
                      context?.runActions?.('change', { value: step.value, label: step.label, index })
                    }
                  }}
                >
                  {props.showNumbers ? (
                    <span
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]',
                        isActive ? 'border-border text-foreground' : 'border-border text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                  ) : null}
                  <span>{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className={paddingClasses[props.padding]}>
          {renderedChildren != null ? (
            <div className="space-y-3">{renderedChildren}</div>
          ) : (
            <div className="text-sm text-foreground">{active?.content || 'Step content'}</div>
          )}
        </div>
      </div>
    )
  },
})
