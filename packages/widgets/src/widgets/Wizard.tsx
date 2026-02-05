import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type WizardProps = {
  steps: string
  currentStep: string
}

const normalizeSteps = (raw: unknown): string[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<string>(parsed, [])
  if (normalized.length > 0) {
    return normalized.map((item) => String(item))
  }
  return []
}

export const WizardWidget: WidgetDefinition<WizardProps> = {
  type: 'Wizard',
  label: 'Wizard',
  category: 'containers',
  description: 'Multi-step workflow',
  defaultProps: {
    steps: '["Step 1", "Step 2", "Step 3"]',
    currentStep: 'Step 1',
  },
  fields: [
    { key: 'steps', label: 'Steps (JSON)', type: 'json', placeholder: '["Step 1","Step 2"]' },
    { key: 'currentStep', label: 'Current step', type: 'text', placeholder: 'Step 1' },
  ],
  render: (props, context) => {
    const steps = normalizeSteps(props.steps)
    const activeStep = normalizeString(context?.state?.currentStep ?? props.currentStep, '')
    const activeIndex = steps.findIndex((step) => step === activeStep)

    return (
      <div className="space-y-3 rounded border border-foreground-muted/40 bg-surface-100 p-3">
        <div className="text-xs font-medium text-foreground">Wizard</div>
        <div className="space-y-2">
          {steps.length > 0 ? (
            steps.map((step, index) => (
              <button
                key={step}
                type="button"
                className="flex w-full items-center gap-2 text-left"
                onClick={() => {
                  context?.setState?.({ currentStep: step })
                  context?.runActions?.('stepChange', { step })
                }}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    index === activeIndex ? 'bg-primary-500 text-white' : 'bg-surface-200 text-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm text-foreground">{step}</span>
              </button>
            ))
          ) : (
            <div className="text-xs text-foreground-muted">No steps defined</div>
          )}
        </div>
      </div>
    )
  },
}
